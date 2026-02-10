// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title CTFPredictionMarketV2
 * @notice Upgradeable Conditional Token Framework prediction market with:
 *   - UUPS proxy upgradeability
 *   - Market creation fee (anti-spam)
 *   - Market cancellation with refunds
 *   - Rich on-chain metadata (categories, option images)
 *   - Batch trade execution for operator-assisted matching
 *   - Creator fee sharing
 */
contract CTFPredictionMarketV2 is
    Initializable,
    ERC1155Upgradeable,
    ERC1155Holder,
    OwnableUpgradeable,
    ReentrancyGuard,
    UUPSUpgradeable
{
    using ECDSA for bytes32;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    enum OrderSide { BUY, SELL }
    enum SignatureType { EOA, POLY_PROXY, POLY_GNOSIS_SAFE }
    enum MarketStatus { Active, Resolved, Canceled }

    struct Order {
        address maker;
        address taker;
        uint256 tokenId;
        uint256 makerAmount;
        uint256 takerAmount;
        uint256 expiration;
        uint256 nonce;
        uint256 feeRateBps;
        OrderSide side;
        SignatureType signatureType;
        bytes signature;
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
        MarketStatus status;
        bool paused;
        // V2: Rich metadata
        string[] categories;
        string[] optionTitles;
        string[] optionImages;
        string imageUrl;
    }

    struct OrderStatus {
        bool isFilledOrCancelled;
        uint256 remaining;
    }

    struct OperatorTrade {
        uint256 marketId;
        address buyer;
        address seller;
        uint256 outcomeIndex;
        uint256 shareAmount;
        uint256 usdcAmount;
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    uint256 public marketCount;
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public platformFeeBps;

    // V2: Market creation fee (in collateral token decimals, e.g. 1e6 = 1 USDC)
    uint256 public createMarketFee;

    // V2: Creator fee percent (basis points, e.g. 100 = 1%)
    uint256 public creatorFeeBps;

    // V2: Protocol fee accumulator per token
    mapping(address => uint256) public accumulatedFees;

    mapping(uint256 => Market) public markets;
    mapping(bytes32 => OrderStatus) public orderStatus;
    mapping(address => mapping(uint256 => bool)) public nonces;
    mapping(uint256 => mapping(uint256 => uint256)) public outcomeTokens;
    mapping(uint256 => uint256) public tokenToMarket;
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public userPositions;
    mapping(address => bool) public authorizedResolvers;
    mapping(address => bool) public authorizedOperators;

    // V2: Total collateral deposited per market (for cancellation refunds)
    mapping(uint256 => uint256) public marketCollateral;

    // V2: Total shares minted per market per user (for cancellation refunds)
    mapping(uint256 => mapping(address => uint256)) public userMintedAmount;

    // V2: Track all unique minters for refund iteration
    mapping(uint256 => address[]) private marketMinters;
    mapping(uint256 => mapping(address => bool)) private isMinter;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event MarketCreated(
        uint256 indexed marketId,
        bytes32 indexed conditionId,
        string question,
        uint256 outcomeCount,
        uint256 closingTime,
        address indexed creator,
        uint256 feePaid,
        string[] categories,
        string[] optionTitles,
        string imageUrl
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
    event MarketCanceled(uint256 indexed marketId);
    event MarketActivated(uint256 indexed marketId);

    event TokensRedeemed(
        uint256 indexed marketId,
        address indexed user,
        uint256 outcome,
        uint256 amount,
        uint256 payout
    );

    event RefundClaimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );

    event ResolverAuthorized(address indexed resolver, bool authorized);
    event OperatorAuthorized(address indexed operator, bool authorized);
    event TokensMintedFor(uint256 indexed marketId, address indexed recipient, uint256 amount);
    event CreateMarketFeeUpdated(uint256 oldFee, uint256 newFee);
    event CreatorFeeBpsUpdated(uint256 oldFee, uint256 newFee);
    event PlatformFeeBpsUpdated(uint256 oldFee, uint256 newFee);

    event OperatorTradeExecuted(
        uint256 indexed marketId,
        address indexed buyer,
        address indexed seller,
        uint256 outcomeIndex,
        uint256 shareAmount,
        uint256 usdcAmount,
        uint256 creatorFee,
        uint256 protocolFee
    );

    /*//////////////////////////////////////////////////////////////
                            INITIALIZER
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _owner) public initializer {
        __ERC1155_init("https://api.betua.com/metadata/{id}.json");
        __Ownable_init(_owner);

        platformFeeBps = 50; // 0.5%
        createMarketFee = 1_000_000; // 1 USDC (6 decimals)
        creatorFeeBps = 100; // 1%
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /*//////////////////////////////////////////////////////////////
                        MARKET CREATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new prediction market with rich metadata
     * @param _question Market question
     * @param _description Market description (JSON metadata)
     * @param _outcomeCount Number of possible outcomes
     * @param _closingTime When market closes for trading
     * @param _collateralToken ERC20 token used as collateral
     * @param _categories Array of category strings
     * @param _optionTitles Array of option title strings
     * @param _optionImages Array of option image URLs
     * @param _imageUrl Market cover image URL
     */
    function createMarket(
        string memory _question,
        string memory _description,
        uint256 _outcomeCount,
        uint256 _closingTime,
        address _collateralToken,
        string[] memory _categories,
        string[] memory _optionTitles,
        string[] memory _optionImages,
        string memory _imageUrl
    ) external nonReentrant returns (uint256 marketId, bytes32 conditionId) {
        require(_outcomeCount >= 2, "Need at least 2 outcomes");
        require(_closingTime > block.timestamp, "Invalid closing time");

        // Charge creation fee (anti-spam)
        if (createMarketFee > 0) {
            IERC20(_collateralToken).transferFrom(msg.sender, address(this), createMarketFee);
            accumulatedFees[_collateralToken] += createMarketFee;
        }

        marketCount++;
        marketId = marketCount;

        conditionId = keccak256(
            abi.encodePacked(
                address(this),
                marketId,
                _question,
                _outcomeCount,
                block.timestamp
            )
        );

        Market storage m = markets[marketId];
        m.id = marketId;
        m.question = _question;
        m.description = _description;
        m.creator = msg.sender;
        m.collateralToken = _collateralToken;
        m.createdAt = block.timestamp;
        m.closingTime = _closingTime;
        m.conditionId = conditionId;
        m.outcomeCount = _outcomeCount;
        m.status = MarketStatus.Active;
        m.imageUrl = _imageUrl;

        // Store rich metadata
        for (uint256 i = 0; i < _categories.length; i++) {
            m.categories.push(_categories[i]);
        }
        for (uint256 i = 0; i < _optionTitles.length; i++) {
            m.optionTitles.push(_optionTitles[i]);
        }
        for (uint256 i = 0; i < _optionImages.length; i++) {
            m.optionImages.push(_optionImages[i]);
        }

        // Create outcome tokens
        for (uint256 i = 0; i < _outcomeCount; i++) {
            uint256 tokenId = uint256(keccak256(abi.encodePacked(conditionId, i)));
            outcomeTokens[marketId][i] = tokenId;
            tokenToMarket[tokenId] = marketId;
        }

        emit MarketCreated(
            marketId, conditionId, _question, _outcomeCount, _closingTime,
            msg.sender, createMarketFee, _categories, _optionTitles, _imageUrl
        );
    }

    /**
     * @notice Backwards-compatible createMarket (no rich metadata)
     */
    function createMarket(
        string memory _question,
        string memory _description,
        uint256 _outcomeCount,
        uint256 _closingTime,
        address _collateralToken
    ) external nonReentrant returns (uint256 marketId, bytes32 conditionId) {
        require(_outcomeCount >= 2, "Need at least 2 outcomes");
        require(_closingTime > block.timestamp, "Invalid closing time");

        // Charge creation fee
        if (createMarketFee > 0) {
            IERC20(_collateralToken).transferFrom(msg.sender, address(this), createMarketFee);
            accumulatedFees[_collateralToken] += createMarketFee;
        }

        marketCount++;
        marketId = marketCount;

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
            status: MarketStatus.Active,
            paused: false,
            categories: new string[](0),
            optionTitles: new string[](0),
            optionImages: new string[](0),
            imageUrl: ""
        });

        for (uint256 i = 0; i < _outcomeCount; i++) {
            uint256 tokenId = uint256(keccak256(abi.encodePacked(conditionId, i)));
            outcomeTokens[marketId][i] = tokenId;
            tokenToMarket[tokenId] = marketId;
        }

        emit MarketCreated(
            marketId, conditionId, _question, _outcomeCount, _closingTime,
            msg.sender, createMarketFee,
            new string[](0), new string[](0), ""
        );
    }

    /*//////////////////////////////////////////////////////////////
                        POSITION MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function mintPositionTokens(uint256 marketId, uint256 amount)
        external
        nonReentrant
    {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.closingTime, "Market closed");

        IERC20(market.collateralToken).transferFrom(msg.sender, address(this), amount);

        // Track collateral for cancellation refunds
        marketCollateral[marketId] += amount;
        userMintedAmount[marketId][msg.sender] += amount;
        if (!isMinter[marketId][msg.sender]) {
            isMinter[marketId][msg.sender] = true;
            marketMinters[marketId].push(msg.sender);
        }

        for (uint256 i = 0; i < market.outcomeCount; i++) {
            uint256 tokenId = outcomeTokens[marketId][i];
            _mint(msg.sender, tokenId, amount, "");
            userPositions[msg.sender][marketId][i] += amount;
        }
    }

    function redeemPositionTokens(uint256 marketId, uint256 amount)
        external
        nonReentrant
    {
        Market storage market = markets[marketId];

        for (uint256 i = 0; i < market.outcomeCount; i++) {
            uint256 tokenId = outcomeTokens[marketId][i];
            _burn(msg.sender, tokenId, amount);
            userPositions[msg.sender][marketId][i] -= amount;
        }

        marketCollateral[marketId] -= amount;
        if (userMintedAmount[marketId][msg.sender] >= amount) {
            userMintedAmount[marketId][msg.sender] -= amount;
        }

        IERC20(market.collateralToken).transfer(msg.sender, amount);
    }

    function mintPositionTokensFor(uint256 marketId, uint256 amount, address recipient)
        external
        nonReentrant
    {
        require(authorizedOperators[msg.sender], "Not authorized operator");
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.closingTime, "Market closed");

        IERC20(market.collateralToken).transferFrom(msg.sender, address(this), amount);

        marketCollateral[marketId] += amount;
        userMintedAmount[marketId][recipient] += amount;
        if (!isMinter[marketId][recipient]) {
            isMinter[marketId][recipient] = true;
            marketMinters[marketId].push(recipient);
        }

        for (uint256 i = 0; i < market.outcomeCount; i++) {
            uint256 tokenId = outcomeTokens[marketId][i];
            _mint(recipient, tokenId, amount, "");
            userPositions[recipient][marketId][i] += amount;
        }

        emit TokensMintedFor(marketId, recipient, amount);
    }

    /*//////////////////////////////////////////////////////////////
                        MARKET RESOLUTION
    //////////////////////////////////////////////////////////////*/

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
        require(market.status == MarketStatus.Active, "Not active");
        require(block.timestamp >= market.closingTime, "Market not closed");
        require(winningOutcome < market.outcomeCount, "Invalid outcome");

        market.status = MarketStatus.Resolved;
        market.resolutionTime = block.timestamp;
        market.winningOutcome = winningOutcome;

        emit MarketResolved(marketId, winningOutcome);
    }

    /**
     * @notice Cancel a market - allows users to claim refunds
     * @dev Only owner or admin can cancel. Users call claimRefund() after.
     */
    function cancelMarket(uint256 marketId) external {
        Market storage market = markets[marketId];
        require(
            msg.sender == owner() || msg.sender == market.creator,
            "Not authorized"
        );
        require(market.status == MarketStatus.Active, "Not active");

        market.status = MarketStatus.Canceled;

        emit MarketCanceled(marketId);
    }

    /**
     * @notice Re-activate a canceled market
     */
    function activateMarket(uint256 marketId) external onlyOwner {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Canceled, "Not canceled");

        market.status = MarketStatus.Active;

        emit MarketActivated(marketId);
    }

    /**
     * @notice Claim refund for a canceled market
     * @dev Burns all outcome tokens and returns proportional collateral
     */
    function claimRefund(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Canceled, "Market not canceled");

        // Calculate refund: burn all outcome tokens user holds
        // User gets back collateral proportional to their complete sets
        uint256 minBalance = type(uint256).max;
        for (uint256 i = 0; i < market.outcomeCount; i++) {
            uint256 tokenId = outcomeTokens[marketId][i];
            uint256 bal = balanceOf(msg.sender, tokenId);
            if (bal < minBalance) minBalance = bal;
        }

        require(minBalance > 0, "No tokens to refund");

        // Burn complete sets
        for (uint256 i = 0; i < market.outcomeCount; i++) {
            uint256 tokenId = outcomeTokens[marketId][i];
            _burn(msg.sender, tokenId, minBalance);
            if (userPositions[msg.sender][marketId][i] >= minBalance) {
                userPositions[msg.sender][marketId][i] -= minBalance;
            }
        }

        // Refund collateral
        marketCollateral[marketId] -= minBalance;
        IERC20(market.collateralToken).transfer(msg.sender, minBalance);

        emit RefundClaimed(marketId, msg.sender, minBalance);
    }

    function redeemWinningTokens(uint256 marketId, uint256 amount)
        external
        nonReentrant
    {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Resolved, "Market not resolved");

        uint256 winningTokenId = outcomeTokens[marketId][market.winningOutcome];

        _burn(msg.sender, winningTokenId, amount);
        userPositions[msg.sender][marketId][market.winningOutcome] -= amount;

        IERC20(market.collateralToken).transfer(msg.sender, amount);

        emit TokensRedeemed(marketId, msg.sender, market.winningOutcome, amount, amount);
    }

    /*//////////////////////////////////////////////////////////////
                    OPERATOR-ASSISTED TRADING (V2)
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Execute a single trade as operator (for hybrid matching)
     */
    function executeTrade(OperatorTrade calldata trade)
        external
        nonReentrant
    {
        require(authorizedOperators[msg.sender], "Not authorized operator");
        _executeTrade(trade);
    }

    /**
     * @notice Execute multiple trades in a single transaction (batch)
     */
    function executeTrades(OperatorTrade[] calldata trades)
        external
        nonReentrant
    {
        require(authorizedOperators[msg.sender], "Not authorized operator");
        for (uint256 i = 0; i < trades.length; i++) {
            _executeTrade(trades[i]);
        }
    }

    function _executeTrade(OperatorTrade calldata trade) internal {
        Market storage market = markets[trade.marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(trade.outcomeIndex < market.outcomeCount, "Invalid outcome");
        require(trade.shareAmount > 0 && trade.usdcAmount > 0, "Zero amount");

        // Calculate fees
        uint256 creatorFee = (trade.usdcAmount * creatorFeeBps) / FEE_DENOMINATOR;
        uint256 protocolFee = (trade.usdcAmount * platformFeeBps) / FEE_DENOMINATOR;

        // Transfer shares: seller -> buyer
        uint256 tokenId = outcomeTokens[trade.marketId][trade.outcomeIndex];
        _safeTransferFrom(trade.seller, trade.buyer, tokenId, trade.shareAmount, "");

        // Transfer USDC: buyer -> seller (minus fees)
        IERC20(market.collateralToken).transferFrom(
            trade.buyer, trade.seller, trade.usdcAmount - creatorFee - protocolFee
        );

        // Creator fee
        if (creatorFee > 0) {
            IERC20(market.collateralToken).transferFrom(
                trade.buyer, market.creator, creatorFee
            );
        }

        // Protocol fee
        if (protocolFee > 0) {
            IERC20(market.collateralToken).transferFrom(
                trade.buyer, address(this), protocolFee
            );
            accumulatedFees[market.collateralToken] += protocolFee;
        }

        // Update positions
        userPositions[trade.seller][trade.marketId][trade.outcomeIndex] -= trade.shareAmount;
        userPositions[trade.buyer][trade.marketId][trade.outcomeIndex] += trade.shareAmount;

        emit OperatorTradeExecuted(
            trade.marketId, trade.buyer, trade.seller,
            trade.outcomeIndex, trade.shareAmount, trade.usdcAmount,
            creatorFee, protocolFee
        );
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setAuthorizedResolver(address resolver, bool authorized) external onlyOwner {
        authorizedResolvers[resolver] = authorized;
        emit ResolverAuthorized(resolver, authorized);
    }

    function setAuthorizedOperator(address operator, bool authorized) external onlyOwner {
        authorizedOperators[operator] = authorized;
        emit OperatorAuthorized(operator, authorized);
    }

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 500, "Fee too high");
        uint256 old = platformFeeBps;
        platformFeeBps = _feeBps;
        emit PlatformFeeBpsUpdated(old, _feeBps);
    }

    function setCreateMarketFee(uint256 _fee) external onlyOwner {
        uint256 old = createMarketFee;
        createMarketFee = _fee;
        emit CreateMarketFeeUpdated(old, _fee);
    }

    function setCreatorFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high"); // Max 10%
        uint256 old = creatorFeeBps;
        creatorFeeBps = _feeBps;
        emit CreatorFeeBpsUpdated(old, _feeBps);
    }

    function withdrawFees(address token) external onlyOwner nonReentrant {
        uint256 fees = accumulatedFees[token];
        require(fees > 0, "No fees");
        accumulatedFees[token] = 0;
        IERC20(token).transfer(owner(), fees);
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

    function isMarketActive(uint256 marketId) external view returns (
        bool active, uint256 closingTime, bool resolved, bool paused
    ) {
        Market storage m = markets[marketId];
        closingTime = m.closingTime;
        resolved = m.status == MarketStatus.Resolved;
        paused = m.paused;
        active = m.status == MarketStatus.Active && !m.paused && block.timestamp < closingTime && closingTime > 0;
    }

    function getMarketCollateral(uint256 marketId) external view returns (address) {
        return markets[marketId].collateralToken;
    }

    function getMarketStatus(uint256 marketId) external view returns (MarketStatus) {
        return markets[marketId].status;
    }

    function getMarketMeta(uint256 marketId) external view returns (
        address creator,
        string memory question,
        string[] memory optionTitles,
        string[] memory categories,
        string memory imageUrl,
        uint256 endDate,
        MarketStatus status,
        uint256 winningOutcome,
        string[] memory optionImages
    ) {
        Market storage m = markets[marketId];
        return (
            m.creator, m.question, m.optionTitles, m.categories,
            m.imageUrl, m.closingTime, m.status, m.winningOutcome, m.optionImages
        );
    }

    function getOutcomeToken(uint256 marketId, uint256 outcome) external view returns (uint256) {
        return outcomeTokens[marketId][outcome];
    }

    function getOrderStatus(bytes32 orderHash) external view returns (OrderStatus memory) {
        return orderStatus[orderHash];
    }

    function getUserPosition(address user, uint256 marketId, uint256 outcome) external view returns (uint256) {
        return userPositions[user][marketId][outcome];
    }

    /*//////////////////////////////////////////////////////////////
                        ERC1155 OVERRIDES
    //////////////////////////////////////////////////////////////*/

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, ERC1155Holder)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
