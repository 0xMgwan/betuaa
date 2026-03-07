import { NextRequest, NextResponse } from 'next/server';
import { getUserByWallet } from '@/lib/ntzs';

/**
 * POST /api/ntzs/login
 * Body: { email?, phone?, walletAddress }
 * Checks if user exists in nTZS and returns their data
 */
export async function POST(req: NextRequest) {
  try {
    const { email, phone, walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Look up user in nTZS by wallet address (which is used as externalId during deposits)
    console.log(`[Login API] Looking up user by wallet address: ${walletAddress}`);
    
    const ntzsUser = await getUserByWallet(walletAddress);

    if (!ntzsUser) {
      console.log(`[Login API] User not found for ${walletAddress}`);
      return NextResponse.json({ user: null });
    }

    console.log(`[Login API] Found user:`, ntzsUser);

    // Return user data - use email as username if no username exists
    const username = email ? email.split('@')[0] : phone?.slice(-4) || 'user';
    
    return NextResponse.json({
      user: {
        userId: ntzsUser.id,
        walletAddress: ntzsUser.walletAddress,
        username: username,
        email: email,
        phone: phone,
      },
    });
  } catch (err) {
    console.error(`[Login API] Error:`, err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
