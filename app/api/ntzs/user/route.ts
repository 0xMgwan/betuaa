import { NextRequest, NextResponse } from 'next/server';
import { createOrGetUser } from '@/lib/ntzs';

/**
 * POST /api/ntzs/user
 * Body: { walletAddress, email?, phone? }
 * Creates or retrieves a nTZS user keyed by wallet address.
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, email, phone } = await req.json();

    if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const user = await createOrGetUser({ 
      walletAddress, 
      email,
      phone 
    });
    return NextResponse.json({ ntzsUserId: user.id, walletAddress: user.walletAddress });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
