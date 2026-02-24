import { createPublicClient, http, fallback } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACTS, RPC } from '@/lib/contracts';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarketV2.json';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: fallback([
    http(RPC.baseSepolia.primary),
    http(RPC.baseSepolia.fallback),
  ]),
});

export async function GET() {
  try {
    const marketCount = await publicClient.readContract({
      address: CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
      abi: CTFPredictionMarketABI,
      functionName: 'marketCount',
    });

    return Response.json({
      success: true,
      marketCount: Number(marketCount),
    });
  } catch (error) {
    console.error('Error fetching market count:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
