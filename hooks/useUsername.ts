import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function useUsername() {
  const { address } = useAccount();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setUsername(null);
      setIsLoading(false);
      return;
    }

    // Load username from localStorage
    const stored = localStorage.getItem(`username_${address.toLowerCase()}`);
    setUsername(stored);
    setIsLoading(false);
  }, [address]);

  const saveUsername = (newUsername: string) => {
    if (!address) return;
    
    localStorage.setItem(`username_${address.toLowerCase()}`, newUsername);
    setUsername(newUsername);
  };

  const hasUsername = !!username;

  return {
    username,
    hasUsername,
    isLoading,
    saveUsername,
  };
}
