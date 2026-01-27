# CTF Prediction Market Architecture

## Overview

This document explains the new Conditional Token Framework (CTF) based prediction market architecture, following Polymarket and Limitless standards.

## Key Differences from Original Contract

### 1. **ERC1155 Outcome Tokens (CTF Standard)**
- **Old**: Simple share tracking in mappings
- **New**: ERC1155 tokens for each outcome
- **Benefits**: 
  - Tokens are transferable and tradeable
  - Compatible with DEXs and wallets
  - Standard NFT marketplace support

### 2. **Signature-Based Order Matching**
- **Old**: Direct buy/sell transactions
- **New**: Off-chain order creation, on-chain settlement
- **Benefits**:
  - Gas-efficient (only settlement on-chain)
  - Better UX (instant order creation)
  - Supports limit orders and order books

### 3. **Conditional Token Framework**
- Each market has a unique `conditionId`
- Outcome tokens are minted by depositing collateral
- Complete sets can be redeemed for collateral
- Winning tokens redeemed 1:1 for collateral

## Architecture Components

### Core Contracts

#### CTFPredictionMarket.sol
Main contract implementing:
- Market creation with CTF tokens
- Signature-based order matching
- Position token minting/redeeming
- Market resolution
- EIP-712 typed signatures

### Data Structures

#### Order
```solidity
struct Order {
    address maker;          // Order creator
    address taker;          // Order taker (address(0) for open)
    uint256 tokenId;        // Outcome token ID
    uint256 makerAmount;    // Amount maker offers
    uint256 takerAmount;    // Amount taker provides
    uint256 expiration;     // Expiration timestamp
    uint256 nonce;          // Unique nonce
    uint256 feeRateBps;     // Fee in basis points
    OrderSide side;         // BUY or SELL
    SignatureType signatureType;
    bytes signature;        // EIP-712 signature
}
```

#### Market
```solidity
struct Market {
    uint256 id;
    string question;
    address creator;
    address collateralToken;
    uint256 closingTime;
    bytes32 conditionId;    // Unique CTF condition ID
    uint256 outcomeCount;
    uint256 winningOutcome;
    bool resolved;
}
```

## Trading Flow

### 1. Market Creation
```solidity
createMarket(
    "Will ETH reach $5000 by EOY?",
    "Market resolves YES if...",
    2,  // Binary market (Yes/No)
    closingTime,
    USDC_ADDRESS
)
```

### 2. Minting Position Tokens
Users deposit collateral to mint outcome tokens:
```solidity
// Deposit 100 USDC
mintPositionTokens(marketId, 100e6)
// Receives: 100 YES tokens + 100 NO tokens
```

### 3. Creating Orders (Off-chain)
```javascript
const order = {
    maker: userAddress,
    taker: ZERO_ADDRESS,  // Open order
    tokenId: yesTokenId,
    makerAmount: 60e18,   // Selling 60 YES tokens
    takerAmount: 60e6,    // For 60 USDC
    expiration: timestamp,
    nonce: uniqueNonce,
    feeRateBps: 50,       // 0.5% fee
    side: SELL,
    signatureType: EOA
}

// Sign with EIP-712
const signature = await signer._signTypedData(domain, types, order)
order.signature = signature
```

### 4. Filling Orders (On-chain)
```solidity
fillOrder(order, 60e18)  // Fill entire order
```

### 5. Market Resolution
```solidity
resolveMarket(marketId, 0)  // YES wins (outcome 0)
```

### 6. Redeeming Winnings
```solidity
// Redeem 60 YES tokens for 60 USDC
redeemWinningTokens(marketId, 60e18)
```

## Key Features

### 1. **Complete Set Minting/Redeeming**
- Mint: Deposit collateral → Receive all outcome tokens
- Redeem: Burn all outcome tokens → Receive collateral back
- Enables market making and liquidity provision

### 2. **Order Book System**
- Off-chain order creation (gas-free)
- On-chain settlement only
- Nonce-based order management
- Partial fills supported

### 3. **EIP-712 Signatures**
- Structured data signing
- Domain separation
- Replay protection
- Human-readable signatures

### 4. **Fee Structure**
- Platform fee: 0.5% (50 bps) default
- Configurable per order
- Paid in collateral token
- Max 5% cap

## Integration with Frontend

### CLOB Client Integration
The existing Polymarket CLOB client can be adapted:

```typescript
import { ClobClient } from '@polymarket/clob-client'

// Initialize with our contract
const client = new ClobClient(
  RPC_URL,
  CHAIN_ID,
  CTF_CONTRACT_ADDRESS
)

// Create order
const order = await client.createOrder({
  tokenID: yesTokenId,
  price: 0.60,
  size: 100,
  side: 'SELL'
})

// Post to orderbook
await client.postOrder(order)
```

### Wallet Integration
```typescript
// Mint position tokens
await contract.mintPositionTokens(marketId, amount)

// Approve tokens for trading
await erc1155.setApprovalForAll(EXCHANGE_ADDRESS, true)

// Fill order
await contract.fillOrder(order, fillAmount)
```

## Comparison with Polymarket

### Similarities
✅ ERC1155 outcome tokens
✅ Signature-based trading
✅ Conditional Token Framework
✅ EIP-712 typed signatures
✅ Order book matching
✅ Complete set minting/redeeming

### Differences
- **Simplified**: Single contract vs modular mixins
- **Integrated**: Market creation + trading in one contract
- **Flexible**: Supports any ERC20 collateral
- **Customizable**: Per-market fee configuration

## Security Considerations

1. **Signature Verification**: EIP-712 with domain separation
2. **Nonce Management**: Prevents replay attacks
3. **Reentrancy Protection**: NonReentrant guards
4. **Order Expiration**: Time-based order validity
5. **Access Control**: Owner-only admin functions

## Gas Optimization

1. **Off-chain Orders**: Only settlement on-chain
2. **Batch Operations**: Multiple orders in one tx
3. **Efficient Storage**: Packed structs
4. **Minimal State Changes**: Optimized updates

## Future Enhancements

1. **Proxy Wallet Support**: Like Polymarket's proxy system
2. **Gnosis Safe Integration**: Multi-sig trading
3. **Advanced Order Types**: Stop-loss, take-profit
4. **Cross-market Trading**: Atomic swaps between markets
5. **Liquidity Mining**: Incentivize market makers

## Migration Path

### From Old Contract
1. Deploy new CTF contract
2. Create equivalent markets
3. Migrate user positions (snapshot + airdrop)
4. Update frontend to use new contract
5. Deprecate old contract

### Testing Strategy
1. Unit tests for all functions
2. Integration tests for trading flows
3. Signature verification tests
4. Gas benchmarking
5. Mainnet fork testing

## Deployment Checklist

- [ ] Install dependencies
- [ ] Compile contracts
- [ ] Run test suite
- [ ] Deploy to testnet
- [ ] Verify contracts
- [ ] Test with frontend
- [ ] Audit (if needed)
- [ ] Deploy to mainnet
- [ ] Update frontend config

## Resources

- [Polymarket CTF Exchange](https://github.com/Polymarket/ctf-exchange)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [ERC-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [Conditional Tokens Framework](https://docs.gnosis.io/conditionaltokens/)
