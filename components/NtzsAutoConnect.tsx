'use client';

import { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';

/**
 * Auto-connects the nTZS wallet when user is authenticated in the database
 * but wagmi wallet isn't connected yet.
 */
export default function NtzsAutoConnect() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    // Only attempt once per session
    if (hasAttempted || isConnected) return;

    // Check if user is authenticated in database
    const storedUser = localStorage.getItem('ntzsUser');
    if (!storedUser) return;

    try {
      const user = JSON.parse(storedUser);
      if (!user?.walletAddress) return;

      // Find the nTZS connector
      const ntzsConnector = connectors.find(c => c.id === 'ntzs-wallet');
      if (!ntzsConnector) return;

      // Store the wallet address in localStorage for the connector
      localStorage.setItem('ntzs:wallet_address', user.walletAddress);
      if (user.userId) localStorage.setItem('ntzs:user_id', user.userId);
      if (user.phone) localStorage.setItem('ntzs:phone', user.phone);
      
      // Connect the wagmi connector
      connect({ connector: ntzsConnector });
      setHasAttempted(true);
    } catch (err) {
      console.error('[NtzsAutoConnect] Failed to auto-connect:', err);
      setHasAttempted(true);
    }
  }, [isConnected, connect, connectors, hasAttempted]);

  return null; // This is a utility component with no UI
}
