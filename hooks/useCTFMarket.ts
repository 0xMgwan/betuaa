import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '../lib/contracts';
import CTFPredictionMarketABI from '../lib/abis/CTFPredictionMarket.json';
import { baseSepolia } from 'wagmi/chains';

const CONTRACT_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`;

// Read market count
export function useCTFMarketCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'marketCount',
    chainId: baseSepolia.id,
  });
}

// Get market details
export function useCTFGetMarket(marketId: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'getMarket',
    args: [BigInt(marketId)],
    chainId: baseSepolia.id,
  });
}

// Get outcome token ID
export function useCTFGetOutcomeToken(marketId: number, outcomeIndex: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'getOutcomeToken',
    args: [BigInt(marketId), BigInt(outcomeIndex)],
    chainId: baseSepolia.id,
  });
}

// Get token balance (ERC1155)
export function useCTFBalanceOf(account: `0x${string}` | undefined, tokenId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CTFPredictionMarketABI,
    functionName: 'balanceOf',
    args: account && tokenId ? [account, tokenId] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!account && tokenId !== undefined,
    },
  });
}

// Create market
export function useCTFCreateMarket() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createMarket = async (
    question: string,
    description: string,
    outcomeCount: bigint,
    closingTime: bigint,
    collateralToken: `0x${string}`
  ) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CTFPredictionMarketABI,
      functionName: 'createMarket',
      args: [question, description, outcomeCount, closingTime, collateralToken],
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

// Mint position tokens
export function useCTFMintPositionTokens() {
  const { data: hash, writeContract, isPending, isSuccess, error } = useWriteContract();

  const mintPositionTokens = async (marketId: number, amount: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CTFPredictionMarketABI,
      functionName: 'mintPositionTokens',
      args: [BigInt(marketId), amount],
      chainId: baseSepolia.id,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    mintPositionTokens,
    isPending: isPending || isConfirming,
    isSuccess: isConfirmed,
    error,
    hash,
  };
}

// Redeem position tokens
export function useCTFRedeemPositionTokens() {
  const { data: hash, writeContract, isPending, isSuccess, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const redeemPositionTokens = async (marketId: number, amount: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CTFPredictionMarketABI,
      functionName: 'redeemPositionTokens',
      args: [BigInt(marketId), amount],
      chainId: baseSepolia.id,
    });
  };

  return {
    redeemPositionTokens,
    isPending: isPending || isConfirming,
    isSuccess: isConfirmed,
    error,
    hash,
  };
}

// Resolve market
export function useCTFResolveMarket() {
  const { data: hash, writeContract, isPending, isSuccess, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const resolveMarket = async (marketId: number, winningOutcome: number) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CTFPredictionMarketABI,
      functionName: 'resolveMarket',
      args: [BigInt(marketId), BigInt(winningOutcome)],
      chainId: baseSepolia.id,
    });
  };

  return {
    resolveMarket,
    isPending: isPending || isConfirming,
    isSuccess: isConfirmed,
    error,
    hash,
  };
}

// Redeem winning tokens
export function useCTFRedeemWinningTokens() {
  const { data: hash, writeContract, isPending, isSuccess, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const redeemWinningTokens = (marketId: number, amount: bigint) => {
    console.log('redeemWinningTokens called with:', { marketId, amount: amount.toString() });
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CTFPredictionMarketABI,
      functionName: 'redeemWinningTokens',
      args: [BigInt(marketId), amount],
      chainId: baseSepolia.id,
    });
  };

  return {
    redeemWinningTokens,
    isPending: isPending || isConfirming,
    isSuccess: isConfirmed,
    error,
    hash,
  };
}

// Redeem position tokens (sell shares)
export function useCTFBurnPositionTokens() {
  const { data: hash, writeContract, isPending, isSuccess, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const burnPositionTokens = (marketId: number, amount: bigint) => {
    console.log('redeemPositionTokens called with:', { marketId, amount: amount.toString() });
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CTFPredictionMarketABI,
      functionName: 'redeemPositionTokens',
      args: [BigInt(marketId), amount],
      chainId: baseSepolia.id,
    });
  };

  return {
    burnPositionTokens,
    isPending: isPending || isConfirming,
    isSuccess: isConfirmed,
    error,
    hash,
  };
}
