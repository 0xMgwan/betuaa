"use client";

import { motion } from "framer-motion";
import { TrendingUp, Zap, Shield, Users } from "lucide-react";
import { Button } from "./ui/button";

export default function Hero() {
  return (
    <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-white dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20" />
      
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6 border border-blue-500/20"
          >
            <Zap className="h-4 w-4 fill-blue-600 dark:fill-blue-400" />
            <span className="text-sm font-semibold tracking-wide">Live Predictions Market</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.95] tracking-tight">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="block bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text text-transparent"
            >
              Predict.
            </motion.span>
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="block bg-gradient-to-r from-purple-600 via-blue-600 to-blue-700 bg-clip-text text-transparent"
            >
              Trade.
            </motion.span>
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="block bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent"
            >
              Win.
            </motion.span>
          </h1>

          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
            Join the future of decentralized predictions. Trade on real-world events,
            sports, crypto, and more with blockchain-powered transparency.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-sm px-8 h-12 font-semibold shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30">
              Start Trading
            </Button>
            <Button size="lg" variant="outline" className="text-sm px-8 h-12 font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-900">
              Explore Markets
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl mb-3 shadow-lg shadow-blue-500/30">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-sm font-bold mb-1.5 text-gray-900 dark:text-white">Real-Time Markets</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                Trade on live events with instant settlement
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl mb-3 shadow-lg shadow-purple-500/30">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-sm font-bold mb-1.5 text-gray-900 dark:text-white">Secure & Transparent</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                Blockchain-verified outcomes and payouts
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center"
            >
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-4 rounded-2xl mb-3 shadow-lg shadow-pink-500/30">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-sm font-bold mb-1.5 text-gray-900 dark:text-white">Community Driven</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                Join thousands of traders worldwide
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
