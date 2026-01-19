"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";

const positions = [
  {
    id: 1,
    market: "Will Bitcoin reach $150,000 by end of 2026?",
    position: "Yes",
    shares: 100,
    avgPrice: 0.67,
    currentPrice: 0.72,
    value: 72,
    pnl: 5,
    pnlPercent: 7.46,
    status: "active",
  },
  {
    id: 2,
    market: "Will Manchester City win the Premier League 2025/26?",
    position: "Yes",
    shares: 50,
    avgPrice: 0.68,
    currentPrice: 0.72,
    value: 36,
    pnl: 2,
    pnlPercent: 5.88,
    status: "active",
  },
  {
    id: 3,
    market: "Will Trump win the 2026 midterm elections?",
    position: "No",
    shares: 75,
    avgPrice: 0.42,
    currentPrice: 0.38,
    value: 28.5,
    pnl: -3,
    pnlPercent: -9.52,
    status: "active",
  },
];

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState("positions");
  
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      <div className="pt-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-6">Portfolio</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total P&L</span>
                {totalPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Positions</span>
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold">{positions.length}</div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("positions")}
                className={`py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === "positions"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                Active Positions
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === "history"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                Trade History
              </button>
            </div>
          </div>

          {/* Positions Table */}
          {activeTab === "positions" && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Market
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Shares
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Avg Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Current
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        P&L
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {positions.map((position) => (
                      <tr key={position.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="px-6 py-4 text-sm font-medium">{position.market}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            position.position === 'Yes' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {position.position}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{position.shares}</td>
                        <td className="px-6 py-4 text-sm">${position.avgPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm">${position.currentPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-semibold">${position.value.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className={`font-semibold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)}
                            <span className="text-xs ml-1">
                              ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === "history" && (
            <Card className="p-12 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">No trade history yet</p>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
