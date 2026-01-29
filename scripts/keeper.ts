/**
 * Pyth Keeper Bot
 * Automatically resolves expired Pyth-based markets
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, base } from 'viem/chains';
import { getPriceUpdateData } from '../lib/pyth';

// Configuration
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY as `0x${string}`;
const PYTH_RESOLVER_ADDRESS = process.env.PYTH_RESOLVER_ADDRESS as `0x${string}`;
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
const CHAIN = process.env.CHAIN === 'mainnet' ? base : baseSepolia;

if (!PRIVATE_KEY) {
  throw new Error('KEEPER_PRIVATE_KEY environment variable is required');
}

if (!PYTH_RESOLVER_ADDRESS) {
  throw new Error('PYTH_RESOLVER_ADDRESS environment variable is required');
}

// PythResolver ABI (minimal)
const PYTH_RESOLVER_ABI = [
  'function canResolve(uint256 marketId) external view returns (bool)',
  'function resolveMarket(uint256 marketId, bytes[] calldata priceUpdateData) external payable',
  'function pythMarkets(uint256 marketId) external view returns (bytes32 priceId, int64 threshold, uint256 expiryTime, bool isAbove, bool resolved)',
  'function pyth() external view returns (address)',
];

const PYTH_ABI = [
  'function getUpdateFee(bytes[] calldata updateData) external view returns (uint256)',
];

interface PythMarket {
  id: number;
  priceId: string;
  threshold: bigint;
  expiryTime: number;
  isAbove: boolean;
  resolved: boolean;
}

class KeeperBot {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private pythResolver: ethers.Contract;
  private pyth: ethers.Contract | null = null;
  private isRunning = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.wallet = new ethers.Wallet(PRIVATE_KEY!, this.provider);
    this.pythResolver = new ethers.Contract(
      PYTH_RESOLVER_ADDRESS!,
      PYTH_RESOLVER_ABI,
      this.wallet
    );
  }

  async initialize() {
    console.log('🤖 Initializing Keeper Bot...');
    console.log(`📍 Network: ${RPC_URL}`);
    console.log(`👛 Keeper Address: ${this.wallet.address}`);
    console.log(`📝 PythResolver: ${PYTH_RESOLVER_ADDRESS}`);

    // Get Pyth contract address
    const pythAddress = await this.pythResolver.pyth();
    this.pyth = new ethers.Contract(pythAddress, PYTH_ABI, this.wallet);
    console.log(`🔮 Pyth Contract: ${pythAddress}`);

    // Check balance
    const balance = await this.provider.getBalance(this.wallet.address);
    console.log(`💰 Keeper Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance < ethers.parseEther('0.01')) {
      console.warn('⚠️  Low balance! Please fund keeper wallet.');
    }

    console.log('✅ Keeper Bot initialized\n');
  }

  async fetchExpiredMarkets(): Promise<PythMarket[]> {
    try {
      // Query subgraph for Pyth markets
      const query = `
        query {
          markets(
            where: { resolved: false }
            orderBy: closingTime
            orderDirection: asc
          ) {
            id
            resolved
            closingTime
          }
        }
      `;

      const response = await fetch(SUBGRAPH_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const { data } = await response.json();
      const markets: PythMarket[] = [];

      // Check each market to see if it's a Pyth market and can be resolved
      for (const market of data.markets) {
        try {
          const canResolve = await this.pythResolver.canResolve(market.id);
          
          if (canResolve) {
            const pythMarket = await this.pythResolver.pythMarkets(market.id);
            
            markets.push({
              id: Number(market.id),
              priceId: pythMarket.priceId,
              threshold: pythMarket.threshold,
              expiryTime: Number(pythMarket.expiryTime),
              isAbove: pythMarket.isAbove,
              resolved: pythMarket.resolved,
            });
          }
        } catch (error) {
          // Not a Pyth market, skip
          continue;
        }
      }

      return markets;
    } catch (error) {
      console.error('Error fetching markets:', error);
      return [];
    }
  }

  async resolveMarket(market: PythMarket): Promise<boolean> {
    try {
      console.log(`\n🎯 Resolving Market ${market.id}...`);
      console.log(`   Price Feed: ${market.priceId}`);
      console.log(`   Threshold: ${market.threshold}`);
      console.log(`   Expiry: ${new Date(market.expiryTime * 1000).toLocaleString()}`);

      // Get price update data from Hermes
      const priceUpdateData = await getPriceUpdateData([market.priceId]);
      
      if (!priceUpdateData || priceUpdateData.length === 0) {
        console.error('   ❌ No price update data available');
        return false;
      }

      // Calculate update fee
      const updateFee = await this.pyth!.getUpdateFee(priceUpdateData);
      console.log(`   💸 Update Fee: ${ethers.formatEther(updateFee)} ETH`);

      // Estimate gas
      const gasEstimate = await this.pythResolver.resolveMarket.estimateGas(
        market.id,
        priceUpdateData,
        { value: updateFee }
      );

      console.log(`   ⛽ Estimated Gas: ${gasEstimate.toString()}`);

      // Send resolution transaction
      const tx = await this.pythResolver.resolveMarket(
        market.id,
        priceUpdateData,
        {
          value: updateFee,
          gasLimit: gasEstimate * 120n / 100n, // 20% buffer
        }
      );

      console.log(`   📤 Transaction sent: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log(`   ✅ Market ${market.id} resolved successfully!`);
        console.log(`   🔗 Transaction: ${tx.hash}`);
        return true;
      } else {
        console.error(`   ❌ Transaction failed`);
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
        console.log(`⏰ ${new Date().toLocaleString()} - Checking for expired markets...`);

        // Fetch expired unresolved markets
        const markets = await this.fetchExpiredMarkets();

        if (markets.length === 0) {
          console.log('   ℹ️  No markets to resolve');
        } else {
          console.log(`   📊 Found ${markets.length} market(s) to resolve`);

          // Resolve each market
          for (const market of markets) {
            await this.resolveMarket(market);
            
            // Wait a bit between resolutions to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        // Wait before next check (60 seconds)
        console.log('\n💤 Waiting 60 seconds before next check...\n');
        await new Promise(resolve => setTimeout(resolve, 60000));
      } catch (error) {
        console.error('❌ Error in keeper loop:', error);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
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
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    keeper.stop();
    process.exit(0);
  });
  
  // Start keeper
  await keeper.run();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default KeeperBot;
