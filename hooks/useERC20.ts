import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import ERC20ABI from '@/lib/abis/ERC20.json';
import { baseSepolia } from 'wagmi/chains';

export function useTokenBalance(tokenAddress: `0x${string}`, userAddress: `0x${string}`) {
  return useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: [userAddress],
    chainId: baseSepolia.id,
    query: {
      enabled: !!userAddress && !!tokenAddress,
    },
  });
}

export function useTokenAllowance(
  tokenAddress: `0x${string}`,
  ownerAddress: `0x${string}`,
  spenderAddress: `0x${string}`
) {
  return useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [ownerAddress, spenderAddress],
    chainId: baseSepolia.id,
    query: {
      enabled: !!ownerAddress && !!tokenAddress && !!spenderAddress,
    },
  });
}

export function useTokenDecimals(tokenAddress: `0x${string}`) {
  return useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'decimals',
    chainId: baseSepolia.id,
    query: {
      enabled: !!tokenAddress,
    },
  });
}

export function useTokenSymbol(tokenAddress: `0x${string}`) {
  return useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: 'symbol',
    chainId: baseSepolia.id,
    query: {
      enabled: !!tokenAddress,
    },
  });
}

export function useApproveToken() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (tokenAddress: `0x${string}`, spenderAddress: `0x${string}`, amount: bigint) => {
    return writeContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [spenderAddress, amount],
      chainId: baseSepolia.id,
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
