"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import CategoryTabs from "@/components/CategoryTabs";
import FeaturedMarket from "@/components/FeaturedMarket";
import CompactMarketCard from "@/components/CompactMarketCard";
import ActivityFeed from "@/components/ActivityFeed";
import Footer from "@/components/Footer";
import { generatePriceHistory } from "@/lib/generatePriceHistory";
import { BlockchainMarket, useAllMarkets } from "@/hooks/useMarkets";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useTranslation } from "@/hooks/useTranslation";
import TradingModal from "@/components/TradingModal";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { STABLECOINS } from '@/lib/contracts';
import { extractCategory } from '@/lib/categoryUtils';
// Lazy load heavy components
const BlockchainMarketModal = dynamic(() => import("@/components/BlockchainMarketModal"), { ssr: false });

export default function Home() {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedBlockchainMarket, setSelectedBlockchainMarket] = useState<BlockchainMarket | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const { activities } = useActivityFeed();
  const { markets: blockchainMarkets, isLoading: isLoadingBlockchain } = useAllMarkets();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'closing' | 'created' | 'activity'>('created');
  const [showFilters, setShowFilters] = useState(false);

  // Centralized modal state
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<{ marketId: number; outcomeId: number; outcomeName: string; price: number; paymentToken: string } | null>(null);
  
  // Pagination state for blockchain markets (keep for blockchain markets only)
  const [blockchainPage, setBlockchainPage] = useState(1);
  const BLOCKCHAIN_PER_PAGE = 12;

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showConnectPrompt || showTradingModal || selectedBlockchainMarket) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConnectPrompt, showTradingModal, selectedBlockchainMarket]);

  // Handle trade click from cards
  const handleTradeClick = (marketId: number, outcomeId: number, outcomeName: string, price: number, paymentToken: string) => {
    if (!isConnected) {
      setShowConnectPrompt(true);
      return;
    }
    
    setSelectedTrade({ marketId, outcomeId, outcomeName, price, paymentToken });
    setShowTradingModal(true);
  };

  const displayedBlockchainMarkets = useMemo(() => {
    let markets = [...blockchainMarkets];
    
    // Apply category filter
    if (activeCategory && activeCategory !== 'all' && activeCategory !== 'trending') {
      // Map tab IDs to extractCategory values
      const categoryMap: Record<string, string[]> = {
        crypto: ['crypto'],
        sports: ['sports'],
        politics: ['politics'],
        business: ['other'],
        tech: ['technology'],
        climate: ['other'],
        new: [], // handled separately below
      };
      
      if (activeCategory === 'new') {
        // "New" = most recently created markets (last 7 days)
        const oneWeekAgo = Date.now() / 1000 - 7 * 24 * 60 * 60;
        markets = markets.filter(market => market.id > 0); // all are "new" for now, sorted by id desc later
        markets.sort((a, b) => b.id - a.id);
      } else {
        const matchCategories = categoryMap[activeCategory];
        if (matchCategories && matchCategories.length > 0) {
          markets = markets.filter(market => {
            const marketCategory = extractCategory(market.description);
            return matchCategories.includes(marketCategory);
          });
        }
      }
    }
    
    // "Trending" = sort by volume
    if (activeCategory === 'trending') {
      markets.sort((a, b) => Number(b.totalVolume) - Number(a.totalVolume));
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      markets = markets.filter(market => 
        market.title.toLowerCase().includes(query) ||
        market.description.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const now = new Date();
      markets = markets.filter(market => {
        const closingDate = new Date(Number(market.closingDate) * 1000);
        const isActive = closingDate > now && !market.resolved;
        const isClosed = closingDate <= now && !market.resolved;
        const isResolved = market.resolved;
        
        if (statusFilter === 'active') return isActive;
        if (statusFilter === 'closed') return isClosed;
        if (statusFilter === 'resolved') return isResolved;
        return true;
      });
    }
    
    // Apply sorting (unless already sorted by category logic)
    if (activeCategory !== 'trending' && activeCategory !== 'new') {
      markets = [...markets].sort((a, b) => {
        if (sortBy === 'volume') {
          return Number(b.totalVolume) - Number(a.totalVolume);
        }
        if (sortBy === 'closing') {
          return Number(a.closingDate) - Number(b.closingDate);
        }
        if (sortBy === 'created') {
          return b.id - a.id;
        }
        if (sortBy === 'activity') {
          return b.participantCount - a.participantCount;
        }
        return 0;
      });
    }
    
    // Apply pagination - only show current page
    const startIdx = (blockchainPage - 1) * BLOCKCHAIN_PER_PAGE;
    const endIdx = startIdx + BLOCKCHAIN_PER_PAGE;
    return markets.slice(startIdx, endIdx);
  }, [blockchainMarkets, activeCategory, searchQuery, statusFilter, sortBy, blockchainPage]);


  useEffect(() => {
    console.log('✅ Category changed to:', activeCategory);
    setRenderKey(prev => prev + 1);
    setBlockchainPage(1);
  }, [activeCategory]);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16 md:pb-0">
      <Navbar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <div className="md:pt-16">
        <div className="hidden md:block">
          <CategoryTabs 
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-[180px] md:pt-0 pb-3 md:pb-8">
          <div className="mb-4 md:mb-0 hidden md:block">
            <FeaturedMarket />
          </div>
          
          {/* Main Content Grid */}
          <div className="mt-0 md:mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Markets Section */}
            <div className="lg:col-span-2">
              {/* Blockchain Markets - using same card format */}
              {displayedBlockchainMarkets.length > 0 && (
                <div className="mb-0 md:mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                      Created Markets
                    </h3>
                    <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      {displayedBlockchainMarkets.length} markets
                    </span>
                  </div>
                  
                  {/* First 3 markets - horizontal scroll on mobile */}
                  {displayedBlockchainMarkets.length > 0 && (
                    <div className="mb-3 md:mb-6 overflow-x-auto scrollbar-hide md:hidden">
                      <div className="flex gap-3 pb-2">
                        {displayedBlockchainMarkets.slice(0, 3).map((market) => {
                          const closingDate = new Date(Number(market.closingDate) * 1000);
                          const isActive = closingDate > new Date() && !market.resolved;
                          
                          return (
                            <div key={market.id} className="flex-shrink-0 w-[85vw]">
                              <CompactMarketCard
                                id={market.id}
                                question={market.title}
                                category="CRYPTO"
                                yesPrice={0.50}
                                noPrice={0.50}
                                volume={(() => { const vol = Number(market.totalVolume) / 1e6; return vol >= 1000 ? `${(vol / 1000).toFixed(1)}K USDC` : `${vol.toFixed(2)} USDC`; })()}
                                endDate={closingDate.toLocaleDateString()}
                                trend="up"
                                priceHistory={generatePriceHistory(50, 50)}
                                onClick={() => setSelectedBlockchainMarket(market)}
                                onTradeClick={handleTradeClick}
                                isBlockchain={true}
                                status={market.resolved ? 'resolved' : isActive ? 'active' : 'closed'}
                                description={market.description}
                                paymentToken={market.paymentToken}
                                image={market.image}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Desktop grid - all markets */}
                  <div className="hidden md:grid grid-cols-2 gap-6">
                    {displayedBlockchainMarkets.map((market) => {
                      const closingDate = new Date(Number(market.closingDate) * 1000);
                      const isActive = closingDate > new Date() && !market.resolved;
                      
                      return (
                        <div key={market.id} onClick={() => setSelectedBlockchainMarket(market)}>
                          <CompactMarketCard
                            id={market.id}
                            question={market.title}
                            category="CRYPTO"
                            yesPrice={0.50}
                            noPrice={0.50}
                            volume={(() => { const vol = Number(market.totalVolume) / 1e6; return vol >= 1000 ? `${(vol / 1000).toFixed(1)}K USDC` : `${vol.toFixed(2)} USDC`; })()}
                            endDate={closingDate.toLocaleDateString()}
                            trend="up"
                            priceHistory={generatePriceHistory(50, 50)}
                            onClick={() => setSelectedBlockchainMarket(market)}
                            onTradeClick={handleTradeClick}
                            isBlockchain={true}
                            status={market.resolved ? 'resolved' : isActive ? 'active' : 'closed'}
                            description={market.description}
                            paymentToken={market.paymentToken}
                            image={market.image}
                          />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Remaining markets on mobile - vertical list */}
                  {displayedBlockchainMarkets.length > 3 && (
                    <div className="md:hidden grid grid-cols-1 gap-3">
                      {displayedBlockchainMarkets.slice(3).map((market) => {
                        const closingDate = new Date(Number(market.closingDate) * 1000);
                        const isActive = closingDate > new Date() && !market.resolved;
                        
                        return (
                          <div key={market.id} onClick={() => setSelectedBlockchainMarket(market)}>
                            <CompactMarketCard
                              id={market.id}
                              question={market.title}
                              category="CRYPTO"
                              yesPrice={0.50}
                              noPrice={0.50}
                              volume={(() => { const vol = Number(market.totalVolume) / 1e6; return vol >= 1000 ? `${(vol / 1000).toFixed(1)}K USDC` : `${vol.toFixed(2)} USDC`; })()}
                              endDate={closingDate.toLocaleDateString()}
                              trend="up"
                              priceHistory={generatePriceHistory(50, 50)}
                              onClick={() => setSelectedBlockchainMarket(market)}
                              onTradeClick={handleTradeClick}
                              isBlockchain={true}
                              status={market.resolved ? 'resolved' : isActive ? 'active' : 'closed'}
                              description={market.description}
                              paymentToken={market.paymentToken}
                              image={market.image}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 md:mt-8">
                {/* Results Count */}
                <div className="mb-3 md:mb-4 flex items-center justify-between">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    {displayedBlockchainMarkets.length} {displayedBlockchainMarkets.length === 1 ? 'market' : 'markets'} found
                  </p>
                </div>

                {/* Empty State */}
                {displayedBlockchainMarkets.length === 0 && (
                  <div className="text-center py-8 md:py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg mb-2">
                      No markets found
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                      Try adjusting your filters or search query
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Feed Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {t('activity.recentActivity')}
                  </h2>
                  <ActivityFeed activities={activities} maxItems={8} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      
      {selectedBlockchainMarket && (
        <BlockchainMarketModal
          isOpen={!!selectedBlockchainMarket}
          onClose={() => setSelectedBlockchainMarket(null)}
          market={selectedBlockchainMarket}
        />
      )}

      {/* Centralized Connect Wallet Prompt */}
      {showConnectPrompt && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-md" onClick={() => setShowConnectPrompt(false)} style={{ willChange: 'opacity' }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full border-2 border-gray-200 dark:border-gray-700 shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ willChange: 'transform' }}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Connect Wallet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please connect your wallet to start trading on this market.
            </p>
            <div className="flex flex-col gap-2">
              <ConnectButton />
              <button
                onClick={() => setShowConnectPrompt(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centralized Trading Modal */}
      {selectedTrade && (
        <TradingModal
          isOpen={showTradingModal}
          onClose={() => {
            setShowTradingModal(false);
            setSelectedTrade(null);
          }}
          marketId={selectedTrade.marketId}
          outcomeId={selectedTrade.outcomeId}
          outcomeName={selectedTrade.outcomeName}
          currentPrice={selectedTrade.price}
          paymentToken={selectedTrade.paymentToken}
          tokenSymbol={STABLECOINS.baseSepolia.find(t => t.address.toLowerCase() === selectedTrade.paymentToken.toLowerCase())?.symbol || 'USDC'}
          tokenDecimals={STABLECOINS.baseSepolia.find(t => t.address.toLowerCase() === selectedTrade.paymentToken.toLowerCase())?.decimals || 6}
        />
      )}

    </div>
  );
}
