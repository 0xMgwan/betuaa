import { NextRequest, NextResponse } from 'next/server';
import { NtzsClient, NtzsApiError } from '@/lib/ntzs/client';

const ntzs = new NtzsClient({
  apiKey: process.env.NTZS_API_KEY!,
  baseUrl: process.env.NTZS_API_BASE_URL || 'https://api.ntzs.co.tz',
});

// Create a withdrawal (off-ramp)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amountTzs, phone } = body;

    if (!userId || !amountTzs || !phone) {
      return NextResponse.json(
        { error: 'userId, amountTzs, and phone are required' },
        { status: 400 }
      );
    }

    const withdrawal = await ntzs.withdrawals.create({
      userId,
      amountTzs: Number(amountTzs),
      phone,
    });

    return NextResponse.json(withdrawal);
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    
    if (error instanceof NtzsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create withdrawal' },
      { status: 500 }
    );
  }
}

// Get withdrawal status or list withdrawals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const withdrawalId = searchParams.get('withdrawalId');
    const userId = searchParams.get('userId');

    if (withdrawalId) {
      const withdrawal = await ntzs.withdrawals.get(withdrawalId);
      return NextResponse.json(withdrawal);
    } else if (userId) {
      const withdrawals = await ntzs.withdrawals.list(userId);
      return NextResponse.json(withdrawals);
    } else {
      return NextResponse.json(
        { error: 'withdrawalId or userId is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching withdrawal:', error);
    
    if (error instanceof NtzsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch withdrawal' },
      { status: 500 }
    );
  }
}
