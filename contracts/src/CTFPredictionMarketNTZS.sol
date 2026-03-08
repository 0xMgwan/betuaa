// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CTFPredictionMarketNTZS
 * @notice Prediction market contract optimized for nTZS off-chain balance tracking
 * @dev This contract ONLY manages outcome tokens (ERC1155). Collateral (nTZS) is tracked
 *      off-chain via the nTZS API. The platform API mediates between nTZS balances and
 *      outcome token operations.
 */
contract CTFPredictionMarketNTZS is ERC1155, Ownable, ReentrancyGuard {
    
    struct Market {
        string question;
        string description;
        uint256 outcomeCount;
        uint256 closingTime;
        address creator;
        bool resolved;
        uint256 winningOutcome;
        bool cancelled;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(uint256 => uint256)) public outcomeTokens; // marketId => outcomeIndex => tokenId
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public userPositions; // user => marketId => outcomeIndex => amount
    
    // Authorized operators (platform wallet) can mint/burn on behalf of users
    mapping(address => bool) public authorizedOperators;

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        uint256 outcomeCount,
        uint256 closingTime,
        address indexed creator
    );
    
    event TokensMinted(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );
    
    event TokensRedeemed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );
    
    event MarketResolved(
        uint256 indexed marketId,
        uint256 winningOutcome
    );
    
    event MarketCancelled(uint256 indexed marketId);
    
    event WinningsRedeemed(
        uint256 indexed marketId,
        address indexed user,
        uint256 indexed outcome,
        uint256 amount
    );

    constructor() ERC1155("") Ownable(msg.sender) {
        // Owner (platform wallet) is automatically authorized
        authorizedOperators[msg.sender] = true;
    }

    modifier onlyAuthorized() {
        require(authorizedOperators[msg.sender], "Not authorized");
        _;
    }

    function setAuthorizedOperator(address operator, bool authorized) external onlyOwner {
        authorizedOperators[operator] = authorized;
    }

    /**
     * @notice Create a new prediction market
     * @dev No collateral needed - this is tracked off-chain via nTZS API
     */
    function createMarket(
        string memory _question,
        string memory _description,
        uint256 _outcomeCount,
        uint256 _closingTime
    ) external returns (uint256 marketId) {
        require(_outcomeCount >= 2, "Need at least 2 outcomes");
        require(_closingTime > block.timestamp, "Invalid closing time");
        
        marketCount++;
        marketId = marketCount;
        
        markets[marketId] = Market({
            question: _question,
            description: _description,
            outcomeCount: _outcomeCount,
            closingTime: _closingTime,
            creator: msg.sender,
            resolved: false,
            winningOutcome: 0,
            cancelled: false
        });
        
        // Create outcome token IDs
        for (uint256 i = 0; i < _outcomeCount; i++) {
            uint256 tokenId = (marketId << 128) | i;
            outcomeTokens[marketId][i] = tokenId;
        }
        
        emit MarketCreated(marketId, _question, _outcomeCount, _closingTime, msg.sender);
    }

    /**
     * @notice Mint outcome tokens for a user
     * @dev Called by authorized operator (platform wallet) after verifying nTZS balance off-chain
     * @param marketId Market ID
     * @param user User to mint tokens for
     * @param amount Amount of tokens to mint (in wei, 18 decimals)
     */
    function mintPositionTokensFor(
        uint256 marketId,
        address user,
        uint256 amount
    ) external onlyAuthorized nonReentrant {
        Market storage market = markets[marketId];
        require(!market.resolved, "Market resolved");
        require(!market.cancelled, "Market cancelled");
        require(block.timestamp < market.closingTime, "Market closed");
        
        // Mint outcome tokens for each outcome to the user
        for (uint256 i = 0; i < market.outcomeCount; i++) {
            uint256 tokenId = outcomeTokens[marketId][i];
            _mint(user, tokenId, amount, "");
            userPositions[user][marketId][i] += amount;
        }
        
        emit TokensMinted(marketId, user, amount);
    }

    /**
     * @notice Redeem (burn) all outcome tokens to get collateral back
     * @dev Platform API will credit user's nTZS balance after this succeeds
     */
    function redeemPositionTokens(
        uint256 marketId,
        uint256 amount
    ) external nonReentrant {
        Market storage market = markets[marketId];
        require(!market.resolved, "Market resolved - use redeemWinningTokens");
        
        // Burn outcome tokens for each outcome
        for (uint256 i = 0; i < market.outcomeCount; i++) {
            uint256 tokenId = outcomeTokens[marketId][i];
            _burn(msg.sender, tokenId, amount);
            userPositions[msg.sender][marketId][i] -= amount;
        }
        
        emit TokensRedeemed(marketId, msg.sender, amount);
    }

    /**
     * @notice Resolve market with winning outcome
     */
    function resolveMarket(uint256 marketId, uint256 winningOutcome) external onlyOwner {
        Market storage market = markets[marketId];
        require(!market.resolved, "Already resolved");
        require(!market.cancelled, "Market cancelled");
        require(block.timestamp >= market.closingTime, "Market still open");
        require(winningOutcome < market.outcomeCount, "Invalid outcome");
        
        market.resolved = true;
        market.winningOutcome = winningOutcome;
        
        emit MarketResolved(marketId, winningOutcome);
    }

    /**
     * @notice Redeem winning tokens for collateral
     * @dev Platform API will credit user's nTZS balance after this succeeds
     */
    function redeemWinningTokens(
        uint256 marketId,
        uint256 amount
    ) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved");
        
        uint256 winningTokenId = outcomeTokens[marketId][market.winningOutcome];
        
        // Burn winning tokens
        _burn(msg.sender, winningTokenId, amount);
        userPositions[msg.sender][marketId][market.winningOutcome] -= amount;
        
        emit WinningsRedeemed(marketId, msg.sender, market.winningOutcome, amount);
    }

    /**
     * @notice Cancel market and allow users to claim refunds
     */
    function cancelMarket(uint256 marketId) external onlyOwner {
        Market storage market = markets[marketId];
        require(!market.resolved, "Already resolved");
        require(!market.cancelled, "Already cancelled");
        
        market.cancelled = true;
        
        emit MarketCancelled(marketId);
    }

    /**
     * @notice Claim refund for cancelled market
     * @dev Platform API will credit user's nTZS balance after this succeeds
     */
    function claimRefund(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.cancelled, "Market not cancelled");
        
        // Burn all outcome tokens
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < market.outcomeCount; i++) {
            uint256 tokenId = outcomeTokens[marketId][i];
            uint256 balance = balanceOf(msg.sender, tokenId);
            if (balance > 0) {
                _burn(msg.sender, tokenId, balance);
                userPositions[msg.sender][marketId][i] = 0;
                totalAmount += balance;
            }
        }
        
        // Amount to refund is totalAmount / outcomeCount (since user had equal amounts of each)
        uint256 refundAmount = totalAmount / market.outcomeCount;
        
        emit TokensRedeemed(marketId, msg.sender, refundAmount);
    }

    /**
     * @notice Get market details
     */
    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    /**
     * @notice Get user's position in a market
     */
    function getUserPosition(
        address user,
        uint256 marketId,
        uint256 outcomeIndex
    ) external view returns (uint256) {
        return userPositions[user][marketId][outcomeIndex];
    }

    /**
     * @notice Get outcome token ID
     */
    function getOutcomeToken(uint256 marketId, uint256 outcomeIndex) external view returns (uint256) {
        return outcomeTokens[marketId][outcomeIndex];
    }
}
