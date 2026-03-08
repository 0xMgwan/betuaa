import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { createOrGetUser } from '@/lib/ntzs';

/**
 * Execute contract transactions on behalf of nTZS users.
 * Since nTZS wallets are custodial and the transfer API is broken,
 * we use the user's actual nTZS wallet private key (managed by nTZS)
 * to sign transactions directly.
 * 
 * This endpoint acts as a proxy to execute transactions that the user
 * has approved via the frontend.
 */

const NTZS_WALLET_PRIVATE_KEY = process.env.NTZS_WALLET_PRIVATE_KEY;

if (!NTZS_WALLET_PRIVATE_KEY) {
  console.warn('NTZS_WALLET_PRIVATE_KEY not set - nTZS transaction execution will fail');
}

export async function POST(req: NextRequest) {
  try {
    const { userAddress, contractAddress, abi, functionName, args, value } = await req.json();

    if (!userAddress || !contractAddress || !abi || !functionName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify user exists in nTZS system
    const user = await createOrGetUser({
      walletAddress: userAddress,
      email: `${userAddress.toLowerCase()}@betua.app`,
    });

    console.log(`[nTZS Execute] User ${user.id} executing ${functionName} on ${contractAddress}`);

    // For now, return error since we don't have access to user's private key
    // nTZS manages the private keys, not us
    return NextResponse.json({
      error: 'nTZS transaction execution requires nTZS API support for contract interactions. Please contact nTZS team to enable this feature.',
    }, { status: 501 });

  } catch (error: any) {
    console.error('[nTZS Execute] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Transaction execution failed' },
      { status: 500 }
    );
  }
}
