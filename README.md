# BetUAA - Decentralized Prediction Market Platform

A fully decentralized prediction market platform built on Base blockchain, allowing users to create markets, trade shares, and earn from accurate predictions.

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange)
![Base](https://img.shields.io/badge/Base-Sepolia-blue)

## 🌟 Features

### Core Functionality
- **Create Markets** - Anyone can create prediction markets on any topic
- **Buy/Sell Shares** - Trade outcome shares with dynamic pricing
- **Market Resolution** - Creators resolve markets by declaring winning outcomes
- **Claim Winnings** - Winners claim payouts from resolved markets
- **Portfolio Tracking** - Real-time P&L tracking and position management

### User Experience
- **Username System** - Set custom username on first wallet connection
- **RainbowKit Integration** - Beautiful multi-wallet support (MetaMask, Coinbase, etc.)
- **Dark Mode** - Full dark/light theme support
- **Responsive Design** - Mobile-first, works on all devices
- **Real-time Updates** - Live market data and price updates

### Technical Features
- **Multi-Token Support** - USDC, USDT, cNGN, and other stablecoins
- **Decimal Handling** - Proper handling of 6-decimal (USDC) and 18-decimal tokens
- **Unlimited Approval** - One-time approval for seamless trading
- **Gas Optimized** - Efficient smart contracts with minimal gas costs
- **i18n Support** - Complete internationalization with English & Swahili

## 🏗️ Architecture

### Frontend Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **Web3**: Wagmi v2, Viem, RainbowKit
- **State Management**: React Hooks, TanStack Query
- **Icons**: Lucide React

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Foundry
- **Network**: Base Sepolia (Testnet)
- **Standards**: ERC20, ReentrancyGuard, Ownable

### Contract Addresses (Base Sepolia)
```
PredictionMarket: 0x724653Ffb86044FF0688FABF8e532AC1A77702ab
MockUSDC: 0xeF40866aEEADefe8f9ee2a1CE3dA80C52bA52D61
```

## 🚀 Getting Started

### Prerequisites
```bash
Node.js 18+ 
npm or yarn
MetaMask or compatible Web3 wallet
Base Sepolia ETH (for gas)
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

## 📖 User Guide

### First Time Setup

1. **Connect Wallet**
   - Click "Connect Wallet" in navbar
   - Select your wallet (MetaMask recommended)
   - Approve connection

2. **Set Username**
   - Modal appears on first connection
   - Choose username (3-20 characters, alphanumeric + underscore)
   - Username is permanent and stored locally

3. **Choose Language**
   - Click wallet address dropdown
   - Scroll to "Language" section
   - Select English or Swahili
   - Preference persists across sessions

4. **Get Test Tokens**
   - Get Base Sepolia ETH from [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
   - Get MockUSDC from contract: `0xeF40866aEEADefe8f9ee2a1CE3dA80C52bA52D61`

### Creating a Market

1. Click "Create Market" in navbar
2. Fill in market details:
   - Title (e.g., "Will Bitcoin reach $150k by 2025?")
   - Description
   - Select payment token (USDC, USDT, etc.)
   - Set closing date
3. Confirm transaction
4. Market appears on homepage

### Trading Shares

**Buying Shares:**
1. Browse markets on homepage
2. Click "Buy Yes" or "Buy No"
3. Enter number of shares (e.g., 0.1)
4. First time: Approve unlimited token spending
5. Confirm buy transaction
6. Shares appear in Portfolio

**Selling Shares:**
1. Go to Portfolio page
2. Find your position
3. Click "Sell Shares"
4. Enter amount to sell
5. Confirm transaction
6. Receive payout instantly

### Market Resolution

**For Market Creators:**
1. Go to Profile page
2. Find your market
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

## 🧪 Testing

### Test Flow

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

## 📁 Project Structure

```
betuaa/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Homepage (market list)
│   ├── portfolio/         # Portfolio page
│   ├── profile/           # User profile page
│   └── api/               # API routes
├── components/            # React components
│   ├── Navbar.tsx        # Navigation with wallet
│   ├── TradingModal.tsx  # Buy shares modal
│   ├── SellModal.tsx     # Sell shares modal
│   ├── CustomConnectButton.tsx  # Wallet dropdown
│   └── UsernameModal.tsx # Username setup
├── hooks/                # Custom React hooks
│   ├── usePredictionMarket.ts  # Contract interactions
│   ├── useERC20.ts       # Token operations
│   ├── useUsername.ts    # Username management
│   └── useUserPositions.ts  # Portfolio data
├── lib/                  # Utilities and config
│   ├── wagmi.ts         # Wagmi configuration
│   ├── contracts.ts     # Contract addresses
│   └── abis/            # Contract ABIs
└── public/              # Static assets
```

## 🔧 Smart Contract Details

### PredictionMarket.sol

**Key Functions:**
- `createMarket()` - Create new prediction market
- `buyShares()` - Purchase outcome shares
- `sellShares()` - Sell owned shares
- `resolveMarket()` - Declare winning outcome
- `claimWinnings()` - Claim payouts from resolved markets
- `calculatePrice()` - Dynamic price calculation based on share distribution

**Features:**
- Automated market maker (AMM) pricing
- Multi-token support (any ERC20)
- Creator and platform fees (0.5% each)
- Reentrancy protection
- Proper decimal handling for all token types

## 🐛 Known Issues & Solutions

### Issue: "Transfer amount exceeds allowance"
**Solution**: Fixed with unlimited approval pattern (approve max uint256 once)

### Issue: Username modal keeps appearing
**Solution**: Added `hasChecked` state to show modal only once per session

### Issue: Portfolio not showing positions
**Solution**: Fixed API to use `getUserPosition()` instead of direct mapping access

### Issue: Cost calculation mismatch
**Solution**: Contract now properly converts between 18-decimal shares and token decimals

## 🚢 Deployment

### Frontend (Vercel)
```bash
npm run build
vercel deploy
```

### Smart Contracts (Base Mainnet)
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
