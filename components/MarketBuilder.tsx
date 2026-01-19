"use client";

import { useState } from "react";
import { Calendar, DollarSign, Users, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export default function MarketBuilder() {
  const [formData, setFormData] = useState({
    question: "",
    category: "crypto",
    description: "",
    endDate: "",
    initialLiquidity: "",
    resolutionSource: "",
  });

  const categories = [
    "Crypto",
    "Sports",
    "Politics",
    "Technology",
    "Business",
    "Climate",
    "Entertainment",
    "Science",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Market created:", formData);
    // Handle market creation
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Create Your Prediction Market</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Set up a new market for the community to trade on
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Market Question *
          </label>
          <input
            type="text"
            placeholder="What's your prediction? e.g., Will Bitcoin reach $150k by 2026?"
            value={formData.question}
            onChange={(e) =>
              setFormData({ ...formData, question: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat.toLowerCase()}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Description
          </label>
          <textarea
            placeholder="Provide context and details about this market..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Market End Date *
          </label>
          <input
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            When should this market close for trading?
          </p>
        </div>

        {/* Initial Liquidity */}
        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Initial Liquidity (Optional)
          </label>
          <input
            type="number"
            placeholder="1000"
            value={formData.initialLiquidity}
            onChange={(e) =>
              setFormData({ ...formData, initialLiquidity: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Amount you want to provide as initial liquidity (in USDC)
          </p>
        </div>

        {/* Resolution Source */}
        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Resolution Source *
          </label>
          <input
            type="text"
            placeholder="e.g., CoinMarketCap, Official announcement, etc."
            value={formData.resolutionSource}
            onChange={(e) =>
              setFormData({ ...formData, resolutionSource: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            What source will be used to determine the outcome?
          </p>
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">Market Creation Guidelines</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Questions must be clear and unambiguous</li>
                <li>Resolution criteria must be objective and verifiable</li>
                <li>Markets are subject to community review</li>
                <li>Inappropriate markets will be removed</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" size="lg" className="flex-1">
            Create Market
          </Button>
          <Button type="button" variant="outline" size="lg" className="flex-1">
            Save as Draft
          </Button>
        </div>
      </form>
    </div>
  );
}
