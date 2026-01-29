import { GraphQLClient } from 'graphql-request';

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/1724435/betuaa-ctf/v0.0.1';

export const graphqlClient = new GraphQLClient(SUBGRAPH_URL);

// Query to get market data with volume and participants
export const GET_MARKET_QUERY = `
  query GetMarket($marketId: ID!) {
    market(id: $marketId) {
      id
      marketId
      question
      description
      creator
      createdAt
      closingTime
      resolved
      winningOutcome
      totalVolume
      totalLiquidity
      participantCount
      tradeCount
    }
  }
`;

// Query to get all markets with stats
export const GET_MARKETS_QUERY = `
  query GetMarkets($first: Int!, $skip: Int!, $orderBy: Market_orderBy, $orderDirection: OrderDirection) {
    markets(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      marketId
      question
      description
      creator
      createdAt
      closingTime
      resolved
      winningOutcome
      totalVolume
      totalLiquidity
      participantCount
      tradeCount
    }
  }
`;

// Query to get user positions
export const GET_USER_POSITIONS_QUERY = `
  query GetUserPositions($userId: ID!) {
    user(id: $userId) {
      id
      totalVolume
      totalPnL
      marketsTraded
      positions {
        id
        market {
          id
          marketId
          question
          resolved
          winningOutcome
        }
        outcomeId
        balance
        averageCost
        realizedPnL
      }
    }
  }
`;

// Query to get recent trades
export const GET_RECENT_TRADES_QUERY = `
  query GetRecentTrades($first: Int!, $marketId: String) {
    trades(
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: { market: $marketId }
    ) {
      id
      user {
        id
      }
      market {
        id
        question
      }
      amount
      type
      timestamp
      transactionHash
    }
  }
`;

// Query to get global stats
export const GET_GLOBAL_STATS_QUERY = `
  query GetGlobalStats {
    globalStats(id: "global") {
      totalVolume
      totalMarkets
      totalUsers
      totalTrades
    }
  }
`;

// Helper function to fetch market data
export async function fetchMarketData(marketId: string) {
  try {
    const data = await graphqlClient.request(GET_MARKET_QUERY, { marketId });
    return data.market;
  } catch (error) {
    console.error('Error fetching market data from subgraph:', error);
    return null;
  }
}

// Helper function to fetch all markets
export async function fetchMarkets(first = 100, skip = 0, orderBy = 'createdAt', orderDirection = 'desc') {
  try {
    const data = await graphqlClient.request(GET_MARKETS_QUERY, {
      first,
      skip,
      orderBy,
      orderDirection,
    });
    return data.markets;
  } catch (error) {
    console.error('Error fetching markets from subgraph:', error);
    return [];
  }
}

// Helper function to fetch user positions
export async function fetchUserPositions(userAddress: string) {
  try {
    const userId = userAddress.toLowerCase();
    const data = await graphqlClient.request(GET_USER_POSITIONS_QUERY, { userId });
    return data.user;
  } catch (error) {
    console.error('Error fetching user positions from subgraph:', error);
    return null;
  }
}

// Helper function to fetch recent trades
export async function fetchRecentTrades(first = 20, marketId?: string) {
  try {
    const data = await graphqlClient.request(GET_RECENT_TRADES_QUERY, { first, marketId });
    return data.trades;
  } catch (error) {
    console.error('Error fetching trades from subgraph:', error);
    return [];
  }
}

// Helper function to fetch global stats
export async function fetchGlobalStats() {
  try {
    const data = await graphqlClient.request(GET_GLOBAL_STATS_QUERY);
    return data.globalStats;
  } catch (error) {
    console.error('Error fetching global stats from subgraph:', error);
    return null;
  }
}
