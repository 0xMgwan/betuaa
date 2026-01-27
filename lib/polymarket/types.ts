// Polymarket API Types based on Gamma API documentation

export interface PolymarketMarket {
  condition_id: string;
  question_id: string;
  tokens: PolymarketToken[];
  rewards?: {
    min_size: number;
    max_spread: number;
    event_start_date?: string;
    event_end_date?: string;
  };
  minimum_order_size: number;
  minimum_tick_size: number;
  description: string;
  category?: string;
  end_date_iso: string;
  game_start_time?: string;
  question: string;
  market_slug: string;
  min_incentive_size?: number;
  max_incentive_spread?: number;
  active: boolean;
  closed: boolean;
  archived: boolean;
  accepting_orders: boolean;
  accepting_order_timestamp?: string;
  seconds_delay?: number;
  icon?: string;
  competitive?: number;
  volume?: string;
  volume_24hr?: string;
  liquidity?: string;
  outcome_prices?: string[];
  clob_token_ids?: string[];
  enable_order_book?: boolean;
}

export interface PolymarketToken {
  token_id: string;
  outcome: string;
  price: string;
  winner?: boolean;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description?: string;
  start_date_iso?: string;
  end_date_iso?: string;
  image?: string;
  icon?: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  markets: PolymarketMarket[];
  volume?: string;
  liquidity?: string;
  comment_count?: number;
}

export interface PolymarketCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  market_count?: number;
}

export interface PolymarketResolution {
  market_id: string;
  condition_id: string;
  question_id: string;
  resolved: boolean;
  winning_outcome?: string;
  resolution_date?: string;
  resolution_source?: string;
}

export interface PolymarketPriceHistory {
  market: string;
  asset_id: string;
  prices: Array<{
    t: number; // timestamp
    p: string; // price
  }>;
}

// API Response types
export interface PolymarketMarketsResponse {
  data: PolymarketMarket[];
  count: number;
  next_cursor?: string;
}

export interface PolymarketEventsResponse {
  data: PolymarketEvent[];
  count: number;
  next_cursor?: string;
}

// Simplified market for our UI
export interface SimplifiedPolymarketMarket {
  id: string;
  question: string;
  description: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  resolved: boolean;
  winningOutcome?: string;
  icon?: string;
  slug: string;
}
