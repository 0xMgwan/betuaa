import { GraphQLClient } from 'graphql-request';

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/1724435/betuaa-ctf/v0.0.4';

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

// Query to get top traders by volume (leaderboard)
export const GET_TOP_TRADERS_QUERY = `
  query GetTopTraders($first: Int!) {
    users(first: $first, orderBy: totalVolume, orderDirection: desc) {
      id
      address
      totalVolume
      totalPnL
      marketsTraded
      positionCount
    }
  }
`;

// Query to get top traders by P&L (profit leaderboard)
export const GET_TOP_PROFIT_TRADERS_QUERY = `
  query GetTopProfitTraders($first: Int!) {
    users(first: $first, orderBy: totalPnL, orderDirection: desc) {
      id
      address
      totalVolume
      totalPnL
      marketsTraded
      positionCount
    }
  }
`;

// Query to get user stats
export const GET_USER_STATS_QUERY = `
  query GetUserStats($userId: ID!) {
    user(id: $userId) {
      id
      address
      totalVolume
      totalPnL
      marketsTraded
      positionCount
      trades(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        market {
          id
          question
        }
        amount
        type
        timestamp
      }
    }
  }
`;

// Query to get market trades with user details
export const GET_MARKET_TRADES_QUERY = `
  query GetMarketTrades($marketId: String!, $first: Int!) {
    trades(
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: { market: $marketId }
    ) {
      id
      user {
        id
        address
      }
      outcomeId
      amount
      type
      timestamp
      transactionHash
    }
  }
`;

// Query to get all trades for activity feed
export const GET_ALL_TRADES_QUERY = `
  query GetAllTrades($first: Int!, $skip: Int!) {
    trades(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc) {
      id
      user {
        id
        address
      }
      market {
        id
        marketId
        question
      }
      outcomeId
      amount
      type
      timestamp
      transactionHash
    }
  }
`;

// Helper function to fetch top traders by volume
export async function fetchTopTraders(first = 10) {
  try {
    const data = await graphqlClient.request(GET_TOP_TRADERS_QUERY, { first });
    return data.users;
  } catch (error) {
    console.error('Error fetching top traders from subgraph:', error);
    return [];
  }
}

// Helper function to fetch top traders by profit
export async function fetchTopProfitTraders(first = 10) {
  try {
    const data = await graphqlClient.request(GET_TOP_PROFIT_TRADERS_QUERY, { first });
    return data.users;
  } catch (error) {
    console.error('Error fetching top profit traders from subgraph:', error);
    return [];
  }
}

// Helper function to fetch user stats
export async function fetchUserStats(userAddress: string) {
  try {
    const userId = userAddress.toLowerCase();
    const data = await graphqlClient.request(GET_USER_STATS_QUERY, { userId });
    return data.user;
  } catch (error) {
    console.error('Error fetching user stats from subgraph:', error);
    return null;
  }
}

// Helper function to fetch market trades
export async function fetchMarketTrades(marketId: string, first = 20) {
  try {
    const data = await graphqlClient.request(GET_MARKET_TRADES_QUERY, { marketId, first });
    return data.trades;
  } catch (error) {
    console.error('Error fetching market trades from subgraph:', error);
    return [];
  }
}

// Helper function to fetch all trades for activity feed
export async function fetchAllTrades(first = 20, skip = 0) {
  try {
    const data = await graphqlClient.request(GET_ALL_TRADES_QUERY, { first, skip });
    return data.trades;
  } catch (error) {
    console.error('Error fetching all trades from subgraph:', error);
    return [];
  }
}
