"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, Activity } from "lucide-react";

const stats = [
  {
    icon: DollarSign,
    value: "$124M",
    label: "Total Volume",
    change: "+23%",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: TrendingUp,
    value: "15,234",
    label: "Active Markets",
    change: "+12%",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Users,
    value: "89K+",
    label: "Traders",
    change: "+45%",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Activity,
    value: "99.8%",
    label: "Uptime",
    change: "Stable",
    color: "from-orange-500 to-red-500",
  },
];

export default function Stats() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {stat.change}
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
