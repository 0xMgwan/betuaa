/**
 * nTZS Market Trade API
 * 
 * Handles all market operations for nTZS users using the nTZS-optimized CTF contract.
 * This contract does NOT require on-chain collateral - all balance tracking is done via nTZS API.
 * 
 * Flow:
 * 1. User deposits via M-Pesa → nTZS API balance increases
 * 2. User creates market/buys shares → nTZS API balance decreases, outcome tokens minted
 * 3. User sells/redeems → outcome tokens burned, nTZS API balance increases
 * 4. User withdraws to M-Pesa → nTZS API balance decreases
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  platformWalletClient,
  platformPublicClient,
  PLATFORM_ADDRESS,
} from '@/lib/platform-wallet';
import { CONTRACTS } from '@/lib/contracts';
import CTFPredictionMarketNTZSABIJson from '@/lib/abis/CTFPredictionMarketNTZS.json';
import { createOrGetUser, createTransfer } from '@/lib/ntzs';

const CTFPredictionMarketNTZSABI = CTFPredictionMarketNTZSABIJson as any;

const CTF_NTZS_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarketNTZS as `0x${string}`;
const NTZS_API_BASE_URL = process.env.NTZS_API_BASE_URL || 'https://www.ntzs.co.tz';
const NTZS_API_KEY = process.env.NTZS_API_KEY!;

/**
 * Get user's nTZS balance via API.
 * Uses ntzsUserId directly if available, otherwise falls back to createOrGetUser.
 */
async function getNTZSBalance(userAddress: string, ntzsUserId?: string, ntzsEmail?: string): Promise<number> {
  let userId = ntzsUserId;
  
  if (!userId) {
    // Fall back to createOrGetUser with the best email we have
    const email = ntzsEmail || `${userAddress.toLowerCase()}@betua.app`;
    const user = await createOrGetUser({ walletAddress: userAddress, email });
    userId = user.id;
  }
  
  console.log(`[ntzs-trade] Fetching balance for userId: ${userId}`);
  const res = await fetch(`${NTZS_API_BASE_URL}/api/v1/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${NTZS_API_KEY}` },
  });
  
  if (!res.ok) throw new Error('Failed to fetch nTZS balance');
  const data = await res.json();
  console.log(`[ntzs-trade] User balance: ${data.balanceTzs} TZS`);
  return data.balanceTzs || 0;
}

/**
 * Get or create the platform's nTZS user (cached per request lifetime)
 */
let _platformNtzsUser: { id: string } | null = null;
async function getPlatformNtzsUser() {
  if (!_platformNtzsUser) {
    _platformNtzsUser = await createOrGetUser({ walletAddress: PLATFORM_ADDRESS! });
  }
  return _platformNtzsUser;
}

/**
 * Deduct nTZS from user's balance by transferring to platform user.
 */
async function deductNTZSBalance(userAddress: string, amountTzs: number, ntzsUserId?: string, ntzsEmail?: string): Promise<void> {
  // 1. Check balance
  const balance = await getNTZSBalance(userAddress, ntzsUserId, ntzsEmail);
  if (balance < amountTzs) {
    throw new Error(`Insufficient nTZS balance. You have ${balance} TZS but need ${amountTzs} TZS.`);
  }

  // 2. Get user ID
  let userId = ntzsUserId;
  if (!userId) {
    const email = ntzsEmail || `${userAddress.toLowerCase()}@betua.app`;
    const user = await createOrGetUser({ walletAddress: userAddress, email });
    userId = user.id;
  }

  // 3. Transfer from user to platform
  const platformUser = await getPlatformNtzsUser();
  console.log(`[ntzs-trade] Transferring ${amountTzs} TZS from user ${userId} to platform ${platformUser.id}`);
  const transfer = await createTransfer({
    fromUserId: userId,
    toUserId: platformUser.id,
    amountTzs,
  });
  console.log(`[ntzs-trade] ✅ Transfer complete:`, transfer.id, `${amountTzs} TZS deducted from user`);
}

/**
 * Credit nTZS to user's balance by transferring from platform user.
 */
async function creditNTZSBalance(userAddress: string, amountTzs: number, ntzsUserId?: string, ntzsEmail?: string): Promise<void> {
  // 1. Get user ID
  let userId = ntzsUserId;
  if (!userId) {
    const email = ntzsEmail || `${userAddress.toLowerCase()}@betua.app`;
    const user = await createOrGetUser({ walletAddress: userAddress, email });
    userId = user.id;
  }

  // 2. Transfer from platform to user
  const platformUser = await getPlatformNtzsUser();
  console.log(`[ntzs-trade] Crediting ${amountTzs} TZS from platform ${platformUser.id} to user ${userId}`);
  const transfer = await createTransfer({
    fromUserId: platformUser.id,
    toUserId: userId,
    amountTzs,
  });
  console.log(`[ntzs-trade] ✅ Credit complete:`, transfer.id, `${amountTzs} TZS credited to user`);
}

export async function POST(req: NextRequest) {
  console.log('[/api/market/ntzs-trade] ========== REQUEST RECEIVED ==========');
  
  try {
    if (!platformWalletClient || !PLATFORM_ADDRESS) {
      return NextResponse.json(
        { error: 'Platform wallet not configured' },
        { status: 503 }
      );
    }

    const body = await req.json();
    console.log('[/api/market/ntzs-trade] Request:', JSON.stringify(body));
    
    const { action, userAddress, ntzsUserId, ntzsEmail, ...params } = body;

    if (!action || !userAddress) {
      return NextResponse.json(
        { error: 'action and userAddress are required' },
        { status: 400 }
      );
    }

    console.log(`[ntzs-trade] User: ${userAddress}, ntzsUserId: ${ntzsUserId}, email: ${ntzsEmail}`);

    let hash: `0x${string}`;
    let receipt: any;

    switch (action) {
      // ─── Market Creation ────────────────────────────────────
      case 'createMarket': {
        const { question, description, outcomeCount, closingTime, creationFeeTzs } = params;
        
        if (!question || !closingTime) {
          return NextResponse.json(
            { error: 'question and closingTime are required' },
            { status: 400 }
          );
        }

        // Deduct creation fee from user's nTZS balance
        const fee = creationFeeTzs || 2500; // 2500 TZS default fee
        await deductNTZSBalance(userAddress, fee, ntzsUserId, ntzsEmail);

        // Create market on-chain (no collateral needed)
        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_NTZS_ADDRESS,
          abi: CTFPredictionMarketNTZSABI,
          functionName: 'createMarket',
          args: [
            question,
            description || '',
            BigInt(outcomeCount || 2),
            BigInt(closingTime),
          ],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        // Extract marketId from logs
        const marketCreatedLog = receipt.logs.find(
          (log: any) => log.address.toLowerCase() === CTF_NTZS_ADDRESS.toLowerCase()
        );
        const marketId = marketCreatedLog?.topics?.[1]
          ? Number(BigInt(marketCreatedLog.topics[1]))
          : null;

        console.log(`[ntzs-trade] Market created: ${marketId}, fee: ${fee} TZS`);

        return NextResponse.json({
          success: true,
          action,
          hash,
          marketId,
          feePaid: fee,
          blockNumber: receipt.blockNumber.toString(),
        });
      }

      // ─── Buy Shares (Mint Position Tokens) ─────────────────
      case 'mintPositionTokens': {
        const { marketId, amountTzs } = params;
        
        if (marketId === undefined || !amountTzs) {
          return NextResponse.json(
            { error: 'marketId and amountTzs are required' },
            { status: 400 }
          );
        }

        // Deduct collateral from user's nTZS balance
        await deductNTZSBalance(userAddress, amountTzs, ntzsUserId, ntzsEmail);

        // Mint outcome tokens on-chain (platform wallet executes, tokens go to user)
        const amountWei = BigInt(amountTzs) * BigInt(10 ** 18);
        
        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_NTZS_ADDRESS,
          abi: CTFPredictionMarketNTZSABI,
          functionName: 'mintPositionTokensFor',
          args: [BigInt(marketId), userAddress as `0x${string}`, amountWei],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        console.log(`[ntzs-trade] Minted ${amountTzs} TZS worth of tokens for ${userAddress}`);

        return NextResponse.json({
          success: true,
          action,
          hash,
          amountSpent: amountTzs,
          blockNumber: receipt.blockNumber.toString(),
        });
      }

      // ─── Sell Shares (Redeem Position Tokens) ──────────────
      case 'redeemPositionTokens': {
        const { marketId, amountTzs } = params;
        
        if (marketId === undefined || !amountTzs) {
          return NextResponse.json(
            { error: 'marketId and amountTzs are required' },
            { status: 400 }
          );
        }

        const amountWei = BigInt(amountTzs) * BigInt(10 ** 18);

        // Burn outcome tokens on-chain (user must have approved contract)
        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_NTZS_ADDRESS,
          abi: CTFPredictionMarketNTZSABI,
          functionName: 'redeemPositionTokens',
          args: [BigInt(marketId), amountWei],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        // Credit collateral back to user's nTZS balance
        await creditNTZSBalance(userAddress, amountTzs, ntzsUserId, ntzsEmail);

        console.log(`[ntzs-trade] Redeemed ${amountTzs} TZS worth of tokens for ${userAddress}`);

        return NextResponse.json({
          success: true,
          action,
          hash,
          amountReceived: amountTzs,
          blockNumber: receipt.blockNumber.toString(),
        });
      }

      // ─── Claim Winnings ────────────────────────────────────
      case 'redeemWinningTokens': {
        const { marketId, amountTzs } = params;
        
        if (marketId === undefined || !amountTzs) {
          return NextResponse.json(
            { error: 'marketId and amountTzs are required' },
            { status: 400 }
          );
        }

        const amountWei = BigInt(amountTzs) * BigInt(10 ** 18);

        // Burn winning tokens on-chain
        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_NTZS_ADDRESS,
          abi: CTFPredictionMarketNTZSABI,
          functionName: 'redeemWinningTokens',
          args: [BigInt(marketId), amountWei],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        // Credit winnings to user's nTZS balance
        await creditNTZSBalance(userAddress, amountTzs, ntzsUserId, ntzsEmail);

        console.log(`[ntzs-trade] Redeemed ${amountTzs} TZS winnings for ${userAddress}`);

        return NextResponse.json({
          success: true,
          action,
          hash,
          winnings: amountTzs,
          blockNumber: receipt.blockNumber.toString(),
        });
      }

      // ─── Cancel Market & Claim Refund ──────────────────────
      case 'cancelMarket': {
        const { marketId } = params;
        
        if (marketId === undefined) {
          return NextResponse.json(
            { error: 'marketId is required' },
            { status: 400 }
          );
        }

        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_NTZS_ADDRESS,
          abi: CTFPredictionMarketNTZSABI,
          functionName: 'cancelMarket',
          args: [BigInt(marketId)],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        return NextResponse.json({
          success: true,
          action,
          hash,
          blockNumber: receipt.blockNumber.toString(),
        });
      }

      case 'claimRefund': {
        const { marketId } = params;
        
        if (marketId === undefined) {
          return NextResponse.json(
            { error: 'marketId is required' },
            { status: 400 }
          );
        }

        // Get user's position to calculate refund amount
        // This would need to be tracked off-chain or queried from contract
        const refundAmountTzs = params.refundAmountTzs || 0;

        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_NTZS_ADDRESS,
          abi: CTFPredictionMarketNTZSABI,
          functionName: 'claimRefund',
          args: [BigInt(marketId)],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        // Credit refund to user's nTZS balance
        if (refundAmountTzs > 0) {
          await creditNTZSBalance(userAddress, refundAmountTzs);
        }

        return NextResponse.json({
          success: true,
          action,
          hash,
          refund: refundAmountTzs,
          blockNumber: receipt.blockNumber.toString(),
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[/api/market/ntzs-trade] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Trade operation failed' },
      { status: 500 }
    );
  }
}
