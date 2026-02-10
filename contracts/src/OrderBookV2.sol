// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title OrderBookV2
 * @notice UUPS-upgradeable on-chain Central Limit Order Book (CLOB) for prediction market outcome tokens
 * @dev Implements price-time priority matching like Limitless Exchange on Base.
 *      - Limit orders: specify exact price and size
 *      - Market orders: execute immediately at best available price
 *      - Orders stored on-chain in sorted linked lists per price level
 *      - Prices are in basis points (0-10000) representing 0.00-1.00 USDC per share
 *      - YES token price + NO token price always = 10000 (1.00 USDC)
 */
contract OrderBookV2 is
    Initializable,
    ERC1155Holder,
    OwnableUpgradeable,
    ReentrancyGuard,
    UUPSUpgradeable
{

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant PRICE_PRECISION = 10000;
    uint256 public constant MIN_PRICE = 1;
    uint256 public constant MAX_PRICE = 9999;
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
        uint256 outcomeIndex;
        Side side;
        uint256 price;
        uint256 size;
        uint256 filled;
        uint256 timestamp;
        bool active;
    }

    struct PriceLevel {
        uint256 price;
        uint256 totalSize;
        uint256 headOrderId;
        uint256 tailOrderId;
        uint256 nextPrice;
        uint256 prevPrice;
        bool exists;
    }

    struct MarketBook {
        uint256 bestBid;
        uint256 bestAsk;
        uint256 totalVolume;
        uint256 lastTradePrice;
        bool initialized;
    }

    struct OrderNode {
        uint256 nextOrderId;
        uint256 prevOrderId;
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

    address public ctfContract;
    address public collateralToken;
    uint8 public collateralDecimals;

    uint256 public platformFeeBps;
    uint256 public accumulatedFees;

    uint256 public nextOrderId;

    mapping(uint256 => Order) public orders;
    mapping(uint256 => OrderNode) public orderNodes;
    mapping(uint256 => mapping(uint256 => mapping(Side => mapping(uint256 => PriceLevel)))) public priceLevels;
    mapping(uint256 => mapping(uint256 => MarketBook)) public marketBooks;
    mapping(address => uint256[]) public userOrderIds;
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
                            INITIALIZER
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _ctfContract,
        address _collateralToken,
        uint8 _collateralDecimals,
        address _owner
    ) public initializer {
        __Ownable_init(_owner);

        ctfContract = _ctfContract;
        collateralToken = _collateralToken;
        collateralDecimals = _collateralDecimals;
        platformFeeBps = 50;
        nextOrderId = 1;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /*//////////////////////////////////////////////////////////////
                        LIMIT ORDER PLACEMENT
    //////////////////////////////////////////////////////////////*/

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

        _initBookIfNeeded(marketId, outcomeIndex);

        address mktCollateral = _getMarketCollateral(marketId);

        if (side == Side.BUY) {
            uint256 collateralRequired = (price * size) / PRICE_PRECISION;
            require(collateralRequired > 0, "Order too small");
            IERC20(mktCollateral).transferFrom(msg.sender, address(this), collateralRequired);
        } else {
            uint256 tokenId = _getTokenId(marketId, outcomeIndex);
            IERC1155(ctfContract).safeTransferFrom(msg.sender, address(this), tokenId, size, "");
        }

        uint256 remaining = _matchOrder(marketId, outcomeIndex, side, price, size, msg.sender);

        if (remaining > 0) {
            orderId = _createOrder(marketId, outcomeIndex, side, price, remaining, msg.sender);
        }

        return orderId;
    }

    /*//////////////////////////////////////////////////////////////
                        MARKET ORDER EXECUTION
    //////////////////////////////////////////////////////////////*/

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

            uint256 worstPrice = book.bestAsk + (book.bestAsk * maxSlippageBps) / FEE_DENOMINATOR;
            if (worstPrice > MAX_PRICE) worstPrice = MAX_PRICE;

            uint256 maxCollateral = (worstPrice * size) / PRICE_PRECISION;
            address mktCollateral = _getMarketCollateral(marketId);
            IERC20(mktCollateral).transferFrom(msg.sender, address(this), maxCollateral);

            uint256 remaining = _matchOrder(marketId, outcomeIndex, side, worstPrice, size, msg.sender);
            filledSize = size - remaining;

            if (remaining > 0) {
                uint256 refund = (worstPrice * remaining) / PRICE_PRECISION;
                if (refund > 0) {
                    IERC20(mktCollateral).transfer(msg.sender, refund);
                }
            }
        } else {
            require(book.bestBid > 0, "No bids available");

            uint256 worstPrice = book.bestBid - (book.bestBid * maxSlippageBps) / FEE_DENOMINATOR;
            if (worstPrice < MIN_PRICE) worstPrice = MIN_PRICE;

            uint256 tokenId = _getTokenId(marketId, outcomeIndex);
            IERC1155(ctfContract).safeTransferFrom(msg.sender, address(this), tokenId, size, "");

            uint256 remaining = _matchOrder(marketId, outcomeIndex, side, worstPrice, size, msg.sender);
            filledSize = size - remaining;

            if (remaining > 0) {
                IERC1155(ctfContract).safeTransferFrom(address(this), msg.sender, tokenId, remaining, "");
            }
        }

        require(filledSize > 0, "No liquidity at acceptable price");
    }

    /*//////////////////////////////////////////////////////////////
                        ORDER CANCELLATION
    //////////////////////////////////////////////////////////////*/

    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.maker == msg.sender, "Not order maker");
        require(order.active, "Order not active");

        uint256 remaining = order.size - order.filled;
        require(remaining > 0, "Nothing to cancel");

        _removeOrder(orderId);

        if (order.side == Side.BUY) {
            uint256 refund = (order.price * remaining) / PRICE_PRECISION;
            if (refund > 0) {
                IERC20(_getMarketCollateral(order.marketId)).transfer(msg.sender, refund);
            }
        } else {
            uint256 tokenId = _getTokenId(order.marketId, order.outcomeIndex);
            IERC1155(ctfContract).safeTransferFrom(address(this), msg.sender, tokenId, remaining, "");
        }

        emit OrderCancelled(orderId, msg.sender, remaining);
    }

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
                            IERC20(_getMarketCollateral(marketId)).transfer(msg.sender, refund);
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

    function splitShares(uint256 marketId, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(_isMarketActive(marketId), "Market not active");

        address mktCollateral = _getMarketCollateral(marketId);
        IERC20(mktCollateral).transferFrom(msg.sender, address(this), amount);
        IERC20(mktCollateral).approve(ctfContract, amount);

        (bool success,) = ctfContract.call(
            abi.encodeWithSignature("mintPositionTokens(uint256,uint256)", marketId, amount)
        );
        require(success, "Split failed");

        uint256 yesTokenId = _getTokenId(marketId, 0);
        uint256 noTokenId = _getTokenId(marketId, 1);
        IERC1155(ctfContract).safeTransferFrom(address(this), msg.sender, yesTokenId, amount, "");
        IERC1155(ctfContract).safeTransferFrom(address(this), msg.sender, noTokenId, amount, "");

        emit SharesSplit(marketId, msg.sender, amount);
    }

    function mergeShares(uint256 marketId, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        uint256 yesTokenId = _getTokenId(marketId, 0);
        uint256 noTokenId = _getTokenId(marketId, 1);
        IERC1155(ctfContract).safeTransferFrom(msg.sender, address(this), yesTokenId, amount, "");
        IERC1155(ctfContract).safeTransferFrom(msg.sender, address(this), noTokenId, amount, "");

        IERC1155(ctfContract).setApprovalForAll(ctfContract, true);

        (bool success,) = ctfContract.call(
            abi.encodeWithSignature("redeemPositionTokens(uint256,uint256)", marketId, amount)
        );
        require(success, "Merge failed");

        IERC20(_getMarketCollateral(marketId)).transfer(msg.sender, amount);

        emit SharesMerged(marketId, msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                        MATCHING ENGINE (INTERNAL)
    //////////////////////////////////////////////////////////////*/

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

        if (remaining > 0) {
            remaining = _matchCrossBook(marketId, outcomeIndex, takerSide, takerPrice, remaining, taker);
        }
    }

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

        if (takerSide == Side.BUY) {
            while (remaining > 0 && compBook.bestBid > 0 && compBook.bestBid >= (PRICE_PRECISION - takerPrice)) {
                uint256 compPrice = compBook.bestBid;

                PriceLevel storage compLevel = priceLevels[marketId][compOutcome][Side.BUY][compPrice];
                if (!compLevel.exists || compLevel.totalSize == 0) {
                    compBook.bestBid = compLevel.nextPrice;
                    continue;
                }

                uint256 fillable = remaining < compLevel.totalSize ? remaining : compLevel.totalSize;
                remaining -= fillable;

                _fillCrossBookLevel(marketId, outcomeIndex, compOutcome, takerPrice, compPrice, fillable, taker);

                if (compLevel.totalSize == 0) {
                    _removePriceLevel(marketId, compOutcome, Side.BUY, compPrice);
                    compBook.bestBid = compLevel.nextPrice;
                }
            }
        } else {
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

    function _fillCrossBookLevel(
        uint256 marketId,
        uint256 outcomeIndex,
        uint256 compOutcome,
        uint256 takerPrice,
        uint256 compPrice,
        uint256 fillSize,
        address /* taker */
    ) internal {
        uint256 takerCost = (takerPrice * fillSize) / PRICE_PRECISION;
        uint256 compCost = (compPrice * fillSize) / PRICE_PRECISION;

        uint256 fee = ((takerCost + compCost) * platformFeeBps) / (FEE_DENOMINATOR * 2);
        accumulatedFees += fee;

        MarketBook storage book = marketBooks[marketId][outcomeIndex];
        book.totalVolume += takerCost;
        book.lastTradePrice = takerPrice;

        MarketBook storage compBookStats = marketBooks[marketId][compOutcome];
        compBookStats.totalVolume += compCost;
        compBookStats.lastTradePrice = compPrice;

        emit CrossBookMatch(marketId, outcomeIndex, compOutcome, takerPrice, fillSize);
    }

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

            _executeTrade(params, fillSize, makerOrder.maker);

            makerOrder.filled += fillSize;
            remaining -= fillSize;
            level.totalSize -= fillSize;

            if (makerOrder.filled >= makerOrder.size) {
                _deactivateOrder(currentOrderId, nextId, level);

                emit OrderFilled(
                    currentOrderId, makerOrder.maker, params.taker,
                    params.marketId, params.outcomeIndex, params.price, fillSize
                );
            }

            currentOrderId = nextId;
        }

        if (level.totalSize == 0) {
            _removePriceLevel(params.marketId, params.outcomeIndex, params.makerSide, params.price);
        }
    }

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

    function _executeTrade(
        FillParams memory params,
        uint256 size,
        address maker
    ) internal {
        uint256 cost = (params.price * size) / PRICE_PRECISION;
        uint256 fee = (cost * platformFeeBps) / FEE_DENOMINATOR;
        accumulatedFees += fee;

        uint256 tokenId = _getTokenId(params.marketId, params.outcomeIndex);

        address mktCollateral = _getMarketCollateral(params.marketId);

        if (params.takerSide == Side.BUY) {
            IERC1155(ctfContract).safeTransferFrom(address(this), params.taker, tokenId, size, "");
            IERC20(mktCollateral).transfer(maker, cost - fee);
        } else {
            IERC1155(ctfContract).safeTransferFrom(address(this), maker, tokenId, size, "");
            IERC20(mktCollateral).transfer(params.taker, cost - fee);
        }

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

        _insertIntoPriceLevel(marketId, outcomeIndex, side, price, orderId);

        userOrderIds[maker].push(orderId);
        userActiveOrderCount[maker]++;

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
            level.price = price;
            level.totalSize = remaining;
            level.headOrderId = orderId;
            level.tailOrderId = orderId;
            level.exists = true;

            _insertPriceLevelSorted(marketId, outcomeIndex, side, price);
        } else {
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
            uint256 current = book.bestBid;

            if (current == 0 || price > current) {
                priceLevels[marketId][outcomeIndex][side][price].nextPrice = current;
                if (current != 0) {
                    priceLevels[marketId][outcomeIndex][side][current].prevPrice = price;
                }
                return;
            }

            while (current != 0) {
                PriceLevel storage currentLevel = priceLevels[marketId][outcomeIndex][side][current];
                uint256 nextP = currentLevel.nextPrice;

                if (nextP == 0 || price > nextP) {
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
            uint256 current = book.bestAsk;

            if (current == 0 || price < current) {
                priceLevels[marketId][outcomeIndex][side][price].nextPrice = current;
                if (current != 0) {
                    priceLevels[marketId][outcomeIndex][side][current].prevPrice = price;
                }
                return;
            }

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

        if (prevP != 0) {
            priceLevels[marketId][outcomeIndex][side][prevP].nextPrice = nextP;
        }
        if (nextP != 0) {
            priceLevels[marketId][outcomeIndex][side][nextP].prevPrice = prevP;
        }

        MarketBook storage book = marketBooks[marketId][outcomeIndex];
        if (side == Side.BUY && book.bestBid == price) {
            book.bestBid = nextP;
        }
        if (side == Side.SELL && book.bestAsk == price) {
            book.bestAsk = nextP;
        }

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
        (bool success, bytes memory data) = ctfContract.staticcall(
            abi.encodeWithSignature("isMarketActive(uint256)", marketId)
        );

        if (!success) return false;

        (bool active, , , ) = abi.decode(data, (bool, uint256, bool, bool));
        return active;
    }

    function _complementaryOutcome(uint256 outcomeIndex) internal pure returns (uint256) {
        return outcomeIndex == 0 ? 1 : 0;
    }

    function _getTokenId(uint256 marketId, uint256 outcomeIndex) internal view returns (uint256) {
        (bool success, bytes memory data) = ctfContract.staticcall(
            abi.encodeWithSignature("getOutcomeToken(uint256,uint256)", marketId, outcomeIndex)
        );
        require(success, "Failed to get token ID");
        return abi.decode(data, (uint256));
    }

    /// @dev Read the collateral token for a specific market from the CTF contract.
    ///      Falls back to the OrderBook's default collateralToken if the call fails.
    function _getMarketCollateral(uint256 marketId) internal view returns (address) {
        (bool success, bytes memory data) = ctfContract.staticcall(
            abi.encodeWithSignature("getMarketCollateral(uint256)", marketId)
        );
        if (success && data.length >= 32) {
            address token = abi.decode(data, (address));
            if (token != address(0)) return token;
        }
        return collateralToken;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

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

        uint256 bidCount = 0;
        uint256 currentPrice = book.bestBid;
        while (currentPrice != 0 && bidCount < maxLevels) {
            bidCount++;
            currentPrice = priceLevels[marketId][outcomeIndex][Side.BUY][currentPrice].nextPrice;
        }

        uint256 askCount = 0;
        currentPrice = book.bestAsk;
        while (currentPrice != 0 && askCount < maxLevels) {
            askCount++;
            currentPrice = priceLevels[marketId][outcomeIndex][Side.SELL][currentPrice].nextPrice;
        }

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

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

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

    function getMidPrice(uint256 marketId, uint256 outcomeIndex) external view returns (uint256) {
        MarketBook storage book = marketBooks[marketId][outcomeIndex];
        if (book.bestBid == 0 || book.bestAsk == 0) return 0;
        return (book.bestBid + book.bestAsk) / 2;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 500, "Fee too high");
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
