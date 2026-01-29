// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

interface ICTFPredictionMarket {
    function resolveMarket(uint256 marketId, uint256 winningOutcome) external;
}

/**
 * @title PythResolver
 * @notice Automated market resolver using Pyth Network price feeds
 * @dev Enables trustless, instant resolution for financial prediction markets
 */
contract PythResolver {
    IPyth public immutable pyth;
    ICTFPredictionMarket public immutable ctfMarket;
    
    struct PythMarket {
        bytes32 priceId;           // Pyth price feed ID
        int64 threshold;           // Price threshold (scaled by 10^8)
        uint256 expiryTime;        // Market expiry timestamp
        bool isAbove;              // True = "above threshold", False = "below threshold"
        bool resolved;             // Resolution status
    }
    
    // marketId => PythMarket config
    mapping(uint256 => PythMarket) public pythMarkets;
    
    event PythMarketCreated(
        uint256 indexed marketId,
        bytes32 indexed priceId,
        int64 threshold,
        uint256 expiryTime,
        bool isAbove
    );
    
    event MarketResolved(
        uint256 indexed marketId,
        int64 finalPrice,
        uint256 winningOutcome
    );
    
    error MarketNotExpired();
    error MarketAlreadyResolved();
    error MarketNotConfigured();
    error InvalidPriceUpdate();
    
    constructor(address _pyth, address _ctfMarket) {
        pyth = IPyth(_pyth);
        ctfMarket = ICTFPredictionMarket(_ctfMarket);
    }
    
    /**
     * @notice Configure a market for Pyth-based resolution
     * @param marketId CTF market ID
     * @param priceId Pyth price feed ID (e.g., ETH/USD)
     * @param threshold Price threshold in Pyth format (scaled by 10^8)
     * @param expiryTime Unix timestamp when market expires
     * @param isAbove True if "above threshold" wins, false if "below threshold" wins
     */
    function configurePythMarket(
        uint256 marketId,
        bytes32 priceId,
        int64 threshold,
        uint256 expiryTime,
        bool isAbove
    ) external {
        // TODO: Add access control (only market creator or admin)
        
        pythMarkets[marketId] = PythMarket({
            priceId: priceId,
            threshold: threshold,
            expiryTime: expiryTime,
            isAbove: isAbove,
            resolved: false
        });
        
        emit PythMarketCreated(marketId, priceId, threshold, expiryTime, isAbove);
    }
    
    /**
     * @notice Resolve a market using Pyth price feed
     * @param marketId Market to resolve
     * @param priceUpdateData Pyth price update data (from Hermes API)
     * @dev Anyone can call this after expiry - incentivize with keeper rewards
     */
    function resolveMarket(
        uint256 marketId,
        bytes[] calldata priceUpdateData
    ) external payable {
        PythMarket storage market = pythMarkets[marketId];
        
        if (market.priceId == bytes32(0)) revert MarketNotConfigured();
        if (block.timestamp < market.expiryTime) revert MarketNotExpired();
        if (market.resolved) revert MarketAlreadyResolved();
        
        // Update Pyth price (requires fee payment)
        uint256 updateFee = pyth.getUpdateFee(priceUpdateData);
        pyth.updatePriceFeeds{value: updateFee}(priceUpdateData);
        
        // Get latest price
        PythStructs.Price memory price = pyth.getPrice(market.priceId);
        
        // Validate price is recent (within 60 seconds)
        if (block.timestamp - price.publishTime > 60) revert InvalidPriceUpdate();
        
        // Determine winner based on threshold
        uint256 winningOutcome;
        if (market.isAbove) {
            // "Above" wins if price >= threshold
            winningOutcome = price.price >= market.threshold ? 0 : 1;
        } else {
            // "Below" wins if price < threshold
            winningOutcome = price.price < market.threshold ? 0 : 1;
        }
        
        // Mark as resolved
        market.resolved = true;
        
        // Resolve on CTF contract
        ctfMarket.resolveMarket(marketId, winningOutcome);
        
        emit MarketResolved(marketId, price.price, winningOutcome);
        
        // Refund excess ETH to caller
        if (msg.value > updateFee) {
            payable(msg.sender).transfer(msg.value - updateFee);
        }
    }
    
    /**
     * @notice Get current price for a market's feed
     * @param marketId Market ID
     * @return price Current price from Pyth
     */
    function getCurrentPrice(uint256 marketId) external view returns (PythStructs.Price memory) {
        PythMarket storage market = pythMarkets[marketId];
        if (market.priceId == bytes32(0)) revert MarketNotConfigured();
        return pyth.getPrice(market.priceId);
    }
    
    /**
     * @notice Check if market can be resolved
     * @param marketId Market ID
     * @return canResolve True if market is expired and not yet resolved
     */
    function canResolve(uint256 marketId) external view returns (bool) {
        PythMarket storage market = pythMarkets[marketId];
        return market.priceId != bytes32(0) 
            && block.timestamp >= market.expiryTime 
            && !market.resolved;
    }
}
