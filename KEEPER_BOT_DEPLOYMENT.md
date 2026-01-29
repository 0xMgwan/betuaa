# Keeper Bot Deployment Guide

## Overview

The Keeper Bot automatically resolves expired Pyth markets by:
1. Monitoring for expired markets
2. Fetching current prices from Pyth
3. Determining winning outcomes
4. Submitting resolution transactions

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Base Sepolia or Base Mainnet ETH for gas fees

### Setup

1. **Install dependencies** (already included):
```bash
npm install viem node-fetch
```

2. **Create a keeper wallet**:
   - Generate a new wallet or use an existing one
   - Fund it with Base Sepolia or Mainnet ETH (0.1+ ETH recommended)
   - Keep the private key secure

## Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Keeper wallet private key (REQUIRED)
PRIVATE_KEY=0x...

# Network (optional, default: sepolia)
CHAIN=sepolia  # or "mainnet"

# RPC URL (optional, uses defaults if not set)
RPC_URL=https://sepolia.base.org
```

### Secure Storage

**NEVER commit `.env.local` to git!** It's already in `.gitignore`.

For production deployment:
- Use environment variable management (GitHub Secrets, AWS Secrets Manager, etc.)
- Rotate keys regularly
- Monitor keeper wallet activity

## Running the Keeper Bot

### Single Check (Test Mode)
```bash
PRIVATE_KEY=0x... npm run keeper-bot
```

This runs once and exits. Use for testing.

### Continuous Mode (Watch)
```bash
PRIVATE_KEY=0x... npm run keeper-bot -- --watch
```

This runs continuously, checking every 60 seconds.

### With Custom Network
```bash
PRIVATE_KEY=0x... CHAIN=mainnet npm run keeper-bot -- --watch
```

## How It Works

### Market Detection
1. Queries CTF contract for total market count
2. Checks each market with `canResolve(marketId)`
3. Fetches Pyth market configuration

### Resolution Process
1. **Fetch Price**: Gets current price from Pyth Hermes API
2. **Compare**: Compares price against market threshold
3. **Determine Outcome**: 
   - If `isAbove=true`: YES if price >= threshold, NO otherwise
   - If `isAbove=false`: YES if price < threshold, NO otherwise
4. **Get Update Data**: Fetches price update data from Hermes
5. **Estimate Gas**: Calculates gas requirements
6. **Submit Transaction**: Sends resolution with 0.001 ETH for Pyth update fee
7. **Confirm**: Waits for transaction confirmation

### Output Example
```
🤖 Pyth Keeper Bot Initializing...

📍 Network: Base Sepolia
👛 Keeper Address: 0x...
📝 PythResolver: 0xc3c8523FaC61b6E35DC553BB5a1F542982753F62
⏱️  Check Interval: 60s
🔄 Watch Mode: ON

💰 Keeper Balance: 0.5 ETH

🚀 Keeper Bot started

⏰ 2026-01-29 17:30:00 - Checking for resolvable markets...
   📊 Found 2 market(s) to resolve

🎯 Resolving Market 1...
   💹 Current Price: $3450.25
   📊 Threshold: $3500.00
   🎲 Outcome: NO (Below)
   📦 Update Data: 1 item(s)
   ⛽ Estimating gas...
   Gas Estimate: 150000
   📤 Sending resolution transaction...
   ✅ Transaction sent: 0x...
   ✅ Market 1 resolved successfully!

💤 Waiting 60s before next check...
```

## Monitoring

### Check Keeper Balance
```bash
cast balance 0xKEEPER_ADDRESS --rpc-url https://sepolia.base.org
```

### View Resolved Markets
```bash
cast call 0xc3c8523FaC61b6E35DC553BB5a1F542982753F62 \
  "pythMarkets(uint256)" \
  MARKET_ID \
  --rpc-url https://sepolia.base.org
```

### Monitor Transactions
- View on BaseScan: https://sepolia.basescan.org/
- Search for keeper wallet address
- Track gas usage and resolution success rate

## Troubleshooting

### "Low balance! Keeper may fail to resolve markets"
**Solution**: Fund keeper wallet with more ETH
```bash
# Check balance
cast balance 0xKEEPER_ADDRESS --rpc-url https://sepolia.base.org

# Recommended: 0.1+ ETH
```

### "Could not fetch price"
**Solution**: Pyth API may be temporarily unavailable
- Check Hermes API status: https://hermes.pyth.network/
- Keeper will retry on next check

### "No markets to resolve"
**Solution**: No expired Pyth markets available
- Create test markets with short expiry times
- Wait for markets to expire

### Transaction fails with "Market not expired"
**Solution**: Market hasn't reached expiry time yet
- Check market expiry time: `cast call ... pythMarkets(uint256)`
- Wait for expiry before resolution

### "Insufficient balance for gas"
**Solution**: Keeper wallet needs more ETH
- Each resolution costs ~150k gas + Pyth update fee
- Recommended: 0.1+ ETH in keeper wallet

## Production Deployment

### Option 1: VPS/Server
```bash
# SSH into server
ssh user@server.com

# Clone repo and setup
git clone https://github.com/0xMgwan/betuaa.git
cd betuaa
npm install

# Create .env file with PRIVATE_KEY
echo "PRIVATE_KEY=0x..." > .env.local

# Run with process manager (pm2)
npm install -g pm2
pm2 start "npm run keeper-bot -- --watch" --name "pyth-keeper"
pm2 save
pm2 startup
```

### Option 2: Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY scripts/keeper-bot.ts ./scripts/
COPY lib/pyth.ts ./lib/

ENV CHAIN=mainnet
ENV PRIVATE_KEY=${KEEPER_PRIVATE_KEY}

CMD ["npm", "run", "keeper-bot", "--", "--watch"]
```

### Option 3: GitHub Actions
```yaml
name: Keeper Bot

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  resolve:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run keeper-bot
        env:
          PRIVATE_KEY: ${{ secrets.KEEPER_PRIVATE_KEY }}
          CHAIN: mainnet
```

## Cost Analysis

### Per Resolution
- **Pyth Update Fee**: ~$0.01-0.05 (Base Sepolia: free)
- **Gas Cost**: ~150k gas * gas price
- **Total**: ~$0.20-0.50 per resolution (Base Mainnet)

### Monthly (100 resolutions)
- **Base Sepolia**: ~$0 (testnet)
- **Base Mainnet**: ~$20-50

### Revenue Options
1. **Platform Subsidy**: Cover costs from platform revenue
2. **Market Fee**: Charge 0.1-0.5% of winning payouts
3. **Keeper Rewards**: Allocate treasury funds for incentives

## Security Best Practices

1. **Key Management**
   - Never commit private keys
   - Use environment variables
   - Rotate keys periodically

2. **Monitoring**
   - Set up alerts for failed resolutions
   - Monitor keeper balance
   - Track gas usage trends

3. **Rate Limiting**
   - Hermes API has generous limits
   - Keeper respects rate limits
   - No issues with current configuration

4. **Access Control**
   - Keeper wallet should only resolve markets
   - Don't use for other transactions
   - Consider multi-sig for mainnet

## Support & Debugging

### Enable Verbose Logging
```bash
DEBUG=* npm run keeper-bot -- --watch
```

### Test Market Creation
```bash
python3 scripts/create_pyth_market.py 0xPRIVATE_KEY
```

### Manual Resolution
```bash
python3 scripts/resolve_pyth_market.py 0xPRIVATE_KEY MARKET_ID
```

### Check Contract State
```bash
# Is resolver authorized?
cast call 0xA5Bf04D3D079BE92981EE8208b18B0514eBd370C \
  "authorizedResolvers(address)" \
  0xc3c8523FaC61b6E35DC553BB5a1F542982753F62 \
  --rpc-url https://sepolia.base.org

# Get market config
cast call 0xc3c8523FaC61b6E35DC553BB5a1F542982753F62 \
  "pythMarkets(uint256)" \
  MARKET_ID \
  --rpc-url https://sepolia.base.org
```

## Next Steps

1. ✅ Deploy keeper bot to test environment
2. ✅ Monitor for 24-48 hours
3. ✅ Verify all resolutions successful
4. ✅ Deploy to production
5. ✅ Set up monitoring and alerts
6. ✅ Document operational procedures

---

**Status**: Ready for deployment
**Last Updated**: January 29, 2026
**Version**: 1.0.0
