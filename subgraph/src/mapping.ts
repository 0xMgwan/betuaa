import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import {
  MarketCreated,
  MarketResolved,
  TransferSingle,
  TokensRedeemed,
} from "../generated/CTFPredictionMarket/CTFPredictionMarket";
import {
  Market,
  User,
  Position,
  Trade,
  Outcome,
  GlobalStats,
} from "../generated/schema";

const ZERO_BI = BigInt.fromI32(0);
const ONE_BI = BigInt.fromI32(1);
const GLOBAL_STATS_ID = "global";

function getOrCreateUser(address: Address): User {
  let user = User.load(address.toHexString());
  if (user == null) {
    user = new User(address.toHexString());
    user.address = address;
    user.totalVolume = ZERO_BI;
    user.totalPnL = ZERO_BI;
    user.marketsTraded = 0;
    user.positionCount = 0;
    user.save();

    // Update global stats
    let stats = getOrCreateGlobalStats();
    stats.totalUsers = stats.totalUsers + 1;
    stats.save();
  }
  return user;
}

function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load(GLOBAL_STATS_ID);
  if (stats == null) {
    stats = new GlobalStats(GLOBAL_STATS_ID);
    stats.totalVolume = ZERO_BI;
    stats.totalMarkets = 0;
    stats.totalUsers = 0;
    stats.totalTrades = 0;
    stats.save();
  }
  return stats;
}

export function handleMarketCreated(event: MarketCreated): void {
  let marketId = event.params.marketId.toString();
  let market = new Market(marketId);
  
  market.marketId = event.params.marketId;
  market.question = event.params.question;
  market.description = event.params.question;
  market.creator = event.transaction.from;
  market.collateralToken = Bytes.fromHexString("0x036CbD53842c5426634e7929541eC2318f3dCF7e"); // USDC on Base Sepolia
  market.createdAt = event.block.timestamp;
  market.closingTime = event.params.closingTime;
  market.resolutionTime = ZERO_BI; // Not in event, set to 0
  market.conditionId = event.params.conditionId;
  market.outcomeCount = event.params.outcomeCount.toI32();
  market.winningOutcome = null;
  market.resolved = false;
  market.paused = false;
  
  // Initialize calculated fields
  market.totalVolume = ZERO_BI;
  market.totalLiquidity = ZERO_BI;
  market.participantCount = 0;
  market.tradeCount = 0;
  
  market.save();

  // Create outcome entities
  for (let i = 0; i < 2; i++) {
    let outcomeId = marketId + "-" + i.toString();
    let outcome = new Outcome(outcomeId);
    outcome.market = marketId;
    outcome.outcomeId = i;
    outcome.tokenId = ZERO_BI; // Will be set on first mint
    outcome.totalSupply = ZERO_BI;
    outcome.holders = 0;
    outcome.save();
  }

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalMarkets = stats.totalMarkets + 1;
  stats.save();
}

export function handleMarketResolved(event: MarketResolved): void {
  let marketId = event.params.marketId.toString();
  let market = Market.load(marketId);
  
  if (market != null) {
    market.resolved = true;
    market.winningOutcome = event.params.winningOutcome.toI32();
    market.save();
  }
}

export function handleTransferSingle(event: TransferSingle): void {
  let from = event.params.from;
  let to = event.params.to;
  let tokenId = event.params.id;
  let amount = event.params.value;

  // Skip if it's a mint (from zero address) or burn (to zero address)
  // These are handled by PositionsMinted and PositionsRedeemed events
  if (from.toHexString() == "0x0000000000000000000000000000000000000000" ||
      to.toHexString() == "0x0000000000000000000000000000000000000000") {
    return;
  }

  // Update sender position
  if (from.toHexString() != "0x0000000000000000000000000000000000000000") {
    updatePosition(from, tokenId, amount, false);
  }

  // Update receiver position
  if (to.toHexString() != "0x0000000000000000000000000000000000000000") {
    updatePosition(to, tokenId, amount, true);
  }
}

export function handleTokensRedeemed(event: TokensRedeemed): void {
  let user = getOrCreateUser(event.params.user);
  let marketId = event.params.marketId.toString();
  let outcome = event.params.outcome;
  let amount = event.params.amount;
  let payout = event.params.payout;
  
  let market = Market.load(marketId);
  if (market == null) return;

  // Determine if this is a claim (resolved market) or redeem (active market)
  let tradeType = market.resolved ? "CLAIM" : "REDEEM";

  // Update market
  market.totalLiquidity = market.totalLiquidity.minus(payout);
  market.tradeCount = market.tradeCount + 1;
  market.save();

  // Update user P&L if claiming winnings
  if (market.resolved) {
    let profit = payout.minus(amount);
    user.totalPnL = user.totalPnL.plus(profit);
  }
  user.save();

  // Create trade record
  let tradeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let trade = new Trade(tradeId);
  trade.user = user.id;
  trade.market = marketId;
  trade.outcomeId = outcome.toI32();
  trade.tokenId = ZERO_BI;
  trade.amount = amount;
  trade.type = tradeType;
  trade.timestamp = event.block.timestamp;
  trade.blockNumber = event.block.number;
  trade.transactionHash = event.transaction.hash;
  trade.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalTrades = stats.totalTrades + 1;
  stats.save();
}

function updatePosition(
  userAddress: Address,
  tokenId: BigInt,
  amount: BigInt,
  isIncrease: boolean
): void {
  // This is a simplified version - you'd need to decode tokenId to get marketId and outcomeId
  // For now, we'll skip detailed position tracking in transfers
}
