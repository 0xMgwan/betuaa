/**
 * GET  /api/ntzs/deposit  — returns platform deposit address and user's balance
 * POST /api/ntzs/deposit  — confirms an on-chain NTZS deposit by txHash, credits user balance
 *
 * Deposit flow:
 *  1. User sends NTZS from their nTZS wallet app to the platform wallet address
 *  2. POST with txHash → we verify on-chain and credit their DB balanceTzs
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PLATFORM_ADDRESS, platformPublicClient } from '@/lib/platform-wallet';

const NTZS_TOKEN = (process.env.NEXT_PUBLIC_NTZS_TOKEN_ADDRESS ?? '').toLowerCase() as `0x${string}`;
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const scan = searchParams.get('scan') === 'true';

  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress: address },
    include: { deposits: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });

  let newDeposits: any[] = [];

  // Auto-scan recent blocks for incoming NTZS transfers from this address
  if (scan && user) {
    try {
      const latestBlock = await platformPublicClient.getBlockNumber();
      const fromBlock = latestBlock > 500n ? latestBlock - 500n : 0n; // last ~500 blocks (~17 min)

      const logs = await platformPublicClient.getLogs({
        address: NTZS_TOKEN,
        event: {
          type: 'event',
          name: 'Transfer',
          inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'value', type: 'uint256', indexed: false },
          ],
        },
        args: {
          from: address as `0x${string}`,
          to: PLATFORM_ADDRESS as `0x${string}`,
        },
        fromBlock,
        toBlock: latestBlock,
      });

      for (const log of logs) {
        const txHash = log.transactionHash;
        if (!txHash) continue;

        const alreadyProcessed = await prisma.deposit.findUnique({ where: { txHash } });
        if (alreadyProcessed) continue;

        const amountTzs = Number((log as any).args.value / BigInt(1e18));
        if (amountTzs <= 0) continue;

        const [deposit] = await prisma.$transaction([
          prisma.deposit.create({
            data: { userId: user.id, txHash, amountTzs, fromAddress: address.toLowerCase() },
          }),
          prisma.user.update({
            where: { walletAddress: address },
            data: { balanceTzs: { increment: amountTzs } },
          }),
        ]);
        newDeposits.push(deposit);
        console.log(`[deposit:scan] Auto-credited ${amountTzs} TZS to ${address} tx=${txHash}`);
      }
    } catch (e) {
      console.error('[deposit:scan] Error:', e);
    }

    // Refresh user after potential credits
    if (newDeposits.length > 0) {
      const refreshed = await prisma.user.findUnique({
        where: { walletAddress: address },
        include: { deposits: { orderBy: { createdAt: 'desc' }, take: 10 } },
      });
      return NextResponse.json({
        platformWalletAddress: PLATFORM_ADDRESS,
        ntzsTokenAddress: NTZS_TOKEN,
        balanceTzs: refreshed?.balanceTzs ?? 0,
        recentDeposits: refreshed?.deposits ?? [],
        newDeposits,
      });
    }
  }

  return NextResponse.json({
    platformWalletAddress: PLATFORM_ADDRESS,
    ntzsTokenAddress: NTZS_TOKEN,
    balanceTzs: user?.balanceTzs ?? 0,
    recentDeposits: user?.deposits ?? [],
    newDeposits,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { txHash, userAddress } = await req.json();

    if (!txHash || !userAddress) {
      return NextResponse.json({ error: 'txHash and userAddress are required' }, { status: 400 });
    }

    // Prevent double-crediting
    const existing = await prisma.deposit.findUnique({ where: { txHash } });
    if (existing) {
      return NextResponse.json({ error: 'Transaction already processed', deposit: existing }, { status: 409 });
    }

    // Verify on-chain
    let receipt: any;
    try {
      receipt = await platformPublicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
    } catch {
      return NextResponse.json({ error: 'Transaction not found on Base Sepolia.' }, { status: 404 });
    }

    if (!receipt || receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction failed or not confirmed yet.' }, { status: 400 });
    }

    // Find Transfer(from, to, amount) where to = platform wallet
    const transferLog = receipt.logs.find(
      (log: any) =>
        log.address.toLowerCase() === NTZS_TOKEN &&
        log.topics[0] === TRANSFER_TOPIC &&
        log.topics[2] &&
        `0x${log.topics[2].slice(26)}`.toLowerCase() === PLATFORM_ADDRESS!.toLowerCase()
    );

    if (!transferLog) {
      return NextResponse.json(
        { error: `No NTZS transfer to platform wallet found in this transaction.` },
        { status: 400 }
      );
    }

    const fromAddress = `0x${transferLog.topics[1].slice(26)}`;
    if (fromAddress.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json(
        { error: `Sender (${fromAddress}) does not match your wallet (${userAddress}).` },
        { status: 400 }
      );
    }

    const rawAmount = BigInt(transferLog.data);
    const amountTzs = Number(rawAmount / BigInt(1e18));

    if (amountTzs <= 0) {
      return NextResponse.json({ error: 'Transfer amount too small.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { walletAddress: userAddress } });
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please register first.' }, { status: 404 });
    }

    const [deposit, updatedUser] = await prisma.$transaction([
      prisma.deposit.create({
        data: { userId: user.id, txHash, amountTzs, fromAddress: fromAddress.toLowerCase() },
      }),
      prisma.user.update({
        where: { walletAddress: userAddress },
        data: { balanceTzs: { increment: amountTzs } },
      }),
    ]);

    console.log(`[deposit] Credited ${amountTzs} TZS to ${userAddress} tx=${txHash}`);

    return NextResponse.json({
      success: true,
      deposit,
      newBalance: updatedUser.balanceTzs,
      message: `Deposited ${amountTzs} TZS. New balance: ${updatedUser.balanceTzs} TZS.`,
    });
  } catch (err: any) {
    console.error('[deposit] Error:', err);
    return NextResponse.json({ error: err.message || 'Deposit failed' }, { status: 500 });
  }
}
