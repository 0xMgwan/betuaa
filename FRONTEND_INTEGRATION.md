# Frontend Integration Guide - CTF Prediction Market

## ✅ Deployment Complete

**Network:** Base Sepolia (Chain ID: 84532)  
**Status:** Contracts deployed, tested, and verified ✅

---

## 📋 Deployed Contract Addresses

### Base Sepolia
- **CTFPredictionMarket:** `0x692C052Ca3765FCf24a38Ea0c1F653259dF2E8e7`
- **MockUSDC:** `0x7c476223C59E2106511C7238c1A3f78C4d8AF7a1`

### Basescan Links
- [CTFPredictionMarket](https://sepolia.basescan.org/address/0x692c052ca3765fcf24a38ea0c1f653259df2e8e7)
- [MockUSDC](https://sepolia.basescan.org/address/0x7c476223c59e2106511c7238c1a3f78c4d8af7a1)

---

## 🔧 Frontend Setup

### 1. Contract Configuration
**File:** `lib/contracts.ts`

Already updated with:
- ✅ CTF contract addresses
- ✅ MockUSDC address
- ✅ Stablecoin configurations

### 2. Contract ABIs
**Files:** `lib/abis/`

Available ABIs:
- ✅ `CTFPredictionMarket.json` - Main contract ABI with all functions
- ✅ `MockUSDC.json` - ERC20 token ABI

### 3. Custom Hook
**File:** `hooks/useCTFMarket.ts`

Provides React hook for contract interactions:
```typescript
const {
  marketCount,
  createMarket,
  mintPositionTokens,
  redeemPositionTokens,
  resolveMarket,
  redeemWinningTokens,
  // ... and loading states
} = useCTFMarket();
```

---

## 🎯 Core Functions Available

### Market Management
- **createMarket** - Create new prediction market
- **resolveMarket** - Resolve market with winning outcome
- **pauseMarket** - Pause market trading
- **unpauseMarket** - Resume market trading

### Position Tokens
- **mintPositionTokens** - Mint YES/NO tokens with collateral
- **redeemPositionTokens** - Redeem tokens for collateral (before resolution)
- **redeemWinningTokens** - Redeem winning tokens after resolution

### Order Matching
- **fillOrder** - Fill signed order (requires EIP-712 signature)
- **cancelOrder** - Cancel pending order

### Admin Functions
- **setPlatformFee** - Set platform fee rate
- **withdrawFees** - Withdraw accumulated fees
- **withdrawFeesAmount** - Withdraw specific fee amount

### View Functions
- **getMarket** - Get market details
- **getOutcomeToken** - Get token ID for outcome
- **marketCount** - Get total markets created
- **balanceOf** - Get user's token balance

---

## 📊 Market Data Structure

```typescript
interface Market {
  question: string;           // Market question
  description: string;        // Market description
  creator: address;           // Market creator address
  collateralToken: address;   // Token used for collateral
  createdAt: uint256;         // Creation timestamp
  closingTime: uint256;       // Market closing timestamp
  conditionId: bytes32;       // Condition ID for CTF
  outcomeCount: uint256;      // Number of outcomes (usually 2)
  resolved: bool;             // Is market resolved?
  winningOutcome: uint256;    // Winning outcome index
  paused: bool;               // Is market paused?
}
```

---

## 🔄 Typical User Flow

### 1. Create Market
```
User → createMarket(question, description, 2, closingTime, collateralToken)
```

### 2. Mint Position Tokens
```
User → approve(market, amount) → mintPositionTokens(marketId, amount)
Result: User receives YES and NO tokens
```

### 3. Trade (Optional)
```
User A → createOrder(YES tokens) → signOrder(EIP-712)
User B → fillOrder(signedOrder, amount)
```

### 4. Market Closes
```
Closing time passes → Market can be resolved
```

### 5. Resolve Market
```
Creator → resolveMarket(marketId, winningOutcome)
```

### 6. Redeem Winning Tokens
```
Winners → redeemWinningTokens(marketId, amount)
Result: User receives collateral for winning tokens
```

---

## 🧪 Test Markets Created

| Market ID | Question | Status | Winner |
|-----------|----------|--------|--------|
| 1 | Will ETH reach $5000 by Feb 2026? | Active | - |
| 2 | Test Resolution Market | Resolved | YES |
| 3 | Redemption Test Market | Resolved | YES |

---

## 📝 Integration Checklist

- [x] Contract addresses configured
- [x] ABIs available
- [x] Custom hook created
- [x] Contracts deployed and verified
- [x] Multi-account testing completed
- [x] Market resolution tested
- [x] Token redemption tested
- [ ] UI components updated
- [ ] Connect to existing market components
- [ ] Test end-to-end flow

---

## 🚀 Next Steps

### For Frontend Team
1. Update existing market components to use new contract addresses
2. Implement market creation form
3. Add position token minting UI
4. Implement order matching interface (requires EIP-712 signing)
5. Add market resolution UI
6. Test full end-to-end flow

### Files to Update
- `components/BlockchainMarketModal.tsx` - Market creation
- `components/CompactMarketCard.tsx` - Market display
- `app/api/polymarket/events/route.ts` - Market data fetching

---

## 💡 Key Implementation Notes

1. **ERC1155 Tokens** - Position tokens are ERC1155 (not ERC20)
   - Use `balanceOf(address, tokenId)` for balance queries
   - Use `setApprovalForAll()` for approvals

2. **Token IDs** - Generated dynamically per market/outcome
   - Use `getOutcomeToken(marketId, outcomeIndex)` to get token ID

3. **Collateral** - Any ERC20 token can be used
   - Default: MockUSDC for testing
   - Production: Real USDC or other stablecoins

4. **Fee Structure** - Platform fees only (no creator fees)
   - Default: 50 bps (0.5%)
   - Configurable by contract owner

5. **Market Resolution** - Only creator can resolve
   - Must be after closing time
   - Winning outcome is permanent

---

## 🔗 Useful Resources

- **Contract Source:** `/contracts/src/CTFPredictionMarket.sol`
- **Test Suite:** `/contracts/test/CTFPredictionMarket.t.sol`
- **Deployment Script:** `/contracts/script/DeployCTF.s.sol`
- **Basescan:** https://sepolia.basescan.org/

---

## ✅ Verification

All functionality has been tested on Base Sepolia:
- ✅ Market creation
- ✅ Position token minting
- ✅ Multi-account interactions
- ✅ Market resolution
- ✅ Winning token redemption
- ✅ State protection (no minting after resolution)

**Ready for frontend integration!** 🎉
