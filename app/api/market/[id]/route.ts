import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACTS } from '@/lib/contracts';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarket.json';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

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

    console.log(`Fetching market ${marketId} from CTF contract...`);

    // Fetch market data from CTF contract
    const market = await publicClient.readContract({
      address: CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
      abi: CTFPredictionMarketABI,
      functionName: 'getMarket',
      args: [BigInt(marketId)],
    }) as any;

    console.log(`Market ${marketId} raw data:`, market);

    // Market struct has named fields: id, question, description, creator, collateralToken, createdAt, closingTime, resolutionTime, conditionId, outcomeCount, winningOutcome, resolved, paused
    // If market doesn't exist, question will be empty string
    if (!market.question || market.question === '') {
      console.log(`Market ${marketId} not found (empty question)`);
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    // Calculate volume and traders by checking if tokens have been minted
    let totalVolume = BigInt(0);
    let participantCount = 0;
    
    try {
      // Check each outcome token to see if it has been minted
      // If tokens exist, we know there's been activity
      for (let i = 0; i < Number(market.outcomeCount); i++) {
        try {
          const tokenId = await publicClient.readContract({
            address: CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`,
            abi: CTFPredictionMarketABI,
            functionName: 'outcomeTokens',
            args: [BigInt(marketId), BigInt(i)],
          }) as bigint;
          
          // If tokenId exists and is greater than 0, tokens have been minted
          if (tokenId > BigInt(0)) {
            // Estimate volume: For demo, assume 1 USDC per outcome token minted
            // In production, query Transfer events or use The Graph
            totalVolume += BigInt(1000000); // 1 USDC in 6 decimals
            participantCount = Math.max(participantCount, 1); // At least 1 trader
          }
        } catch (err) {
          console.log(`Error checking outcome ${i}:`, err);
        }
      }
      
      console.log(`Market ${marketId} calculated volume: ${totalVolume.toString()}, participants: ${participantCount}`);
    } catch (error) {
      console.log('Could not calculate volume:', error);
      totalVolume = BigInt(0);
      participantCount = 0;
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
