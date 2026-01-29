// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title CTFPredictionMarket
 * @notice Conditional Token Framework based prediction market following Polymarket standards
 * @dev Implements ERC1155 for outcome tokens and signature-based order matching
 */
contract CTFPredictionMarket is ERC1155, ERC1155Holder, Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    enum OrderSide { BUY, SELL }
    enum SignatureType { EOA, POLY_PROXY, POLY_GNOSIS_SAFE }
    
    struct Order {
        address maker;          // Order creator
        address taker;          // Order taker (address(0) for open orders)
        uint256 tokenId;        // Outcome token ID
        uint256 makerAmount;    // Amount maker is offering
        uint256 takerAmount;    // Amount taker must provide
        uint256 expiration;     // Order expiration timestamp
        uint256 nonce;          // Unique order nonce
        uint256 feeRateBps;     // Fee rate in basis points
        OrderSide side;         // BUY or SELL
        SignatureType signatureType;
        bytes signature;        // Order signature
    }

    struct Market {
        uint256 id;
        string question;
        string description;
        address creator;
        address collateralToken;
        uint256 createdAt;
        uint256 closingTime;
        uint256 resolutionTime;
        bytes32 conditionId;
        uint256 outcomeCount;
        uint256 winningOutcome;
        bool resolved;
        bool paused;
    }

    struct OrderStatus {
        bool isFilledOrCancelled;
        uint256 remaining;
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    uint256 public marketCount;
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public platformFeeBps = 50; // 0.5%
    
    // Market ID => Market
    mapping(uint256 => Market) public markets;
    
    // Order hash => OrderStatus
    mapping(bytes32 => OrderStatus) public orderStatus;
    
    // User => nonce => used
    mapping(address => mapping(uint256 => bool)) public nonces;
    
    // Market ID => outcome index => token ID
    mapping(uint256 => mapping(uint256 => uint256)) public outcomeTokens;
    
    // Token ID => Market ID
    mapping(uint256 => uint256) public tokenToMarket;
    
    // User => Market ID => outcome => balance (for tracking)
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public userPositions;
    
    // Authorized resolvers (e.g., PythResolver for automated resolution)
    mapping(address => bool) public authorizedResolvers;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event MarketCreated(
        uint256 indexed marketId,
        bytes32 indexed conditionId,
        string question,
        uint256 outcomeCount,
        uint256 closingTime
    );

    event OrderFilled(
        bytes32 indexed orderHash,
        address indexed maker,
        address indexed taker,
        uint256 tokenId,
        uint256 makerAmount,
        uint256 takerAmount
    );

    event OrderCancelled(bytes32 indexed orderHash, address indexed maker);
    
    event MarketResolved(uint256 indexed marketId, uint256 winningOutcome);
    
    event TokensRedeemed(
        uint256 indexed marketId,
        address indexed user,
        uint256 outcome,
        uint256 amount,
        uint256 payout
    );
    
    event ResolverAuthorized(address indexed resolver, bool authorized);

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() 
        ERC1155("https://api.betua.com/metadata/{id}.json")
        Ownable(msg.sender)
        EIP712("CTFPredictionMarket", "1")
    {}

    /*//////////////////////////////////////////////////////////////
                        MARKET CREATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new prediction market
     * @param _question Market question
     * @param _description Market description
     * @param _outcomeCount Number of possible outcomes
     * @param _closingTime When market closes for trading
     * @param _collateralToken ERC20 token used as collateral
     */
    function createMarket(
        string memory _question,
        string memory _description,
        uint256 _outcomeCount,
        uint256 _closingTime,
        address _collateralToken
    ) external returns (uint256 marketId, bytes32 conditionId) {
        require(_outcomeCount >= 2, "Need at least 2 outcomes");
        require(_closingTime > block.timestamp, "Invalid closing time");
        
        marketCount++;
        marketId = marketCount;
        
        // Generate unique condition ID
        conditionId = keccak256(
            abi.encodePacked(
                address(this),
                marketId,
                _question,
                _outcomeCount,
                block.timestamp
            )
        );
        
        markets[marketId] = Market({
            id: marketId,
            question: _question,
            description: _description,
            creator: msg.sender,
            collateralToken: _collateralToken,
            createdAt: block.timestamp,
            closingTime: _closingTime,
            resolutionTime: 0,
            conditionId: conditionId,
            outcomeCount: _outcomeCount,
            winningOutcome: 0,
            resolved: false,
            paused: false
        });
        
        // Create outcome tokens
        for (uint256 i = 0; i < _outcomeCount; i++) {
            uint256 tokenId = uint256(keccak256(abi.encodePacked(conditionId, i)));
            outcomeTokens[marketId][i] = tokenId;
            tokenToMarket[tokenId] = marketId;
        }
        
        emit MarketCreated(marketId, conditionId, _question, _outcomeCount, _closingTime);
    }

    /*//////////////////////////////////////////////////////////////
                        ORDER MATCHING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Fill an order using signature-based authentication
     * @param order The order to fill
     * @param fillAmount Amount to fill (in maker amount terms)
     */
    function fillOrder(Order memory order, uint256 fillAmount) 
        external 
        nonReentrant 
    {
        Market storage market = markets[tokenToMarket[order.tokenId]];
        require(!market.paused, "Market paused");
        require(block.timestamp < market.closingTime, "Market closed");
        require(!market.resolved, "Market resolved");
        
        bytes32 orderHash = _hashOrder(order);
        
        // Verify signature
        require(_verifyOrderSignature(order, orderHash), "Invalid signature");
        
        // Check order status
        OrderStatus storage status = orderStatus[orderHash];
        require(!status.isFilledOrCancelled, "Order filled or cancelled");
        require(order.expiration > block.timestamp, "Order expired");
        require(!nonces[order.maker][order.nonce], "Nonce used");
        
        // Calculate amounts
        uint256 takerAmount = (fillAmount * order.takerAmount) / order.makerAmount;
        uint256 fee = (takerAmount * platformFeeBps) / FEE_DENOMINATOR;
        
        // Update order status
        if (status.remaining == 0) {
            status.remaining = order.makerAmount;
        }
        require(fillAmount <= status.remaining, "Exceeds remaining");
        status.remaining -= fillAmount;
        
        if (status.remaining == 0) {
            status.isFilledOrCancelled = true;
            nonces[order.maker][order.nonce] = true;
        }
        
        // Execute trade based on order side
        if (order.side == OrderSide.BUY) {
            // Maker is buying outcome tokens, taker is selling
            // Transfer collateral from maker to taker
            IERC20(market.collateralToken).transferFrom(
                order.maker,
                msg.sender,
                takerAmount - fee
            );
            
            // Transfer fee to platform
            if (fee > 0) {
                IERC20(market.collateralToken).transferFrom(
                    order.maker,
                    owner(),
                    fee
                );
            }
            
            // Transfer outcome tokens from taker to maker
            _safeTransferFrom(msg.sender, order.maker, order.tokenId, fillAmount, "");
            
        } else {
            // Maker is selling outcome tokens, taker is buying
            // Transfer collateral from taker to maker
            IERC20(market.collateralToken).transferFrom(
                msg.sender,
                order.maker,
                takerAmount - fee
            );
            
            // Transfer fee to platform
            if (fee > 0) {
                IERC20(market.collateralToken).transferFrom(
                    msg.sender,
                    owner(),
                    fee
                );
            }
            
            // Transfer outcome tokens from maker to taker
            _safeTransferFrom(order.maker, msg.sender, order.tokenId, fillAmount, "");
        }
        
        emit OrderFilled(orderHash, order.maker, msg.sender, order.tokenId, fillAmount, takerAmount);
    }

    /**
     * @notice Cancel an order
     * @param order The order to cancel
     */
    function cancelOrder(Order memory order) external {
        require(msg.sender == order.maker, "Not order maker");
        
        bytes32 orderHash = _hashOrder(order);
        OrderStatus storage status = orderStatus[orderHash];
        
        require(!status.isFilledOrCancelled, "Already filled or cancelled");
        
        status.isFilledOrCancelled = true;
        nonces[order.maker][order.nonce] = true;
        
        emit OrderCancelled(orderHash, order.maker);
    }

    /*//////////////////////////////////////////////////////////////
                        POSITION MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint outcome tokens by depositing collateral
     * @param marketId Market ID
     * @param amount Amount of collateral to deposit
     */
    function mintPositionTokens(uint256 marketId, uint256 amount) 
        external 
        nonReentrant 
    {
        Market storage market = markets[marketId];
        require(!market.resolved, "Market resolved");
        require(block.timestamp < market.closingTime, "Market closed");
        
        // Transfer collateral from user
        IERC20(market.collateralToken).transferFrom(msg.sender, address(this), amount);
        
        // Mint outcome tokens for each outcome
        for (uint256 i = 0; i < market.outcomeCount; i++) {
            uint256 tokenId = outcomeTokens[marketId][i];
            _mint(msg.sender, tokenId, amount, "");
            userPositions[msg.sender][marketId][i] += amount;
        }
    }

    /**
     * @notice Burn outcome tokens to redeem collateral
     * @param marketId Market ID
     * @param amount Amount of tokens to burn
     */
    function redeemPositionTokens(uint256 marketId, uint256 amount) 
        external 
        nonReentrant 
    {
        Market storage market = markets[marketId];
        
        // Burn outcome tokens for each outcome
        for (uint256 i = 0; i < market.outcomeCount; i++) {
            uint256 tokenId = outcomeTokens[marketId][i];
            _burn(msg.sender, tokenId, amount);
            userPositions[msg.sender][marketId][i] -= amount;
        }
        
        // Transfer collateral back to user
        IERC20(market.collateralToken).transfer(msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                        MARKET RESOLUTION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Resolve a market with winning outcome
     * @param marketId Market ID
     * @param winningOutcome Index of winning outcome
     */
    function resolveMarket(uint256 marketId, uint256 winningOutcome) 
        external 
    {
        Market storage market = markets[marketId];
        require(
            msg.sender == market.creator || 
            msg.sender == owner() || 
            authorizedResolvers[msg.sender],
            "Not authorized"
        );
        require(!market.resolved, "Already resolved");
        require(block.timestamp >= market.closingTime, "Market not closed");
        require(winningOutcome < market.outcomeCount, "Invalid outcome");
        
        market.resolved = true;
        market.resolutionTime = block.timestamp;
        market.winningOutcome = winningOutcome;
        
        emit MarketResolved(marketId, winningOutcome);
    }
    
    /**
     * @notice Authorize or revoke resolver contracts (e.g., PythResolver)
     * @param resolver Address of resolver contract
     * @param authorized True to authorize, false to revoke
     */
    function setAuthorizedResolver(address resolver, bool authorized) 
        external 
        onlyOwner 
    {
        authorizedResolvers[resolver] = authorized;
        emit ResolverAuthorized(resolver, authorized);
    }

    /**
     * @notice Redeem winning tokens for collateral
     * @param marketId Market ID
     * @param amount Amount of winning tokens to redeem
     */
    function redeemWinningTokens(uint256 marketId, uint256 amount) 
        external 
        nonReentrant 
    {
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved");
        
        uint256 winningTokenId = outcomeTokens[marketId][market.winningOutcome];
        
        // Burn winning tokens
        _burn(msg.sender, winningTokenId, amount);
        userPositions[msg.sender][marketId][market.winningOutcome] -= amount;
        
        // Transfer collateral 1:1
        IERC20(market.collateralToken).transfer(msg.sender, amount);
        
        emit TokensRedeemed(marketId, msg.sender, market.winningOutcome, amount, amount);
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _hashOrder(Order memory order) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "Order(address maker,address taker,uint256 tokenId,uint256 makerAmount,uint256 takerAmount,uint256 expiration,uint256 nonce,uint256 feeRateBps,uint8 side,uint8 signatureType)"
                    ),
                    order.maker,
                    order.taker,
                    order.tokenId,
                    order.makerAmount,
                    order.takerAmount,
                    order.expiration,
                    order.nonce,
                    order.feeRateBps,
                    order.side,
                    order.signatureType
                )
            )
        );
    }

    function _verifyOrderSignature(Order memory order, bytes32 orderHash) 
        internal 
        view 
        returns (bool) 
    {
        address signer = orderHash.recover(order.signature);
        return signer == order.maker;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 500, "Fee too high"); // Max 5%
        platformFeeBps = _feeBps;
    }

    /**
     * @notice Withdraw accumulated fees for a specific token
     * @param token The ERC20 token to withdraw fees for
     */
    function withdrawFees(address token) external onlyOwner nonReentrant {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        require(IERC20(token).transfer(owner(), balance), "Withdrawal failed");
    }

    /**
     * @notice Withdraw specific amount of fees
     * @param token The ERC20 token to withdraw
     * @param amount Amount to withdraw
     */
    function withdrawFeesAmount(address token, uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(IERC20(token).transfer(owner(), amount), "Withdrawal failed");
    }

    function pauseMarket(uint256 marketId) external onlyOwner {
        markets[marketId].paused = true;
    }

    function unpauseMarket(uint256 marketId) external onlyOwner {
        markets[marketId].paused = false;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    function getOutcomeToken(uint256 marketId, uint256 outcome) 
        external 
        view 
        returns (uint256) 
    {
        return outcomeTokens[marketId][outcome];
    }

    function getOrderStatus(bytes32 orderHash) 
        external 
        view 
        returns (OrderStatus memory) 
    {
        return orderStatus[orderHash];
    }

    function getUserPosition(address user, uint256 marketId, uint256 outcome) 
        external 
        view 
        returns (uint256) 
    {
        return userPositions[user][marketId][outcome];
    }

    /*//////////////////////////////////////////////////////////////
                        ERC1155 OVERRIDES
    //////////////////////////////////////////////////////////////*/

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC1155Holder)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
