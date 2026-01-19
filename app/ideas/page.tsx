"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Home, MessageSquare, Bookmark, User, HelpCircle, FileText, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarketBuilder from "@/components/MarketBuilder";
import CommunityIdeas from "@/components/CommunityIdeas";

export default function IdeasPage() {
  const [activeTab, setActiveTab] = useState("ideas");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      <div className="pt-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 sticky top-24">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-blue-600" />
                  Ideas
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Serving public conversation
                </p>

                <nav className="space-y-2">
                  <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
                    <Home className="h-5 w-5" />
                    <span className="font-medium">Home</span>
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-medium">Replies</span>
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
                    <Bookmark className="h-5 w-5" />
                    <span className="font-medium">Bookmarks</span>
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
                    <User className="h-5 w-5" />
                    <span className="font-medium">Profile</span>
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Community guidelines</span>
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
                    <HelpCircle className="h-5 w-5" />
                    <span className="font-medium">Support</span>
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
                    <HelpCircle className="h-5 w-5" />
                    <span className="font-medium">FAQs</span>
                  </button>
                </nav>

                <Button className="w-full mt-6" size="lg">
                  Post
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-800">
                  <div className="flex gap-8 px-6">
                    <button
                      onClick={() => setActiveTab("ideas")}
                      className={`py-4 font-semibold text-sm border-b-2 transition-colors ${
                        activeTab === "ideas"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      Ideas
                    </button>
                    <button
                      onClick={() => setActiveTab("live")}
                      className={`py-4 font-semibold text-sm border-b-2 transition-colors ${
                        activeTab === "live"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      Live trades
                    </button>
                    <button
                      onClick={() => setActiveTab("builder")}
                      className={`py-4 font-semibold text-sm border-b-2 transition-colors ${
                        activeTab === "builder"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      Market builder
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "ideas" && <CommunityIdeas />}
                  {activeTab === "live" && (
                    <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Live trades will appear here</p>
                    </div>
                  )}
                  {activeTab === "builder" && <MarketBuilder />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
