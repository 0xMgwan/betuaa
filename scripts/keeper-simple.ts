/**
 * Simple Pyth Keeper Bot
 * Automatically resolves expired Pyth-based markets
 * 
 * Usage:
 * KEEPER_PRIVATE_KEY=0x... PYTH_RESOLVER_ADDRESS=0x... npm run keeper
 */

import { getPriceUpdateData } from '../lib/pyth';

// Configuration from environment
const PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY;
const PYTH_RESOLVER_ADDRESS = process.env.PYTH_RESOLVER_ADDRESS;
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
const CHECK_INTERVAL = 60000; // 60 seconds

if (!PRIVATE_KEY) {
  console.error('❌ KEEPER_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

if (!PYTH_RESOLVER_ADDRESS) {
  console.error('❌ PYTH_RESOLVER_ADDRESS environment variable is required');
  process.exit(1);
}

interface ExpiredMarket {
  id: string;
  priceId: string;
  closingTime: string;
}

/**
 * Fetch expired unresolved Pyth markets from subgraph
 */
async function fetchExpiredMarkets(): Promise<ExpiredMarket[]> {
  try {
    const query = `
      query {
        markets(
          where: { 
            resolved: false,
            closingTime_lt: "${Math.floor(Date.now() / 1000)}"
          }
          orderBy: closingTime
          orderDirection: asc
          first: 10
        ) {
          id
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
    return data?.markets || [];
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}

/**
 * Resolve a single market
 */
async function resolveMarket(marketId: string, priceId: string): Promise<boolean> {
  try {
    console.log(`\n🎯 Resolving Market ${marketId}...`);
    console.log(`   Price Feed: ${priceId}`);

    // Get price update data from Hermes
    const priceUpdateData = await getPriceUpdateData([priceId]);
    
    if (!priceUpdateData || priceUpdateData.length === 0) {
      console.error('   ❌ No price update data available');
      return false;
    }

    console.log('   ✅ Price update data fetched');
    console.log('   📝 Call resolveMarket() on PythResolver with this data');
    console.log(`   📊 Market ID: ${marketId}`);
    console.log(`   📦 Update Data Length: ${priceUpdateData.length}`);
    
    // TODO: Implement actual contract call using viem or web3
    // For now, just log the data needed
    
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error resolving market ${marketId}:`, error.message);
    return false;
  }
}

/**
 * Main keeper loop
 */
async function runKeeper() {
  console.log('🤖 Pyth Keeper Bot Starting...\n');
  console.log(`📍 PythResolver: ${PYTH_RESOLVER_ADDRESS}`);
  console.log(`🔗 Subgraph: ${SUBGRAPH_URL}`);
  console.log(`⏰ Check Interval: ${CHECK_INTERVAL / 1000}s\n`);

  let isRunning = true;

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down keeper...');
    isRunning = false;
  });

  while (isRunning) {
    try {
      console.log(`⏰ ${new Date().toLocaleString()} - Checking for expired markets...`);

      const markets = await fetchExpiredMarkets();

      if (markets.length === 0) {
        console.log('   ℹ️  No expired markets to resolve');
      } else {
        console.log(`   📊 Found ${markets.length} expired market(s)`);

        for (const market of markets) {
          // Check if it's a Pyth market by trying to get its config
          // In production, you'd query the PythResolver contract
          // For now, we'll assume markets with certain IDs are Pyth markets
          
          // Mock priceId - in production, fetch from contract
          const mockPriceId = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';
          
          await resolveMarket(market.id, mockPriceId);
          
          // Wait between resolutions
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Wait before next check
      console.log(`\n💤 Waiting ${CHECK_INTERVAL / 1000}s before next check...\n`);
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    } catch (error) {
      console.error('❌ Error in keeper loop:', error);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  console.log('👋 Keeper stopped');
  process.exit(0);
}

// Start keeper
runKeeper().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
