# Supported Stablecoins on BetUAA

## Base Mainnet Stablecoins (VERIFIED ✓)

### Global Stablecoins
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals)
- **USDT**: `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` (6 decimals)

### African Stablecoins
- **cNGN** (Nigerian Naira): `0x46C85152bFe9f96829aA94755D9f915F9B10EF5F` (18 decimals)

### Asian Stablecoins
- **IDRX** (Indonesian Rupiah): `0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22` (18 decimals)

## Base Sepolia Testnet (VERIFIED ✓)
- **USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (6 decimals)
- **USDT**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (6 decimals) - Using USDC for testing
- **cNGN**: `0x929A08903C22440182646Bb450a67178Be402f7f` (18 decimals)

## How It Works

1. **Market Creation**: When creating a market, specify which stablecoin to use
2. **Trading**: Users trade using the stablecoin specified for that market
3. **Multi-Currency Support**: Different markets can use different stablecoins
4. **Flexibility**: Platform owner can add/remove supported tokens

## Benefits

- **Local Currency Support**: Users can trade in their local stablecoin
- **Reduced Conversion Fees**: No need to convert to USDC first
- **Better UX**: Trade in familiar currencies
- **Wider Adoption**: Accessible to more users globally

## Technical Implementation

- `StablecoinRegistry.sol`: Central registry of all supported stablecoins
- `PredictionMarket.sol`: Updated to accept any whitelisted stablecoin
- Each market stores its payment token address
- All trades/claims use the market's designated stablecoin
