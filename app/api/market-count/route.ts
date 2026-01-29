import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACTS } from '@/lib/contracts';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarket.json';

export async function GET() {
  try {
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://sepolia.base.org'),
    });

    const marketCount = await publicClient.readContract({
      address: CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
      abi: CTFPredictionMarketABI,
      functionName: 'marketCount',
    });

    return Response.json({
      success: true,
      marketCount: Number(marketCount),
      marketId: Number(marketCount) - 1,
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
