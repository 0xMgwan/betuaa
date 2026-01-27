# Betua Smart Contracts

Prediction market smart contracts for the Betua platform on BASE, following Polymarket CTF Exchange standards.

## Contracts

### CTFPredictionMarket.sol (NEW - Recommended)
**Conditional Token Framework** based prediction market following Polymarket standards.

**Features:**
- ✅ ERC1155 outcome tokens (transferable & tradeable)
- ✅ Signature-based order matching (off-chain orders, on-chain settlement)
- ✅ Complete set minting/redeeming (deposit collateral → get all outcome tokens)
- ✅ Compatible with Polymarket CLOB client
- ✅ Gas-efficient trading with EIP-712 signatures
- ✅ Order book system with maker/taker orders
- ✅ Works with any ERC20 collateral token
- ✅ 1:1 collateral redemption for winning tokens

**See:** [CTF_ARCHITECTURE.md](./CTF_ARCHITECTURE.md) for detailed documentation

### PredictionMarket.sol (Legacy)
Original share-based prediction market contract.

**Features:**
- Create binary and multi-outcome markets
- Direct buy/sell with dynamic pricing
- Liquidity provision and subsidies
- Oracle-based resolution
- Fee distribution to creators and platform

**Note:** New deployments should use CTFPredictionMarket.sol

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

### Deploy CTFPredictionMarket (Recommended)

1. Set up environment variables:
```bash
cd contracts
cp env.example .env
# Edit .env with your values
```

2. Deploy to BASE Sepolia:
```bash
forge create ./src/CTFPredictionMarket.sol:CTFPredictionMarket \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --account deployer
```

3. Deploy to BASE Mainnet:
```bash
forge create ./src/CTFPredictionMarket.sol:CTFPredictionMarket \
  --rpc-url $BASE_RPC_URL \
  --account deployer
```

### Deploy Legacy PredictionMarket

```bash
forge create ./src/PredictionMarket.sol:PredictionMarket \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --account deployer
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
