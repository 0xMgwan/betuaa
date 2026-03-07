/**
 * POST /api/trade
 * Custodial trade execution — all contract writes go through the platform wallet.
 *
 * Actions:
 *   buy      — user pays TZS, platform mints position tokens and records user's share
 *   sell     — user sells position, platform redeems and pays TZS back
 *   cancel   — cancel a limit order (platform wallet)
 *   split    — split collateral into outcome shares
 *   merge    — merge equal outcome shares back into collateral
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  platformWalletClient,
  platformPublicClient,
  PLATFORM_ADDRESS,
  tzsToUsdcRaw,
  usdcRawToTzs,
} from '@/lib/platform-wallet';
import { createTransfer, getUserByWallet } from '@/lib/ntzs';
import { addPosition, removePosition, getPosition } from '@/lib/positions';
import { CONTRACTS } from '@/lib/contracts';
import OrderBookABI from '@/lib/abis/OrderBookV2.json';
import CTFPredictionMarketABI from '@/lib/abis/CTFPredictionMarketV2.json';
import ERC20ABI from '@/lib/abis/ERC20.json';

const ORDER_BOOK_ADDRESS = CONTRACTS.baseSepolia.orderBook as `0x${string}`;
const CTF_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`;
const MOCK_USDC = CONTRACTS.baseSepolia.mockUSDC as `0x${string}`;

// ── Helpers ────────────────────────────────────────────────────────────────────

async function ensureApproval(token: `0x${string}`, spender: `0x${string}`, amount: bigint) {
  if (!platformWalletClient || !PLATFORM_ADDRESS) return;
  const allowance = await platformPublicClient.readContract({
    address: token,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [PLATFORM_ADDRESS, spender],
  }) as bigint;

  if (allowance < amount) {
    const maxApproval = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    const hash = await platformWalletClient.writeContract({
      address: token,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [spender, maxApproval],
    });
    await platformPublicClient.waitForTransactionReceipt({ hash });
  }
}

async function ensureERC1155Approval(operator: `0x${string}`) {
  if (!platformWalletClient || !PLATFORM_ADDRESS) return;
  const approved = await platformPublicClient.readContract({
    address: CTF_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'isApprovedForAll',
    args: [PLATFORM_ADDRESS, operator],
  }) as boolean;

  if (!approved) {
    const hash = await platformWalletClient.writeContract({
      address: CTF_ADDRESS,
      abi: CTFPredictionMarketABI,
      functionName: 'setApprovalForAll',
      args: [operator, true],
    });
    await platformPublicClient.waitForTransactionReceipt({ hash });
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!platformWalletClient || !PLATFORM_ADDRESS) {
      return NextResponse.json({ error: 'Platform wallet not configured' }, { status: 503 });
    }

    const body = await req.json();
    const { action, userAddress } = body as { action: string; userAddress: string };

    if (!userAddress) return NextResponse.json({ error: 'userAddress required' }, { status: 400 });

    // Resolve nTZS user for payment
    const user = await getUserByWallet(userAddress);
    const platformNtzsUser = PLATFORM_ADDRESS ? await getUserByWallet(PLATFORM_ADDRESS) : null;

    switch (action) {

      // ── BUY outcome shares ───────────────────────────────────────────────────
      case 'buy': {
        const { marketId, outcomeIndex, amountTzs } = body as {
          marketId: number;
          outcomeIndex: number;
          amountTzs: number;
        };

        if (!user) return NextResponse.json({ error: 'nTZS user not found for this address' }, { status: 404 });
        if (!platformNtzsUser) return NextResponse.json({ error: 'Platform nTZS account not configured' }, { status: 503 });

        // 1. Collect payment: transfer nTZS from user to platform
        await createTransfer({
          fromUserId: user.id,
          toUserId: platformNtzsUser.id,
          amountTzs,
        });

        // 2. Mint position tokens (collateral → equal YES+NO shares)
        const usdcAmount = tzsToUsdcRaw(amountTzs);
        await ensureApproval(MOCK_USDC, CTF_ADDRESS, usdcAmount);

        const { request: mintReq } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: CTF_ADDRESS,
          abi: CTFPredictionMarketABI,
          functionName: 'mintPositionTokens',
          args: [BigInt(marketId), usdcAmount],
        });
        const mintHash = await platformWalletClient.writeContract(mintReq);
        await platformPublicClient.waitForTransactionReceipt({ hash: mintHash });

        // 3. Record user's position (they own `outcomeIndex` shares)
        //    mintPositionTokens gives equal shares for each outcome — user picks one side
        const position = addPosition({
          userAddress,
          marketId,
          outcomeIndex,
          shares: usdcAmount * BigInt(1e12), // scale to 18 decimals (USDC 6→18)
          costTzs: amountTzs,
        });

        return NextResponse.json({ success: true, hash: mintHash, position: {
          marketId: position.marketId,
          outcomeIndex: position.outcomeIndex,
          shares: position.shares.toString(),
          costTzs: position.costTzs,
        }});
      }

      // ── SELL / REDEEM position shares ─────────────────────────────────────────
      case 'sell': {
        const { marketId, outcomeIndex, sharesToSell } = body as {
          marketId: number;
          outcomeIndex: number;
          sharesToSell: string; // bigint as string
        };

        const sharesRaw = BigInt(sharesToSell);
        const existing = getPosition(userAddress, marketId, outcomeIndex);
        if (!existing || existing.shares < sharesRaw) {
          return NextResponse.json({ error: 'Insufficient position' }, { status: 400 });
        }

        // Redeem position tokens back to collateral via merge
        const usdcAmount = sharesRaw / BigInt(1e12);
        await ensureERC1155Approval(ORDER_BOOK_ADDRESS);

        const { request: mergeReq } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: ORDER_BOOK_ADDRESS,
          abi: OrderBookABI,
          functionName: 'mergeShares',
          args: [BigInt(marketId), usdcAmount],
        });
        const mergeHash = await platformWalletClient.writeContract(mergeReq);
        await platformPublicClient.waitForTransactionReceipt({ hash: mergeHash });

        // Pay user back in TZS
        const payoutTzs = usdcRawToTzs(usdcAmount);
        if (user && platformNtzsUser && payoutTzs > 0) {
          await createTransfer({
            fromUserId: platformNtzsUser.id,
            toUserId: user.id,
            amountTzs: payoutTzs,
          });
        }

        removePosition(userAddress, marketId, outcomeIndex, sharesRaw);

        return NextResponse.json({ success: true, hash: mergeHash, payoutTzs });
      }

      // ── PLACE market order via OrderBook ────────────────────────────────────
      case 'marketOrder': {
        const { marketId, outcomeIndex, side, amountTzs, maxSlippageBps = 200 } = body as {
          marketId: number;
          outcomeIndex: number;
          side: 0 | 1; // 0=BUY, 1=SELL
          amountTzs: number;
          maxSlippageBps?: number;
        };

        if (!user) return NextResponse.json({ error: 'nTZS user not found' }, { status: 404 });
        if (!platformNtzsUser) return NextResponse.json({ error: 'Platform nTZS account not configured' }, { status: 503 });

        const usdcAmount = tzsToUsdcRaw(amountTzs);

        if (side === 0) {
          // BUY: collect payment first
          await createTransfer({ fromUserId: user.id, toUserId: platformNtzsUser.id, amountTzs });
          await ensureApproval(MOCK_USDC, ORDER_BOOK_ADDRESS, usdcAmount);
        } else {
          // SELL: verify position exists
          const pos = getPosition(userAddress, marketId, outcomeIndex);
          if (!pos || pos.shares === 0n) {
            return NextResponse.json({ error: 'No position to sell' }, { status: 400 });
          }
          await ensureERC1155Approval(ORDER_BOOK_ADDRESS);
        }

        const { request: orderReq } = await platformPublicClient.simulateContract({
          account: platformWalletClient.account,
          address: ORDER_BOOK_ADDRESS,
          abi: OrderBookABI,
          functionName: 'placeMarketOrder',
          args: [BigInt(marketId), BigInt(outcomeIndex), side, usdcAmount, BigInt(maxSlippageBps)],
          gas: BigInt(500_000),
        });
        const hash = await platformWalletClient.writeContract(orderReq);
        await platformPublicClient.waitForTransactionReceipt({ hash });

        if (side === 0) {
          addPosition({ userAddress, marketId, outcomeIndex, shares: usdcAmount * BigInt(1e12), costTzs: amountTzs });
        } else {
          removePosition(userAddress, marketId, outcomeIndex, usdcAmount * BigInt(1e12));
          const payoutTzs = usdcRawToTzs(usdcAmount);
          if (platformNtzsUser && payoutTzs > 0) {
            await createTransfer({ fromUserId: platformNtzsUser.id, toUserId: user!.id, amountTzs: payoutTzs });
          }
        }

        return NextResponse.json({ success: true, hash });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error('[/api/trade]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
