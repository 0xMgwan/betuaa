/**
 * Create a test Pyth market for testing automated resolution
 * 
 * This script creates a simple ETH price prediction market that expires in 5 minutes
 * for quick testing of the Pyth integration
 */

import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { CONTRACTS } from '../lib/contracts';
import { PYTH_PRICE_FEEDS, toPythPrice } from '../lib/pyth';

// Configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`;

if (!PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY environment variable required');
  process.exit(1);
}

// Contract ABIs (minimal)
const CTF_ABI = [
  {
    inputs: [
      { name: '_question', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_outcomeCount', type: 'uint256' },
      { name: '_closingTime', type: 'uint256' },
      { name: '_collateralToken', type: 'address' }
    ],
    name: 'createMarket',
    outputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'conditionId', type: 'bytes32' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'marketCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

const PYTH_RESOLVER_ABI = [
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'priceId', type: 'bytes32' },
      { name: 'threshold', type: 'int64' },
      { name: 'expiryTime', type: 'uint256' },
      { name: 'isAbove', type: 'bool' }
    ],
    name: 'configurePythMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

async function main() {
  console.log('🚀 Creating Test Pyth Market\n');

  // Setup clients
  const account = privateKeyToAccount(PRIVATE_KEY);
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http('https://sepolia.base.org')
  });
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http('https://sepolia.base.org')
  });

  console.log(`👛 Wallet: ${account.address}\n`);

  // Market parameters
  const ethPriceFeed = PYTH_PRICE_FEEDS['ETH/USD'];
  const currentPrice = 3500; // Approximate current ETH price
  const threshold = currentPrice; // Will ETH be above current price?
  const expiryTime = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
  
  const question = `Will ETH be above $${threshold} in 5 minutes?`;
  const description = `Test market using Pyth oracle for ETH/USD price feed. Market expires in 5 minutes and will resolve automatically based on Pyth price data.`;

  console.log('📊 Market Details:');
  console.log(`   Question: ${question}`);
  console.log(`   Price Feed: ${ethPriceFeed.name} (${ethPriceFeed.symbol})`);
  console.log(`   Threshold: $${threshold}`);
  console.log(`   Expires: ${new Date(expiryTime * 1000).toLocaleString()}`);
  console.log(`   Auto-resolves: Yes (via Pyth)\n`);

  // Step 1: Create market in CTF contract
  console.log('📝 Step 1: Creating market in CTF contract...');
  
  const { request: createRequest } = await publicClient.simulateContract({
    address: CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
    abi: CTF_ABI,
    functionName: 'createMarket',
    args: [
      question,
      description,
      BigInt(2), // 2 outcomes (Yes/No)
      BigInt(expiryTime),
      USDC_ADDRESS
    ],
    account
  });

  const createHash = await walletClient.writeContract(createRequest);
  console.log(`   Transaction: ${createHash}`);
  console.log('   ⏳ Waiting for confirmation...');
  
  const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
  console.log(`   ✅ Market created! Block: ${createReceipt.blockNumber}\n`);

  // Get market ID
  const marketCount = await publicClient.readContract({
    address: CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
    abi: CTF_ABI,
    functionName: 'marketCount'
  });
  
  const marketId = marketCount;
  console.log(`   Market ID: ${marketId}\n`);

  // Step 2: Configure Pyth resolution
  console.log('🔮 Step 2: Configuring Pyth resolution...');
  
  const pythThreshold = toPythPrice(threshold);
  
  const { request: configRequest } = await publicClient.simulateContract({
    address: CONTRACTS.baseSepolia.pythResolver as `0x${string}`,
    abi: PYTH_RESOLVER_ABI,
    functionName: 'configurePythMarket',
    args: [
      marketId,
      ethPriceFeed.id as `0x${string}`,
      pythThreshold,
      BigInt(expiryTime),
      true // "Above" wins if price >= threshold
    ],
    account
  });

  const configHash = await walletClient.writeContract(configRequest);
  console.log(`   Transaction: ${configHash}`);
  console.log('   ⏳ Waiting for confirmation...');
  
  const configReceipt = await publicClient.waitForTransactionReceipt({ hash: configHash });
  console.log(`   ✅ Pyth resolution configured! Block: ${configReceipt.blockNumber}\n`);

  // Summary
  console.log('✅ Test Market Created Successfully!\n');
  console.log('📋 Summary:');
  console.log(`   Market ID: ${marketId}`);
  console.log(`   Question: ${question}`);
  console.log(`   Threshold: $${threshold}`);
  console.log(`   Expires in: 5 minutes`);
  console.log(`   View on BaseScan: https://sepolia.basescan.org/address/${CONTRACTS.baseSepolia.ctfPredictionMarket}\n`);
  
  console.log('🧪 Next Steps:');
  console.log('   1. View market on your platform');
  console.log('   2. Wait 5 minutes for expiry');
  console.log('   3. Call resolveMarket() on PythResolver');
  console.log('   4. Verify automatic resolution worked\n');
  
  console.log('💡 Manual Resolution Command:');
  console.log(`   npm run resolve-market ${marketId}\n`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
