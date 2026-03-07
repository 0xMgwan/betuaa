import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: address },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('Error fetching profile:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { walletAddress, username, email, phone, bio } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { walletAddress },
      data: {
        ...(username && { username }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('Error updating profile:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
