// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./StablecoinRegistry.sol";

contract PredictionMarket is Ownable, ReentrancyGuard {
    enum MarketStatus { Active, Closed, Resolved, Disputed }
    enum MarketType { Binary, MultiOutcome }

    struct Outcome {
        string name;
        uint256 totalShares;
        uint256 yesShares;
        uint256 noShares;
        bool isWinner;
    }

    struct Market {
        uint256 id;
        string title;
        string description;
        MarketType marketType;
        MarketStatus status;
        address creator;
        address paymentToken;
        uint256 createdAt;
        uint256 closingDate;
        uint256 resolutionDate;
        uint256 totalVolume;
        uint256 totalLiquidity;
        uint256 liquiditySubsidy;
        uint256 participantCount;
        address oracleAddress;
        uint256 winningOutcomeId;
    }

    struct Position {
        uint256 shares;
        uint256 averagePrice;
        uint256 outcomeId;
    }

    uint256 public marketCount;
    uint256 public constant CREATOR_FEE = 50;
    uint256 public constant PLATFORM_FEE = 50;
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    mapping(address => bool) public supportedTokens;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => Outcome[]) public marketOutcomes;
    mapping(uint256 => mapping(address => mapping(uint256 => Position))) public positions;
    mapping(address => uint256[]) public userMarkets;

    event MarketCreated(uint256 indexed marketId, address indexed creator, string title, MarketType marketType, uint256 closingDate);
    event SharesPurchased(uint256 indexed marketId, uint256 indexed outcomeId, address indexed buyer, uint256 shares, uint256 cost);
    event SharesSold(uint256 indexed marketId, uint256 indexed outcomeId, address indexed seller, uint256 shares, uint256 payout);
    event MarketResolved(uint256 indexed marketId, uint256 indexed winningOutcomeId, address resolver);
    event LiquidityAdded(uint256 indexed marketId, address indexed provider, uint256 amount);

    constructor() Ownable(msg.sender) {
        supportedTokens[StablecoinRegistry.USDC_BASE] = true;
        supportedTokens[StablecoinRegistry.USDC_BASE_SEPOLIA] = true;
        supportedTokens[StablecoinRegistry.USDT_BASE] = true;
        supportedTokens[StablecoinRegistry.USDT_BASE_SEPOLIA] = true;
        supportedTokens[StablecoinRegistry.CNGN_BASE] = true;
        supportedTokens[StablecoinRegistry.CNGN_BASE_SEPOLIA] = true;
        supportedTokens[StablecoinRegistry.IDRX_BASE] = true;
    }
    
    function addSupportedToken(address _token) external onlyOwner {
        require(StablecoinRegistry.isSupported(_token), "Token not in registry");
        supportedTokens[_token] = true;
    }
    
    function removeSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = false;
    }

    function createMarket(
        string memory _title,
        string memory _description,
        MarketType _marketType,
        uint256 _closingDate,
        string[] memory _outcomeNames,
        uint256 _initialLiquidity,
        address _paymentToken
    ) external nonReentrant returns (uint256) {
        require(_closingDate > block.timestamp, "Invalid closing date");
        require(_outcomeNames.length >= 2, "Need at least 2 outcomes");
        require(supportedTokens[_paymentToken], "Payment token not supported");

        if (_marketType == MarketType.Binary) {
            require(_outcomeNames.length == 2, "Binary markets need exactly 2 outcomes");
        }

        marketCount++;
        uint256 marketId = marketCount;

        markets[marketId] = Market({
            id: marketId,
            title: _title,
            description: _description,
            marketType: _marketType,
            status: MarketStatus.Active,
            creator: msg.sender,
            paymentToken: _paymentToken,
            createdAt: block.timestamp,
            closingDate: _closingDate,
            resolutionDate: 0,
            totalVolume: 0,
            totalLiquidity: _initialLiquidity,
            liquiditySubsidy: 0,
            participantCount: 0,
            oracleAddress: address(0),
            winningOutcomeId: 0
        });

        for (uint256 i = 0; i < _outcomeNames.length; i++) {
            marketOutcomes[marketId].push(Outcome({
                name: _outcomeNames[i],
                totalShares: 0,
                yesShares: 0,
                noShares: 0,
                isWinner: false
            }));
        }

        if (_initialLiquidity > 0) {
            require(
                IERC20(_paymentToken).transferFrom(msg.sender, address(this), _initialLiquidity),
                "Liquidity transfer failed"
            );
            emit LiquidityAdded(marketId, msg.sender, _initialLiquidity);
        }

        emit MarketCreated(marketId, msg.sender, _title, _marketType, _closingDate);
        return marketId;
    }

    function buyShares(uint256 _marketId, uint256 _outcomeId, uint256 _amount) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.closingDate, "Market closed");
        require(_outcomeId < marketOutcomes[_marketId].length, "Invalid outcome");

        uint256 price = calculatePrice(_marketId, _outcomeId);
        uint256 cost = (_amount * price) / 1e18;
        
        // Convert cost from 18 decimals to token decimals
        IERC20Metadata paymentToken = IERC20Metadata(market.paymentToken);
        uint8 tokenDecimals = paymentToken.decimals();
        if (tokenDecimals < 18) {
            cost = cost / (10 ** (18 - tokenDecimals));
        }
        
        uint256 creatorFee = (cost * CREATOR_FEE) / FEE_DENOMINATOR;
        uint256 platformFee = (cost * PLATFORM_FEE) / FEE_DENOMINATOR;
        uint256 netCost = cost + creatorFee + platformFee;
        require(paymentToken.transferFrom(msg.sender, address(this), netCost), "Payment failed");

        Position storage position = positions[_marketId][msg.sender][_outcomeId];
        
        if (position.shares == 0) {
            market.participantCount++;
            userMarkets[msg.sender].push(_marketId);
        }

        uint256 totalShares = position.shares + _amount;
        position.averagePrice = ((position.averagePrice * position.shares) + (price * _amount)) / totalShares;
        position.shares = totalShares;
        position.outcomeId = _outcomeId;

        marketOutcomes[_marketId][_outcomeId].totalShares += _amount;
        marketOutcomes[_marketId][_outcomeId].yesShares += _amount;
        
        market.totalVolume += cost;

        paymentToken.transfer(market.creator, creatorFee);

        emit SharesPurchased(_marketId, _outcomeId, msg.sender, _amount, cost);
    }

    function sellShares(uint256 _marketId, uint256 _outcomeId, uint256 _amount) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.closingDate, "Market closed");

        Position storage position = positions[_marketId][msg.sender][_outcomeId];
        require(position.shares >= _amount, "Insufficient shares");

        uint256 price = calculatePrice(_marketId, _outcomeId);
        uint256 payout = (_amount * price) / 1e18;
        
        // Convert payout from 18 decimals to token decimals
        IERC20Metadata paymentToken = IERC20Metadata(market.paymentToken);
        uint8 tokenDecimals = paymentToken.decimals();
        if (tokenDecimals < 18) {
            payout = payout / (10 ** (18 - tokenDecimals));
        }
        
        uint256 creatorFee = (payout * CREATOR_FEE) / FEE_DENOMINATOR;
        uint256 platformFee = (payout * PLATFORM_FEE) / FEE_DENOMINATOR;
        uint256 netPayout = payout - creatorFee - platformFee;

        position.shares -= _amount;
        marketOutcomes[_marketId][_outcomeId].totalShares -= _amount;
        marketOutcomes[_marketId][_outcomeId].noShares += _amount;

        market.totalVolume += payout;
        paymentToken.transfer(msg.sender, netPayout);
        paymentToken.transfer(market.creator, creatorFee);

        emit SharesSold(_marketId, _outcomeId, msg.sender, _amount, netPayout);
    }

    function resolveMarket(uint256 _marketId, uint256 _winningOutcomeId) external {
        Market storage market = markets[_marketId];
        require(
            msg.sender == market.creator || msg.sender == market.oracleAddress || msg.sender == owner(),
            "Not authorized"
        );
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp >= market.closingDate, "Market not closed yet");
        require(_winningOutcomeId < marketOutcomes[_marketId].length, "Invalid outcome");

        market.status = MarketStatus.Resolved;
        market.resolutionDate = block.timestamp;
        market.winningOutcomeId = _winningOutcomeId;
        marketOutcomes[_marketId][_winningOutcomeId].isWinner = true;

        emit MarketResolved(_marketId, _winningOutcomeId, msg.sender);
    }

    function claimWinnings(uint256 _marketId, uint256 _outcomeId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Resolved, "Market not resolved");
        require(marketOutcomes[_marketId][_outcomeId].isWinner, "Not winning outcome");

        Position storage position = positions[_marketId][msg.sender][_outcomeId];
        require(position.shares > 0, "No shares to claim");

        // Shares are in 18 decimals, payout should be 1:1 in token decimals
        uint256 payout = position.shares;
        
        // Convert from 18 decimals to token decimals
        IERC20Metadata paymentToken = IERC20Metadata(market.paymentToken);
        uint8 tokenDecimals = paymentToken.decimals();
        if (tokenDecimals < 18) {
            payout = payout / (10 ** (18 - tokenDecimals));
        }
        
        position.shares = 0;

        paymentToken.transfer(msg.sender, payout);
    }

    function calculatePrice(uint256 _marketId, uint256 _outcomeId) public view returns (uint256) {
        Outcome[] storage outcomes = marketOutcomes[_marketId];
        uint256 totalShares = 0;
        
        for (uint256 i = 0; i < outcomes.length; i++) {
            totalShares += outcomes[i].totalShares;
        }

        if (totalShares == 0) {
            return 1e18 / outcomes.length;
        }

        uint256 outcomeShares = outcomes[_outcomeId].totalShares;
        return (outcomeShares * 1e18) / totalShares;
    }

    function getMarket(uint256 _marketId) external view returns (Market memory) {
        return markets[_marketId];
    }

    function getMarketOutcomes(uint256 _marketId) external view returns (Outcome[] memory) {
        return marketOutcomes[_marketId];
    }

    function getUserPosition(uint256 _marketId, address _user, uint256 _outcomeId) external view returns (Position memory) {
        return positions[_marketId][_user][_outcomeId];
    }

    function getUserMarkets(address _user) external view returns (uint256[] memory) {
        return userMarkets[_user];
    }

    function addLiquiditySubsidy(uint256 _marketId, uint256 _amount) external onlyOwner {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(
            IERC20(market.paymentToken).transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        market.liquiditySubsidy += _amount;
        market.totalLiquidity += _amount;
        
        emit LiquidityAdded(_marketId, msg.sender, _amount);
    }
    
    function getSupportedTokens() external view returns (address[] memory) {
        address[] memory tokens = new address[](7);
        tokens[0] = StablecoinRegistry.USDC_BASE;
        tokens[1] = StablecoinRegistry.USDC_BASE_SEPOLIA;
        tokens[2] = StablecoinRegistry.USDT_BASE;
        tokens[3] = StablecoinRegistry.USDT_BASE_SEPOLIA;
        tokens[4] = StablecoinRegistry.CNGN_BASE;
        tokens[5] = StablecoinRegistry.CNGN_BASE_SEPOLIA;
        tokens[6] = StablecoinRegistry.IDRX_BASE;
        return tokens;
    }

    function setOracle(uint256 _marketId, address _oracle) external {
        require(msg.sender == markets[_marketId].creator, "Not creator");
        markets[_marketId].oracleAddress = _oracle;
    }

    function closeMarket(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(msg.sender == market.creator || msg.sender == owner(), "Not authorized");
        require(market.status == MarketStatus.Active, "Market not active");
        
        market.status = MarketStatus.Closed;
    }
}
