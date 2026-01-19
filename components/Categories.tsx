"use client";

import { motion } from "framer-motion";
import {
  Bitcoin,
  Trophy,
  Rocket,
  Briefcase,
  Zap,
  Globe,
  Cpu,
  Heart,
} from "lucide-react";

const categories = [
  { name: "Crypto", icon: Bitcoin, count: 1234, color: "from-orange-500 to-yellow-500" },
  { name: "Sports", icon: Trophy, count: 892, color: "from-green-500 to-emerald-500" },
  { name: "Space", icon: Rocket, count: 456, color: "from-blue-500 to-cyan-500" },
  { name: "Business", icon: Briefcase, count: 678, color: "from-purple-500 to-pink-500" },
  { name: "Technology", icon: Cpu, count: 1567, color: "from-indigo-500 to-blue-500" },
  { name: "Politics", icon: Globe, count: 789, color: "from-red-500 to-pink-500" },
  { name: "Entertainment", icon: Zap, count: 543, color: "from-yellow-500 to-orange-500" },
  { name: "Health", icon: Heart, count: 321, color: "from-pink-500 to-rose-500" },
];

export default function Categories() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Explore Categories
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Find markets across diverse topics
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500/50 group"
              >
                <div className={`bg-gradient-to-br ${category.color} p-4 rounded-xl mb-4 mx-auto w-fit group-hover:scale-110 transition-transform`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {category.count.toLocaleString()} markets
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
