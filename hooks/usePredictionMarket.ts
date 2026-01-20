import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import PredictionMarketABI from '@/lib/abis/PredictionMarket.json';
import { baseSepolia } from 'wagmi/chains';

const CONTRACT_ADDRESS = CONTRACTS.baseSepolia.predictionMarket as `0x${string}`;

export function useMarketCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PredictionMarketABI,
    functionName: 'marketCount',
    chainId: baseSepolia.id,
  });
}

export function useGetMarket(marketId: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PredictionMarketABI,
    functionName: 'getMarket',
    args: [BigInt(marketId)],
    chainId: baseSepolia.id,
  });
}

export function useGetMarketOutcomes(marketId: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PredictionMarketABI,
    functionName: 'getMarketOutcomes',
    args: [BigInt(marketId)],
    chainId: baseSepolia.id,
  });
}

export function useGetUserPosition(marketId: number, userAddress: `0x${string}`, outcomeId: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PredictionMarketABI,
    functionName: 'getUserPosition',
    args: [BigInt(marketId), userAddress, BigInt(outcomeId)],
    chainId: baseSepolia.id,
    query: {
      enabled: !!userAddress,
    },
  });
}

export function useGetSupportedTokens() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PredictionMarketABI,
    functionName: 'getSupportedTokens',
    chainId: baseSepolia.id,
  });
}

export function useCalculatePrice(marketId: number, outcomeId: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PredictionMarketABI,
    functionName: 'calculatePrice',
    args: [BigInt(marketId), BigInt(outcomeId)],
    chainId: baseSepolia.id,
  });
}

export function useCreateMarket() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createMarket = async (
    title: string,
    description: string,
    marketType: number, // 0 = Binary, 1 = MultiOutcome
    closingDate: bigint,
    outcomeNames: string[],
    initialLiquidity: bigint,
    paymentToken: `0x${string}`
  ) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PredictionMarketABI,
      functionName: 'createMarket',
      args: [title, description, marketType, closingDate, outcomeNames, initialLiquidity, paymentToken],
      chainId: baseSepolia.id,
    });
  };

  return {
    createMarket,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useBuyShares() {
  const { data: hash, writeContract, isPending, isSuccess, error } = useWriteContract();

  const buyShares = async (
    marketId: number,
    outcomeId: number,
    shares: bigint
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: PredictionMarketABI,
      functionName: 'buyShares',
      args: [BigInt(marketId), BigInt(outcomeId), shares],
      chainId: baseSepolia.id,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    buyShares,
    isPending: isPending || isConfirming,
    isSuccess: isConfirmed,
    error,
    hash,
  };
}

export function useSellShares() {
  const { data: hash, writeContract, isPending, isSuccess, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const sellShares = async (marketId: number, outcomeId: number, amount: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: PredictionMarketABI,
      functionName: 'sellShares',
      args: [BigInt(marketId), BigInt(outcomeId), amount],
      chainId: baseSepolia.id,
    });
  };

  return {
    sellShares,
    isPending: isPending || isConfirming,
    isSuccess: isConfirmed,
    error,
    hash,
  };
}

export function useResolveMarket() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const resolveMarket = async (marketId: number, winningOutcomeId: number) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PredictionMarketABI,
      functionName: 'resolveMarket',
      args: [BigInt(marketId), BigInt(winningOutcomeId)],
      chainId: baseSepolia.id,
    });
  };

  return {
    resolveMarket,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useClaimWinnings() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimWinnings = async (marketId: number, outcomeId: number) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PredictionMarketABI,
      functionName: 'claimWinnings',
      args: [BigInt(marketId), BigInt(outcomeId)],
      chainId: baseSepolia.id,
    });
  };

  return {
    claimWinnings,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
