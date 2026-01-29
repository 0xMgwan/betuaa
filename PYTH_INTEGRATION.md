# Pyth Network Integration Guide

## Overview
This guide explains how to integrate Pyth Network price feeds for automated, trustless market resolution on your prediction market platform.

## What is Pyth Network?
Pyth Network provides real-time, high-fidelity price feeds for crypto, equities, forex, and commodities. It's used by Limitless Exchange and other DeFi protocols for objective, verifiable price data.

## Architecture

### Smart Contracts
1. **PythResolver.sol** - Automated resolver using Pyth price feeds
2. **CTFPredictionMarket.sol** - Updated to support external resolvers

### Market Types Supported
- **Price Threshold**: "Will ETH be above $5000 by Feb 1?"
- **Price Range**: "Will BTC be between $90k-$100k?"
- **Time-based**: Markets expire at specific timestamp, resolve instantly

## Pyth Network Details

### Base Mainnet
- Pyth Contract: `0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a`
- Hermes API: `https://hermes.pyth.network`

### Base Sepolia (Testnet)
- Pyth Contract: `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729`
- Hermes API: `https://hermes.pyth.network`

### Available Price Feeds
- **Crypto**: ETH/USD, BTC/USD, SOL/USD, etc.
- **Forex**: EUR/USD, GBP/USD, JPY/USD
- **Commodities**: Gold, Silver, Oil
- **Equities**: AAPL, TSLA, NVDA (via synthetic feeds)

Full list: https://pyth.network/developers/price-feed-ids

## How It Works

### 1. Market Creation
```solidity
// Creator configures market with Pyth feed
pythResolver.configurePythMarket(
    marketId: 1,
    priceId: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace, // ETH/USD
    threshold: 500000000000, // $5000 (scaled by 10^8)
    expiryTime: 1738368000, // Feb 1, 2026
    isAbove: true // "Above" wins if price >= threshold
);
```

### 2. Market Expiry
- Market reaches expiry timestamp
- Anyone can call `resolveMarket()` (incentivize with keeper rewards)

### 3. Automated Resolution
```solidity
// Keeper calls resolver with Pyth price update
pythResolver.resolveMarket{value: updateFee}(
    marketId: 1,
    priceUpdateData: [/* Pyth price update from Hermes */]
);
```

### 4. Resolution Process
1. Resolver pulls latest Pyth price on-chain
2. Validates price is recent (< 60 seconds old)
3. Compares price against threshold
4. Determines winner (Yes/No)
5. Calls `resolveMarket()` on CTF contract
6. Users can immediately redeem winnings

## Frontend Integration

### 1. Market Creation UI
```typescript
// Fetch available Pyth price feeds
const priceFeeds = await fetch('https://hermes.pyth.network/api/price_feed_ids');

// Display feed selector
<select>
  <option value="0xff61...">ETH/USD</option>
  <option value="0xe62...">BTC/USD</option>
  <option value="0xef0...">SOL/USD</option>
</select>

// Configure market
await pythResolver.configurePythMarket(
  marketId,
  selectedPriceId,
  thresholdInPythFormat,
  expiryTimestamp,
  isAbove
);
```

### 2. Real-time Price Display
```typescript
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';

const connection = new EvmPriceServiceConnection('https://hermes.pyth.network');

// Subscribe to price updates
connection.subscribePriceFeedUpdates([priceId], (priceFeed) => {
  const price = priceFeed.getPriceUnchecked();
  console.log(`Current price: $${price.price * 10 ** price.expo}`);
});
```

### 3. Market Resolution
```typescript
// Check if market can be resolved
const canResolve = await pythResolver.canResolve(marketId);

if (canResolve) {
  // Get price update data from Hermes
  const priceUpdateData = await connection.getPriceFeedsUpdateData([priceId]);
  
  // Calculate update fee
  const updateFee = await pyth.getUpdateFee(priceUpdateData);
  
  // Resolve market
  await pythResolver.resolveMarket(marketId, priceUpdateData, {
    value: updateFee
  });
}
```

## Keeper Bot

Create an automated keeper to resolve markets after expiry:

```typescript
// keeper.ts
import { ethers } from 'ethers';
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';

async function resolveExpiredMarkets() {
  const markets = await fetchExpiredUnresolvedMarkets();
  
  for (const market of markets) {
    const canResolve = await pythResolver.canResolve(market.id);
    
    if (canResolve) {
      const priceUpdateData = await connection.getPriceFeedsUpdateData([market.priceId]);
      const updateFee = await pyth.getUpdateFee(priceUpdateData);
      
      await pythResolver.resolveMarket(market.id, priceUpdateData, {
        value: updateFee,
        gasLimit: 500000
      });
      
      console.log(`Resolved market ${market.id}`);
    }
  }
}

// Run every minute
setInterval(resolveExpiredMarkets, 60000);
```

## Benefits

### For Users
- ✅ **Instant Settlement**: No waiting for manual resolution
- ✅ **Trustless**: No reliance on admin or oracle
- ✅ **Verifiable**: All price data on-chain
- ✅ **No Disputes**: Objective price data eliminates conflicts

### For Platform
- ✅ **Automated**: No manual resolution needed
- ✅ **Scalable**: Handle thousands of markets
- ✅ **Reliable**: Pyth has 70+ data publishers
- ✅ **Fast**: Sub-second price updates

## Cost Analysis

### Pyth Update Fees
- Base Mainnet: ~$0.01-0.05 per update
- Base Sepolia: Free (testnet)

### Gas Costs
- Resolution: ~150k-200k gas
- Base Mainnet: ~$0.10-0.50 per resolution

### Keeper Incentives
- Charge small fee (0.1-0.5%) on winning payouts
- Or platform subsidizes resolution costs

## Example Markets

### Crypto Price Markets
- "Will ETH reach $5000 by Feb 1, 2026?"
- "Will BTC stay above $90k for next 24 hours?"
- "Will SOL be between $100-$150 on March 1?"

### Short-term Markets
- "Will ETH be above $3500 in next hour?" (Limitless-style)
- "Will BTC/ETH ratio exceed 20 by end of day?"

### Forex Markets
- "Will EUR/USD be above 1.10 by end of week?"
- "Will GBP/USD fall below 1.25 by month end?"

## Next Steps

1. ✅ Deploy PythResolver contract
2. ⏳ Update CTFPredictionMarket to support external resolvers
3. ⏳ Create market creation UI with Pyth feed selector
4. ⏳ Build keeper bot for automated resolution
5. ⏳ Update subgraph to track Pyth markets
6. ⏳ Test on Base Sepolia with real price feeds

## Resources

- Pyth Docs: https://docs.pyth.network/
- Price Feed IDs: https://pyth.network/developers/price-feed-ids
- EVM Integration: https://docs.pyth.network/price-feeds/use-real-time-data/evm
- Hermes API: https://hermes.pyth.network/docs/
