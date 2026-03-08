import { NextRequest, NextResponse } from 'next/server';
import { createOrGetUser } from '@/lib/ntzs';

const NTZS_API_BASE_URL = process.env.NTZS_API_BASE_URL || 'https://www.ntzs.co.tz';
const NTZS_API_KEY = process.env.NTZS_API_KEY!;

/**
 * POST /api/ntzs/approve
 * Approve a spender to use nTZS tokens on behalf of the user
 * This uses the nTZS API to execute the approval transaction
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, spender, amount } = await req.json();

    if (!walletAddress || !spender || !amount) {
      return NextResponse.json(
        { error: 'walletAddress, spender, and amount are required' },
        { status: 400 }
      );
    }

    // Get or create nTZS user
    const user = await createOrGetUser({ walletAddress });

    // Call nTZS API to execute approval transaction
    // The nTZS API will sign and broadcast the approval on behalf of the user
    const response = await fetch(`${NTZS_API_BASE_URL}/api/v1/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NTZS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        to: process.env.NEXT_PUBLIC_NTZS_TOKEN_ADDRESS,
        data: encodeApprovalData(spender, amount),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Approval failed' }));
      return NextResponse.json(
        { error: error.message || 'Approval failed' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      txHash: result.txHash,
    });
  } catch (err: any) {
    console.error('[ntzs/approve] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Approval failed' },
      { status: 500 }
    );
  }
}

// Helper to encode ERC20 approve(address,uint256) function call
function encodeApprovalData(spender: string, amount: string): string {
  // approve(address spender, uint256 amount)
  // Function selector: 0x095ea7b3
  const selector = '0x095ea7b3';
  const spenderPadded = spender.slice(2).padStart(64, '0');
  const amountHex = BigInt(amount).toString(16).padStart(64, '0');
  return `${selector}${spenderPadded}${amountHex}`;
}
