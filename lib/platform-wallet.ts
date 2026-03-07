/**
 * Platform wallet — server-side only.
 * Signs all contract transactions on behalf of users.
 * Never import this in client components.
 */
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'wagmi/chains';
import { RPC } from './contracts';

if (!process.env.PLATFORM_PRIVATE_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('PLATFORM_PRIVATE_KEY is not set');
}

export const platformAccount = process.env.PLATFORM_PRIVATE_KEY
  ? privateKeyToAccount(process.env.PLATFORM_PRIVATE_KEY as `0x${string}`)
  : undefined;

export const platformPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC.baseSepolia.primary),
});

export const platformWalletClient = platformAccount
  ? createWalletClient({
      account: platformAccount,
      chain: baseSepolia,
      transport: http(RPC.baseSepolia.primary),
    })
  : null;

export const PLATFORM_ADDRESS = platformAccount?.address as `0x${string}` | undefined;

/**
 * TZS ↔ USDC conversion.
 * NTZS_PER_USDC env var controls the rate (default: 2600 TZS = 1 USDC).
 * MockUSDC has 6 decimals.
 */
export const NTZS_PER_USDC = Number(process.env.NTZS_PER_USDC ?? 2600);

/** Convert TZS amount to MockUSDC raw units (6 decimals) */
export function tzsToUsdcRaw(amountTzs: number): bigint {
  const usdc = amountTzs / NTZS_PER_USDC;
  return BigInt(Math.floor(usdc * 1_000_000)); // 6 decimals
}

/** Convert MockUSDC raw units to TZS */
export function usdcRawToTzs(rawUsdc: bigint): number {
  const usdc = Number(rawUsdc) / 1_000_000;
  return usdc * NTZS_PER_USDC;
}
