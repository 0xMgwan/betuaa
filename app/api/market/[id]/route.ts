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

    // Calculate volume from userPositions mapping
    let totalVolume = BigInt(0);
    let uniqueHolders = new Set<string>();
    
    try {
      // The CTF contract has a userPositions mapping: user => marketId => outcome => balance
      // We can't enumerate all users on-chain, so we'll use a different approach:
      // Check the contract's collateral balance which represents total minted volume
      const collateralBalance = await publicClient.readContract({
        address: market.collateralToken as `0x${string}`,
        abi: [
          {
            "inputs": [{"name": "account", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'balanceOf',
        args: [CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`],
      }) as bigint;
      
      // This represents total collateral locked in the contract
      // For this specific market, we'd need event indexing to get exact volume
      // For now, we'll return 0 as a placeholder
      totalVolume = BigInt(0);
    } catch (error) {
      console.log('Could not calculate volume:', error);
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
      participantCount: uniqueHolders.size,
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
