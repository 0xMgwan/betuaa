# Betua Smart Contracts

Prediction market smart contracts for the Betua platform on BASE.

## Contracts

### PredictionMarket.sol
Main contract for creating and managing prediction markets.

**Features:**
- Create binary and multi-outcome markets
- Buy and sell shares with dynamic pricing
- Liquidity provision and subsidies
- Oracle-based resolution
- Fee distribution to creators and platform

### MockUSDC.sol
Mock USDC token for testing purposes.

## Deployment

### Prerequisites
```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts
```

### Deploy to BASE Sepolia

1. Set up environment variables:
```bash
cd contracts
cp .env.example .env
# Edit .env with your values
```

2. Deploy MockUSDC (for testing):
```bash
forge create ./src/MockUSDC.sol:MockUSDC \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --account deployer
```

3. Deploy PredictionMarket:
```bash
forge create ./src/PredictionMarket.sol:PredictionMarket \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --account deployer \
  --constructor-args <USDC_ADDRESS>
```

### Deploy to BASE Mainnet

```bash
forge create ./src/PredictionMarket.sol:PredictionMarket \
  --rpc-url $BASE_RPC_URL \
  --account deployer \
  --constructor-args <USDC_ADDRESS>
```

## Testing

```bash
forge test
```

## Verification

```bash
forge verify-contract \
  --chain-id 84532 \
  --compiler-version v0.8.20 \
  <CONTRACT_ADDRESS> \
  src/PredictionMarket.sol:PredictionMarket \
  --constructor-args $(cast abi-encode "constructor(address)" <USDC_ADDRESS>)
```

## Contract Addresses

### BASE Sepolia
- MockUSDC: TBD
- PredictionMarket: TBD

### BASE Mainnet
- USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
- PredictionMarket: TBD
