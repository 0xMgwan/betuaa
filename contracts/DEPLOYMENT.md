# BetUAA Contract Deployment

## Base Sepolia Testnet (Chain ID: 84532)

### Deployed Contracts

**MockUSDC (Test Token)**
- Address: `0xAE44F1ad9111A2F61FBCd0624c6593A967d1F7FF`
- Verified: ✅ https://sepolia.basescan.org/address/0xae44f1ad9111a2f61fbcd0624c6593a967d1f7ff

**PredictionMarket (Main Contract)**
- Address: `0x8F23474E7f7641dff430986082C1c07aE9fbb949`
- Verified: ✅ https://sepolia.basescan.org/address/0x8f23474e7f7641dff430986082c1c07ae9fbb949

### Deployment Details
- **Network**: Base Sepolia
- **Chain ID**: 84532
- **Deployer**: 0x... (from your private key)
- **Gas Used**: 3,223,892 gas
- **Total Cost**: 0.0000038686704 ETH
- **Timestamp**: January 20, 2026

### Supported Stablecoins

#### Mainnet (Base)
1. **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
2. **USDT**: `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2`
3. **cNGN**: `0x46C85152bFe9f96829aA94755D9f915F9B10EF5F`
4. **IDRX**: `0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22`

#### Testnet (Base Sepolia)
1. **USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
2. **USDT**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (same as USDC for testing)
3. **cNGN**: `0x929A08903C22440182646Bb450a67178Be402f7f`
4. **MockUSDC**: `0xAE44F1ad9111A2F61FBCd0624c6593A967d1F7FF` (deployed for testing)

### Contract Features

✅ Multi-stablecoin support (4 tokens on mainnet, 4 on testnet)
✅ Binary and multi-outcome markets
✅ Automated Market Maker (AMM) pricing
✅ Creator and platform fees (0.5% each)
✅ Market resolution with oracle support
✅ Liquidity subsidies
✅ User position tracking

### Next Steps

1. **Frontend Integration**
   - Add contract addresses to wagmi config
   - Create hooks for contract interactions
   - Add stablecoin selection UI
   - Implement market creation flow
   - Add trading interface

2. **Testing**
   - Create test markets with different stablecoins
   - Test buying/selling shares
   - Test market resolution
   - Test claiming winnings

3. **Mainnet Deployment** (when ready)
   - Deploy to Base mainnet
   - Verify contracts
   - Update frontend config

### Useful Commands

```bash
# Get test USDC from faucet
cast send 0xAE44F1ad9111A2F61FBCd0624c6593A967d1F7FF "faucet()" --rpc-url $BASE_SEPOLIA_RPC --private-key $PRIVATE_KEY

# Check supported tokens
cast call 0x8F23474E7f7641dff430986082C1c07aE9fbb949 "getSupportedTokens()" --rpc-url $BASE_SEPOLIA_RPC

# Check market count
cast call 0x8F23474E7f7641dff430986082C1c07aE9fbb949 "marketCount()" --rpc-url $BASE_SEPOLIA_RPC
```

### Contract ABIs

ABIs are available in:
- `out/PredictionMarket.sol/PredictionMarket.json`
- `out/MockUSDC.sol/MockUSDC.json`
