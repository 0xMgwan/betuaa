# Pyth Integration Setup Guide

## Quick Start

This guide will help you integrate Pyth Network for automated market resolution.

## Step 1: Install Pyth SDK

```bash
cd contracts
npm install @pythnetwork/pyth-sdk-solidity
```

## Step 2: Deploy PythResolver Contract

```bash
# On Base Sepolia (testnet)
forge create PythResolver \
  --rpc-url https://sepolia.base.org \
  --constructor-args \
    0xA2aa501b19aff244D90cc15a4Cf739D2725B5729 \  # Pyth contract on Base Sepolia
    YOUR_CTF_CONTRACT_ADDRESS \
  --private-key YOUR_PRIVATE_KEY

# On Base Mainnet
forge create PythResolver \
  --rpc-url https://mainnet.base.org \
  --constructor-args \
    0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a \  # Pyth contract on Base Mainnet
    YOUR_CTF_CONTRACT_ADDRESS \
  --private-key YOUR_PRIVATE_KEY
```

## Step 3: Update CTFPredictionMarket

Add resolver authorization to your CTF contract:

```solidity
// Add to CTFPredictionMarket.sol
mapping(address => bool) public authorizedResolvers;

function setResolver(address resolver, bool authorized) external onlyOwner {
    authorizedResolvers[resolver] = authorized;
}

function resolveMarket(uint256 marketId, uint256 winningOutcome) external {
    require(authorizedResolvers[msg.sender], "Not authorized");
    // ... existing resolution logic
}
```

## Step 4: Frontend Integration

Install Pyth JS SDK:

```bash
npm install @pythnetwork/pyth-evm-js
```

## Step 5: Create Pyth-based Market

```typescript
// Example: "Will ETH be above $5000 by Feb 1, 2026?"
const priceId = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'; // ETH/USD
const threshold = 500000000000; // $5000 in Pyth format (scaled by 10^8)
const expiryTime = Math.floor(new Date('2026-02-01').getTime() / 1000);

await pythResolver.configurePythMarket(
  marketId,
  priceId,
  threshold,
  expiryTime,
  true // "Above" wins
);
```

## Step 6: Deploy Keeper Bot

Create a simple keeper to auto-resolve markets:

```typescript
// keeper.ts
import { ethers } from 'ethers';
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const pythResolver = new ethers.Contract(RESOLVER_ADDRESS, ABI, wallet);
const connection = new EvmPriceServiceConnection('https://hermes.pyth.network');

async function checkAndResolve() {
  // Query subgraph for expired unresolved markets
  const markets = await fetchExpiredMarkets();
  
  for (const market of markets) {
    const canResolve = await pythResolver.canResolve(market.id);
    
    if (canResolve) {
      const priceUpdateData = await connection.getPriceFeedsUpdateData([market.priceId]);
      const updateFee = await pythResolver.pyth().getUpdateFee(priceUpdateData);
      
      const tx = await pythResolver.resolveMarket(market.id, priceUpdateData, {
        value: updateFee
      });
      
      await tx.wait();
      console.log(`✅ Resolved market ${market.id}`);
    }
  }
}

// Run every minute
setInterval(checkAndResolve, 60000);
```

## Common Pyth Price Feed IDs

```typescript
const PRICE_FEEDS = {
  'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'USDC/USD': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'EUR/USD': '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b',
};
```

## Testing on Base Sepolia

1. Get testnet ETH from Base Sepolia faucet
2. Deploy PythResolver contract
3. Create test market with ETH/USD feed
4. Wait for expiry
5. Call `resolveMarket()` to test automated resolution

## Production Checklist

- [ ] Deploy PythResolver on Base Mainnet
- [ ] Authorize resolver in CTF contract
- [ ] Update market creation UI with Pyth feed selector
- [ ] Deploy keeper bot with monitoring
- [ ] Add Pyth price displays to market cards
- [ ] Update subgraph to track Pyth markets
- [ ] Test with small markets first
- [ ] Monitor keeper bot logs
- [ ] Set up alerts for failed resolutions

## Cost Optimization

### Keeper Rewards
- Charge 0.1-0.5% fee on winning payouts
- Use to cover Pyth update fees + gas costs
- Incentivizes decentralized keeper network

### Batch Resolution
- Resolve multiple markets in one transaction
- Reduces per-market gas costs
- Share Pyth update fee across markets

## Support

- Pyth Discord: https://discord.gg/pythnetwork
- Pyth Docs: https://docs.pyth.network/
- Base Docs: https://docs.base.org/
