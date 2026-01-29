import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import {
  MarketCreated,
  MarketResolved,
  TransferSingle,
  TokensRedeemed,
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
  market.resolutionTime = ZERO_BI;
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

  // Create outcome entities and store tokenId mapping
  for (let i = 0; i < 2; i++) {
    let outcomeId = marketId + "-" + i.toString();
    let outcome = new Outcome(outcomeId);
    outcome.market = marketId;
    outcome.outcomeId = i;
    outcome.tokenId = ZERO_BI; // Will be set when we see first transfer
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

  // Handle minting (buying tokens) - this is where volume is tracked
  if (isMint && !isBurn) {
    let user = getOrCreateUser(to);
    
    // Find which market this token belongs to by checking all outcomes
    // We need to iterate through markets to find the matching tokenId
    let foundMarket: Market | null = null;
    let foundOutcomeId = 0;
    
    // Check recent markets (last 100 markets should be enough)
    for (let marketNum = 1; marketNum <= 100; marketNum++) {
      let market = Market.load(marketNum.toString());
      if (market == null) continue;
      
      // Check each outcome for this market
      for (let outcomeNum = 0; outcomeNum < market.outcomeCount; outcomeNum++) {
        let outcomeEntityId = marketNum.toString() + "-" + outcomeNum.toString();
        let outcome = Outcome.load(outcomeEntityId);
        
        if (outcome == null) continue;
        
        // Check if this outcome already has this tokenId
        if (outcome.tokenId.equals(tokenId)) {
          foundMarket = market;
          foundOutcomeId = outcomeNum;
          break;
        }
        
        // If tokenId not set yet (equals 0), this is the first mint - store it
        if (outcome.tokenId.equals(ZERO_BI)) {
          outcome.tokenId = tokenId;
          outcome.totalSupply = outcome.totalSupply.plus(amount);
          outcome.save();
          foundMarket = market;
          foundOutcomeId = outcomeNum;
          break;
        }
      }
      
      if (foundMarket != null) break;
    }
    
    // Update market stats if we found the market
    if (foundMarket != null) {
      foundMarket.totalVolume = foundMarket.totalVolume.plus(amount);
      foundMarket.totalLiquidity = foundMarket.totalLiquidity.plus(amount);
      foundMarket.tradeCount = foundMarket.tradeCount + 1;
      
      // Check if this is a new participant
      let positionId = foundMarket.id + "-" + to.toHexString() + "-" + foundOutcomeId.toString();
      let existingPosition = Position.load(positionId);
      if (existingPosition == null) {
        foundMarket.participantCount = foundMarket.participantCount + 1;
      }
      
      foundMarket.save();
      
      // Create trade record
      let tradeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
      let trade = new Trade(tradeId);
      trade.user = user.id;
      trade.market = foundMarket.id;
      trade.outcomeId = foundOutcomeId;
      trade.tokenId = tokenId;
      trade.amount = amount;
      trade.type = "MINT";
      trade.timestamp = event.block.timestamp;
      trade.blockNumber = event.block.number;
      trade.transactionHash = event.transaction.hash;
      trade.save();
    }
    
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

