import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, encodeFunctionData, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

/**
 * Execute transactions for nTZS embedded wallets.
 * Since nTZS wallets are embedded/custodial, we need to sign transactions
 * on behalf of users using a server-side approach.
 * 
 * For now, this uses a dedicated transaction signer wallet that executes
 * transactions on behalf of nTZS users. The nTZS user pays for the transaction
 * via their nTZS balance (off-chain accounting).
 */

const TX_SIGNER_PRIVATE_KEY = process.env.NTZS_TX_SIGNER_PRIVATE_KEY || process.env.PLATFORM_PRIVATE_KEY;

if (!TX_SIGNER_PRIVATE_KEY) {
  console.warn('NTZS_TX_SIGNER_PRIVATE_KEY not set - nTZS transactions will fail');
}

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

export async function POST(req: NextRequest) {
  try {
    const { from, to, data, value } = await req.json();

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to' },
        { status: 400 }
      );
    }

    if (!TX_SIGNER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Transaction signer not configured' },
        { status: 503 }
      );
    }

    console.log(`[nTZS TX] Executing transaction for ${from} to ${to}`);
    console.log(`[nTZS TX] Data: ${data?.slice(0, 66)}...`);
    console.log(`[nTZS TX] Value: ${value || '0x0'}`);

    // Create wallet client with the transaction signer key
    const account = privateKeyToAccount(TX_SIGNER_PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http('https://sepolia.base.org'),
    });

    // Execute the transaction
    const hash = await walletClient.sendTransaction({
      to: to as `0x${string}`,
      data: data as `0x${string}`,
      value: value ? BigInt(value) : BigInt(0),
    });

    console.log(`[nTZS TX] Transaction sent: ${hash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`[nTZS TX] Transaction confirmed in block ${receipt.blockNumber}`);

    return NextResponse.json({
      hash,
      blockNumber: receipt.blockNumber.toString(),
      status: receipt.status,
    });

  } catch (error: any) {
    console.error('[nTZS TX] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Transaction execution failed' },
      { status: 500 }
    );
  }
}
