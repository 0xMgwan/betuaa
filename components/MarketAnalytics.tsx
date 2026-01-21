'use client';

import { useState } from 'react';
import { TrendingUp, Users, DollarSign, Activity, BarChart3, PieChart } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MarketAnalyticsProps {
  marketId: number;
  totalVolume: number;
  participantCount: number;
  outcomes: Array<{
    name: string;
    price: number;
    totalShares: number;
  }>;
  tokenSymbol?: string;
}

export default function MarketAnalytics({
  marketId,
  totalVolume,
  participantCount,
  outcomes,
  tokenSymbol = 'USDC'
}: MarketAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'depth' | 'volume' | 'traders'>('overview');

  // Generate mock price history data
  const priceHistory = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}h`,
    yes: 45 + Math.random() * 20,
    no: 55 - Math.random() * 20,
  }));

  // Generate mock volume data
  const volumeData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    volume: Math.random() * 1000 + 500,
  }));

  // Market depth data
  const depthData = [
    { price: 30, yesBids: 1200, noBids: 0 },
    { price: 35, yesBids: 1000, noBids: 0 },
    { price: 40, yesBids: 800, noBids: 0 },
    { price: 45, yesBids: 600, noBids: 0 },
    { price: 50, yesBids: 400, noBids: 400 },
    { price: 55, yesBids: 0, noBids: 600 },
    { price: 60, yesBids: 0, noBids: 800 },
    { price: 65, yesBids: 0, noBids: 1000 },
    { price: 70, yesBids: 0, noBids: 1200 },
  ];

  // Trader distribution
  const traderDistribution = [
    { name: 'Whales (>$1000)', value: 15, color: '#3b82f6' },
    { name: 'Medium ($100-$1000)', value: 35, color: '#8b5cf6' },
    { name: 'Retail (<$100)', value: 50, color: '#ec4899' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Total Volume</span>
          </div>
          <p className="text-2xl font-bold">{(totalVolume / 1e6).toFixed(2)} {tokenSymbol}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Traders</span>
          </div>
          <p className="text-2xl font-bold">{participantCount}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Yes Price</span>
          </div>
          <p className="text-2xl font-bold">{outcomes[0]?.price || 50}¢</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Liquidity</span>
          </div>
          <p className="text-2xl font-bold">${(totalVolume / 1e6 * 0.3).toFixed(1)}K</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'depth', label: 'Market Depth', icon: Activity },
          { id: 'volume', label: 'Volume', icon: DollarSign },
          { id: 'traders', label: 'Traders', icon: PieChart },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Price History (24h)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={priceHistory}>
                  <defs>
                    <linearGradient id="colorYes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="yes" stroke="#10b981" fillOpacity={1} fill="url(#colorYes)" name="Yes" />
                  <Area type="monotone" dataKey="no" stroke="#ef4444" fillOpacity={1} fill="url(#colorNo)" name="No" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'depth' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Market Depth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={depthData}>
                <defs>
                  <linearGradient id="yesBids" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="noBids" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="price" label={{ value: 'Price (¢)', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Shares', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="stepAfter" dataKey="yesBids" stroke="#10b981" fill="url(#yesBids)" name="Yes Bids" />
                <Area type="stepAfter" dataKey="noBids" stroke="#ef4444" fill="url(#noBids)" name="No Bids" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Market depth shows the cumulative buy orders at different price levels.
            </p>
          </div>
        )}

        {activeTab === 'volume' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Volume Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="volume" fill="#3b82f6" name="Volume (USDC)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'traders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Trader Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie
                    data={traderDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {traderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Trading Insights</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Average Trade Size</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${(totalVolume / participantCount / 1e6).toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-300">Most Active Hour</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">14:00 UTC</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">Win Rate (Yes)</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {outcomes[0]?.price || 50}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
