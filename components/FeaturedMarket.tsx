"use client";

import { Clock, TrendingUp, Users } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

export default function FeaturedMarket() {
  return (
    <Card className="overflow-hidden border-2 border-blue-500/20 hover:border-blue-500/40 transition-all">
      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <img
              src="https://api.dicebear.com/7.x/shapes/svg?seed=bitcoin"
              alt="Market"
              className="w-12 h-12 rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">
                Will Bitcoin reach $150,000 by end of 2026?
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Ends Dec 31, 2026
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  12,453 traders
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              News
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Bitcoin continues its bullish trend as institutional adoption increases.
              Major financial institutions are now offering crypto services...
            </p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Volume: <span className="font-semibold text-gray-900 dark:text-white">$2.4M</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Annually
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="success" className="w-full">
              Yes 67¢
            </Button>
            <Button variant="danger" className="w-full">
              No 33¢
            </Button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
          <div className="w-full h-64 relative">
            <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 150 Q 50 140 100 120 T 200 80 T 300 60 T 400 50"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
              />
              <path
                d="M 0 150 Q 50 140 100 120 T 200 80 T 300 60 T 400 50 L 400 200 L 0 200 Z"
                fill="url(#gradient)"
              />
            </svg>
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  +15%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
