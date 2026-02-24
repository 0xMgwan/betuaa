import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, fallback } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACTS, RPC } from '@/lib/contracts';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarketV2.json';

// MarketStatus enum from CTFPredictionMarketV2.sol
const MarketStatus = { Active: 0, Resolved: 1, Canceled: 2 } as const;
const MarketStatusLabel = ['Active', 'Resolved', 'Canceled'] as const;

const PLATFORM_FEE_BPS = 50;
const CREATOR_FEE_BPS  = 100;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: fallback([
    http(RPC.baseSepolia.primary, { retryCount: 3, retryDelay: 1000 }),
    http(RPC.baseSepolia.fallback, { retryCount: 2, retryDelay: 1000 }),
  ]),
});

const CTF_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`;

// Cache: 10 second TTL for the full list
const listCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10_000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fromParam = parseInt(searchParams.get('from') ?? '1');
  const toParam   = searchParams.get('to');

  try {
    // Fetch total market count
    const marketCount = await publicClient.readContract({
      address: CTF_ADDRESS,
      abi: CTFPredictionMarketABI,
      functionName: 'marketCount',
    });

    const total = Number(marketCount);
    const from  = Math.max(1, fromParam);
    const to    = Math.min(total, toParam ? parseInt(toParam) : total);

    if (from > to || total === 0) {
      return NextResponse.json({ markets: [], total });
    }

    const cacheKey = `markets-${from}-${to}`;
    const cached = listCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Batch-fetch all markets in parallel
    const ids = Array.from({ length: to - from + 1 }, (_, i) => from + i);
    const settled = await Promise.allSettled(
      ids.map(id =>
        publicClient.readContract({
          address: CTF_ADDRESS,
          abi: CTFPredictionMarketABI,
          functionName: 'getMarket',
          args: [BigInt(id)],
        }).then(m => ({ id, market: m as any }))
      )
    );

    const markets = settled
      .filter(r => r.status === 'fulfilled' && (r.value as any).market?.question)
      .map(r => {
        const { id, market } = (r as PromiseFulfilledResult<{ id: number; market: any }>).value;
        const statusCode  = Number(market.status ?? 0);
        const statusLabel = MarketStatusLabel[statusCode] ?? 'Active';

        let imageUrl: string | undefined;
        try {
          const parsed = JSON.parse(market.description);
          if (parsed.image) imageUrl = parsed.image;
        } catch { /* not JSON */ }

        return {
          id,
          title: market.question,
          description: market.description,
          creator: market.creator,
          paymentToken: market.collateralToken,
          closingDate: market.closingTime.toString(),
          status: statusLabel,
          resolved: statusCode === MarketStatus.Resolved,
          canceled: statusCode === MarketStatus.Canceled,
          winningOutcomeId: Number(market.winningOutcome || 0),
          platformFeeBps: PLATFORM_FEE_BPS,
          creatorFeeBps: CREATOR_FEE_BPS,
          image: imageUrl,
        };
      });

    const result = { markets, total };
    listCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching markets batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
