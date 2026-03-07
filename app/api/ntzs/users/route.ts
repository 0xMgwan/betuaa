import { NextRequest, NextResponse } from 'next/server';
import { createOrGetUser } from '@/lib/ntzs';

// Create a new nTZS user (idempotent - returns existing user if already exists)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { externalId, email, phone } = body;

    if (!externalId) {
      return NextResponse.json(
        { error: 'externalId is required' },
        { status: 400 }
      );
    }

    // For phone registrations, create a placeholder email
    const userEmail = email || (phone ? `${phone}@ntzs.local` : undefined);

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Either email or phone is required' },
        { status: 400 }
      );
    }

    console.log('[nTZS Users API] Creating/getting user:', { externalId, email: userEmail, phone });

    // Use createOrGetUser which is idempotent
    const user = await createOrGetUser({
      walletAddress: externalId,
      email: userEmail,
      phone,
    });

    console.log('[nTZS Users API] User created/retrieved:', user.id);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating nTZS user:', error);
    const message = error instanceof Error ? error.message : 'Failed to create user';
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Get user by external ID (wallet address)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const externalId = searchParams.get('externalId');

    if (!externalId) {
      return NextResponse.json(
        { error: 'externalId is required' },
        { status: 400 }
      );
    }

    // Try to get user from database first
    const { prisma } = await import('@/lib/prisma');
    const dbUser = await prisma.user.findUnique({
      where: { walletAddress: externalId },
    });

    if (dbUser) {
      return NextResponse.json({
        id: dbUser.ntzsUserId || dbUser.id,
        walletAddress: dbUser.walletAddress,
        email: dbUser.email,
        phone: dbUser.phone,
      });
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching nTZS user:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch user';
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
