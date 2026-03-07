/**
 * nTZS API Client
 * Custom implementation based on nTZS API documentation
 */

export class NtzsApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'NtzsApiError';
  }
}

interface NtzsUser {
  id: string;
  externalId: string;
  email: string;
  phone?: string;
  walletAddress: string;
  balanceTzs: number;
  createdAt: string;
}

interface NtzsDeposit {
  id: string;
  userId: string;
  amountTzs: number;
  phone: string;
  status: 'pending' | 'minted' | 'failed';
  txHash?: string;
  createdAt: string;
}

interface NtzsTransfer {
  id: string;
  fromUserId: string;
  toUserId: string;
  amountTzs: number;
  txHash: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

interface NtzsWithdrawal {
  id: string;
  userId: string;
  amountTzs: number;
  phone: string;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  createdAt: string;
}

interface NtzsClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export class NtzsClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: NtzsClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.ntzs.co.tz';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new NtzsApiError(response.status, error.message || 'Request failed');
    }

    return response.json();
  }

  // User Management
  users = {
    create: async (data: {
      externalId: string;
      email: string;
      phone?: string;
    }): Promise<NtzsUser> => {
      return this.request<NtzsUser>('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    get: async (userId: string): Promise<NtzsUser> => {
      return this.request<NtzsUser>(`/api/v1/users/${userId}`);
    },

    getBalance: async (userId: string): Promise<{ balanceTzs: number }> => {
      const user = await this.users.get(userId);
      return { balanceTzs: user.balanceTzs };
    },

    getByExternalId: async (externalId: string): Promise<NtzsUser> => {
      return this.request<NtzsUser>(`/api/v1/users/external/${externalId}`);
    },
  };

  // Deposits (On-Ramp)
  deposits = {
    create: async (data: {
      userId: string;
      amountTzs: number;
      phone: string;
    }): Promise<NtzsDeposit> => {
      return this.request<NtzsDeposit>('/api/v1/deposits', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    get: async (depositId: string): Promise<NtzsDeposit> => {
      return this.request<NtzsDeposit>(`/api/v1/deposits/${depositId}`);
    },

    list: async (userId: string): Promise<NtzsDeposit[]> => {
      return this.request<NtzsDeposit[]>(`/api/v1/deposits?userId=${userId}`);
    },
  };

  // Transfers
  transfers = {
    create: async (data: {
      fromUserId: string;
      toUserId: string;
      amountTzs: number;
    }): Promise<NtzsTransfer> => {
      return this.request<NtzsTransfer>('/api/v1/transfers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    get: async (transferId: string): Promise<NtzsTransfer> => {
      return this.request<NtzsTransfer>(`/api/v1/transfers/${transferId}`);
    },

    list: async (userId: string): Promise<NtzsTransfer[]> => {
      return this.request<NtzsTransfer[]>(`/api/v1/transfers?userId=${userId}`);
    },
  };

  // Withdrawals (Off-Ramp)
  withdrawals = {
    create: async (data: {
      userId: string;
      amountTzs: number;
      phone: string;
    }): Promise<NtzsWithdrawal> => {
      return this.request<NtzsWithdrawal>('/api/v1/withdrawals', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    get: async (withdrawalId: string): Promise<NtzsWithdrawal> => {
      return this.request<NtzsWithdrawal>(`/api/v1/withdrawals/${withdrawalId}`);
    },

    list: async (userId: string): Promise<NtzsWithdrawal[]> => {
      return this.request<NtzsWithdrawal[]>(`/api/v1/withdrawals?userId=${userId}`);
    },
  };
}

// Export types
export type {
  NtzsUser,
  NtzsDeposit,
  NtzsTransfer,
  NtzsWithdrawal,
  NtzsClientConfig,
};
