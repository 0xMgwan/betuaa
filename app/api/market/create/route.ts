/**
 * POST /api/market/create
 * Creates a prediction market on-chain using the platform wallet.
 * User pays creation fee in nTZS (transferred to platform).
 */
import { NextRequest, NextResponse } from 'next/server';
import { platformWalletClient, platformPublicClient, PLATFORM_ADDRESS, tzsToUsdcRaw } from '@/lib/platform-wallet';
import { createTransfer, getUserByWallet } from '@/lib/ntzs';
import { CONTRACTS } from '@/lib/contracts';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarketV2.json';
import ERC20ABI from '@/lib/abis/ERC20.json';

const CTF_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`;
const MOCK_USDC = CONTRACTS.baseSepolia.mockUSDC as `0x${string}`;

// Creation fee in TZS (platform can set this)
const CREATION_FEE_TZS = Number(process.env.MARKET_CREATION_FEE_TZS ?? 0);

export async function POST(req: NextRequest) {
  try {
    if (!platformWalletClient || !PLATFORM_ADDRESS) {
      return NextResponse.json({ error: 'Platform wallet not configured' }, { status: 503 });
    }

    const body = await req.json();
    const {
      question,
      description,
      outcomeCount = 2,
      closingTime,
      collateralToken,
      userAddress,
    } = body as {
      question: string;
      description: string;
      outcomeCount?: number;
      closingTime: number; // unix timestamp
      collateralToken?: string;
      userAddress: string;
    };

    if (!question || !closingTime || !userAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const token = (collateralToken || MOCK_USDC) as `0x${string}`;

    // Charge creation fee if set
    if (CREATION_FEE_TZS > 0) {
      const user = await getUserByWallet(userAddress);
      if (!user) return NextResponse.json({ error: 'nTZS user not found' }, { status: 404 });

      const platformUser = await getUserByWallet(PLATFORM_ADDRESS);
      if (!platformUser) return NextResponse.json({ error: 'Platform nTZS account not configured' }, { status: 503 });

      await createTransfer({
        fromUserId: user.id,
        toUserId: platformUser.id,
        amountTzs: CREATION_FEE_TZS,
      });
    }

    // Ensure platform has approved the CTF contract to spend its collateral (no-op if already approved)
    const allowance = await platformPublicClient.readContract({
      address: token,
      abi: ERC20ABI,
      functionName: 'allowance',
      args: [PLATFORM_ADDRESS, CTF_ADDRESS],
    }) as bigint;

    if (allowance === 0n) {
      const approveTx = await platformWalletClient.writeContract({
        address: token,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [CTF_ADDRESS, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
      });
      await platformPublicClient.waitForTransactionReceipt({ hash: approveTx });
    }

    // Create the market using the platform wallet
    const { request } = await platformPublicClient.simulateContract({
      account: platformWalletClient.account,
      address: CTF_ADDRESS,
      abi: CTFPredictionMarketABI,
      functionName: 'createMarket',
      args: [question, description, BigInt(outcomeCount), BigInt(closingTime), token],
    });

    const hash = await platformWalletClient.writeContract(request);
    const receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

    // Extract marketId from logs (MarketCreated event)
    // Event: MarketCreated(uint256 indexed marketId, ...)
    const marketCreatedLog = receipt.logs.find(
      (log) => log.address.toLowerCase() === CTF_ADDRESS.toLowerCase()
    );
    const marketId = marketCreatedLog?.topics?.[1]
      ? Number(BigInt(marketCreatedLog.topics[1]))
      : null;

    return NextResponse.json({ success: true, hash, marketId, blockNumber: receipt.blockNumber.toString() });
  } catch (err) {
    console.error('[/api/market/create]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
