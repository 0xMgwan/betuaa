# Phase 2 & 3 Implementation Roadmap

## 🎯 Phase 2: Trading & Liquidity (Priority 1)

### 2.1 Buy/Sell Shares Implementation
**Files to Create/Update:**
- [ ] `components/TradingInterface.tsx` - Main trading UI component
- [ ] `hooks/useTrading.ts` - Trading logic and state management
- [ ] `components/TransactionNotification.tsx` - Toast notifications for tx status
- [ ] Update `BlockchainMarketModal.tsx` - Connect Buy buttons to trading logic

**Features:**
1. **Buy Shares Flow:**
   - Click "Buy Yes/No" → Open amount input modal
   - Show price impact calculation
   - Token approval (if needed)
   - Execute buy transaction
   - Show pending/success/error states
   - Update user position in real-time

2. **Sell Shares Flow:**
   - Check user's current position
   - Input amount to sell
   - Show expected payout
   - Execute sell transaction
   - Update position

3. **Transaction States:**
   - Idle → Approving → Approved → Trading → Success/Error
   - Loading spinners and progress indicators
   - Error handling with retry option

### 2.2 Position Tracking
**Files to Create/Update:**
- [ ] `hooks/useUserPositions.ts` - Fetch user positions across all markets
- [ ] `components/PositionCard.tsx` - Display individual position
- [ ] Update `app/profile/page.tsx` - Show positions with P&L
- [ ] Update `app/portfolio/page.tsx` - Comprehensive portfolio view

**Features:**
1. **Position Display:**
   - Market name and outcome
   - Shares owned
   - Average buy price
   - Current value
   - Unrealized P&L ($ and %)
   - Quick sell button

2. **Portfolio Analytics:**
   - Total portfolio value
   - Total P&L
   - Active positions count
   - Trade history

### 2.3 Liquidity Management
**Files to Create/Update:**
- [ ] `components/AddLiquidityModal.tsx` - UI for adding liquidity
- [ ] Update `BlockchainMarketModal.tsx` - Show liquidity info

**Features:**
- Display current market liquidity
- Add liquidity subsidy (creator only)
- Show price impact before trades

---

## 📊 Phase 3: Market Resolution & Claims (Priority 2)

### 3.1 Market Resolution
**Files to Create/Update:**
- [ ] `components/ResolveMarketModal.tsx` - Resolution interface
- [ ] `hooks/useMarketResolution.ts` - Resolution logic
- [ ] Update `app/profile/page.tsx` - Add "Resolve" button for creators

**Features:**
1. **Resolution UI:**
   - Only visible to market creator
   - Show all outcomes
   - Select winning outcome
   - Confirmation dialog
   - Execute resolution transaction

2. **Resolution States:**
   - Market active → Closed → Resolved
   - Show resolution status on cards
   - Display winning outcome

### 3.2 Claim Winnings
**Files to Create/Update:**
- [ ] `components/ClaimWinningsButton.tsx` - Claim UI
- [ ] `hooks/useClaimWinnings.ts` - Claim logic
- [ ] Update `app/portfolio/page.tsx` - Show claimable markets

**Features:**
1. **Claim Detection:**
   - Automatically detect winning positions
   - Show "Claim" button on resolved markets
   - Display claimable amount

2. **Claim Flow:**
   - One-click claim
   - Batch claim multiple markets
   - Show claimed amount
   - Update portfolio after claim

### 3.3 Market Analytics
**Files to Create/Update:**
- [ ] `components/PriceChart.tsx` - Real price history chart
- [ ] `components/MarketStats.tsx` - Detailed market statistics
- [ ] Update `BlockchainMarketModal.tsx` - Replace placeholder chart

**Features:**
- Real-time price history (fetch from events)
- Volume over time
- Number of traders
- Trade history log

---

## 🛠️ Technical Implementation Order

### Week 1: Core Trading (Days 1-4)
1. **Day 1:** Trading interface component + amount input modal
2. **Day 2:** Buy shares implementation (approval + buy flow)
3. **Day 3:** Sell shares implementation
4. **Day 4:** Transaction notifications + error handling

### Week 2: Positions & Portfolio (Days 5-7)
5. **Day 5:** Position tracking hooks + display
6. **Day 6:** Portfolio page with P&L calculations
7. **Day 7:** Add liquidity UI + testing

### Week 3: Resolution & Claims (Days 8-10)
8. **Day 8:** Market resolution UI + logic
9. **Day 9:** Claim winnings implementation
10. **Day 10:** Market analytics + price charts

---

## 📋 Implementation Checklist

### Phase 2: Trading
- [ ] Create TradingInterface component
- [ ] Implement token approval flow
- [ ] Connect Buy Yes/No buttons
- [ ] Add amount input with validation
- [ ] Show price impact calculation
- [ ] Implement buy transaction
- [ ] Implement sell transaction
- [ ] Add transaction notifications
- [ ] Create position tracking hooks
- [ ] Update portfolio page with positions
- [ ] Add liquidity subsidy UI
- [ ] Test all trading flows

### Phase 3: Resolution
- [ ] Create ResolveMarketModal
- [ ] Add resolution button for creators
- [ ] Implement resolution transaction
- [ ] Update market status after resolution
- [ ] Create ClaimWinningsButton
- [ ] Detect winning positions
- [ ] Implement claim transaction
- [ ] Add batch claim functionality
- [ ] Create price history chart
- [ ] Add market statistics
- [ ] Test resolution and claims

---

## 🎯 Success Metrics

**Phase 2 Complete When:**
- ✅ Users can buy shares with any supported token
- ✅ Users can sell shares and receive payout
- ✅ Positions are tracked and displayed correctly
- ✅ P&L calculations are accurate
- ✅ All transactions have proper notifications

**Phase 3 Complete When:**
- ✅ Creators can resolve their markets
- ✅ Users can claim winnings from resolved markets
- ✅ Market analytics show real data
- ✅ Price history is displayed correctly
- ✅ All edge cases are handled

---

## 🚀 Let's Start!

**First Task:** Implement Buy Shares functionality
- Create TradingInterface component
- Add amount input modal
- Implement approval + buy flow
- Add transaction notifications

Ready to begin? 🎉
