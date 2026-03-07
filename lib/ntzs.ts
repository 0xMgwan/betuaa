/**
 * nTZS REST client — server-side only.
 * Never import this in client components — use /api/ntzs/* routes instead.
 */

const BASE_URL = process.env.NTZS_API_BASE_URL || 'https://api.ntzs.co';
const API_KEY  = process.env.NTZS_API_KEY!;

if (!API_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('NTZS_API_KEY is not set');
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NtzsUser {
  id: string;
  externalId: string;
  email?: string;
  phone?: string;
  walletAddress: string;
  createdAt: string;
}

export interface NtzsDeposit {
  id: string;
  userId: string;
  amountTzs: number;
  phone: string;
  status: 'pending' | 'processing' | 'minted' | 'failed';
  txHash?: string;
  createdAt: string;
}

export interface NtzsWithdrawal {
  id: string;
  userId: string;
  amountTzs: number;
  phone: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface NtzsBalance {
  balanceTzs: number;
  balanceNtzs: string; // raw token amount (18 decimals string)
  walletAddress: string;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  console.log(`[nTZS Request] ${method} ${url}`, body ? JSON.stringify(body) : '');
  
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log(`[nTZS Response] ${method} ${url} - Status: ${res.status}`);

  if (!res.ok) {
    let message = `nTZS API error ${res.status}`;
    try {
      const errData = await res.json();
      console.log(`[nTZS Error Response]`, errData);
      message = errData.message || errData.error || message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const data = await res.json();
  console.log(`[nTZS Success Response]`, JSON.stringify(data).slice(0, 200));
  return data as T;
}

// ─── Users ────────────────────────────────────────────────────────────────────

/** Create a nTZS user, or retrieve the existing one (idempotent via externalId). */
export async function createOrGetUser(params: {
  walletAddress: string;
  email?: string;
  phone?: string;
}): Promise<NtzsUser> {
  return request<NtzsUser>('POST', '/api/v1/users', {
    externalId: params.walletAddress.toLowerCase(),
    email:      params.email,
    phone:      params.phone,
  });
}

export async function getUserByWallet(walletAddress: string): Promise<NtzsUser | null> {
  try {
    console.log(`[nTZS] Looking up user by wallet address: ${walletAddress}`);
    
    // Try different API endpoints
    try {
      // Try 1: /api/v1/users?walletAddress={address}
      const user = await request<NtzsUser>('GET', `/api/v1/users?walletAddress=${walletAddress}`);
      console.log(`[nTZS] Found user via walletAddress query:`, user);
      return user;
    } catch (err1) {
      console.log(`[nTZS] walletAddress query failed, trying externalId path`);
      try {
        // Try 2: /api/v1/users/external/{externalId}
        const externalId = walletAddress.toLowerCase();
        const user = await request<NtzsUser>('GET', `/api/v1/users/external/${externalId}`);
        console.log(`[nTZS] Found user via external endpoint:`, user);
        return user;
      } catch (err2) {
        console.log(`[nTZS] External endpoint failed, trying externalId query param`);
        // Try 3: /api/v1/users?externalId={externalId}
        const externalId = walletAddress.toLowerCase();
        const user = await request<NtzsUser>('GET', `/api/v1/users?externalId=${externalId}`);
        console.log(`[nTZS] Found user via externalId query:`, user);
        return user;
      }
    }
  } catch (err) {
    console.log(`[nTZS] User not found for wallet ${walletAddress}:`, err);
    return null;
  }
}

export async function getNtzsBalance(userId: string): Promise<NtzsBalance> {
  // Balance is included in the user object at /api/v1/users/{userId}
  return request<NtzsBalance>('GET', `/api/v1/users/${userId}`);
}

export async function getNtzsBalanceByWallet(walletAddress: string): Promise<NtzsBalance> {
  console.log(`[nTZS] Fetching balance for wallet: ${walletAddress}`);
  // First get the user by wallet address (externalId)
  const user = await getUserByWallet(walletAddress);
  if (!user) {
    throw new Error('User not found');
  }
  // Then get balance using the user's ID
  return getNtzsBalance(user.id);
}

// ─── Deposits (On-Ramp) ───────────────────────────────────────────────────────

/** Initiate a Mobile Money STK Push deposit. Returns immediately; poll getDeposit for status. */
export async function createDeposit(params: {
  userId: string;
  amountTzs: number;
  phone: string; // 255XXXXXXXXX
}): Promise<NtzsDeposit> {
  return request<NtzsDeposit>('POST', '/api/v1/deposits', {
    userId: params.userId,
    amountTzs: params.amountTzs,
    phoneNumber: params.phone,
  });
}

export async function getDeposit(depositId: string): Promise<NtzsDeposit> {
  return request<NtzsDeposit>('GET', `/api/v1/deposits/${depositId}`);
}

// ─── Withdrawals (Off-Ramp) ───────────────────────────────────────────────────

/** Initiate a withdrawal — burns nTZS and sends TZS to Mobile Money. */
export async function createWithdrawal(params: {
  userId: string;
  amountTzs: number;
  phone: string; // 255XXXXXXXXX
}): Promise<NtzsWithdrawal> {
  return request<NtzsWithdrawal>('POST', '/api/v1/withdrawals', {
    userId: params.userId,
    amountTzs: params.amountTzs,
    phoneNumber: params.phone,
  });
}

export async function getWithdrawal(withdrawalId: string): Promise<NtzsWithdrawal> {
  return request<NtzsWithdrawal>('GET', `/api/v1/withdrawals/${withdrawalId}`);
}

// ─── Transfers (In-Platform) ──────────────────────────────────────────────────

export interface NtzsTransfer {
  id: string;
  fromUserId: string;
  toUserId: string;
  amountTzs: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  createdAt: string;
}

/** Transfer nTZS between two nTZS users (e.g., user → platform for a trade). */
export async function createTransfer(params: {
  fromUserId: string;
  toUserId: string;
  amountTzs: number;
}): Promise<NtzsTransfer> {
  return request<NtzsTransfer>('POST', '/api/v1/transfers', params);
}
