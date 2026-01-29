# Pyth Integration Testing Guide

## Overview
This guide walks through testing both traditional and Pyth-powered markets on your platform.

## Two Market Types

### 1. Traditional Markets (Existing - Still Works!)
- **Creation**: Users create via UI or contract
- **Resolution**: Manual (creator or admin)
- **Use Case**: Subjective outcomes, custom events
- **Example**: "Will Team X win the championship?"

### 2. Pyth Markets (New!)
- **Creation**: Via script or future UI
- **Resolution**: Automatic via Pyth oracle
- **Use Case**: Objective price-based outcomes
- **Example**: "Will ETH be above $3500 by tomorrow?"

Both types work independently and can coexist!

## Quick Test: Create a Pyth Market

### Prerequisites
- Wallet with Base Sepolia ETH
- PRIVATE_KEY environment variable set
- PythResolver authorized (✅ Done!)

### Step 1: Create Test Market

```bash
cd /Users/macbookpro/Desktop/betuaa/betuaa
PRIVATE_KEY=your_private_key npm run tsx scripts/create-test-pyth-market.ts
```

This creates a 5-minute test market: "Will ETH be above $X in 5 minutes?"

### Step 2: View on Platform

1. Go to your platform homepage
2. You should see the new market appear
3. Market should show:
   - Question about ETH price
   - 5-minute countdown
   - "Auto-resolves" badge (future feature)

### Step 3: Wait for Expiry

Wait 5 minutes for the market to expire.

### Step 4: Test Manual Resolution

After expiry, resolve the market:

```bash
# Get current ETH price from Pyth
curl "https://hermes.pyth.network/api/latest_price_feeds?ids[]=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"

# Resolve market (replace MARKET_ID with your market ID)
cast send 0xc3c8523FaC61b6E35DC553BB5a1F542982753F62 \
  "resolveMarket(uint256,bytes[])" \
  MARKET_ID \
  [] \
  --rpc-url https://sepolia.base.org \
  --private-key YOUR_PRIVATE_KEY \
  --value 0.0001ether
```

### Step 5: Verify Resolution

1. Check market status on platform
2. Verify winning outcome is correct
3. Test redeeming winning tokens

## Test Traditional Markets

### Create Traditional Market

1. Go to your platform
2. Click "Create Market"
3. Fill in:
   - Question: "Will it rain tomorrow?"
   - Description: "Test market"
   - Closing time: Tomorrow
   - Collateral: USDC
4. Submit transaction
5. Market appears on homepage

### Resolve Traditional Market

1. Wait for market to close
2. As creator, go to market page
3. Click "Resolve Market"
4. Select winning outcome
5. Confirm transaction

## Verification Checklist

### Pyth Markets
- [ ] Market created successfully
- [ ] Market appears on platform
- [ ] Countdown shows correct expiry
- [ ] Market expires at correct time
- [ ] Resolution transaction succeeds
- [ ] Correct outcome determined
- [ ] Winners can redeem tokens

### Traditional Markets
- [ ] Market created via UI
- [ ] Market appears on platform
- [ ] Creator can resolve manually
- [ ] Resolution works correctly
- [ ] Winners can redeem tokens

### Both Types
- [ ] Both market types visible on homepage
- [ ] Filtering/sorting works for both
- [ ] Trading works for both types
- [ ] Position tracking works for both
- [ ] Profile page shows both types

## Common Issues

### Issue: Market doesn't appear
**Solution**: Check subgraph sync status, wait 30 seconds, refresh page

### Issue: Resolution fails
**Solution**: 
- Ensure market is expired
- Check Pyth update fee is included
- Verify PythResolver is authorized

### Issue: Wrong outcome
**Solution**: 
- Verify Pyth price feed data
- Check threshold configuration
- Review resolution logs

## Advanced Testing

### Test Different Price Feeds

```typescript
// BTC market
const btcFeed = PYTH_PRICE_FEEDS['BTC/USD'];

// SOL market
const solFeed = PYTH_PRICE_FEEDS['SOL/USD'];

// Forex market
const eurFeed = PYTH_PRICE_FEEDS['EUR/USD'];
```

### Test Different Timeframes

```typescript
// 1 hour market
const expiryTime = Math.floor(Date.now() / 1000) + 3600;

// 24 hour market
const expiryTime = Math.floor(Date.now() / 1000) + 86400;

// 1 week market
const expiryTime = Math.floor(Date.now() / 1000) + 604800;
```

### Test Edge Cases

1. **Market expires but no one resolves**: Keeper bot should handle
2. **Price exactly at threshold**: Test boundary conditions
3. **Multiple markets expire simultaneously**: Test batch resolution
4. **Stale price data**: Should reject resolution

## Monitoring

### Check Subgraph Status

```bash
# Query market data
curl -X POST https://gateway-arbitrum.network.thegraph.com/api/YOUR_API_KEY/subgraphs/id/CCkEh8eKCHxZhaxgbHcAv7qNLCU1bu3F2A5t6zYGbMup \
  -H "Content-Type: application/json" \
  -d '{"query":"{ markets(first: 5, orderBy: createdAt, orderDirection: desc) { id question resolved } }"}'
```

### Check Pyth Price

```bash
# Get current ETH price
curl "https://hermes.pyth.network/api/latest_price_feeds?ids[]=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
```

### Check Contract State

```bash
# Check if resolver is authorized
cast call 0xA5Bf04D3D079BE92981EE8208b18B0514eBd370C \
  "authorizedResolvers(address)" \
  0xc3c8523FaC61b6E35DC553BB5a1F542982753F62 \
  --rpc-url https://sepolia.base.org

# Check Pyth market config
cast call 0xc3c8523FaC61b6E35DC553BB5a1F542982753F62 \
  "pythMarkets(uint256)" \
  MARKET_ID \
  --rpc-url https://sepolia.base.org
```

## Success Criteria

✅ **Integration Successful If:**
1. Traditional markets still work as before
2. Pyth markets can be created
3. Pyth markets resolve automatically
4. Both types coexist without conflicts
5. Users can trade on both types
6. Winners can redeem from both types

## Next Steps After Testing

1. **Add UI for Pyth market creation**
   - Price feed selector
   - Threshold input
   - Auto-generate question

2. **Add "Auto-resolves" badge** to Pyth markets

3. **Deploy keeper bot** for production

4. **Add real-time price display** to market cards

5. **Create marketing materials** for Pyth integration

## Support

If issues arise:
1. Check contract addresses in `lib/contracts.ts`
2. Verify PythResolver authorization
3. Check Pyth API status
4. Review transaction logs on BaseScan
5. Check subgraph sync status

---

**Ready to test!** Start with the 5-minute test market to verify the full flow.
