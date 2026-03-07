import { NextRequest, NextResponse } from 'next/server';
import { NtzsClient, NtzsApiError } from '@/lib/ntzs/client';

const ntzs = new NtzsClient({
  apiKey: process.env.NTZS_API_KEY!,
  baseUrl: process.env.NTZS_API_BASE_URL || 'https://api.ntzs.co.tz',
});

// Create a new nTZS user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { externalId, email, phone } = body;

    if (!externalId || !email) {
      return NextResponse.json(
        { error: 'externalId and email are required' },
        { status: 400 }
      );
    }

    const user = await ntzs.users.create({
      externalId,
      email,
      phone,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating nTZS user:', error);
    
    if (error instanceof NtzsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// Get user by external ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const externalId = searchParams.get('externalId');
    const userId = searchParams.get('userId');

    if (!externalId && !userId) {
      return NextResponse.json(
        { error: 'externalId or userId is required' },
        { status: 400 }
      );
    }

    let user;
    if (externalId) {
      user = await ntzs.users.getByExternalId(externalId);
    } else if (userId) {
      user = await ntzs.users.get(userId);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching nTZS user:', error);
    
    if (error instanceof NtzsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
