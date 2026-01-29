# Deployment Status - Pyth Network Integration

## Base Sepolia Testnet

### Deployed Contracts ✅

**PythResolver**
- Address: `0xc3c8523FaC61b6E35DC553BB5a1F542982753F62`
- Network: Base Sepolia (Chain ID: 84532)
- Verified: ✅ [View on BaseScan](https://sepolia.basescan.org/address/0xc3c8523fac61b6e35dc553bb5a1f542982753f62)
- Deployed: January 29, 2026

**CTFPredictionMarket** (Existing)
- Address: `0x692C052Ca3765FCf24a38Ea0c1F653259dF2E8e7`
- Network: Base Sepolia
- Status: Active

**Pyth Oracle** (Base Sepolia)
- Address: `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729`
- Network: Base Sepolia
- Status: Active

### Configuration

```typescript
// lib/contracts.ts
export const CONTRACTS = {
  baseSepolia: {
    ctfPredictionMarket: '0x692C052Ca3765FCf24a38Ea0c1F653259dF2E8e7',
    pythResolver: '0xc3c8523FaC61b6E35DC553BB5a1F542982753F62',
  }
}
```

## Next Steps

### 1. Authorize PythResolver ⏳

You need to authorize the PythResolver in your CTF contract:

```bash
cast send 0x692C052Ca3765FCf24a38Ea0c1F653259dF2E8e7 \
  "setAuthorizedResolver(address,bool)" \
  0xc3c8523FaC61b6E35DC553BB5a1F542982753F62 \
  true \
  --rpc-url https://sepolia.base.org \
  --private-key YOUR_PRIVATE_KEY
```

Or use your wallet directly on BaseScan:
1. Go to: https://sepolia.basescan.org/address/0x692C052Ca3765FCf24a38Ea0c1F653259dF2E8e7#writeContract
2. Connect your wallet
3. Call `setAuthorizedResolver`
   - resolver: `0xc3c8523FaC61b6E35DC553BB5a1F542982753F62`
   - authorized: `true`

### 2. Create Your First Pyth Market 🎯

Once authorized, you can create a test market:

```typescript
// Example: "Will ETH be above $3500 by tomorrow?"
const priceId = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'; // ETH/USD
const threshold = 350000000000; // $3500 in Pyth format (scaled by 10^8)
const expiryTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

// First create market in CTF contract
await ctfContract.createMarket(
  "Will ETH be above $3500 by tomorrow?",
  "ETH/USD price prediction using Pyth oracle",
  2, // 2 outcomes (Yes/No)
  expiryTime,
  USDC_ADDRESS
);

// Then configure Pyth resolution
await pythResolver.configurePythMarket(
  marketId,
  priceId,
  threshold,
  expiryTime,
  true // "Above" wins if price >= threshold
);
```

### 3. Test Resolution 🧪

After market expires:

```typescript
// Get price update data from Hermes
const priceUpdateData = await getPriceUpdateData([priceId]);

// Calculate update fee
const updateFee = await pyth.getUpdateFee(priceUpdateData);

// Resolve market
await pythResolver.resolveMarket(marketId, priceUpdateData, {
  value: updateFee
});
```

## Available Price Feeds

### Crypto (Most Popular)
- **ETH/USD**: `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`
- **BTC/USD**: `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43`
- **SOL/USD**: `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d`

### Forex
- **EUR/USD**: `0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b`
- **GBP/USD**: `0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1`

Full list in `lib/pyth.ts`

## Testing Checklist

- [x] Deploy PythResolver contract
- [x] Verify contract on BaseScan
- [x] Update frontend with contract address
- [ ] Authorize resolver in CTF contract
- [ ] Create test Pyth market (ETH/USD)
- [ ] Verify real-time price display works
- [ ] Wait for market expiry
- [ ] Test manual resolution
- [ ] Verify winning token redemption

## Resources

- **PythResolver Contract**: https://sepolia.basescan.org/address/0xc3c8523fac61b6e35dc553bb5a1f542982753f62
- **Pyth Hermes API**: https://hermes.pyth.network
- **Price Feed IDs**: https://pyth.network/developers/price-feed-ids
- **Integration Guide**: See `PYTH_INTEGRATION.md`
- **Setup Guide**: See `PYTH_SETUP.md`

## Support

If you encounter issues:
1. Check contract is authorized: `cast call 0x692C052Ca3765FCf24a38Ea0c1F653259dF2E8e7 "authorizedResolvers(address)" 0xc3c8523FaC61b6E35DC553BB5a1F542982753F62 --rpc-url https://sepolia.base.org`
2. Verify Pyth price feed is active: https://hermes.pyth.network/api/latest_price_feeds?ids[]=PRICE_ID
3. Check keeper bot logs for resolution errors

---

**Status**: Ready for testing ✅
**Last Updated**: January 29, 2026
