/**
 * POST /api/market/trade
 * Unified API for ALL on-chain market operations via the platform wallet.
 * nTZS users call this instead of direct wallet transactions.
 *
 * Supported actions:
 *   - createMarket
 *   - mintPositionTokens (buy shares)
 *   - redeemPositionTokens (sell shares)
 *   - redeemWinningTokens (claim winnings)
 *   - cancelMarket
 *   - claimRefund
 *   - placeLimitOrder
 *   - placeMarketOrder
 *   - cancelOrder
 *   - approveToken
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  platformWalletClient,
  platformPublicClient,
  PLATFORM_ADDRESS,
} from '@/lib/platform-wallet';
import { CONTRACTS } from '@/lib/contracts';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarketV2.json';
import OrderBookABI from '@/lib/abis/OrderBook.json';
import ERC20ABI from '@/lib/abis/ERC20.json';
import { createOrGetUser } from '@/lib/ntzs';

const CTF_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`;
const ORDER_BOOK_ADDRESS = CONTRACTS.baseSepolia.orderBook as `0x${string}`;
const NTZS_TOKEN = '0x6A9525A5C82F92E10741Fcdcb16DbE9111630077'.toLowerCase();

function isNTZSToken(token?: string): boolean {
  return !!token && token.toLowerCase() === NTZS_TOKEN;
}

/**
 * Check user's nTZS balance via the nTZS API.
 * Returns balance in TZS (whole units).
 */
async function checkNTZSBalance(userAddress: string): Promise<number> {
  const user = await createOrGetUser({ 
    walletAddress: userAddress,
    email: `${userAddress.toLowerCase()}@betua.app`
  });
  
  // Fetch user profile which includes balanceTzs
  const BASE_URL = process.env.NTZS_API_BASE_URL || 'https://www.ntzs.co.tz';
  const API_KEY = process.env.NTZS_API_KEY!;
  const res = await fetch(`${BASE_URL}/api/v1/users/${user.id}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
  });
  
  if (!res.ok) throw new Error('Failed to check nTZS balance');
  const data = await res.json();
  return data.balanceTzs || 0;
}

export async function POST(req: NextRequest) {
  console.log('[/api/market/trade] ========== REQUEST RECEIVED ==========');
  
  try {
    if (!platformWalletClient || !PLATFORM_ADDRESS) {
      console.log('[/api/market/trade] ERROR: Platform wallet not configured');
      return NextResponse.json(
        { error: 'Platform wallet not configured. Set PLATFORM_PRIVATE_KEY in .env.local' },
        { status: 503 }
      );
    }

    const body = await req.json();
    console.log('[/api/market/trade] Request body:', JSON.stringify(body));
    
    const { action, userAddress, ...params } = body;

    if (!action) {
      console.log('[/api/market/trade] ERROR: action is required');
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }
    if (!userAddress) {
      console.log('[/api/market/trade] ERROR: userAddress is required');
      return NextResponse.json({ error: 'userAddress is required' }, { status: 400 });
    }

    console.log(`[/api/market/trade] action=${action} user=${userAddress} params=${JSON.stringify(params)}`);

    let hash: `0x${string}`;
    let receipt: any;

    switch (action) {
      // ─── Market Creation ────────────────────────────────────
      case 'createMarket': {
        const { question, description, outcomeCount, closingTime, collateralToken } = params;
        if (!question || !closingTime) {
          return NextResponse.json({ error: 'question and closingTime are required' }, { status: 400 });
        }

        const token = (collateralToken || CONTRACTS.baseSepolia.mockUSDC) as `0x${string}`;

        if (isNTZSToken(collateralToken)) {
          console.log(`[trade] nTZS market creation for user ${userAddress}`);
        }

        // Ensure platform approved the CTF contract for this token
        await ensureApproval(token, CTF_ADDRESS);

        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_ADDRESS,
          abi: CTFPredictionMarketABI,
          functionName: 'createMarket',
          args: [
            question,
            description || '',
            BigInt(outcomeCount || 2),
            BigInt(closingTime),
            token,
          ],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        // Extract marketId from logs
        const marketCreatedLog = receipt.logs.find(
          (log: any) => log.address.toLowerCase() === CTF_ADDRESS.toLowerCase()
        );
        const marketId = marketCreatedLog?.topics?.[1]
          ? Number(BigInt(marketCreatedLog.topics[1]))
          : null;

        return NextResponse.json({
          success: true,
          action,
          hash,
          marketId,
          blockNumber: receipt.blockNumber.toString(),
        });
      }

      // ─── Buy Shares (Mint Position Tokens) ─────────────────
      case 'mintPositionTokens': {
        const { marketId, amount, collateralToken: mintToken } = params;
        if (marketId === undefined || !amount) {
          return NextResponse.json({ error: 'marketId and amount are required' }, { status: 400 });
        }

        // If nTZS, verify user has sufficient balance via nTZS API
        // Platform wallet holds the nTZS pool and executes the contract call
        if (isNTZSToken(mintToken)) {
          const amountTzs = Number(BigInt(amount) / BigInt(1e18));
          if (amountTzs > 0) {
            const balance = await checkNTZSBalance(userAddress);
            if (balance < amountTzs) {
              return NextResponse.json({ 
                error: `Insufficient nTZS balance. You have ${balance} TZS but need ${amountTzs} TZS.` 
              }, { status: 400 });
            }
            console.log(`[trade] nTZS buy: user ${userAddress} has ${balance} TZS, spending ${amountTzs} TZS`);
          }
        }

        // Ensure approval for the collateral token
        if (mintToken) {
          await ensureApproval(mintToken as `0x${string}`, CTF_ADDRESS);
        }

        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_ADDRESS,
          abi: CTFPredictionMarketABI,
          functionName: 'mintPositionTokens',
          args: [BigInt(marketId), BigInt(amount)],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        return NextResponse.json({ success: true, action, hash, blockNumber: receipt.blockNumber.toString() });
      }

      // ─── Sell Shares (Redeem Position Tokens) ──────────────
      case 'redeemPositionTokens': {
        const { marketId, amount, collateralToken: sellToken } = params;
        if (marketId === undefined || !amount) {
          return NextResponse.json({ error: 'marketId and amount are required' }, { status: 400 });
        }

        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_ADDRESS,
          abi: CTFPredictionMarketABI,
          functionName: 'redeemPositionTokens',
          args: [BigInt(marketId), BigInt(amount)],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        // nTZS collateral returns to platform wallet pool automatically
        if (isNTZSToken(sellToken)) {
          const amountTzs = Number(BigInt(amount) / BigInt(1e18));
          console.log(`[trade] nTZS sell: ${amountTzs} TZS returned to platform pool for user ${userAddress}`);
        }

        return NextResponse.json({ success: true, action, hash, blockNumber: receipt.blockNumber.toString() });
      }

      // ─── Claim Winnings ────────────────────────────────────
      case 'redeemWinningTokens': {
        const { marketId, amount, collateralToken: winToken } = params;
        if (marketId === undefined || !amount) {
          return NextResponse.json({ error: 'marketId and amount are required' }, { status: 400 });
        }

        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_ADDRESS,
          abi: CTFPredictionMarketABI,
          functionName: 'redeemWinningTokens',
          args: [BigInt(marketId), BigInt(amount)],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        // nTZS winnings return to platform wallet pool automatically
        if (isNTZSToken(winToken)) {
          const amountTzs = Number(BigInt(amount) / BigInt(1e18));
          console.log(`[trade] nTZS winnings: ${amountTzs} TZS returned to platform pool for user ${userAddress}`);
        }

        return NextResponse.json({ success: true, action, hash, blockNumber: receipt.blockNumber.toString() });
      }

      // ─── Cancel Market ─────────────────────────────────────
      case 'cancelMarket': {
        const { marketId } = params;
        if (marketId === undefined) {
          return NextResponse.json({ error: 'marketId is required' }, { status: 400 });
        }

        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_ADDRESS,
          abi: CTFPredictionMarketABI,
          functionName: 'cancelMarket',
          args: [BigInt(marketId)],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        return NextResponse.json({ success: true, action, hash, blockNumber: receipt.blockNumber.toString() });
      }

      // ─── Claim Refund ──────────────────────────────────────
      case 'claimRefund': {
        const { marketId, collateralToken: refundToken } = params;
        if (marketId === undefined) {
          return NextResponse.json({ error: 'marketId is required' }, { status: 400 });
        }

        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_ADDRESS,
          abi: CTFPredictionMarketABI,
          functionName: 'claimRefund',
          args: [BigInt(marketId)],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        // If nTZS, transfer refund back to user
        // TODO: determine refund amount from receipt logs

        return NextResponse.json({ success: true, action, hash, blockNumber: receipt.blockNumber.toString() });
      }

      // ─── Place Limit Order ─────────────────────────────────
      case 'placeLimitOrder': {
        const { marketId, outcomeIndex, side, priceBps, size, collateralToken: orderToken } = params;
        if (marketId === undefined || outcomeIndex === undefined || side === undefined || !priceBps || !size) {
          return NextResponse.json({ error: 'marketId, outcomeIndex, side, priceBps, size required' }, { status: 400 });
        }

        // If nTZS buy order, verify user has sufficient balance
        if (isNTZSToken(orderToken) && side === 0) {
          const amountTzs = Number(BigInt(size) / BigInt(1e18));
          if (amountTzs > 0) {
            const balance = await checkNTZSBalance(userAddress);
            if (balance < amountTzs) {
              return NextResponse.json({ 
                error: `Insufficient nTZS balance. You have ${balance} TZS but need ${amountTzs} TZS.` 
              }, { status: 400 });
            }
            console.log(`[trade] nTZS limit order: user ${userAddress} has ${balance} TZS, using ${amountTzs} TZS`);
          }
        }

        // Approve collateral for OrderBook
        if (orderToken) {
          await ensureApproval(orderToken as `0x${string}`, ORDER_BOOK_ADDRESS);
        }

        // Approve ERC1155 for OrderBook (for sell orders)
        await ensureERC1155Approval(CTF_ADDRESS, ORDER_BOOK_ADDRESS);

        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: ORDER_BOOK_ADDRESS,
          abi: OrderBookABI,
          functionName: 'placeLimitOrder',
          args: [BigInt(marketId), BigInt(outcomeIndex), side, BigInt(priceBps), BigInt(size)],
          gas: BigInt(500_000),
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        return NextResponse.json({ success: true, action, hash, blockNumber: receipt.blockNumber.toString() });
      }

      // ─── Place Market Order ────────────────────────────────
      case 'placeMarketOrder': {
        const { marketId, outcomeIndex, side, size, maxSlippageBps, collateralToken: mktToken } = params;
        if (marketId === undefined || outcomeIndex === undefined || side === undefined || !size) {
          return NextResponse.json({ error: 'marketId, outcomeIndex, side, size required' }, { status: 400 });
        }

        if (mktToken) {
          await ensureApproval(mktToken as `0x${string}`, ORDER_BOOK_ADDRESS);
        }
        await ensureERC1155Approval(CTF_ADDRESS, ORDER_BOOK_ADDRESS);

        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: ORDER_BOOK_ADDRESS,
          abi: OrderBookABI,
          functionName: 'placeMarketOrder',
          args: [BigInt(marketId), BigInt(outcomeIndex), side, BigInt(size), BigInt(maxSlippageBps || 500)],
          gas: BigInt(500_000),
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        return NextResponse.json({ success: true, action, hash, blockNumber: receipt.blockNumber.toString() });
      }

      // ─── Cancel Order ──────────────────────────────────────
      case 'cancelOrder': {
        const { orderId } = params;
        if (!orderId) {
          return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
        }

        const { request } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: ORDER_BOOK_ADDRESS,
          abi: OrderBookABI,
          functionName: 'cancelOrder',
          args: [BigInt(orderId)],
        });

        hash = await platformWalletClient.writeContract(request);
        receipt = await platformPublicClient.waitForTransactionReceipt({ hash });

        return NextResponse.json({ success: true, action, hash, blockNumber: receipt.blockNumber.toString() });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[/api/market/trade] Error:', err);

    // Extract useful error message
    let message = 'Transaction failed';
    if (err?.shortMessage) {
      message = err.shortMessage;
    } else if (err?.message) {
      message = err.message;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────

/** Ensure the platform wallet has approved a spender for an ERC20 token */
async function ensureApproval(token: `0x${string}`, spender: `0x${string}`) {
  if (!platformWalletClient || !PLATFORM_ADDRESS) return;

  const allowance = (await platformPublicClient.readContract({
    address: token,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [PLATFORM_ADDRESS, spender],
  })) as bigint;

  if (allowance < BigInt('1000000000000000000000000')) {
    // Approve max
    const approveTx = await platformWalletClient.writeContract({
      address: token,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [spender, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
    });
    await platformPublicClient.waitForTransactionReceipt({ hash: approveTx });
    console.log(`[trade] Approved ${token} for ${spender}`);
  }
}

/** Ensure the platform wallet has approved ERC1155 transfers */
async function ensureERC1155Approval(erc1155: `0x${string}`, operator: `0x${string}`) {
  if (!platformWalletClient || !PLATFORM_ADDRESS) return;

  const isApproved = (await platformPublicClient.readContract({
    address: erc1155,
    abi: [
      {
        name: 'isApprovedForAll',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'account', type: 'address' },
          { name: 'operator', type: 'address' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      },
    ],
    functionName: 'isApprovedForAll',
    args: [PLATFORM_ADDRESS, operator],
  })) as boolean;

  if (!isApproved) {
    const tx = await platformWalletClient.writeContract({
      address: erc1155,
      abi: [
        {
          name: 'setApprovalForAll',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'operator', type: 'address' },
            { name: 'approved', type: 'bool' },
          ],
          outputs: [],
        },
      ],
      functionName: 'setApprovalForAll',
      args: [operator, true],
    });
    await platformPublicClient.waitForTransactionReceipt({ hash: tx });
    console.log(`[trade] Approved ERC1155 ${erc1155} for ${operator}`);
  }
}
