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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const marketId = parseInt(id);

    if (isNaN(marketId) || marketId < 1) {
      return NextResponse.json({ error: 'Invalid market ID' }, { status: 400 });
    }

    // Fetch market data from blockchain
    const market = await publicClient.readContract({
      address: CONTRACTS.baseSepolia.predictionMarket as `0x${string}`,
      abi: PredictionMarketABI,
      functionName: 'getMarket',
      args: [BigInt(marketId)],
    }) as any;

    // Fetch market outcomes
    const outcomes = await publicClient.readContract({
      address: CONTRACTS.baseSepolia.predictionMarket as `0x${string}`,
      abi: PredictionMarketABI,
      functionName: 'getMarketOutcomes',
      args: [BigInt(marketId)],
    }) as any;

    // MarketStatus enum: 0=Active, 1=Closed, 2=Resolved, 3=Disputed
    const isResolved = Number(market.status) === 2;

    return NextResponse.json({
      id: marketId,
      title: market.title,
      description: market.description,
      creator: market.creator,
      paymentToken: market.paymentToken,
      closingDate: market.closingDate.toString(),
      resolved: isResolved,
      winningOutcomeId: Number(market.winningOutcomeId),
      totalVolume: market.totalVolume.toString(),
      participantCount: Number(market.participantCount || 0),
      creatorFeePercent: Number(market.creatorFeePercent),
      platformFeePercent: Number(market.platformFeePercent),
      outcomes: outcomes.map((outcome: any) => ({
        name: outcome.name,
        totalShares: outcome.totalShares.toString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching market:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
