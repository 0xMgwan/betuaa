import { NextRequest, NextResponse } from 'next/server';
import { createOrGetUser, getNtzsBalance } from '@/lib/ntzs';

/**
 * GET /api/ntzs/balance?address=0x...&email=...
 * Uses createOrGetUser (idempotent POST) to get the user, then fetches balance.
 */
export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get('address');
    const email = req.nextUrl.searchParams.get('email');

    if (!address) {
      return NextResponse.json({
        balanceTzs: 0,
        balanceNtzs: '0',
        walletAddress: '0x0',
      });
    }

    if (!email) {
      console.log(`[Balance API] No email provided, returning 0 balance`);
      return NextResponse.json({
        balanceTzs: 0,
        balanceNtzs: '0',
        walletAddress: address,
      });
    }

    // createOrGetUser is idempotent — if user exists it returns existing user
    console.log(`[Balance API] Getting user via createOrGetUser for ${address} / ${email}`);
    const user = await createOrGetUser({ walletAddress: address, email });
    console.log(`[Balance API] Got user ID: ${user.id}`);

    const balance = await getNtzsBalance(user.id);
    console.log(`[Balance API] Balance for user ${user.id}: ${balance.balanceTzs} TZS`);

    return NextResponse.json({
      balanceTzs:  balance.balanceTzs,
      balanceNtzs: balance.balanceNtzs,
      walletAddress: balance.walletAddress || address,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Balance API] Error:`, err);
    return NextResponse.json({
      balanceTzs: 0,
      balanceNtzs: '0',
      walletAddress: req.nextUrl.searchParams.get('address') || '0x0',
    });
  }
}
