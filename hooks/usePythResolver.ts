import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '../lib/contracts';
import { baseSepolia } from 'wagmi/chains';

const PYTH_RESOLVER_ABI = [
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'priceId', type: 'bytes32' },
      { name: 'threshold', type: 'int64' },
      { name: 'expiryTime', type: 'uint256' },
      { name: 'isAbove', type: 'bool' },
    ],
    name: 'configurePythMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const PYTH_RESOLVER_ADDRESS = CONTRACTS.baseSepolia.pythResolver as `0x${string}`;

export function useConfigurePythMarket() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const configurePythMarket = async (
    marketId: number,
    priceId: string,
    threshold: number,
    expiryTime: number,
    isAbove: boolean
  ) => {
    // Convert threshold to Pyth format (scaled by 10^8)
    const thresholdScaled = BigInt(Math.floor(threshold * 1e8));
    
    writeContract({
      address: PYTH_RESOLVER_ADDRESS,
      abi: PYTH_RESOLVER_ABI,
      functionName: 'configurePythMarket',
      args: [
        BigInt(marketId),
        priceId as `0x${string}`,
        thresholdScaled,
        BigInt(expiryTime),
        isAbove,
      ],
      chainId: baseSepolia.id,
    });
  };

  return {
    configurePythMarket,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
