import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, fallback } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACTS, RPC } from '@/lib/contracts';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarketV2.json';
import { fetchMarketData } from '@/lib/graphql';

// MarketStatus enum from CTFPredictionMarketV2.sol
const MarketStatus = { Active: 0, Resolved: 1, Canceled: 2 } as const;
const MarketStatusLabel = ['Active', 'Resolved', 'Canceled'] as const;

// CTFPredictionMarketV2 fee defaults (basis points)
const PLATFORM_FEE_BPS = 50;   // 0.5%
const CREATOR_FEE_BPS  = 100;  // 1.0%

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: fallback([
    http(RPC.baseSepolia.primary, { retryCount: 3, retryDelay: 1000 }),
    http(RPC.baseSepolia.fallback, { retryCount: 2, retryDelay: 1000 }),
  ]),
});

// Simple in-memory cache with 5 second TTL (shorter for faster updates)
const marketCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const marketId = parseInt(id);

  try {
    if (isNaN(marketId) || marketId < 1) {
      return NextResponse.json({ error: 'Invalid market ID' }, { status: 400 });
    }

    console.log(`Fetching market ${marketId} from CTF contract and The Graph...`);

    // Check cache first
    const cacheKey = `market-${marketId}`;
    const cached = marketCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Market ${marketId} - returning cached data`);
      return NextResponse.json(cached.data);
    }

    // Try to fetch from The Graph first for real data
    let subgraphData = null;
    try {
      subgraphData = await fetchMarketData(marketId.toString());
    } catch (error) {
      console.error(`Market ${marketId} - subgraph fetch failed:`, error);
    }
    
    // Fetch market data from CTF contract as fallback
    const market = await publicClient.readContract({
      address: CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
      abi: CTFPredictionMarketABI,
      functionName: 'getMarket',
      args: [BigInt(marketId)],
    }) as any;

    console.log(`Market ${marketId} raw data:`, market);
    console.log(`Market ${marketId} subgraph data:`, subgraphData);

    // Market struct has named fields: id, question, description, creator, collateralToken, createdAt, closingTime, resolutionTime, conditionId, outcomeCount, winningOutcome, resolved, paused
    // If market doesn't exist, question will be empty string
    if (!market.question || market.question === '') {
      console.log(`Market ${marketId} not found (empty question)`);
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    // Calculate volume from blockchain events as primary source
    let totalVolume = BigInt(0);
    let participantCount = 0;
    
    try {
      // Query TransferSingle events to calculate real volume
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - BigInt(40000); // Last 40k blocks (within RPC limit)
      
      const logs = await publicClient.getLogs({
        address: CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
        event: {
          type: 'event',
          name: 'TransferSingle',
          inputs: [
            { type: 'address', indexed: true, name: 'operator' },
            { type: 'address', indexed: true, name: 'from' },
            { type: 'address', indexed: true, name: 'to' },
            { type: 'uint256', indexed: false, name: 'id' },
            { type: 'uint256', indexed: false, name: 'value' }
          ]
        },
        fromBlock,
        toBlock: 'latest',
      });

      // Get outcome token IDs for this market
      const outcomeTokenIds: bigint[] = [];
      for (let i = 0; i < Number(market.outcomeCount); i++) {
        const tokenId = await publicClient.readContract({
          address: CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
          abi: CTFPredictionMarketABI,
          functionName: 'outcomeTokens',
          args: [BigInt(marketId), BigInt(i)],
        }) as bigint;
        outcomeTokenIds.push(tokenId);
      }

      // Filter logs for this market's tokens and calculate volume
      const uniqueTraders = new Set<string>();
      
      for (const log of logs) {
        const { from, to, id, value } = log.args as any;
        
        // Check if this is a mint for this market's tokens
        if (from === '0x0000000000000000000000000000000000000000' && 
            outcomeTokenIds.some(tokenId => tokenId === id)) {
          totalVolume = totalVolume + (value || BigInt(0));
          if (to) uniqueTraders.add(to.toLowerCase());
        }
      }
      
      participantCount = uniqueTraders.size;
      console.log(`Market ${marketId} calculated from blockchain - volume: ${totalVolume.toString()}, participants: ${participantCount}`);
      
    } catch (error) {
      console.error(`Market ${marketId} - failed to calculate volume from blockchain:`, error);
      
      // Fallback to subgraph if available
      if (subgraphData) {
        totalVolume = BigInt(subgraphData.totalVolume || 0);
        participantCount = subgraphData.participantCount || 0;
        console.log(`Market ${marketId} using subgraph fallback - volume: ${totalVolume.toString()}, participants: ${participantCount}`);
      }
    }

    // Extract image from description if it exists
    let imageUrl: string | undefined;
    try {
      const descriptionObj = JSON.parse(market.description);
      if (descriptionObj.image) {
        imageUrl = descriptionObj.image;
      }
    } catch {
      // Description is not JSON or doesn't have image field
    }

    // V2 uses MarketStatus enum (uint8): 0=Active, 1=Resolved, 2=Canceled
    const statusCode = Number(market.status ?? 0);
    const statusLabel = MarketStatusLabel[statusCode] ?? 'Active';

    const response = {
      id: marketId,
      title: market.question,
      description: market.description,
      creator: market.creator,
      paymentToken: market.collateralToken,
      closingDate: market.closingTime.toString(),
      status: statusLabel,
      resolved: statusCode === MarketStatus.Resolved,
      canceled: statusCode === MarketStatus.Canceled,
      winningOutcomeId: Number(market.winningOutcome || 0),
      totalVolume: totalVolume.toString(),
      participantCount: participantCount,
      platformFeeBps: PLATFORM_FEE_BPS,
      creatorFeeBps: CREATOR_FEE_BPS,
      image: imageUrl,
    };

    console.log(`Market ${marketId} response:`, response);
    
    // Cache the response
    marketCache.set(cacheKey, { data: response, timestamp: Date.now() });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error(`Error fetching market ${marketId}:`, error);
    console.error('Contract address:', CONTRACTS.baseSepolia.ctfPredictionMarket);
    return NextResponse.json(
      { error: 'Failed to fetch market data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
