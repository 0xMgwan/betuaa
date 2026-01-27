// Map Polymarket categories to our category system

export const POLYMARKET_CATEGORY_MAP: Record<string, string> = {
  // Crypto related
  'crypto': 'crypto',
  'cryptocurrency': 'crypto',
  'bitcoin': 'crypto',
  'ethereum': 'crypto',
  'defi': 'crypto',
  'web3': 'crypto',
  'blockchain': 'crypto',
  'nft': 'crypto',
  'solana': 'crypto',
  'cardano': 'crypto',
  'ripple': 'crypto',
  'xrp': 'crypto',
  'dogecoin': 'crypto',
  'litecoin': 'crypto',
  'polygon': 'crypto',
  'arbitrum': 'crypto',
  'optimism': 'crypto',
  'base': 'crypto',
  'coinbase': 'crypto',
  'kraken': 'crypto',
  'binance': 'crypto',
  
  // Sports
  'sports': 'sports',
  'football': 'sports',
  'basketball': 'sports',
  'soccer': 'sports',
  'nfl': 'sports',
  'nba': 'sports',
  'baseball': 'sports',
  'tennis': 'sports',
  'mma': 'sports',
  'ufc': 'sports',
  'nhl': 'sports',
  'mlb': 'sports',
  'premier-league': 'sports',
  'champions-league': 'sports',
  'world-cup': 'sports',
  'olympics': 'sports',
  'super-bowl': 'sports',
  'nba-finals': 'sports',
  'stanley-cup': 'sports',
  'wimbledon': 'sports',
  'golf': 'sports',
  'boxing': 'sports',
  'wrestling': 'sports',
  'esports': 'sports',
  
  // Politics
  'politics': 'politics',
  'us-current-affairs': 'politics',
  'us-politics': 'politics',
  'election': 'politics',
  'presidential': 'politics',
  'government': 'politics',
  'congress': 'politics',
  'senate': 'politics',
  'house': 'politics',
  'supreme-court': 'politics',
  'international-affairs': 'politics',
  'geopolitics': 'politics',
  'brexit': 'politics',
  'uk-politics': 'politics',
  'eu': 'politics',
  'china': 'politics',
  'russia': 'politics',
  'war': 'politics',
  'conflict': 'politics',
  'diplomacy': 'politics',
  
  // Business/Economics
  'business': 'business',
  'economics': 'business',
  'finance': 'business',
  'stocks': 'business',
  'markets': 'business',
  'trading': 'business',
  'investment': 'business',
  'real-estate': 'business',
  'startup': 'business',
  'ipo': 'business',
  'merger': 'business',
  'acquisition': 'business',
  'inflation': 'business',
  'recession': 'business',
  'gdp': 'business',
  'unemployment': 'business',
  'interest-rates': 'business',
  'fed': 'business',
  'central-bank': 'business',
  'dollar': 'business',
  'forex': 'business',
  'commodities': 'business',
  'oil': 'business',
  'gold': 'business',
  'silver': 'business',
  
  // Tech
  'tech': 'tech',
  'technology': 'tech',
  'ai': 'tech',
  'artificial-intelligence': 'tech',
  'machine-learning': 'tech',
  'science': 'tech',
  'innovation': 'tech',
  'startup-tech': 'tech',
  'apple': 'tech',
  'google': 'tech',
  'microsoft': 'tech',
  'amazon': 'tech',
  'meta': 'tech',
  'tesla': 'tech',
  'spacex': 'tech',
  'openai': 'tech',
  'chatgpt': 'tech',
  'quantum': 'tech',
  'semiconductor': 'tech',
  'chip': 'tech',
  'software': 'tech',
  'hardware': 'tech',
  'internet': 'tech',
  'telecom': 'tech',
  '5g': 'tech',
  'space': 'tech',
  'moon': 'tech',
  'mars': 'tech',
  
  // Entertainment
  'pop-culture': 'entertainment',
  'entertainment': 'entertainment',
  'movies': 'entertainment',
  'music': 'entertainment',
  'celebrity': 'entertainment',
  'tv': 'entertainment',
  'streaming': 'entertainment',
  'netflix': 'entertainment',
  'disney': 'entertainment',
  'hollywood': 'entertainment',
  'oscars': 'entertainment',
  'grammys': 'entertainment',
  'emmys': 'entertainment',
  'awards': 'entertainment',
  'celebrity-news': 'entertainment',
  'celebrity-gossip': 'entertainment',
  'reality-tv': 'entertainment',
  'gaming': 'entertainment',
  'video-games': 'entertainment',
  'twitch': 'entertainment',
  'youtube': 'entertainment',
  'social-media': 'entertainment',
  'tiktok': 'entertainment',
  'instagram': 'entertainment',
  'twitter': 'entertainment',
  'x': 'entertainment',
  'reddit': 'entertainment',
  
  // Other/Misc
  'coronavirus': 'other',
  'covid': 'other',
  'covid-19': 'other',
  'pandemic': 'other',
  'health': 'other',
  'medicine': 'other',
  'vaccine': 'other',
  'climate': 'other',
  'climate-change': 'other',
  'environment': 'other',
  'weather': 'other',
  'natural-disaster': 'other',
  'earthquake': 'other',
  'hurricane': 'other',
  'tornado': 'other',
  'flood': 'other',
  'fire': 'other',
  'miscellaneous': 'other',
  'other': 'other',
};

export function mapPolymarketCategory(polymarketCategory: string): string {
  const normalized = polymarketCategory.toLowerCase().trim();
  return POLYMARKET_CATEGORY_MAP[normalized] || 'other';
}

export function categorizePolymarketMarket(market: any): string {
  // Try to get category from tags first - check all tags, not just the first one
  if (market.tags && Array.isArray(market.tags) && market.tags.length > 0) {
    for (const tag of market.tags) {
      const tagLabel = typeof tag === 'string' ? tag : (tag.label || tag.slug);
      if (tagLabel) {
        const category = mapPolymarketCategory(tagLabel);
        if (category !== 'other') {
          return category;
        }
      }
    }
  }
  
  // Try category field
  if (market.category) {
    const category = mapPolymarketCategory(market.category);
    if (category !== 'other') {
      return category;
    }
  }
  
  // Try to infer from question text
  const question = (market.question || '').toLowerCase();
  const description = (market.description || '').toLowerCase();
  const fullText = question + ' ' + description;
  
  // Crypto keywords
  if (fullText.includes('bitcoin') || fullText.includes('crypto') || fullText.includes('ethereum') || 
      fullText.includes('blockchain') || fullText.includes('defi') || fullText.includes('nft') ||
      fullText.includes('solana') || fullText.includes('cardano') || fullText.includes('polygon') ||
      fullText.includes('web3') || fullText.includes('coinbase') || fullText.includes('kraken')) {
    return 'crypto';
  }
  
  // Politics keywords
  if (fullText.includes('trump') || fullText.includes('biden') || fullText.includes('election') || 
      fullText.includes('president') || fullText.includes('congress') || fullText.includes('senate') ||
      fullText.includes('government') || fullText.includes('political') || fullText.includes('vote') ||
      fullText.includes('campaign') || fullText.includes('supreme court')) {
    return 'politics';
  }
  
  // Sports keywords
  if (fullText.includes('nfl') || fullText.includes('nba') || fullText.includes('sport') || 
      fullText.includes('football') || fullText.includes('basketball') || fullText.includes('soccer') ||
      fullText.includes('baseball') || fullText.includes('tennis') || fullText.includes('mma') ||
      fullText.includes('ufc') || fullText.includes('super bowl') || fullText.includes('world cup') ||
      fullText.includes('olympics') || fullText.includes('premier league') || fullText.includes('nhl') ||
      fullText.includes('mlb') || fullText.includes('esports')) {
    return 'sports';
  }
  
  // Business keywords
  if (fullText.includes('stock') || fullText.includes('market') || fullText.includes('economy') || 
      fullText.includes('business') || fullText.includes('finance') || fullText.includes('trading') ||
      fullText.includes('investment') || fullText.includes('inflation') || fullText.includes('recession') ||
      fullText.includes('gdp') || fullText.includes('unemployment') || fullText.includes('interest rate') ||
      fullText.includes('fed') || fullText.includes('central bank') || fullText.includes('ipo') ||
      fullText.includes('merger') || fullText.includes('acquisition') || fullText.includes('earnings')) {
    return 'business';
  }
  
  // Tech keywords
  if (fullText.includes('ai') || fullText.includes('tech') || fullText.includes('apple') || 
      fullText.includes('google') || fullText.includes('microsoft') || fullText.includes('amazon') ||
      fullText.includes('tesla') || fullText.includes('spacex') || fullText.includes('openai') ||
      fullText.includes('chatgpt') || fullText.includes('quantum') || fullText.includes('semiconductor') ||
      fullText.includes('artificial intelligence') || fullText.includes('machine learning') ||
      fullText.includes('software') || fullText.includes('hardware') || fullText.includes('innovation') ||
      fullText.includes('space') || fullText.includes('moon') || fullText.includes('mars')) {
    return 'tech';
  }
  
  // Entertainment keywords
  if (fullText.includes('movie') || fullText.includes('music') || fullText.includes('celebrity') || 
      fullText.includes('entertainment') || fullText.includes('tv') || fullText.includes('streaming') ||
      fullText.includes('netflix') || fullText.includes('disney') || fullText.includes('hollywood') ||
      fullText.includes('oscar') || fullText.includes('grammy') || fullText.includes('emmy') ||
      fullText.includes('gaming') || fullText.includes('twitch') || fullText.includes('youtube') ||
      fullText.includes('tiktok') || fullText.includes('social media')) {
    return 'entertainment';
  }
  
  return 'other';
}
