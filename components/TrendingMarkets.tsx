"use client";

import MarketCard from "./MarketCard";

const trendingMarkets = [
  {
    title: "Will Bitcoin reach $150,000 by end of 2026?",
    category: "Crypto",
    yesPrice: 67,
    noPrice: 33,
    volume: "$2.4M",
    endDate: "Dec 31, 2026",
    participants: 12453,
    trend: "up" as const,
  },
  {
    title: "Will Ethereum ETF be approved in Q1 2026?",
    category: "Crypto",
    yesPrice: 45,
    noPrice: 55,
    volume: "$1.8M",
    endDate: "Mar 31, 2026",
    participants: 8921,
    trend: "down" as const,
  },
  {
    title: "Will AI replace 50% of coding jobs by 2030?",
    category: "Technology",
    yesPrice: 38,
    noPrice: 62,
    volume: "$980K",
    endDate: "Dec 31, 2030",
    participants: 15234,
    trend: "up" as const,
  },
  {
    title: "Will Manchester City win the Premier League 2025/26?",
    category: "Sports",
    yesPrice: 72,
    noPrice: 28,
    volume: "$3.2M",
    endDate: "May 24, 2026",
    participants: 23456,
    trend: "up" as const,
  },
  {
    title: "Will global temperatures rise by 1.5°C by 2027?",
    category: "Climate",
    yesPrice: 81,
    noPrice: 19,
    volume: "$1.5M",
    endDate: "Dec 31, 2027",
    participants: 6789,
    trend: "up" as const,
  },
  {
    title: "Will SpaceX land humans on Mars by 2030?",
    category: "Space",
    yesPrice: 23,
    noPrice: 77,
    volume: "$2.1M",
    endDate: "Dec 31, 2030",
    participants: 18765,
    trend: "down" as const,
  },
];

export default function TrendingMarkets() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Trending Markets
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Most active prediction markets right now
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingMarkets.map((market, index) => (
            <MarketCard key={index} {...market} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
