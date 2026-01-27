# BetUAA Documentation

This directory contains all project documentation and guides.

## Contents

- **TRANSLATION_STATUS.md** - Translation progress and status for internationalization

## Project Structure

```
betuaa/
├── app/                    # Next.js app directory (pages, API routes)
├── components/             # React components
├── contracts/              # Smart contracts (Solidity)
├── contexts/               # React context providers
├── docs/                   # Documentation (this folder)
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries and helpers
├── locales/                # Translation files
├── public/                 # Static assets
├── scripts/                # Build and deployment scripts
├── .config/                # Additional configuration files
├── components.json         # shadcn/ui configuration
├── eslint.config.mjs       # ESLint configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # Main project README
```

## Key Directories

### `/app`
Next.js 13+ app directory containing:
- Pages and routes
- API endpoints
- Server components
- Layouts

### `/components`
Reusable React components:
- UI components (buttons, cards, modals)
- Feature components (trading, markets)
- Layout components (navbar, footer)

### `/contracts`
Smart contracts for prediction markets:
- **CTFPredictionMarket.sol** - Recommended CTF-based contract
- **PredictionMarket.sol** - Legacy contract
- Deployment scripts and documentation

### `/hooks`
Custom React hooks:
- Market data fetching
- Wallet integration
- Real-time updates
- Polymarket integration

### `/lib`
Utility libraries:
- Market data processing
- API clients
- Helper functions
- Contract ABIs

### `/locales`
Internationalization files:
- English (en)
- Swahili (sw)
- Additional languages

## Configuration Files

All configuration files are kept in the root directory as required by their respective tools:

- **next.config.ts** - Next.js configuration
- **tsconfig.json** - TypeScript compiler options
- **eslint.config.mjs** - Code linting rules
- **postcss.config.mjs** - CSS processing
- **components.json** - shadcn/ui component configuration
- **package.json** - Project dependencies and scripts

## Getting Started

See the main [README.md](../README.md) in the root directory for setup and development instructions.
