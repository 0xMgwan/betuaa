import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACTS } from '@/lib/contracts';
import PredictionMarketABI from '@/lib/abis/PredictionMarket.json';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marketId: string; outcomeId: string; address: string }> }
) {
  try {
    const { marketId, outcomeId, address } = await params;
    
    const marketIdNum = parseInt(marketId);
    const outcomeIdNum = parseInt(outcomeId);

    if (isNaN(marketIdNum) || isNaN(outcomeIdNum) || !address) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Fetch user's position from blockchain using getUserPosition
    const position = await publicClient.readContract({
      address: CONTRACTS.baseSepolia.predictionMarket as `0x${string}`,
      abi: PredictionMarketABI,
      functionName: 'getUserPosition',
      args: [BigInt(marketIdNum), address as `0x${string}`, BigInt(outcomeIdNum)],
    }) as any;

    console.log('Position data:', position);

    // getUserPosition returns a struct with {shares, averagePrice, outcomeId}
    // Handle both array and object responses
    const shares = Array.isArray(position) ? position[0] : position.shares;
    const averagePrice = Array.isArray(position) ? position[1] : position.averagePrice;

    return NextResponse.json({
      shares: shares?.toString() || '0',
      averageBuyPrice: averagePrice ? Number(averagePrice) / 1e18 : 0,
    });
  } catch (error) {
    console.error('Error fetching position:', error);
    return NextResponse.json(
      { error: 'Failed to fetch position data' },
      { status: 500 }
    );
  }
}
