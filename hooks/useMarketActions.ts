/**
 * useMarketActions — auto-selects between wallet-based hooks and
 * nTZS API-based hooks depending on whether the user has an nTZS account.
 *
 * Usage in any component:
 *   const { isNTZSUser } = useMarketActions();
 *   // Then conditionally use the correct hook
 */
import { useState, useEffect } from 'react';

export function useIsNTZSUser() {
  const [isNTZSUser, setIsNTZSUser] = useState(false);
  const [ntzsUser, setNtzsUser] = useState<any>(null);

  useEffect(() => {
    const check = () => {
      const stored = localStorage.getItem('ntzsUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        setNtzsUser(parsed);
        setIsNTZSUser(true);
      } else {
        setNtzsUser(null);
        setIsNTZSUser(false);
      }
    };

    check();

    // Re-check on storage changes
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  return { isNTZSUser, ntzsUser };
}
