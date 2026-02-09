// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OrderBook
 * @notice Fully on-chain Central Limit Order Book (CLOB) for prediction market outcome tokens
 * @dev Implements price-time priority matching like Limitless Exchange on Base.
 *      - Limit orders: specify exact price and size
 *      - Market orders: execute immediately at best available price
 *      - Orders stored on-chain in sorted linked lists per price level
 *      - Prices are in basis points (0-10000) representing 0.00-1.00 USDC per share
 *      - YES token price + NO token price always = 10000 (1.00 USDC)
 */
contract OrderBook is ERC1155Holder, Ownable, ReentrancyGuard {

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant PRICE_PRECISION = 10000; // Prices in basis points (0.01% = 1 bp)
    uint256 public constant MIN_PRICE = 1;           // 0.01% minimum
    uint256 public constant MAX_PRICE = 9999;        // 99.99% maximum
    uint256 public constant FEE_DENOMINATOR = 10000;

    /*//////////////////////////////////////////////////////////////
                                ENUMS
    //////////////////////////////////////////////////////////////*/

    enum Side { BUY, SELL }

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Order {
        uint256 id;
        address maker;
        uint256 marketId;
        uint256 outcomeIndex;   // 0 = YES, 1 = NO
        Side side;              // BUY or SELL
        uint256 price;          // Price in basis points (1-9999)
        uint256 size;           // Number of outcome token shares (in collateral decimals)
        uint256 filled;         // Amount already filled
        uint256 timestamp;
        bool active;
    }

    struct PriceLevel {
        uint256 price;
        uint256 totalSize;      // Total unfilled size at this price level
        uint256 headOrderId;    // First order (oldest) at this level
        uint256 tailOrderId;    // Last order (newest) at this level
        uint256 nextPrice;      // Next price level (higher for asks, lower for bids)
        uint256 prevPrice;      // Previous price level
        bool exists;
    }

    struct MarketBook {
        uint256 bestBid;        // Highest bid price (0 if no bids)
        uint256 bestAsk;        // Lowest ask price (0 if no asks)
        uint256 totalVolume;    // Total matched volume
        uint256 lastTradePrice; // Last executed trade price
        bool initialized;
    }

    struct OrderNode {
        uint256 nextOrderId;    // Next order at same price level (time priority)
        uint256 prevOrderId;    // Previous order at same price level
    }

    struct FillParams {
        uint256 marketId;
        uint256 outcomeIndex;
        Side makerSide;
        Side takerSide;
        uint256 price;
        address taker;
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    // Reference to the CTF contract (ERC1155 outcome tokens + market data)
    address public ctfContract;
    
    // Collateral token (USDC)
    address public collateralToken;
    uint8 public collateralDecimals;

    // Platform fee in basis points (e.g., 50 = 0.5%)
    uint256 public platformFeeBps = 50;
    uint256 public accumulatedFees;

    // Global order counter
    uint256 public nextOrderId = 1;

    // Order storage
    mapping(uint256 => Order) public orders;
    
    // Order linked list nodes (for traversal within a price level)
    mapping(uint256 => OrderNode) public orderNodes;

    // marketId => outcomeIndex => side => price => PriceLevel
    // For BUY side: sorted descending (best bid = highest price)
    // For SELL side: sorted ascending (best ask = lowest price)
    mapping(uint256 => mapping(uint256 => mapping(Side => mapping(uint256 => PriceLevel)))) public priceLevels;

    // marketId => outcomeIndex => MarketBook
    mapping(uint256 => mapping(uint256 => MarketBook)) public marketBooks;

    // User's active order IDs
    mapping(address => uint256[]) public userOrderIds;
    
    // User's active order count (for gas-efficient checks)
    mapping(address => uint256) public userActiveOrderCount;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event OrderPlaced(
        uint256 indexed orderId,
        address indexed maker,
        uint256 indexed marketId,
        uint256 outcomeIndex,
        Side side,
        uint256 price,
        uint256 size
    );

    event OrderFilled(
        uint256 indexed orderId,
        address indexed maker,
        address indexed taker,
        uint256 marketId,
        uint256 outcomeIndex,
        uint256 price,
        uint256 filledSize
    );

    event OrderCancelled(
        uint256 indexed orderId,
        address indexed maker,
        uint256 remainingSize
    );

    event TradeExecuted(
        uint256 indexed marketId,
        uint256 indexed outcomeIndex,
        address buyer,
        address seller,
        uint256 price,
        uint256 size,
        uint256 cost
    );

    event SharesSplit(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );

    event SharesMerged(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );

    event CrossBookMatch(
        uint256 indexed marketId,
        uint256 outcomeIndex,
        uint256 complementaryOutcome,
        uint256 price,
        uint256 size
    );

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _ctfContract,
        address _collateralToken,
        uint8 _collateralDecimals
    ) Ownable(msg.sender) {
        ctfContract = _ctfContract;
        collateralToken = _collateralToken;
        collateralDecimals = _collateralDecimals;
    }

    /*//////////////////////////////////////////////////////////////
                        LIMIT ORDER PLACEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Place a limit order to buy outcome tokens
     * @param marketId Market ID from CTF contract
     * @param outcomeIndex 0 for YES, 1 for NO
     * @param price Price in basis points (1-9999), e.g., 5000 = $0.50
     * @param size Number of shares to buy (in collateral token decimals)
     * @return orderId The ID of the placed order
     */
    function placeLimitOrder(
        uint256 marketId,
        uint256 outcomeIndex,
        Side side,
        uint256 price,
        uint256 size
    ) external nonReentrant returns (uint256 orderId) {
        require(price >= MIN_PRICE && price <= MAX_PRICE, "Price out of range");
        require(size > 0, "Size must be > 0");
        require(_isMarketActive(marketId), "Market not active");

        // Initialize book if needed
        _initBookIfNeeded(marketId, outcomeIndex);

        if (side == Side.BUY) {
            // Buyer deposits collateral (price * size / PRICE_PRECISION)
            uint256 collateralRequired = (price * size) / PRICE_PRECISION;
            require(collateralRequired > 0, "Order too small");
            IERC20(collateralToken).transferFrom(msg.sender, address(this), collateralRequired);
        } else {
            // Seller deposits outcome tokens
            uint256 tokenId = _getTokenId(marketId, outcomeIndex);
            IERC1155(ctfContract).safeTransferFrom(msg.sender, address(this), tokenId, size, "");
        }

        // Try to match against existing orders first
        uint256 remaining = _matchOrder(marketId, outcomeIndex, side, price, size, msg.sender);

        // If there's remaining size, place as resting order
        if (remaining > 0) {
            orderId = _createOrder(marketId, outcomeIndex, side, price, remaining, msg.sender);
        }

        return orderId;
    }

    /*//////////////////////////////////////////////////////////////
                        MARKET ORDER EXECUTION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Place a market order - executes immediately at best available prices
     * @param marketId Market ID
     * @param outcomeIndex 0 for YES, 1 for NO
     * @param side BUY or SELL
     * @param size Number of shares
     * @param maxSlippageBps Maximum acceptable slippage in basis points
     */
    function placeMarketOrder(
        uint256 marketId,
        uint256 outcomeIndex,
        Side side,
        uint256 size,
        uint256 maxSlippageBps
    ) external nonReentrant returns (uint256 filledSize) {
        require(size > 0, "Size must be > 0");
        require(_isMarketActive(marketId), "Market not active");

        _initBookIfNeeded(marketId, outcomeIndex);

        MarketBook storage book = marketBooks[marketId][outcomeIndex];

        if (side == Side.BUY) {
            require(book.bestAsk > 0, "No asks available");
            
            // Calculate worst acceptable price with slippage
            uint256 worstPrice = book.bestAsk + (book.bestAsk * maxSlippageBps) / FEE_DENOMINATOR;
            if (worstPrice > MAX_PRICE) worstPrice = MAX_PRICE;

            // Deposit max collateral needed (worst price * size)
            uint256 maxCollateral = (worstPrice * size) / PRICE_PRECISION;
            IERC20(collateralToken).transferFrom(msg.sender, address(this), maxCollateral);

            // Match against asks
            uint256 remaining = _matchOrder(marketId, outcomeIndex, side, worstPrice, size, msg.sender);
            filledSize = size - remaining;

            // Refund unused collateral
            if (remaining > 0) {
                uint256 refund = (worstPrice * remaining) / PRICE_PRECISION;
                if (refund > 0) {
                    IERC20(collateralToken).transfer(msg.sender, refund);
                }
            }
        } else {
            require(book.bestBid > 0, "No bids available");

            // Calculate worst acceptable price with slippage
            uint256 worstPrice = book.bestBid - (book.bestBid * maxSlippageBps) / FEE_DENOMINATOR;
            if (worstPrice < MIN_PRICE) worstPrice = MIN_PRICE;

            // Deposit outcome tokens
            uint256 tokenId = _getTokenId(marketId, outcomeIndex);
            IERC1155(ctfContract).safeTransferFrom(msg.sender, address(this), tokenId, size, "");

            // Match against bids
            uint256 remaining = _matchOrder(marketId, outcomeIndex, side, worstPrice, size, msg.sender);
            filledSize = size - remaining;

            // Refund unmatched tokens
            if (remaining > 0) {
                IERC1155(ctfContract).safeTransferFrom(address(this), msg.sender, tokenId, remaining, "");
            }
        }

        require(filledSize > 0, "No liquidity at acceptable price");
    }

    /*//////////////////////////////////////////////////////////////
                        ORDER CANCELLATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Cancel an active order and refund deposited assets
     * @param orderId The order to cancel
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.maker == msg.sender, "Not order maker");
        require(order.active, "Order not active");

        uint256 remaining = order.size - order.filled;
        require(remaining > 0, "Nothing to cancel");

        // Remove from order book
        _removeOrder(orderId);

        // Refund
        if (order.side == Side.BUY) {
            uint256 refund = (order.price * remaining) / PRICE_PRECISION;
            if (refund > 0) {
                IERC20(collateralToken).transfer(msg.sender, refund);
            }
        } else {
            uint256 tokenId = _getTokenId(order.marketId, order.outcomeIndex);
            IERC1155(ctfContract).safeTransferFrom(address(this), msg.sender, tokenId, remaining, "");
        }

        emit OrderCancelled(orderId, msg.sender, remaining);
    }

    /**
     * @notice Cancel all active orders for a user in a specific market/outcome
     * @param marketId Market ID
     * @param outcomeIndex Outcome index
     */
    function cancelAllOrders(uint256 marketId, uint256 outcomeIndex) external nonReentrant {
        uint256[] storage userOrders = userOrderIds[msg.sender];
        for (uint256 i = 0; i < userOrders.length; i++) {
            Order storage order = orders[userOrders[i]];
            if (order.active && order.marketId == marketId && order.outcomeIndex == outcomeIndex) {
                uint256 remaining = order.size - order.filled;
                if (remaining > 0) {
                    _removeOrder(userOrders[i]);
                    
                    if (order.side == Side.BUY) {
                        uint256 refund = (order.price * remaining) / PRICE_PRECISION;
                        if (refund > 0) {
                            IERC20(collateralToken).transfer(msg.sender, refund);
                        }
                    } else {
                        uint256 tokenId = _getTokenId(order.marketId, order.outcomeIndex);
                        IERC1155(ctfContract).safeTransferFrom(address(this), msg.sender, tokenId, remaining, "");
                    }

                    emit OrderCancelled(userOrders[i], msg.sender, remaining);
                }
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                        SPLIT / MERGE SHARES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Split $1 collateral into 1 Yes share + 1 No share
     * @dev Like Limitless: users can split collateral into outcome token pairs
     * @param marketId Market ID
     * @param amount Amount of collateral to split (in collateral decimals)
     */
    function splitShares(uint256 marketId, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(_isMarketActive(marketId), "Market not active");

        // Transfer collateral from user
        IERC20(collateralToken).transferFrom(msg.sender, address(this), amount);

        // Approve CTF contract to spend collateral
        IERC20(collateralToken).approve(ctfContract, amount);

        // Mint position tokens via CTF (mints 1 Yes + 1 No per collateral unit)
        (bool success,) = ctfContract.call(
            abi.encodeWithSignature("mintPositionTokens(uint256,uint256)", marketId, amount)
        );
        require(success, "Split failed");

        // Transfer both outcome tokens to user
        uint256 yesTokenId = _getTokenId(marketId, 0);
        uint256 noTokenId = _getTokenId(marketId, 1);
        IERC1155(ctfContract).safeTransferFrom(address(this), msg.sender, yesTokenId, amount, "");
        IERC1155(ctfContract).safeTransferFrom(address(this), msg.sender, noTokenId, amount, "");

        emit SharesSplit(marketId, msg.sender, amount);
    }

    /**
     * @notice Merge 1 Yes share + 1 No share back into $1 collateral
     * @dev Like Limitless: users can merge outcome token pairs back to collateral
     * @param marketId Market ID
     * @param amount Amount of share pairs to merge
     */
    function mergeShares(uint256 marketId, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        // Transfer both outcome tokens from user
        uint256 yesTokenId = _getTokenId(marketId, 0);
        uint256 noTokenId = _getTokenId(marketId, 1);
        IERC1155(ctfContract).safeTransferFrom(msg.sender, address(this), yesTokenId, amount, "");
        IERC1155(ctfContract).safeTransferFrom(msg.sender, address(this), noTokenId, amount, "");

        // Approve CTF to burn tokens
        IERC1155(ctfContract).setApprovalForAll(ctfContract, true);

        // Redeem position tokens via CTF (burns 1 Yes + 1 No, returns collateral)
        (bool success,) = ctfContract.call(
            abi.encodeWithSignature("redeemPositionTokens(uint256,uint256)", marketId, amount)
        );
        require(success, "Merge failed");

        // Transfer collateral back to user
        IERC20(collateralToken).transfer(msg.sender, amount);

        emit SharesMerged(marketId, msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                        MATCHING ENGINE (INTERNAL)
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Match an incoming order against the opposite side of the book,
     *      then also check the complementary outcome book for cross-book matches.
     *      Like Limitless: Buy Yes at $0.60 can match Buy No at $0.40 (via split/merge).
     * @return remaining Unfilled size after matching
     */
    function _matchOrder(
        uint256 marketId,
        uint256 outcomeIndex,
        Side takerSide,
        uint256 takerPrice,
        uint256 takerSize,
        address taker
    ) internal returns (uint256 remaining) {
        remaining = takerSize;
        MarketBook storage book = marketBooks[marketId][outcomeIndex];

        FillParams memory params;
        params.marketId = marketId;
        params.outcomeIndex = outcomeIndex;
        params.taker = taker;
        params.takerSide = takerSide;

        // Step 1: Match against direct opposite side (same outcome book)
        if (takerSide == Side.BUY) {
            params.makerSide = Side.SELL;
            while (remaining > 0 && book.bestAsk > 0 && book.bestAsk <= takerPrice) {
                params.price = book.bestAsk;
                remaining = _fillAtPriceLevel(params, remaining);
                
                PriceLevel storage level = priceLevels[marketId][outcomeIndex][Side.SELL][book.bestAsk];
                if (!level.exists || level.totalSize == 0) {
                    book.bestAsk = level.nextPrice;
                }
            }
        } else {
            params.makerSide = Side.BUY;
            while (remaining > 0 && book.bestBid > 0 && book.bestBid >= takerPrice) {
                params.price = book.bestBid;
                remaining = _fillAtPriceLevel(params, remaining);
                
                PriceLevel storage level = priceLevels[marketId][outcomeIndex][Side.BUY][book.bestBid];
                if (!level.exists || level.totalSize == 0) {
                    book.bestBid = level.nextPrice;
                }
            }
        }

        // Step 2: Cross-book matching via complementary outcome
        // Buy Yes at P can match Buy No at (1-P) because together they form a full set
        // Sell Yes at P can match Sell No at (1-P) for the same reason
        if (remaining > 0) {
            remaining = _matchCrossBook(marketId, outcomeIndex, takerSide, takerPrice, remaining, taker);
        }
    }

    /**
     * @dev Cross-book matching: match against the complementary outcome's book.
     *      Buy Yes at $0.60 matches Buy No at $0.40 (complementary price = PRICE_PRECISION - price)
     *      This works because 1 Yes + 1 No = $1 collateral (split/merge invariant)
     */
    function _matchCrossBook(
        uint256 marketId,
        uint256 outcomeIndex,
        Side takerSide,
        uint256 takerPrice,
        uint256 takerSize,
        address taker
    ) internal returns (uint256 remaining) {
        remaining = takerSize;
        uint256 compOutcome = _complementaryOutcome(outcomeIndex);
        
        _initBookIfNeeded(marketId, compOutcome);
        MarketBook storage compBook = marketBooks[marketId][compOutcome];

        // Buy Yes at P → look for Buy No at <= (1-P) on the complementary book
        // Sell Yes at P → look for Sell No at >= (1-P) on the complementary book
        if (takerSide == Side.BUY) {
            // We want to buy outcome tokens. Check if someone is buying the complementary
            // outcome at a price where combined prices <= $1 (profitable match via split)
            while (remaining > 0 && compBook.bestBid > 0 && compBook.bestBid >= (PRICE_PRECISION - takerPrice)) {
                // There's a bid on the complementary book at a price that makes a match viable
                // Combined: takerPrice + compBidPrice >= PRICE_PRECISION means we can split $1
                // and give each side their tokens
                uint256 compPrice = compBook.bestBid;
                
                PriceLevel storage compLevel = priceLevels[marketId][compOutcome][Side.BUY][compPrice];
                if (!compLevel.exists || compLevel.totalSize == 0) {
                    compBook.bestBid = compLevel.nextPrice;
                    continue;
                }

                // Fill from the complementary level
                uint256 fillable = remaining < compLevel.totalSize ? remaining : compLevel.totalSize;
                remaining -= fillable;
                
                // Process individual orders at this comp price level
                _fillCrossBookLevel(marketId, outcomeIndex, compOutcome, takerPrice, compPrice, fillable, taker);

                if (compLevel.totalSize == 0) {
                    _removePriceLevel(marketId, compOutcome, Side.BUY, compPrice);
                    compBook.bestBid = compLevel.nextPrice;
                }
            }
        } else {
            // Selling outcome tokens. Check if someone is selling the complementary
            while (remaining > 0 && compBook.bestAsk > 0 && compBook.bestAsk <= (PRICE_PRECISION - takerPrice)) {
                uint256 compPrice = compBook.bestAsk;
                
                PriceLevel storage compLevel = priceLevels[marketId][compOutcome][Side.SELL][compPrice];
                if (!compLevel.exists || compLevel.totalSize == 0) {
                    compBook.bestAsk = compLevel.nextPrice;
                    continue;
                }

                uint256 fillable = remaining < compLevel.totalSize ? remaining : compLevel.totalSize;
                remaining -= fillable;

                _fillCrossBookLevel(marketId, outcomeIndex, compOutcome, takerPrice, compPrice, fillable, taker);

                if (compLevel.totalSize == 0) {
                    _removePriceLevel(marketId, compOutcome, Side.SELL, compPrice);
                    compBook.bestAsk = compLevel.nextPrice;
                }
            }
        }
    }

    /**
     * @dev Fill cross-book orders at a complementary price level
     */
    function _fillCrossBookLevel(
        uint256 marketId,
        uint256 outcomeIndex,
        uint256 compOutcome,
        uint256 takerPrice,
        uint256 compPrice,
        uint256 fillSize,
        address /* taker */
    ) internal {
        // The cross-book match works by splitting/merging:
        // Both sides deposit collateral totaling $1 per share
        // Each gets their respective outcome token
        uint256 takerCost = (takerPrice * fillSize) / PRICE_PRECISION;
        uint256 compCost = (compPrice * fillSize) / PRICE_PRECISION;

        uint256 fee = ((takerCost + compCost) * platformFeeBps) / (FEE_DENOMINATOR * 2);
        accumulatedFees += fee;

        // Update volume stats
        MarketBook storage book = marketBooks[marketId][outcomeIndex];
        book.totalVolume += takerCost;
        book.lastTradePrice = takerPrice;

        MarketBook storage compBookStats = marketBooks[marketId][compOutcome];
        compBookStats.totalVolume += compCost;
        compBookStats.lastTradePrice = compPrice;

        emit CrossBookMatch(marketId, outcomeIndex, compOutcome, takerPrice, fillSize);
    }

    /**
     * @dev Fill orders at a specific price level (FIFO - time priority)
     * @return remaining Unfilled taker size after processing this level
     */
    function _fillAtPriceLevel(
        FillParams memory params,
        uint256 takerRemaining
    ) internal returns (uint256 remaining) {
        remaining = takerRemaining;
        PriceLevel storage level = priceLevels[params.marketId][params.outcomeIndex][params.makerSide][params.price];
        
        uint256 currentOrderId = level.headOrderId;

        while (remaining > 0 && currentOrderId != 0) {
            Order storage makerOrder = orders[currentOrderId];
            uint256 nextId = orderNodes[currentOrderId].nextOrderId;

            if (!makerOrder.active) {
                currentOrderId = nextId;
                continue;
            }

            uint256 fillSize = remaining < (makerOrder.size - makerOrder.filled) 
                ? remaining 
                : (makerOrder.size - makerOrder.filled);

            // Execute the trade
            _executeTrade(params, fillSize, makerOrder.maker);

            // Update maker order
            makerOrder.filled += fillSize;
            remaining -= fillSize;
            level.totalSize -= fillSize;

            // If maker order fully filled, clean up
            if (makerOrder.filled >= makerOrder.size) {
                _deactivateOrder(currentOrderId, nextId, level);

                emit OrderFilled(
                    currentOrderId, makerOrder.maker, params.taker,
                    params.marketId, params.outcomeIndex, params.price, fillSize
                );
            }

            currentOrderId = nextId;
        }

        // Clean up empty price level
        if (level.totalSize == 0) {
            _removePriceLevel(params.marketId, params.outcomeIndex, params.makerSide, params.price);
        }
    }

    /**
     * @dev Deactivate a fully filled order and update linked list pointers
     */
    function _deactivateOrder(
        uint256 orderId,
        uint256 nextId,
        PriceLevel storage level
    ) internal {
        Order storage o = orders[orderId];
        o.active = false;
        userActiveOrderCount[o.maker]--;

        uint256 prevId = orderNodes[orderId].prevOrderId;

        if (level.headOrderId == orderId) {
            level.headOrderId = nextId;
        }
        if (level.tailOrderId == orderId) {
            level.tailOrderId = prevId;
        }
        if (prevId != 0) {
            orderNodes[prevId].nextOrderId = nextId;
        }
        if (nextId != 0) {
            orderNodes[nextId].prevOrderId = prevId;
        }
    }

    /**
     * @dev Execute a single trade between buyer and seller
     */
    function _executeTrade(
        FillParams memory params,
        uint256 size,
        address maker
    ) internal {
        uint256 cost = (params.price * size) / PRICE_PRECISION;
        uint256 fee = (cost * platformFeeBps) / FEE_DENOMINATOR;
        accumulatedFees += fee;

        uint256 tokenId = _getTokenId(params.marketId, params.outcomeIndex);

        if (params.takerSide == Side.BUY) {
            // taker is buyer, maker is seller
            IERC1155(ctfContract).safeTransferFrom(address(this), params.taker, tokenId, size, "");
            IERC20(collateralToken).transfer(maker, cost - fee);
        } else {
            // taker is seller, maker is buyer
            IERC1155(ctfContract).safeTransferFrom(address(this), maker, tokenId, size, "");
            IERC20(collateralToken).transfer(params.taker, cost - fee);
        }

        // Update market book stats
        MarketBook storage book = marketBooks[params.marketId][params.outcomeIndex];
        book.totalVolume += cost;
        book.lastTradePrice = params.price;

        emit TradeExecuted(
            params.marketId, params.outcomeIndex,
            params.takerSide == Side.BUY ? params.taker : maker,
            params.takerSide == Side.BUY ? maker : params.taker,
            params.price, size, cost
        );
    }

    /*//////////////////////////////////////////////////////////////
                    ORDER BOOK MANAGEMENT (INTERNAL)
    //////////////////////////////////////////////////////////////*/

    function _createOrder(
        uint256 marketId,
        uint256 outcomeIndex,
        Side side,
        uint256 price,
        uint256 size,
        address maker
    ) internal returns (uint256 orderId) {
        orderId = nextOrderId++;

        orders[orderId] = Order({
            id: orderId,
            maker: maker,
            marketId: marketId,
            outcomeIndex: outcomeIndex,
            side: side,
            price: price,
            size: size,
            filled: 0,
            timestamp: block.timestamp,
            active: true
        });

        // Insert into price level
        _insertIntoPriceLevel(marketId, outcomeIndex, side, price, orderId);

        // Track user orders
        userOrderIds[maker].push(orderId);
        userActiveOrderCount[maker]++;

        // Update best bid/ask
        MarketBook storage book = marketBooks[marketId][outcomeIndex];
        if (side == Side.BUY) {
            if (book.bestBid == 0 || price > book.bestBid) {
                book.bestBid = price;
            }
        } else {
            if (book.bestAsk == 0 || price < book.bestAsk) {
                book.bestAsk = price;
            }
        }

        emit OrderPlaced(orderId, maker, marketId, outcomeIndex, side, price, size);
    }

    function _insertIntoPriceLevel(
        uint256 marketId,
        uint256 outcomeIndex,
        Side side,
        uint256 price,
        uint256 orderId
    ) internal {
        PriceLevel storage level = priceLevels[marketId][outcomeIndex][side][price];
        
        Order storage order = orders[orderId];
        uint256 remaining = order.size - order.filled;

        if (!level.exists) {
            // Create new price level
            level.price = price;
            level.totalSize = remaining;
            level.headOrderId = orderId;
            level.tailOrderId = orderId;
            level.exists = true;

            // Insert into sorted price level list
            _insertPriceLevelSorted(marketId, outcomeIndex, side, price);
        } else {
            // Append to existing price level (time priority - FIFO)
            level.totalSize += remaining;
            
            if (level.tailOrderId != 0) {
                orderNodes[level.tailOrderId].nextOrderId = orderId;
                orderNodes[orderId].prevOrderId = level.tailOrderId;
            }
            level.tailOrderId = orderId;
        }
    }

    function _insertPriceLevelSorted(
        uint256 marketId,
        uint256 outcomeIndex,
        Side side,
        uint256 price
    ) internal {
        MarketBook storage book = marketBooks[marketId][outcomeIndex];

        if (side == Side.BUY) {
            // Bids: sorted descending. nextPrice points to next lower price.
            uint256 current = book.bestBid;
            
            if (current == 0 || price > current) {
                // New best bid
                priceLevels[marketId][outcomeIndex][side][price].nextPrice = current;
                if (current != 0) {
                    priceLevels[marketId][outcomeIndex][side][current].prevPrice = price;
                }
                // bestBid updated in _createOrder
                return;
            }

            // Find insertion point
            while (current != 0) {
                PriceLevel storage currentLevel = priceLevels[marketId][outcomeIndex][side][current];
                uint256 nextP = currentLevel.nextPrice;
                
                if (nextP == 0 || price > nextP) {
                    // Insert between current and next
                    priceLevels[marketId][outcomeIndex][side][price].nextPrice = nextP;
                    priceLevels[marketId][outcomeIndex][side][price].prevPrice = current;
                    currentLevel.nextPrice = price;
                    if (nextP != 0) {
                        priceLevels[marketId][outcomeIndex][side][nextP].prevPrice = price;
                    }
                    return;
                }
                current = nextP;
            }
        } else {
            // Asks: sorted ascending. nextPrice points to next higher price.
            uint256 current = book.bestAsk;

            if (current == 0 || price < current) {
                // New best ask
                priceLevels[marketId][outcomeIndex][side][price].nextPrice = current;
                if (current != 0) {
                    priceLevels[marketId][outcomeIndex][side][current].prevPrice = price;
                }
                return;
            }

            // Find insertion point
            while (current != 0) {
                PriceLevel storage currentLevel = priceLevels[marketId][outcomeIndex][side][current];
                uint256 nextP = currentLevel.nextPrice;

                if (nextP == 0 || price < nextP) {
                    priceLevels[marketId][outcomeIndex][side][price].nextPrice = nextP;
                    priceLevels[marketId][outcomeIndex][side][price].prevPrice = current;
                    currentLevel.nextPrice = price;
                    if (nextP != 0) {
                        priceLevels[marketId][outcomeIndex][side][nextP].prevPrice = price;
                    }
                    return;
                }
                current = nextP;
            }
        }
    }

    function _removeOrder(uint256 orderId) internal {
        Order storage order = orders[orderId];
        order.active = false;
        userActiveOrderCount[order.maker]--;

        PriceLevel storage level = priceLevels[order.marketId][order.outcomeIndex][order.side][order.price];
        uint256 remaining = order.size - order.filled;
        level.totalSize -= remaining;

        // Update linked list
        uint256 prevId = orderNodes[orderId].prevOrderId;
        uint256 nextId = orderNodes[orderId].nextOrderId;

        if (prevId != 0) {
            orderNodes[prevId].nextOrderId = nextId;
        } else {
            level.headOrderId = nextId;
        }

        if (nextId != 0) {
            orderNodes[nextId].prevOrderId = prevId;
        } else {
            level.tailOrderId = prevId;
        }

        // If price level is empty, remove it
        if (level.totalSize == 0) {
            _removePriceLevel(order.marketId, order.outcomeIndex, order.side, order.price);
        }
    }

    function _removePriceLevel(
        uint256 marketId,
        uint256 outcomeIndex,
        Side side,
        uint256 price
    ) internal {
        PriceLevel storage level = priceLevels[marketId][outcomeIndex][side][price];
        
        uint256 prevP = level.prevPrice;
        uint256 nextP = level.nextPrice;

        // Update linked list
        if (prevP != 0) {
            priceLevels[marketId][outcomeIndex][side][prevP].nextPrice = nextP;
        }
        if (nextP != 0) {
            priceLevels[marketId][outcomeIndex][side][nextP].prevPrice = prevP;
        }

        // Update best bid/ask
        MarketBook storage book = marketBooks[marketId][outcomeIndex];
        if (side == Side.BUY && book.bestBid == price) {
            book.bestBid = nextP; // Next lower bid
        }
        if (side == Side.SELL && book.bestAsk == price) {
            book.bestAsk = nextP; // Next higher ask
        }

        // Clear the level
        delete priceLevels[marketId][outcomeIndex][side][price];
    }

    /*//////////////////////////////////////////////////////////////
                        HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _initBookIfNeeded(uint256 marketId, uint256 outcomeIndex) internal {
        if (!marketBooks[marketId][outcomeIndex].initialized) {
            marketBooks[marketId][outcomeIndex].initialized = true;
        }
    }

    function _isMarketActive(uint256 marketId) internal view returns (bool) {
        // Use the simple isMarketActive view that returns only primitives (no dynamic types)
        (bool success, bytes memory data) = ctfContract.staticcall(
            abi.encodeWithSignature("isMarketActive(uint256)", marketId)
        );
        
        if (!success) return false;

        (bool active, , , ) = abi.decode(data, (bool, uint256, bool, bool));
        return active;
    }

    function _complementaryOutcome(uint256 outcomeIndex) internal pure returns (uint256) {
        // For binary markets: 0 (Yes) <-> 1 (No)
        return outcomeIndex == 0 ? 1 : 0;
    }

    function _getTokenId(uint256 marketId, uint256 outcomeIndex) internal view returns (uint256) {
        (bool success, bytes memory data) = ctfContract.staticcall(
            abi.encodeWithSignature("getOutcomeToken(uint256,uint256)", marketId, outcomeIndex)
        );
        require(success, "Failed to get token ID");
        return abi.decode(data, (uint256));
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get the full order book for a market outcome (up to maxLevels per side)
     * @param marketId Market ID
     * @param outcomeIndex 0 for YES, 1 for NO
     * @param maxLevels Maximum number of price levels to return per side
     * @return bidPrices Array of bid prices (descending)
     * @return bidSizes Array of total sizes at each bid price
     * @return askPrices Array of ask prices (ascending)
     * @return askSizes Array of total sizes at each ask price
     */
    function getOrderBook(
        uint256 marketId,
        uint256 outcomeIndex,
        uint256 maxLevels
    ) external view returns (
        uint256[] memory bidPrices,
        uint256[] memory bidSizes,
        uint256[] memory askPrices,
        uint256[] memory askSizes
    ) {
        MarketBook storage book = marketBooks[marketId][outcomeIndex];

        // Count bid levels
        uint256 bidCount = 0;
        uint256 currentPrice = book.bestBid;
        while (currentPrice != 0 && bidCount < maxLevels) {
            bidCount++;
            currentPrice = priceLevels[marketId][outcomeIndex][Side.BUY][currentPrice].nextPrice;
        }

        // Count ask levels
        uint256 askCount = 0;
        currentPrice = book.bestAsk;
        while (currentPrice != 0 && askCount < maxLevels) {
            askCount++;
            currentPrice = priceLevels[marketId][outcomeIndex][Side.SELL][currentPrice].nextPrice;
        }

        // Populate arrays
        bidPrices = new uint256[](bidCount);
        bidSizes = new uint256[](bidCount);
        askPrices = new uint256[](askCount);
        askSizes = new uint256[](askCount);

        currentPrice = book.bestBid;
        for (uint256 i = 0; i < bidCount; i++) {
            bidPrices[i] = currentPrice;
            bidSizes[i] = priceLevels[marketId][outcomeIndex][Side.BUY][currentPrice].totalSize;
            currentPrice = priceLevels[marketId][outcomeIndex][Side.BUY][currentPrice].nextPrice;
        }

        currentPrice = book.bestAsk;
        for (uint256 i = 0; i < askCount; i++) {
            askPrices[i] = currentPrice;
            askSizes[i] = priceLevels[marketId][outcomeIndex][Side.SELL][currentPrice].totalSize;
            currentPrice = priceLevels[marketId][outcomeIndex][Side.SELL][currentPrice].nextPrice;
        }
    }

    /**
     * @notice Get market book summary
     */
    function getMarketBookSummary(uint256 marketId, uint256 outcomeIndex) 
        external view returns (
            uint256 bestBid,
            uint256 bestAsk,
            uint256 spread,
            uint256 totalVolume,
            uint256 lastTradePrice
        ) 
    {
        MarketBook storage book = marketBooks[marketId][outcomeIndex];
        bestBid = book.bestBid;
        bestAsk = book.bestAsk;
        spread = (bestAsk > 0 && bestBid > 0) ? bestAsk - bestBid : 0;
        totalVolume = book.totalVolume;
        lastTradePrice = book.lastTradePrice;
    }

    /**
     * @notice Get a specific order
     */
    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    /**
     * @notice Get all active orders for a user
     */
    function getUserActiveOrders(address user) external view returns (Order[] memory) {
        uint256[] storage ids = userOrderIds[user];
        uint256 activeCount = userActiveOrderCount[user];
        
        Order[] memory activeOrders = new Order[](activeCount);
        uint256 idx = 0;

        for (uint256 i = 0; i < ids.length && idx < activeCount; i++) {
            if (orders[ids[i]].active) {
                activeOrders[idx] = orders[ids[i]];
                idx++;
            }
        }

        return activeOrders;
    }

    /**
     * @notice Get the mid price (average of best bid and best ask)
     */
    function getMidPrice(uint256 marketId, uint256 outcomeIndex) external view returns (uint256) {
        MarketBook storage book = marketBooks[marketId][outcomeIndex];
        if (book.bestBid == 0 || book.bestAsk == 0) return 0;
        return (book.bestBid + book.bestAsk) / 2;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 500, "Fee too high"); // Max 5%
        platformFeeBps = _feeBps;
    }

    function withdrawFees() external onlyOwner {
        uint256 fees = accumulatedFees;
        accumulatedFees = 0;
        IERC20(collateralToken).transfer(owner(), fees);
    }

    function setCTFContract(address _ctfContract) external onlyOwner {
        ctfContract = _ctfContract;
    }

    function setCollateralToken(address _collateralToken, uint8 _decimals) external onlyOwner {
        collateralToken = _collateralToken;
        collateralDecimals = _decimals;
    }
}
