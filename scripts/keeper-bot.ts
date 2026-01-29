/// <reference types="node" />

/**
 * Pyth Keeper Bot - Production Ready
 * Automatically resolves expired Pyth markets using current price data
 * 
 * Usage (runs continuously by default):
 * PRIVATE_KEY=0x... npm run keeper-bot
 * 
 * Or run a single check and exit:
 * PRIVATE_KEY=0x... npm run keeper-bot -- --once
 * 
 * The keeper bot checks for resolvable markets every 60 seconds and resolves them automatically.
 * Markets are auto-resolved based on Pyth price feeds when they expire.
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, base } from 'viem/chains';

// Configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const CHAIN = process.env.CHAIN === 'mainnet' ? 'mainnet' : 'sepolia';
const RPC_URL = CHAIN === 'mainnet' 
  ? 'https://mainnet.base.org'
  : 'https://sepolia.base.org';
const PYTH_RESOLVER = '0xc3c8523FaC61b6E35DC553BB5a1F542982753F62' as `0x${string}`;
const CTF_ADDRESS = '0xA5Bf04D3D079BE92981EE8208b18B0514eBd370C' as `0x${string}`;
const HERMES_API = 'https://hermes.pyth.network';
const CHECK_INTERVAL = 60000; // 60 seconds
// Watch mode is ON by default - keeper bot runs continuously
// Use --once to run a single check and exit
const WATCH_MODE = !process.argv.includes('--once');

// Contract ABIs
const CTF_ABI = [
  {
    inputs: [{ name: 'marketId', type: 'uint256' }, { name: 'winningOutcome', type: 'uint256' }],
    name: 'resolveMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'marketCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const PYTH_RESOLVER_ABI = [
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'canResolve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'pythMarkets',
    outputs: [
      { name: 'priceId', type: 'bytes32' },
      { name: 'threshold', type: 'int64' },
      { name: 'expiryTime', type: 'uint256' },
      { name: 'isAbove', type: 'bool' },
      { name: 'resolved', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'priceUpdateData', type: 'bytes[]' },
    ],
    name: 'resolveMarket',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

interface PythMarket {
  id: number;
  priceId: `0x${string}`;
  threshold: bigint;
  expiryTime: number;
  isAbove: boolean;
  resolved: boolean;
}

class KeeperBot {
  private publicClient;
  private walletClient;
  private account;
  private isRunning = false;

  constructor() {
    if (!PRIVATE_KEY) {
      throw new Error('❌ PRIVATE_KEY environment variable required');
    }

    this.account = privateKeyToAccount(PRIVATE_KEY);
    this.publicClient = createPublicClient({
      chain: CHAIN === 'mainnet' ? base : baseSepolia,
      transport: http(RPC_URL),
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: CHAIN === 'mainnet' ? base : baseSepolia,
      transport: http(RPC_URL),
    });
  }

  async initialize() {
    console.log('\n🤖 Pyth Keeper Bot Initializing...\n');
    console.log(`📍 Network: ${CHAIN === 'mainnet' ? 'Base Mainnet' : 'Base Sepolia'}`);
    console.log(`👛 Keeper Address: ${this.account.address}`);
    console.log(`📝 PythResolver: ${PYTH_RESOLVER}`);
    console.log(`⏱️  Check Interval: ${CHECK_INTERVAL / 1000}s`);
    console.log(`🔄 Watch Mode: ${WATCH_MODE ? 'ON' : 'OFF'}\n`);

    // Check balance
    const balance = await this.publicClient.getBalance({
      address: this.account.address,
    });
    console.log(`💰 Keeper Balance: ${formatEther(balance)} ETH\n`);

    if (balance < parseEther('0.01')) {
      console.warn('⚠️  Low balance! Keeper may fail to resolve markets.\n');
    }
  }

  async fetchResolvableMarkets(): Promise<PythMarket[]> {
    try {
      // Get total market count
      const marketCount = await this.publicClient.readContract({
        address: CTF_ADDRESS,
        abi: CTF_ABI,
        functionName: 'marketCount',
      });

      const markets: PythMarket[] = [];
      const count = Number(marketCount);

      // Check each market
      for (let i = 1; i <= count; i++) {
        try {
          const canResolve = await this.publicClient.readContract({
            address: PYTH_RESOLVER,
            abi: PYTH_RESOLVER_ABI,
            functionName: 'canResolve',
            args: [BigInt(i)],
          });

          if (canResolve) {
            const marketData = await this.publicClient.readContract({
              address: PYTH_RESOLVER,
              abi: PYTH_RESOLVER_ABI,
              functionName: 'pythMarkets',
              args: [BigInt(i)],
            });

            markets.push({
              id: i,
              priceId: marketData[0],
              threshold: marketData[1],
              expiryTime: Number(marketData[2]),
              isAbove: marketData[3],
              resolved: marketData[4],
            });
          }
        } catch (error) {
          // Market not configured or error reading - skip
          continue;
        }
      }

      return markets;
    } catch (error) {
      console.error('❌ Error fetching markets:', error);
      return [];
    }
  }

  async getPythPrice(priceId: string): Promise<{ price: number; expo: number } | null> {
    try {
      const response = await fetch(
        `${HERMES_API}/api/latest_price_feeds?ids[]=${priceId}`
      );
      const data = (await response.json()) as any[];

      if (!data || data.length === 0) {
        return null;
      }

      const priceData = data[0];
      return {
        price: parseInt(priceData.price.price),
        expo: parseInt(priceData.price.expo),
      };
    } catch (error) {
      console.error(`❌ Error fetching price for ${priceId}:`, error);
      return null;
    }
  }

  async getPriceUpdateData(priceId: string): Promise<`0x${string}`[] | null> {
    try {
      const response = await fetch(
        `${HERMES_API}/api/latest_vaas?ids[]=${priceId}`
      );
      const data = (await response.json()) as string[];
      
      if (!data || data.length === 0) {
        return null;
      }
      
      // Convert base64 VAA data to hex bytes
      const hexData = data.map(vaa => {
        // VAA is already in base64, convert to hex
        const buffer = Buffer.from(vaa, 'base64');
        return `0x${buffer.toString('hex')}` as `0x${string}`;
      });
      
      return hexData;
    } catch (error) {
      console.error(`❌ Error fetching update data for ${priceId}:`, error);
      return null;
    }
  }

  async resolveMarket(market: PythMarket): Promise<boolean> {
    try {
      console.log(`\n🎯 Resolving Market ${market.id}...`);

      // Get current price
      const priceData = await this.getPythPrice(market.priceId);
      if (!priceData) {
        console.log(`   ❌ Could not fetch price`);
        return false;
      }

      const currentPrice = priceData.price * Math.pow(10, priceData.expo);
      const thresholdPrice = Number(market.threshold) / 1e8;

      console.log(`   💹 Current Price: $${currentPrice.toFixed(2)}`);
      console.log(`   📊 Threshold: $${thresholdPrice.toFixed(2)}`);

      // Determine outcome
      let outcome: number;
      if (market.isAbove) {
        outcome = currentPrice >= thresholdPrice ? 0 : 1;
        console.log(`   🎲 Outcome: ${outcome === 0 ? 'YES (Above)' : 'NO (Below)'}`);
      } else {
        outcome = currentPrice < thresholdPrice ? 0 : 1;
        console.log(`   🎲 Outcome: ${outcome === 0 ? 'YES (Below)' : 'NO (Above)'}`);
      }

      // Get price update data
      const updateData = await this.getPriceUpdateData(market.priceId);
      if (!updateData) {
        console.log(`   ❌ Could not fetch update data`);
        return false;
      }

      console.log(`   📦 Update Data: ${updateData.length} item(s)`);

      // Send resolution transaction directly to CTF contract
      // The keeper wallet is the owner, so it's authorized to resolve
      console.log(`   📤 Sending resolution transaction...`);
      
      const hash = await this.walletClient.writeContract({
        address: CTF_ADDRESS,
        abi: CTF_ABI,
        functionName: 'resolveMarket',
        args: [BigInt(market.id), BigInt(outcome)],
      });

      console.log(`   ✅ Transaction sent: ${hash}`);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60000,
      });

      if (receipt.status === 'success') {
        console.log(`   ✅ Market ${market.id} resolved successfully!`);
        return true;
      } else {
        console.log(`   ❌ Transaction failed`);
        return false;
      }
    } catch (error: any) {
      console.error(`   ❌ Error resolving market ${market.id}:`, error.message);
      return false;
    }
  }

  async run() {
    if (this.isRunning) {
      console.log('⚠️  Keeper is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Keeper Bot started\n');

    while (this.isRunning) {
      try {
        console.log(`⏰ ${new Date().toLocaleString()} - Checking for resolvable markets...`);

        const markets = await this.fetchResolvableMarkets();

        if (markets.length === 0) {
          console.log('   ℹ️  No markets to resolve');
        } else {
          console.log(`   📊 Found ${markets.length} market(s) to resolve`);

          for (const market of markets) {
            await this.resolveMarket(market);
            // Wait between resolutions
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        if (!WATCH_MODE) {
          console.log('\n✅ Single check complete. Exiting.');
          break;
        }

        console.log(`\n💤 Waiting ${CHECK_INTERVAL / 1000}s before next check...\n`);
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
      } catch (error) {
        console.error('❌ Error in keeper loop:', error);
        if (!WATCH_MODE) break;
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    console.log('\n👋 Keeper stopped');
    process.exit(0);
  }

  stop() {
    console.log('\n🛑 Stopping Keeper Bot...');
    this.isRunning = false;
  }
}

// Main execution
async function main() {
  const keeper = new KeeperBot();

  await keeper.initialize();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    keeper.stop();
  });

  process.on('SIGTERM', () => {
    keeper.stop();
  });

  await keeper.run();
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
