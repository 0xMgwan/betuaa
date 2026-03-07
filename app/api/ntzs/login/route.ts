import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ntzs/login
 * Body: { email?, phone?, walletAddress? }
 * Checks if user exists in database by email, phone, or walletAddress
 */
export async function POST(req: NextRequest) {
  try {
    const { email, phone, walletAddress } = await req.json();

    if (!walletAddress && !email && !phone) {
      return NextResponse.json({ error: 'Email, phone, or wallet address required' }, { status: 400 });
    }

    console.log(`[Login API] Looking up user:`, { email, phone, walletAddress });

    let dbUser = null;

    // Try wallet address first
    if (walletAddress) {
      dbUser = await prisma.user.findUnique({ where: { walletAddress } });
    }

    // Then try email
    if (!dbUser && email) {
      dbUser = await prisma.user.findFirst({ where: { email } });
    }

    // Then try phone
    if (!dbUser && phone) {
      dbUser = await prisma.user.findFirst({ where: { phone } });
    }

    if (!dbUser) {
      console.log(`[Login API] User not found`);
      return NextResponse.json({ user: null });
    }

    console.log(`[Login API] Found user:`, {
      username: dbUser.username,
      email: dbUser.email,
      phone: dbUser.phone,
      walletAddress: dbUser.walletAddress,
    });

    return NextResponse.json({
      user: {
        userId: dbUser.ntzsUserId || dbUser.id,
        walletAddress: dbUser.walletAddress,
        username: dbUser.username,
        email: dbUser.email,
        phone: dbUser.phone,
      },
    });
  } catch (err) {
    console.error(`[Login API] Error:`, err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
