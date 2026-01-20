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

    // Fetch user's position from blockchain
    const position = await publicClient.readContract({
      address: CONTRACTS.baseSepolia.predictionMarket as `0x${string}`,
      abi: PredictionMarketABI,
      functionName: 'positions',
      args: [BigInt(marketIdNum), address as `0x${string}`, BigInt(outcomeIdNum)],
    }) as any;

    return NextResponse.json({
      shares: position.shares.toString(),
      averageBuyPrice: Number(position.averageBuyPrice) / 100, // Convert from basis points
    });
  } catch (error) {
    console.error('Error fetching position:', error);
    return NextResponse.json(
      { error: 'Failed to fetch position data' },
      { status: 500 }
    );
  }
}
