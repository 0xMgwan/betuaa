import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import {
  MarketCreated,
  MarketResolved,
  TransferSingle,
  TokensRedeemed,
  MintPositionTokensCall,
} from "../generated/CTFPredictionMarket/CTFPredictionMarket";
import { Market, User, Position, Trade, GlobalStats, Outcome } from "../generated/schema";

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

  // Determine if this is a mint (from zero address) or burn (to zero address)
  let isMint = from.toHexString() == "0x0000000000000000000000000000000000000000";
  let isBurn = to.toHexString() == "0x0000000000000000000000000000000000000000";

  // Handle minting (buying tokens)
  if (isMint && !isBurn) {
    let user = getOrCreateUser(to);
    updatePosition(to, tokenId, amount, true);
    
    // Try to find the market by iterating through all markets and checking their outcome tokens
    // This is not ideal but necessary since TransferSingle doesn't include market info
    // In practice, we'll track the most recent markets and check those
    let markets = Market.load("1");
    if (markets == null) {
      markets = Market.load("2");
    }
    if (markets == null) {
      markets = Market.load("3");
    }
    
    // For now, track the trade without market linkage
    // The volume will be tracked at user level
    let tradeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    let trade = new Trade(tradeId);
    trade.user = user.id;
    trade.market = "0"; // Unknown market
    trade.outcomeId = 0;
    trade.tokenId = tokenId;
    trade.amount = amount;
    trade.type = "MINT";
    trade.timestamp = event.block.timestamp;
    trade.blockNumber = event.block.number;
    trade.transactionHash = event.transaction.hash;
    trade.save();
    
    // Update user stats
    user.totalVolume = user.totalVolume.plus(amount);
    user.save();
    
    // Update global stats
    let stats = getOrCreateGlobalStats();
    stats.totalTrades = stats.totalTrades + 1;
    stats.totalVolume = stats.totalVolume.plus(amount);
    stats.save();
    
    return;
  }

  // Handle burning (selling/redeeming tokens)
  if (isBurn && !isMint) {
    updatePosition(from, tokenId, amount, false);
    return;
  }

  // Handle regular transfers (secondary market)
  if (!isMint && !isBurn) {
    updatePosition(from, tokenId, amount, false);
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

export function handleMintPositionTokens(call: MintPositionTokensCall): void {
  let marketId = call.inputs.marketId.toString();
  let amount = call.inputs.amount;
  let user = getOrCreateUser(call.from);
  
  // Load market
  let market = Market.load(marketId);
  if (market == null) return;
  
  // Update market stats
  market.totalVolume = market.totalVolume.plus(amount);
  market.totalLiquidity = market.totalLiquidity.plus(amount);
  market.tradeCount = market.tradeCount + 1;
  
  // Update participant count (check if user is new to this market)
  let positionId = marketId + "-" + user.id + "-0";
  let existingPosition = Position.load(positionId);
  if (existingPosition == null) {
    market.participantCount = market.participantCount + 1;
  }
  market.save();
  
  // Update user stats
  user.totalVolume = user.totalVolume.plus(amount);
  if (existingPosition == null) {
    user.marketsTraded = user.marketsTraded + 1;
  }
  user.save();
  
  // Create trade record
  let tradeId = call.transaction.hash.toHexString() + "-" + call.transaction.index.toString();
  let trade = new Trade(tradeId);
  trade.user = user.id;
  trade.market = marketId;
  trade.outcomeId = 0; // Both outcomes are minted
  trade.tokenId = ZERO_BI;
  trade.amount = amount;
  trade.type = "MINT";
  trade.timestamp = call.block.timestamp;
  trade.blockNumber = call.block.number;
  trade.transactionHash = call.transaction.hash;
  trade.save();
  
  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalTrades = stats.totalTrades + 1;
  stats.totalVolume = stats.totalVolume.plus(amount);
  stats.save();
}
