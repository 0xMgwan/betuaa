"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, Users, Zap } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

interface MarketCardProps {
  title: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  endDate: string;
  participants: number;
  trend: "up" | "down";
  index: number;
  description?: string;
}

export default function MarketCard({
  title,
  category,
  yesPrice,
  noPrice,
  volume,
  endDate,
  participants,
  trend,
  index,
  description = "",
}: MarketCardProps) {
  const isPythMarket = description?.includes("[PYTH]");
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {category}
                </span>
                {isPythMarket && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <Zap className="w-3 h-3" />
                    Auto-resolves
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                {title}
              </h3>
            </div>
            {trend === "up" ? (
              <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500 flex-shrink-0 ml-2" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                YES
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {yesPrice}¢
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                NO
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {noPrice}¢
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{endDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{participants.toLocaleString()}</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Volume</span>
              <span className="font-semibold">{volume}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                style={{ width: `${yesPrice}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="success" className="w-full">
              Buy YES
            </Button>
            <Button variant="danger" className="w-full">
              Buy NO
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
