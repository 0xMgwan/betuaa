"use client";

import { Clock, TrendingUp, Users, Sparkles } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { motion } from "framer-motion";

export default function FeaturedMarket() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border border-blue-200/50 dark:border-blue-700/50 bg-gradient-to-br from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 backdrop-blur-xl shadow-2xl hover:shadow-3xl hover:shadow-blue-500/20 dark:hover:shadow-blue-500/30 transition-all duration-300 relative overflow-hidden group">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500" />
        
        <div className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="p-3 md:p-4">
              <motion.div 
                className="flex items-center gap-2.5 mb-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.img
                  src="https://api.dicebear.com/7.x/shapes/svg?seed=bitcoin"
                  alt="Market"
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg shadow-lg flex-shrink-0"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-black mb-1 line-clamp-2 text-gray-900 dark:text-white leading-snug">
                    Will Bitcoin reach $150,000 by end of 2026?
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <motion.span 
                      className="flex items-center gap-1 px-2 py-0.5 bg-blue-100/60 dark:bg-blue-900/40 rounded text-[11px] md:text-xs font-semibold text-blue-700 dark:text-blue-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Clock className="h-3 w-3" />
                      Ends Dec 31
                    </motion.span>
                    <motion.span 
                      className="flex items-center gap-1 px-2 py-0.5 bg-purple-100/60 dark:bg-purple-900/40 rounded text-[11px] md:text-xs font-semibold text-purple-700 dark:text-purple-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Users className="h-3 w-3" />
                      12.4K
                    </motion.span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="mb-2.5 p-2.5 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-[10px] md:text-[11px] font-black text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  📰 News
                </div>
                <p className="text-xs md:text-sm text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">
                  Bitcoin continues its bullish trend as institutional adoption increases.
                </p>
              </motion.div>

              <motion.div 
                className="flex items-center justify-between mb-3 p-2.5 bg-gradient-to-r from-amber-100/40 to-orange-100/40 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div>
                  <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-0.5">Volume</div>
                  <div className="text-lg md:text-xl font-black text-gray-900 dark:text-white">
                    $2.4M
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-0.5">Freq</div>
                  <div className="text-sm md:text-base font-black text-gray-900 dark:text-white">Annual</div>
                </div>
              </motion.div>

              <motion.div 
                className="grid grid-cols-2 gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="success" className="w-full font-black text-sm md:text-base py-2 md:py-3 shadow-lg hover:shadow-xl">
                    Yes 67¢
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="danger" className="w-full font-black text-sm md:text-base py-2 md:py-3 shadow-lg hover:shadow-xl">
                    No 33¢
                  </Button>
                </motion.div>
              </motion.div>
            </div>

            <motion.div 
              className="hidden md:flex bg-gradient-to-br from-blue-100/60 via-purple-100/60 to-pink-100/60 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 backdrop-blur-sm p-4 items-center justify-center relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-full h-48 relative">
                <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 150 Q 50 140 100 120 T 200 80 T 300 60 T 400 50"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 0 150 Q 50 140 100 120 T 200 80 T 300 60 T 400 50 L 400 200 L 0 200 Z"
                    fill="url(#gradient)"
                  />
                </svg>
                <motion.div 
                  className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-xl px-4 py-2.5 shadow-xl border border-green-200/50 dark:border-green-700/50"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </motion.div>
                    <span className="text-sm font-black text-green-600 dark:text-green-400">
                      +15%
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
