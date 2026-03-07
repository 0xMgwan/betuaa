import { NextRequest, NextResponse } from 'next/server';
import { createOrGetUser, createWithdrawal } from '@/lib/ntzs';

/**
 * POST /api/ntzs/withdraw
 * Body: { walletAddress, amountTzs, phone, email }
 * Burns nTZS tokens and sends TZS to Mobile Money number.
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, amountTzs, phone, email } = await req.json();

    if (!walletAddress) return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    if (!amountTzs || amountTzs < 500) return NextResponse.json({ error: 'Minimum withdrawal is 500 TZS' }, { status: 400 });
    if (!phone || !/^255\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Phone must be in 255XXXXXXXXX format' }, { status: 400 });
    }

    const user = await createOrGetUser({ walletAddress, email, phone });

    const withdrawal = await createWithdrawal({
      userId:    user.id,
      amountTzs: Number(amountTzs),
      phone,
    });

    return NextResponse.json({
      withdrawalId: withdrawal.id,
      status:       withdrawal.status,
      amountTzs:    withdrawal.amountTzs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
