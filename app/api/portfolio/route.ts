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
      include: {
        positions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ positions: [] });
    }

    // Format positions for display
    const positions = user.positions.map(p => ({
      id: p.id,
      marketId: p.marketId,
      outcomeIndex: p.outcomeIndex,
      outcomeName: p.outcomeIndex === 0 ? 'YES' : 'NO',
      shares: p.shares,
      costTzs: p.costTzs,
      currentValue: p.costTzs, // TODO: Calculate current value based on market prices
      pnl: 0, // TODO: Calculate P&L
    }));

    return NextResponse.json({ positions });
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}
