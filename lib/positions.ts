/**
 * User position store — server-side only.
 * Tracks which nTZS user owns which outcome shares held by the platform wallet.
 *
 * In production this should be backed by a database (Postgres, Supabase, etc.).
 * For now it's an in-memory Map that survives server restarts only within one process.
 */

export interface UserPosition {
  userAddress: string;
  marketId: number;
  outcomeIndex: number;   // 0=YES, 1=NO, etc.
  shares: bigint;         // raw shares (18 decimals from CTF contract)
  costTzs: number;        // amount paid in TZS
  createdAt: string;
}

// ── Store ──────────────────────────────────────────────────────────────────────
// Key: `${userAddress.toLowerCase()}:${marketId}:${outcomeIndex}`

const store = new Map<string, UserPosition>();

function key(userAddress: string, marketId: number, outcomeIndex: number): string {
  return `${userAddress.toLowerCase()}:${marketId}:${outcomeIndex}`;
}

export function addPosition(pos: Omit<UserPosition, 'createdAt'>): UserPosition {
  const k = key(pos.userAddress, pos.marketId, pos.outcomeIndex);
  const existing = store.get(k);
  const updated: UserPosition = {
    ...pos,
    shares: existing ? existing.shares + pos.shares : pos.shares,
    costTzs: existing ? existing.costTzs + pos.costTzs : pos.costTzs,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  store.set(k, updated);
  return updated;
}

export function removePosition(
  userAddress: string,
  marketId: number,
  outcomeIndex: number,
  shares: bigint,
): UserPosition | null {
  const k = key(userAddress, marketId, outcomeIndex);
  const existing = store.get(k);
  if (!existing) return null;

  const remaining = existing.shares - shares;
  if (remaining <= 0n) {
    store.delete(k);
    return { ...existing, shares: 0n };
  }

  const updated: UserPosition = {
    ...existing,
    shares: remaining,
    costTzs: Number(remaining) / Number(existing.shares) * existing.costTzs,
  };
  store.set(k, updated);
  return updated;
}

export function getPosition(
  userAddress: string,
  marketId: number,
  outcomeIndex: number,
): UserPosition | null {
  return store.get(key(userAddress, marketId, outcomeIndex)) ?? null;
}

export function getUserPositions(userAddress: string): UserPosition[] {
  const result: UserPosition[] = [];
  for (const [k, pos] of store) {
    if (k.startsWith(userAddress.toLowerCase() + ':')) {
      result.push(pos);
    }
  }
  return result;
}

export function getMarketPositions(marketId: number): UserPosition[] {
  const result: UserPosition[] = [];
  for (const [, pos] of store) {
    if (pos.marketId === marketId) result.push(pos);
  }
  return result;
}

/** Total platform shares for a market outcome (sum of all user positions). */
export function totalPlatformShares(marketId: number, outcomeIndex: number): bigint {
  let total = 0n;
  for (const [, pos] of store) {
    if (pos.marketId === marketId && pos.outcomeIndex === outcomeIndex) {
      total += pos.shares;
    }
  }
  return total;
}
