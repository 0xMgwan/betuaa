/**
 * POST /api/ntzs/withdraw
 * Body: { userAddress, amountTzs }
 *
 * Sends NTZS from the platform wallet to the user's wallet on-chain.
 * Debits user's DB balanceTzs.
 *
 * For M-Pesa off-ramp: user first withdraws NTZS to their wallet,
 * then uses the nTZS app to burn and receive TZS via M-Pesa.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { platformWalletClient, platformPublicClient, PLATFORM_ADDRESS } from '@/lib/platform-wallet';
import ERC20ABI from '@/lib/abis/ERC20.json';

const NTZS_TOKEN = process.env.NEXT_PUBLIC_NTZS_TOKEN_ADDRESS! as `0x${string}`;
const MIN_WITHDRAWAL_TZS = 100;

export async function POST(req: NextRequest) {
  try {
    const { userAddress, amountTzs } = await req.json();

    if (!userAddress) return NextResponse.json({ error: 'userAddress is required' }, { status: 400 });
    if (!amountTzs || amountTzs < MIN_WITHDRAWAL_TZS) {
      return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL_TZS} TZS` }, { status: 400 });
    }

    if (!platformWalletClient || !PLATFORM_ADDRESS) {
      return NextResponse.json({ error: 'Platform wallet not configured' }, { status: 503 });
    }

    const user = await prisma.user.findUnique({ where: { walletAddress: userAddress } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.balanceTzs < amountTzs) {
      return NextResponse.json(
        { error: `Insufficient balance. Have ${user.balanceTzs.toFixed(0)} TZS, requested ${amountTzs} TZS.` },
        { status: 400 }
      );
    }

    // Check platform has enough on-chain NTZS
    const rawAmount = BigInt(Math.floor(amountTzs)) * BigInt(1e18);
    const platformBalance = (await platformPublicClient.readContract({
      address: NTZS_TOKEN,
      abi: ERC20ABI,
      functionName: 'balanceOf',
      args: [PLATFORM_ADDRESS],
    })) as bigint;

    if (platformBalance < rawAmount) {
      return NextResponse.json({ error: 'Platform liquidity insufficient. Please contact support.' }, { status: 503 });
    }

    // Debit DB balance first (optimistic, rollback on failure)
    await prisma.user.update({
      where: { walletAddress: userAddress },
      data: { balanceTzs: { decrement: amountTzs } },
    });

    // Send NTZS on-chain
    let txHash: `0x${string}`;
    try {
      txHash = await platformWalletClient.writeContract({
        address: NTZS_TOKEN,
        abi: ERC20ABI,
        functionName: 'transfer',
        args: [userAddress as `0x${string}`, rawAmount],
      });
      await platformPublicClient.waitForTransactionReceipt({ hash: txHash });
    } catch (sendErr: any) {
      // Rollback DB balance on send failure
      await prisma.user.update({
        where: { walletAddress: userAddress },
        data: { balanceTzs: { increment: amountTzs } },
      });
      throw sendErr;
    }

    const updatedUser = await prisma.user.findUnique({ where: { walletAddress: userAddress } });
    console.log(`[withdraw] Sent ${amountTzs} TZS to ${userAddress} tx=${txHash}`);

    return NextResponse.json({
      success: true,
      txHash,
      amountTzs,
      newBalance: updatedUser?.balanceTzs ?? 0,
      message: `Withdrawn ${amountTzs} TZS to your wallet. New balance: ${updatedUser?.balanceTzs ?? 0} TZS.`,
    });
  } catch (err: any) {
    console.error('[withdraw] Error:', err);
    return NextResponse.json({ error: err.message || 'Withdrawal failed' }, { status: 500 });
  }
}
