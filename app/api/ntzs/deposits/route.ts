import { NextRequest, NextResponse } from 'next/server';
import { NtzsClient, NtzsApiError } from '@/lib/ntzs/client';

const ntzs = new NtzsClient({
  apiKey: process.env.NTZS_API_KEY!,
  baseUrl: process.env.NTZS_API_BASE_URL || 'https://api.ntzs.co.tz',
});

// Create a deposit (on-ramp)
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

    const deposit = await ntzs.deposits.create({
      userId,
      amountTzs: Number(amountTzs),
      phone,
    });

    return NextResponse.json(deposit);
  } catch (error) {
    console.error('Error creating deposit:', error);
    
    if (error instanceof NtzsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create deposit' },
      { status: 500 }
    );
  }
}

// Get deposit status or list deposits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const depositId = searchParams.get('depositId');
    const userId = searchParams.get('userId');

    if (depositId) {
      const deposit = await ntzs.deposits.get(depositId);
      console.log(`[deposits GET] Deposit ${depositId} status:`, deposit.status, 'txHash:', deposit.txHash);
      return NextResponse.json(deposit);
    } else if (userId) {
      const deposits = await ntzs.deposits.list(userId);
      return NextResponse.json(deposits);
    } else {
      return NextResponse.json(
        { error: 'depositId or userId is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching deposit:', error);
    
    if (error instanceof NtzsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch deposit' },
      { status: 500 }
    );
  }
}
