/**
 * POST /api/market/claim
 * Claim winnings or refunds after a market resolves.
 *
 * Actions:
 *   redeemWinnings — redeem winning outcome tokens for collateral, pay user in TZS
 *   claimRefund    — claim refund from a cancelled market
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  platformWalletClient,
  platformPublicClient,
  PLATFORM_ADDRESS,
  usdcRawToTzs,
} from '@/lib/platform-wallet';
import { createTransfer, getUserByWallet } from '@/lib/ntzs';
import { getPosition, removePosition } from '@/lib/positions';
import { CONTRACTS } from '@/lib/contracts';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarketV2.json';
import ERC20ABI from '@/lib/abis/ERC20.json';

const CTF_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`;
const MOCK_USDC = CONTRACTS.baseSepolia.mockUSDC as `0x${string}`;

export async function POST(req: NextRequest) {
  try {
    if (!platformWalletClient || !PLATFORM_ADDRESS) {
      return NextResponse.json({ error: 'Platform wallet not configured' }, { status: 503 });
    }

    const body = await req.json();
    const { action, marketId, outcomeIndex, userAddress } = body as {
      action: 'redeemWinnings' | 'claimRefund';
      marketId: number;
      outcomeIndex?: number;
      userAddress: string;
    };

    const user = await getUserByWallet(userAddress);
    if (!user) return NextResponse.json({ error: 'nTZS user not found' }, { status: 404 });

    const platformNtzsUser = await getUserByWallet(PLATFORM_ADDRESS);
    if (!platformNtzsUser) return NextResponse.json({ error: 'Platform nTZS account not configured' }, { status: 503 });

    // Track USDC balance before/after to compute payout
    const usdcBefore = await platformPublicClient.readContract({
      address: MOCK_USDC,
      abi: ERC20ABI,
      functionName: 'balanceOf',
      args: [PLATFORM_ADDRESS],
    }) as bigint;

    let hash: `0x${string}`;

    if (action === 'redeemWinnings') {
      if (outcomeIndex === undefined) return NextResponse.json({ error: 'outcomeIndex required' }, { status: 400 });
      const pos = getPosition(userAddress, marketId, outcomeIndex);
      if (!pos || pos.shares === 0n) return NextResponse.json({ error: 'No winning position' }, { status: 400 });

      const { request } = await platformPublicClient.simulateContract({
        account: platformWalletClient.account,
        address: CTF_ADDRESS,
        abi: CTFPredictionMarketABI,
        functionName: 'redeemWinningTokens',
        args: [BigInt(marketId), pos.shares / BigInt(1e12)],
      });
      hash = await platformWalletClient.writeContract(request);
      await platformPublicClient.waitForTransactionReceipt({ hash });
      removePosition(userAddress, marketId, outcomeIndex, pos.shares);

    } else if (action === 'claimRefund') {
      const { request } = await platformPublicClient.simulateContract({
        account: platformWalletClient.account,
        address: CTF_ADDRESS,
        abi: CTFPredictionMarketABI,
        functionName: 'claimRefund',
        args: [BigInt(marketId)],
      });
      hash = await platformWalletClient.writeContract(request);
      await platformPublicClient.waitForTransactionReceipt({ hash });
      // Remove all positions for this user in this market
      for (let i = 0; i < 10; i++) {
        const pos = getPosition(userAddress, marketId, i);
        if (pos) removePosition(userAddress, marketId, i, pos.shares);
      }

    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Compute how much USDC the platform received
    const usdcAfter = await platformPublicClient.readContract({
      address: MOCK_USDC,
      abi: ERC20ABI,
      functionName: 'balanceOf',
      args: [PLATFORM_ADDRESS],
    }) as bigint;

    const usdcReceived = usdcAfter - usdcBefore;
    const payoutTzs = usdcRawToTzs(usdcReceived > 0n ? usdcReceived : 0n);

    // Pay user in TZS
    if (payoutTzs > 0) {
      await createTransfer({
        fromUserId: platformNtzsUser.id,
        toUserId: user.id,
        amountTzs: payoutTzs,
      });
    }

    return NextResponse.json({ success: true, hash: hash!, payoutTzs });
  } catch (err) {
    console.error('[/api/market/claim]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
