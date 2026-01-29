# BetUAA CTF Prediction Market Subgraph

This subgraph indexes events from the CTF Prediction Market contract on Base Sepolia.

## Features

- **Real-time market data**: Volume, liquidity, trader counts
- **User positions**: Track all user positions across markets
- **Trade history**: Complete trade history with timestamps
- **Global statistics**: Platform-wide metrics

## Deployment

### Prerequisites

1. Create an account on [The Graph Studio](https://thegraph.com/studio/)
2. Install Graph CLI: `npm install -g @graphprotocol/graph-cli`

### Deploy to The Graph Studio

1. **Create a new subgraph** in The Graph Studio
   - Go to https://thegraph.com/studio/
   - Click "Create a Subgraph"
   - Name it "betuaa-ctf"

2. **Authenticate**
   ```bash
   graph auth --studio <DEPLOY_KEY>
   ```

3. **Deploy**
   ```bash
   cd subgraph
   npm run codegen
   npm run build
   npm run deploy
   ```

### Query the Subgraph

Once deployed, you can query the subgraph using GraphQL:

```graphql
{
  markets(first: 10, orderBy: totalVolume, orderDirection: desc) {
    id
    question
    totalVolume
    participantCount
    resolved
    winningOutcome
  }
  
  users(first: 10, orderBy: totalVolume, orderDirection: desc) {
    id
    totalVolume
    totalPnL
    marketsTraded
  }
  
  trades(first: 20, orderBy: timestamp, orderDirection: desc) {
    id
    user {
      id
    }
    market {
      question
    }
    amount
    type
    timestamp
  }
}
```

## Schema

### Market
- Real-time volume and liquidity
- Participant count
- Trade count
- Resolution status

### User
- Total volume traded
- Total P&L
- Markets traded count
- Position count

### Position
- User positions per market/outcome
- Balance and average cost
- Realized P&L

### Trade
- Complete trade history
- Type: MINT, REDEEM, CLAIM, TRANSFER
- Timestamp and block number

## Contract Address

- **CTF Prediction Market**: `0x692C052Ca3765FCf24a38Ea0c1F653259dF2E8e7`
- **Network**: Base Sepolia (Chain ID: 84532)

## Development

```bash
# Install dependencies
npm install

# Generate types
npm run codegen

# Build
npm run build

# Deploy
npm run deploy
```
