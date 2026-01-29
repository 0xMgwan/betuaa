import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACTS } from '@/lib/contracts';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarket.json';
import { fetchMarketData } from '@/lib/graphql';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Simple in-memory cache with 30 second TTL
const marketCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

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

    // Use subgraph data if available, otherwise fallback to 0
    let totalVolume = BigInt(0);
    let participantCount = 0;
    
    if (subgraphData) {
      totalVolume = BigInt(subgraphData.totalVolume || 0);
      participantCount = subgraphData.participantCount || 0;
      console.log(`Market ${marketId} using subgraph data - volume: ${totalVolume.toString()}, participants: ${participantCount}`);
    } else {
      console.log(`Market ${marketId} - no subgraph data available yet, using zeros`);
    }

    const response = {
      id: marketId,
      title: market.question,
      description: market.description,
      creator: market.creator,
      paymentToken: market.collateralToken,
      closingDate: market.closingTime.toString(),
      resolved: market.resolved,
      winningOutcomeId: Number(market.winningOutcome || 0),
      totalVolume: totalVolume.toString(),
      participantCount: participantCount,
      creatorFeePercent: 0, // CTF uses platform fee only
      platformFeePercent: 200, // 2% platform fee (200 basis points)
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
