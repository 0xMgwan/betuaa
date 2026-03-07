import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const timeframe = req.nextUrl.searchParams.get('timeframe') || 'week';

    // Calculate date filter based on timeframe
    let dateFilter: Date | undefined;
    const now = new Date();
    
    switch (timeframe) {
      case 'day':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        dateFilter = undefined;
    }

    // Get all users with their trades
    const users = await prisma.user.findMany({
      include: {
        trades: {
          where: dateFilter ? { createdAt: { gte: dateFilter } } : undefined,
        },
      },
    });

    interface LeaderStats {
      username: string;
      walletAddress: string;
      totalPnL: number;
      winRate: number;
      totalTrades: number;
    }

    // Calculate stats for each user
    const leaders = users
      .map((user): LeaderStats | null => {
        const trades = user.trades;
        const totalTrades = trades.length;
        
        if (totalTrades === 0) return null;

        const totalPnL = trades.reduce((sum: number, t) => {
          // TODO: Calculate actual P&L based on trade outcomes
          return sum + (t.type === 'SELL' ? t.amountTzs : -t.amountTzs);
        }, 0);

        const winningTrades = trades.filter((t) => t.type === 'SELL' && t.amountTzs > 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

        return {
          username: user.username,
          walletAddress: user.walletAddress,
          totalPnL,
          winRate,
          totalTrades,
        };
      })
      .filter((leader): leader is LeaderStats => leader !== null)
      .sort((a, b) => b.totalPnL - a.totalPnL)
      .slice(0, 100)
      .map((leader, index) => ({
        ...leader,
        rank: index + 1,
      }));

    return NextResponse.json({ leaders });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
