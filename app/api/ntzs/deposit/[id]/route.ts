import { NextRequest, NextResponse } from 'next/server';
import { getDeposit } from '@/lib/ntzs';

/**
 * GET /api/ntzs/deposit/[id]
 * Poll deposit status: pending → processing → minted | failed
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deposit = await getDeposit(id);
    return NextResponse.json({
      depositId: deposit.id,
      status:    deposit.status,
      amountTzs: deposit.amountTzs,
      txHash:    deposit.txHash,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
