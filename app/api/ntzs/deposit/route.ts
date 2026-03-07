import { NextRequest, NextResponse } from 'next/server';
import { createOrGetUser, createDeposit } from '@/lib/ntzs';

/**
 * POST /api/ntzs/deposit
 * Body: { walletAddress, amountTzs, phone, email }
 * Provisions user if needed, then initiates Mobile Money STK Push.
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, amountTzs, phone, email } = await req.json();

    if (!walletAddress) return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    if (!amountTzs || amountTzs < 100) return NextResponse.json({ error: 'Minimum deposit is 100 TZS' }, { status: 400 });
    if (!phone || !/^255\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Phone must be in 255XXXXXXXXX format' }, { status: 400 });
    }

    // Ensure user exists (idempotent)
    const user = await createOrGetUser({ walletAddress, email, phone });

    // Initiate deposit → M-Pesa STK push
    const deposit = await createDeposit({
      userId: user.id,
      amountTzs: Number(amountTzs),
      phone,
    });

    return NextResponse.json({
      depositId: deposit.id,
      status:    deposit.status,
      amountTzs: deposit.amountTzs,
      ntzsUserId: user.id, // Return the nTZS user ID so we can store it
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
