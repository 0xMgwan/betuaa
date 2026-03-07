'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { ReactNode } from 'react';
import { config } from '@/lib/wagmi';
import { ThemeProvider } from '@/components/ThemeProvider';

const queryClient = new QueryClient();

/**
 * App providers — wagmi (nTZS connector) + React Query + Theme.
 * RainbowKit removed: wallet connection is handled by NTZSConnectModal.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
