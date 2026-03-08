import { NextRequest, NextResponse } from 'next/server';
import { formatUnits } from 'viem';
import { platformPublicClient } from '@/lib/platform-wallet';

const NTZS_TOKEN = process.env.NEXT_PUBLIC_NTZS_TOKEN_ADDRESS as `0x${string}`;

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * GET /api/ntzs/balance?address=0x...
 * Returns the user's real on-chain NTZS token balance.
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address') as `0x${string}` | null;

  if (!address) {
    return NextResponse.json({ balanceTzs: 0, balanceNtzs: '0', walletAddress: '0x0' });
  }

  try {
    const raw = await platformPublicClient.readContract({
      address: NTZS_TOKEN,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    const balanceTzs = parseFloat(formatUnits(raw, 18));

    return NextResponse.json({
      balanceTzs,
      balanceNtzs: raw.toString(),
      walletAddress: address,
    });
  } catch (err) {
    console.error('[balance] Error reading on-chain balance:', err);
    return NextResponse.json({ balanceTzs: 0, balanceNtzs: '0', walletAddress: address });
  }
}
