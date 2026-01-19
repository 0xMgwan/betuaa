"use client";

import { useState } from "react";
import { Image as ImageIcon, Smile } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const communityIdeas = [
  {
    id: 1,
    user: "sweatybet1024",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sweatybet1024",
    time: "Now",
    content: "cmon China numba one",
    market: {
      title: "Yuan vs Swiatek",
      prediction: "Yes · Yue Yuan",
      yesPrice: 45,
      noPrice: 55,
    },
    likes: 12,
  },
  {
    id: 2,
    user: "cryptowhale",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=cryptowhale",
    time: "2h ago",
    content: "ETF approval is inevitable at this point. Too much institutional pressure.",
    market: {
      title: "Will Ethereum ETF be approved in Q1 2026?",
      prediction: "Yes · ETF Approval",
      yesPrice: 67,
      noPrice: 33,
    },
    likes: 45,
  },
  {
    id: 3,
    user: "sportsanalyst",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sportsanalyst",
    time: "5h ago",
    content: "City's form has been incredible. Can't see them dropping points now.",
    market: {
      title: "Will Manchester City win the Premier League?",
      prediction: "Yes · Man City",
      yesPrice: 72,
      noPrice: 28,
    },
    likes: 28,
  },
];

export default function CommunityIdeas() {
  const [newIdea, setNewIdea] = useState("");
  const [timeFilter, setTimeFilter] = useState("now");

  const timeFilters = [
    { id: "now", label: "Now" },
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
  ];

  return (
    <div>
      {/* Create Idea */}
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-3">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
            alt="User"
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1">
            <input
              type="text"
              placeholder="What's your prediction?"
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Smile className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <Button size="sm" disabled={!newIdea.trim()}>
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Time Filters */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-800">
        {timeFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setTimeFilter(filter.id)}
            className={`pb-3 px-2 font-medium text-sm border-b-2 transition-colors ${
              timeFilter === filter.id
                ? "border-green-500 text-green-600 dark:text-green-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Ideas Feed */}
      <div className="space-y-6">
        {communityIdeas.map((idea) => (
          <div key={idea.id} className="flex gap-3">
            <img
              src={idea.avatar}
              alt={idea.user}
              className="w-12 h-12 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{idea.user}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {idea.time}
                </span>
              </div>
              <p className="mb-3 text-gray-900 dark:text-gray-100">
                {idea.content}
              </p>

              {/* Market Card */}
              <Card className="p-4 border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={idea.avatar}
                    alt="Market"
                    className="w-10 h-10 rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{idea.market.title}</h4>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {idea.market.prediction}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center py-2">
                  <span className="text-4xl font-bold text-gray-400 dark:text-gray-600">
                    BetUAA
                  </span>
                </div>
              </Card>

              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  💬 Reply
                </button>
                <button className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  ❤️ {idea.likes}
                </button>
                <button className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  🔗 Share
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
