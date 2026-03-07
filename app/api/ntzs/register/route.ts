import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Register a new nTZS user with username
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ntzsUserId, walletAddress, username, email, phone } = body;

    if (!ntzsUserId || !walletAddress || !username) {
      return NextResponse.json(
        { error: 'ntzsUserId, walletAddress, and username are required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { walletAddress },
          { ntzsUserId },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
      // User exists, return existing user
      return NextResponse.json({ success: true, user: existingUser });
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        ntzsUserId,
        walletAddress,
        username,
        email,
        phone,
      },
    });

    console.log('[nTZS Register] New user registered:', {
      username,
      walletAddress,
      ntzsUserId,
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}

// Get user by username or ntzsUserId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const ntzsUserId = searchParams.get('ntzsUserId');

    if (!username && !ntzsUserId) {
      return NextResponse.json(
        { error: 'username or ntzsUserId is required' },
        { status: 400 }
      );
    }

    if (ntzsUserId) {
      const user = users.get(ntzsUserId);
      if (user) {
        return NextResponse.json(user);
      }
    }

    if (username) {
      for (const [_, user] of users) {
        if (user.username.toLowerCase() === username.toLowerCase()) {
          return NextResponse.json(user);
        }
      }
    }

    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
