# Stretch - Decentralized Prediction Market Platform

A fully decentralized prediction market platform built on Base blockchain with automated market resolution. Users can create binary outcome markets, trade position tokens, and earn from accurate predictions with automatic resolution powered by real time oracle price feeds.

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange)
![Base](https://img.shields.io/badge/Base-Sepolia-blue)
![Pyth](https://img.shields.io/badge/Pyth-Network-purple)

## 🌟 Features

### Core Functionality
- **Create Markets** - Binary outcome markets (Yes/No) on any topic
- **Pyth Markets** - Markets that auto-resolve using Pyth price feeds
- **Position Token Trading** - Buy/sell outcome tokens at fixed prices
- **Automatic Resolution** - Keeper bot auto-resolves expired Pyth markets
- **Manual Resolution** - Market creators can manually resolve non-Pyth markets
- **Claim Winnings** - Winners redeem winning tokens for collateral
- **Portfolio Tracking** - Real-time P&L tracking and position management

### Pyth Network Integration
- **Price Feeds** - 100+ cryptocurrency price feeds from Pyth Network
- **Auto-Resolution** - Markets automatically resolve based on real-time price data
- **Keeper Bot** - Continuously monitors and resolves expired markets
- **Fresh Price Data** - Hermes API integration for latest VAA (Verifiable Action Approval) data
- **Threshold-Based** - Markets resolve when price crosses configured threshold

### User Experience
- **Username System** - Set custom username on first wallet connection
- **RainbowKit Integration** - Beautiful multi-wallet support (MetaMask, Coinbase, etc.)
- **Dark Mode** - Full dark/light theme support
- **Responsive Design** - Mobile-first, works on all devices
- **Real-time Updates** - Live market data and price updates
- **Success Modals** - Beautiful confirmation screens with transaction details

### Technical Features
- **Multi-Token Support** - USDC, USDT, cNGN, and other stablecoins
- **Decimal Handling** - Proper handling of 6-decimal (USDC) and 18-decimal tokens
- **Unlimited Approval** - One-time approval for seamless trading
- **Gas Optimized** - Efficient smart contracts with minimal gas costs
- **i18n Support** - Complete internationalization with English & Swahili
- **Performance Optimized** - Parallel data fetching, batched contract calls

## 🏗️ Architecture

### Frontend Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript with strict mode
- **Styling**: TailwindCSS v4 with dark mode
- **Web3**: Wagmi v2, Viem, RainbowKit
- **State Management**: React Hooks, TanStack Query
- **Icons**: Lucide React
- **Internationalization**: Custom i18n hook (English, Swahili)

### Backend Services
- **API Routes**: Next.js API routes for server-side data fetching
- **Market Count Endpoint**: `/api/market-count` - Fetches total market count reliably
- **Market Data Endpoint**: `/api/market/[id]` - Fetches individual market details

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Foundry
- **Network**: Base Sepolia (Testnet)
- **Standards**: ERC20, ReentrancyGuard, Ownable, AccessControl

### Keeper Bot
- **Language**: TypeScript (Node.js)
- **Runtime**: tsx (TypeScript executor)
- **Frequency**: Checks every 60 seconds
- **Mode**: Continuous watch mode (runs indefinitely)
- **Purpose**: Auto-resolves expired Pyth markets

### Contract Addresses (Base Sepolia)
```
CTFPredictionMarket: 0xA5Bf04D3D079BE92981EE8208b18B0514eBd370C
PythResolver: 0xc3c8523FaC61b6E35DC553BB5a1F542982753F62
MockUSDC: 0x7c476223C59E2106511C7238c1A3f78C4d8AF7a1
```

### Pyth Network Configuration
```
Network: Base Sepolia
Hermes API: https://hermes.pyth.network
Price Update Fee: ~0.01 ETH per transaction
Supported Price Feeds: 100+ cryptocurrency pairs
```

## 🚀 Getting Started

### Prerequisites
```bash
Node.js 18+ 
npm or yarn
MetaMask or compatible Web3 wallet
Base Sepolia ETH (for gas fees)
Base Sepolia USDC (for trading)
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/0xMgwan/betuaa.git
cd betuaa/betuaa
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Add your WalletConnect Project ID:
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

4. **Run development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

### Running the Keeper Bot

The keeper bot automatically resolves expired Pyth markets every 60 seconds:

```bash
# Run in continuous watch mode (recommended)
PRIVATE_KEY=0x... npm run keeper-bot

# Or run a single check and exit
PRIVATE_KEY=0x... npm run keeper-bot -- --once
```

**Environment Variables for Keeper Bot:**
```env
PRIVATE_KEY=your_private_key_here
CHAIN=sepolia  # or mainnet
```

The keeper bot will:
- ✅ Check for expired Pyth markets every 60 seconds
- ✅ Fetch fresh price data from Hermes API
- ✅ Resolve markets based on current price vs threshold
- ✅ Handle transaction signing and submission
- ✅ Log all activities for monitoring

## 📖 User Guide

### First Time Setup

1. **Connect Wallet**
   - Click "Connect Wallet" in navbar
   - Select your wallet (MetaMask recommended)
   - Approve connection
   - Switch to Base Sepolia network if needed

2. **Set Username**
   - Modal appears on first connection
   - Choose username (3-20 characters, alphanumeric + underscore)
   - Username is permanent and stored locally
   - Used for profile identification

3. **Choose Language**
   - Click wallet address dropdown
   - Scroll to "Language" section
   - Select English or Swahili
   - Preference persists across sessions

4. **Get Test Tokens**
   - Get Base Sepolia ETH from [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
   - Get MockUSDC from contract: `0x7c476223C59E2106511C7238c1A3f78C4d8AF7a1`

### Creating a Market

**Standard Market:**
1. Click "Create Market" in navbar
2. Fill in market details:
   - Title (e.g., "Will Bitcoin reach $150k by 2025?")
   - Description
   - Select payment token (USDC, USDT, etc.)
   - Set closing date
3. Confirm transaction
4. Market appears on homepage

**Pyth Market (Auto-Resolving):**
1. Click "Create Market" in navbar
2. Select "Pyth Market" tab
3. Choose price feed (BTC, ETH, etc.)
4. Set threshold price
5. Select "Above" or "Below" threshold
6. Set expiry time (5 minutes to 6 months)
7. Confirm transaction
8. **Single wallet popup** for auto-configuration
9. Market auto-resolves when it expires ✅

### Trading Shares

**Buying Shares:**
1. Browse markets on homepage
2. Click "Buy Yes" or "Buy No"
3. Enter number of shares (e.g., 0.1)
4. First time: Approve unlimited token spending
5. Confirm buy transaction
6. See success modal with:
   - Outcome selected
   - Amount invested
   - Price per share
   - Total tokens received
7. Shares appear in Portfolio

**Selling Shares:**
1. Go to Portfolio page
2. Find your position
3. Click "Sell Shares"
4. Enter amount to sell
5. Confirm transaction
6. Receive payout instantly

### Market Resolution

**For Pyth Markets:**
- ✅ Automatic! Keeper bot resolves when market expires
- No action needed from creator
- Resolution happens within 60 seconds of expiry

**For Standard Markets:**
1. Go to Profile page
2. Find your market in "Created" tab
3. Click "Resolve Market"
4. Select winning outcome (Yes or No)
5. Confirm transaction
6. Market marked as "Resolved"

### Claiming Winnings

**For Winners:**
1. Go to Portfolio page
2. Find resolved market position
3. If you bet on winning outcome, see "Claim Winnings" button
4. Click to claim
5. Confirm transaction
6. Receive payout to wallet

## 🔐 Smart Contracts

### CTFPredictionMarket.sol

**Purpose**: Main contract for binary outcome prediction markets

**Key Functions:**
- `createMarket()` - Create new market with title, description, token, and closing time
- `mintPositionTokens()` - Buy outcome tokens (1 USDC = 1 YES + 1 NO token)
- `burnPositionTokens()` - Sell outcome tokens back to contract
- `resolveMarket()` - Declare winning outcome (only creator, owner, or authorized resolver)
- `redeemWinningTokens()` - Claim payouts from resolved markets
- `setAuthorizedResolver()` - Authorize external resolver contracts (owner only)

**Market Structure:**
```solidity
struct Market {
    string title;
    string description;
    address creator;
    address paymentToken;
    uint256 closingTime;
    bool resolved;
    uint256 resolutionTime;
    uint256 winningOutcomeId;
    uint256 outcomeCount;
}
```

**Features:**
- Binary outcomes (0 = Yes, 1 = No)
- Multi-token support (any ERC20)
- Proper decimal handling
- Reentrancy protection
- Access control for resolution

### PythResolver.sol

**Purpose**: Automated market resolution using Pyth price feeds

**Key Functions:**
- `configurePythMarket()` - Set up market for auto-resolution
  - Parameters: marketId, priceId, threshold (int64), expiryTime, isAbove
- `resolveMarket()` - Auto-resolve market using Pyth price data
  - Fetches latest price from Pyth
  - Validates price freshness (within 60 seconds)
  - Determines winner based on threshold
  - Calls CTFPredictionMarket.resolveMarket()
- `canResolve()` - Check if market is eligible for resolution
- `getCurrentPrice()` - Get current price for a market's feed

**Pyth Market Structure:**
```solidity
struct PythMarket {
    bytes32 priceId;      // Pyth price feed ID
    int64 threshold;      // Price threshold (scaled by 10^8)
    uint256 expiryTime;   // Market expiry timestamp
    bool isAbove;         // True = "above threshold", False = "below threshold"
    bool resolved;        // Resolution status
}
```

**Features:**
- Threshold-based resolution
- Price freshness validation (60-second window)
- Support for 100+ Pyth price feeds
- Automatic winner determination
- Proper int64 scaling for prices

### Integration Flow

```
User Creates Pyth Market
    ↓
Frontend calls createMarket() on CTFPredictionMarket
    ↓
Market created with [PYTH] tag
    ↓
Frontend calls configurePythMarket() on PythResolver
    ↓
Market configured with price feed and threshold
    ↓
Market expires
    ↓
Keeper bot detects expired market
    ↓
Keeper bot fetches fresh price from Hermes API
    ↓
Keeper bot calls resolveMarket() on PythResolver
    ↓
PythResolver validates price and resolves market
    ↓
Market marked as resolved on CTFPredictionMarket
    ↓
Winners can claim payouts
```

## 🤖 Keeper Bot Architecture

### How It Works

1. **Initialization**
   - Connects to Base Sepolia RPC
   - Creates wallet from private key
   - Initializes public and wallet clients

2. **Market Detection**
   - Fetches all markets from CTFPredictionMarket
   - Checks PythResolver for Pyth configuration
   - Identifies expired, unresolved markets

3. **Price Fetching**
   - Queries Hermes API for latest VAA (Verifiable Action Approval)
   - Converts base64 VAA to hex bytes
   - Validates price freshness

4. **Resolution**
   - Calls resolveMarket() on CTFPredictionMarket
   - Includes price update data
   - Handles transaction signing and submission

5. **Monitoring**
   - Logs all activities
   - Handles errors gracefully
   - Continues checking every 60 seconds

### Key Features

- **Parallel Processing**: Fetches market data in parallel
- **Batched Calls**: Groups contract calls in batches of 10
- **Error Handling**: Graceful error handling with detailed logging
- **Fresh Data**: Always fetches latest price from Hermes API
- **Continuous Operation**: Runs indefinitely in watch mode

### Running the Keeper Bot

```bash
# Production (continuous)
PRIVATE_KEY=0x... npm run keeper-bot

# Development (single check)
PRIVATE_KEY=0x... npm run keeper-bot -- --once

# With logging
PRIVATE_KEY=0x... npm run keeper-bot 2>&1 | tee keeper.log
```

## 🧪 Testing

### Test Flow - Standard Market

1. **Create Market**
   - Create test market with MockUSDC
   - Set closing date 24 hours from now

2. **Buy Shares**
   - Buy 0.2 shares on "Yes" outcome
   - Check Portfolio shows position

3. **Sell Shares**
   - Sell 0.1 shares
   - Verify payout received

4. **Resolve Market**
   - Go to Profile
   - Resolve market with "Yes" as winner

5. **Claim Winnings**
   - Go to Portfolio
   - Claim winnings from resolved market

### Test Flow - Pyth Market

1. **Create Pyth Market**
   - Select BTC price feed
   - Set threshold to $90,000
   - Select "Above" threshold
   - Set expiry to 5 minutes

2. **Approve Configuration**
   - Single wallet popup appears
   - Approve configuration transaction

3. **Wait for Expiry**
   - Wait 5 minutes for market to expire
   - Keeper bot should auto-resolve within 60 seconds

4. **Verify Resolution**
   - Check market status changed to "Resolved"
   - Check winning outcome matches price

5. **Claim Winnings**
   - If you bet correctly, claim your winnings

## 📁 Project Structure

```
betuaa/
├── app/                           # Next.js app directory
│   ├── page.tsx                  # Homepage (market list)
│   ├── portfolio/
│   │   └── page.tsx              # Portfolio page (positions, stats)
│   ├── profile/
│   │   ├── page.tsx              # User profile page
│   │   └── [address]/page.tsx    # User profile by address
│   ├── api/
│   │   ├── market/
│   │   │   └── [id]/route.ts     # Get market details
│   │   └── market-count/
│   │       └── route.ts          # Get total market count
│   └── providers.tsx             # Wagmi, RainbowKit setup
├── components/                    # React components
│   ├── Navbar.tsx                # Navigation with wallet
│   ├── CreateMarketModal.tsx     # Create market modal
│   ├── TradingModal.tsx          # Buy shares modal
│   ├── SellModal.tsx             # Sell shares modal
│   ├── ResolveMarketModal.tsx    # Resolve market modal
│   ├── CustomConnectButton.tsx   # Wallet dropdown
│   ├── UsernameModal.tsx         # Username setup
│   ├── BlockchainMarketModal.tsx # Market details
│   └── SkeletonLoader.tsx        # Loading skeletons
├── hooks/                         # Custom React hooks
│   ├── useCTFMarket.ts           # CTF contract interactions
│   ├── usePythResolver.ts        # Pyth resolver interactions
│   ├── useERC20.ts               # Token operations
│   ├── useUsername.ts            # Username management
│   ├── useUserPositions.ts       # Portfolio data (optimized)
│   ├── useMarkets.ts             # Market data fetching
│   └── useTranslation.ts         # i18n support
├── lib/                           # Utilities and config
│   ├── wagmi.ts                  # Wagmi configuration
│   ├── contracts.ts              # Contract addresses
│   ├── categoryUtils.ts          # Market category utilities
│   ├── graphql.ts                # GraphQL queries (future)
│   └── abis/
│       ├── CTFPredictionMarket.json
│       └── PythResolver.json
├── scripts/
│   └── keeper-bot.ts             # Keeper bot for auto-resolution
├── public/                        # Static assets
│   ├── USDC logo.png
│   ├── USDT Logo.png
│   └── cngn logo.png
└── README.md                      # This file
```

## � Key Integrations

### Pyth Network
- **Purpose**: Real-time price feeds for market resolution
- **Integration**: PythResolver contract + Keeper bot
- **API**: Hermes API for VAA data
- **Feeds**: 100+ cryptocurrency pairs
- **Update Fee**: ~0.01 ETH per resolution

### Wagmi & Viem
- **Purpose**: Web3 React hooks and blockchain interaction
- **Usage**: Contract reading, writing, event listening
- **Features**: Automatic wallet management, transaction handling

### RainbowKit
- **Purpose**: Beautiful wallet connection UI
- **Wallets**: MetaMask, Coinbase Wallet, WalletConnect, etc.
- **Features**: Multi-chain support, account management

### TanStack Query
- **Purpose**: Data fetching and caching
- **Usage**: Market data, user positions, real-time updates
- **Benefits**: Automatic refetching, caching, background updates

### TailwindCSS
- **Purpose**: Utility-first CSS styling
- **Features**: Dark mode, responsive design, custom components
- **Version**: v4 with JIT compilation

## 🐛 Known Issues & Solutions

### Issue: "Transfer amount exceeds allowance"
**Solution**: Use unlimited approval pattern (approve max uint256 once)

### Issue: Portfolio page loading slowly
**Solution**: Optimized with parallel API calls and batched contract calls (5-10x faster)

### Issue: Multiple wallet popups on Pyth market creation
**Solution**: Memoized `configurePythMarket` hook with `useCallback`

### Issue: Stat numbers overflowing boxes
**Solution**: Added `truncate` class and `toFixed(2)` formatting

### Issue: "Balance is of type unknown" TypeScript error
**Solution**: Added proper type annotations and casting in `useUserPositions`

## 📊 Performance Optimizations

### Frontend
- **Parallel Data Fetching**: All market data fetched simultaneously
- **Batched Contract Calls**: Groups calls in batches of 10
- **Memoization**: React hooks memoized to prevent unnecessary renders
- **Lazy Loading**: Components load on demand
- **Image Optimization**: Next.js Image component for assets

### Backend
- **Server-Side Rendering**: API routes for reliable data fetching
- **Caching**: TanStack Query for automatic caching
- **Error Handling**: Graceful error handling with fallbacks

### Keeper Bot
- **Parallel Processing**: Fetches all market data in parallel
- **Batched Calls**: Groups contract calls for efficiency
- **Error Recovery**: Continues operation on individual market failures

## 🚢 Deployment

### Frontend (Vercel)
```bash
npm run build
vercel deploy
```

### Smart Contracts (Base Sepolia)
```bash
cd ../contracts
forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_RPC_URL --broadcast --verify
```

Update contract addresses in `lib/contracts.ts`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Live Demo**: [https://betua-two.vercel.app/](https://betua-two.vercel.app/)
- **GitHub**: [https://github.com/0xMgwan/betuaa](https://github.com/0xMgwan/betuaa)
- **Base Sepolia Explorer**: [https://sepolia.basescan.org/](https://sepolia.basescan.org/)

## 👨‍💻 Developer

Built by David Machuche
- Portfolio: [https://chatafisha.co.tz/](https://chatafisha.co.tz/)
- GitHub: [@0xMgwan](https://github.com/0xMgwan)

## 🙏 Acknowledgments

- Base blockchain for fast, low-cost transactions
- RainbowKit for beautiful wallet UX
- Wagmi for Web3 React hooks
- OpenZeppelin for secure smart contract libraries

---

**Happy Predicting! 🎯**
