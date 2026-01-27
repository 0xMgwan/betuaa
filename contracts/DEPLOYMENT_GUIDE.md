# CTF Prediction Market Deployment Guide

## Prerequisites

1. **Foundry installed**
2. **Private key with Base Sepolia ETH** (for gas fees)
3. **Basescan API key** (for contract verification)

## Get Base Sepolia ETH

1. Visit [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
2. Or bridge from Ethereum Sepolia using [Base Bridge](https://bridge.base.org/)

## Setup Environment

Create a `.env` file in the contracts directory:

```bash
cd contracts
cp env.example .env
```

Edit `.env` and add:

```env
# Your deployer private key (DO NOT COMMIT THIS!)
PRIVATE_KEY=your_private_key_here

# Base Sepolia RPC
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Basescan API key for verification
BASESCAN_API_KEY=your_basescan_api_key_here
```

## Deploy Contracts

### 1. Deploy to Base Sepolia

```bash
forge script script/DeployCTF.s.sol:DeployCTFScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

### 2. Alternative: Deploy without verification first

```bash
forge script script/DeployCTF.s.sol:DeployCTFScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  -vvvv
```

### 3. Verify contracts separately (if needed)

```bash
# Verify MockUSDC
forge verify-contract \
  --chain-id 84532 \
  --compiler-version v0.8.24 \
  <MOCKUSDC_ADDRESS> \
  src/MockUSDC.sol:MockUSDC

# Verify CTFPredictionMarket
forge verify-contract \
  --chain-id 84532 \
  --compiler-version v0.8.24 \
  <MARKET_ADDRESS> \
  src/CTFPredictionMarket.sol:CTFPredictionMarket
```

## Post-Deployment Steps

### 1. Save Contract Addresses

Create `deployed-addresses.json`:

```json
{
  "network": "base-sepolia",
  "chainId": 84532,
  "contracts": {
    "MockUSDC": "0x...",
    "CTFPredictionMarket": "0x..."
  },
  "deployer": "0x...",
  "timestamp": "2026-01-27T..."
}
```

### 2. Test Contract Functions

```bash
# Create a test market
cast send <MARKET_ADDRESS> \
  "createMarket(string,string,uint256,uint256,address)" \
  "Will ETH reach $5000?" \
  "Test market" \
  2 \
  $(($(date +%s) + 86400)) \
  <MOCKUSDC_ADDRESS> \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Check market count
cast call <MARKET_ADDRESS> "marketCount()" --rpc-url $BASE_SEPOLIA_RPC_URL
```

### 3. Mint Test USDC

```bash
# Mint 1000 USDC to your address
cast send <MOCKUSDC_ADDRESS> \
  "mint(address,uint256)" \
  <YOUR_ADDRESS> \
  1000000000 \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 4. Update Frontend Configuration

Update `app/config/contracts.ts`:

```typescript
export const CONTRACTS = {
  BASE_SEPOLIA: {
    CTFPredictionMarket: '0x...',
    MockUSDC: '0x...'
  }
}
```

## Verify Deployment

1. **Check on Basescan**: https://sepolia.basescan.org/address/<CONTRACT_ADDRESS>
2. **Test contract interaction** via Basescan's "Write Contract" tab
3. **Create a test market** and verify it appears correctly

## Troubleshooting

### Insufficient Funds
- Get more Base Sepolia ETH from faucet
- Check balance: `cast balance <YOUR_ADDRESS> --rpc-url $BASE_SEPOLIA_RPC_URL`

### Verification Failed
- Wait a few minutes and try again
- Check compiler version matches (0.8.24)
- Ensure Basescan API key is correct

### Transaction Reverted
- Check gas limit
- Verify constructor arguments
- Check contract dependencies are deployed

## Security Checklist

- [ ] Private key is in `.env` and NOT committed to git
- [ ] `.env` is in `.gitignore`
- [ ] Contract addresses are saved
- [ ] Contracts are verified on Basescan
- [ ] Test transactions completed successfully
- [ ] Frontend updated with new addresses

## Next Steps

1. **Test all contract functions** on-chain
2. **Integrate with frontend** - update ABIs and addresses
3. **Create test markets** for QA
4. **Deploy to mainnet** when ready (Base mainnet)

## Useful Commands

```bash
# Check deployment status
cast receipt <TX_HASH> --rpc-url $BASE_SEPOLIA_RPC_URL

# Get contract code
cast code <CONTRACT_ADDRESS> --rpc-url $BASE_SEPOLIA_RPC_URL

# Call view function
cast call <CONTRACT_ADDRESS> "functionName()" --rpc-url $BASE_SEPOLIA_RPC_URL

# Send transaction
cast send <CONTRACT_ADDRESS> "functionName(args)" <ARGS> --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
```

## Resources

- [Base Sepolia Explorer](https://sepolia.basescan.org/)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [Foundry Book](https://book.getfoundry.sh/)
- [Base Documentation](https://docs.base.org/)
