"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Trophy, TrendingUp, Medal } from "lucide-react";
import { Card } from "@/components/ui/card";

const leaderboardData = [
  {
    rank: 1,
    username: "cryptoking",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=cryptoking",
    totalPnL: 15420,
    winRate: 78.5,
    trades: 234,
  },
  {
    rank: 2,
    username: "marketmaster",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marketmaster",
    totalPnL: 12850,
    winRate: 72.3,
    trades: 189,
  },
  {
    rank: 3,
    username: "predictpro",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=predictpro",
    totalPnL: 10230,
    winRate: 69.8,
    trades: 156,
  },
  {
    rank: 4,
    username: "tradewizard",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tradewizard",
    totalPnL: 8940,
    winRate: 67.2,
    trades: 143,
  },
  {
    rank: 5,
    username: "betmaster",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=betmaster",
    totalPnL: 7650,
    winRate: 65.4,
    trades: 128,
  },
];

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState("all-time");

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-600" />;
    return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      <div className="pt-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Leaderboard</h1>
            </div>
            
            <div className="flex gap-2">
              {["24h", "7d", "30d", "all-time"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeframe === tf
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {tf === "all-time" ? "All Time" : tf.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trader
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total P&L
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Win Rate
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trades
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {leaderboardData.map((trader) => (
                    <tr
                      key={trader.rank}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-900 ${
                        trader.rank <= 3 ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center w-10">
                          {getRankIcon(trader.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={trader.avatar}
                            alt={trader.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <span className="font-semibold">{trader.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                          <TrendingUp className="h-4 w-4" />
                          ${trader.totalPnL.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${trader.winRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{trader.winRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {trader.trades}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
