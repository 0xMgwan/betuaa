import { NextRequest, NextResponse } from 'next/server';
import { createOrGetUser, createTransfer } from '@/lib/ntzs';
import { PLATFORM_ADDRESS } from '@/lib/platform-wallet';

export async function POST(req: NextRequest) {
  try {
    const { userAddress, amountTzs } = await req.json();

    console.log(`[test-transfer] Creating transfer: ${amountTzs} TZS from ${userAddress} to platform ${PLATFORM_ADDRESS}`);

    // Get both users
    const user = await createOrGetUser({ walletAddress: userAddress });
    console.log(`[test-transfer] User:`, user);

    const platformUser = await createOrGetUser({ walletAddress: PLATFORM_ADDRESS! });
    console.log(`[test-transfer] Platform user:`, platformUser);

    // Create transfer
    const transfer = await createTransfer({
      fromUserId: user.id,
      toUserId: platformUser.id,
      amountTzs,
    });

    console.log(`[test-transfer] Transfer created:`, transfer);

    return NextResponse.json({
      success: true,
      transfer,
      user,
      platformUser,
    });
  } catch (err: any) {
    console.error('[test-transfer] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
