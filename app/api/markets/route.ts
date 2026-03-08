import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, fallback } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACTS, RPC } from '@/lib/contracts';
import CTFPredictionMarketNTZSABI from '@/lib/abis/CTFPredictionMarketNTZS.json';

const PLATFORM_FEE_BPS = 50;
const CREATOR_FEE_BPS  = 100;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: fallback([
    http(RPC.baseSepolia.primary, { retryCount: 3, retryDelay: 1000 }),
    http(RPC.baseSepolia.fallback, { retryCount: 2, retryDelay: 1000 }),
  ]),
});

const CTF_NTZS_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarketNTZS as `0x${string}`;

// Cache: 10 second TTL for the full list
const listCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10_000;

export async function GET(request: NextRequest) {
  try {
    const marketCount = await publicClient.readContract({
      address: CTF_NTZS_ADDRESS,
      abi: CTFPredictionMarketNTZSABI,
      functionName: 'marketCount',
    }).catch(() => 0n);

    const total = Number(marketCount);

    if (total === 0) {
      return NextResponse.json({ markets: [], total: 0 });
    }

    const cacheKey = `markets-ntzs-${total}`;
    const cached = listCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const settled = await Promise.allSettled(
      Array.from({ length: total }, (_, i) => i + 1).map(id =>
        publicClient.readContract({
          address: CTF_NTZS_ADDRESS,
          abi: CTFPredictionMarketNTZSABI,
          functionName: 'getMarket',
          args: [BigInt(id)],
        }).then(m => ({ id, market: m as any }))
      )
    );

    const markets = settled
      .filter(r => r.status === 'fulfilled' && (r.value as any).market?.question)
      .map(r => {
        const { id, market } = (r as PromiseFulfilledResult<{ id: number; market: any }>).value;

        const resolved = market.resolved ?? false;
        const canceled = market.cancelled ?? false;
        const statusLabel = canceled ? 'Canceled' : (resolved ? 'Resolved' : 'Active');

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
          paymentToken: 'nTZS',
          closingDate: market.closingTime.toString(),
          status: statusLabel,
          resolved,
          canceled,
          winningOutcomeId: Number(market.winningOutcome || 0),
          platformFeeBps: PLATFORM_FEE_BPS,
          creatorFeeBps: CREATOR_FEE_BPS,
          image: imageUrl,
          isNTZS: true,
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
