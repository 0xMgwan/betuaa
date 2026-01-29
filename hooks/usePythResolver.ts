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

  const configurePythMarket = (
    marketId: number,
    priceId: string,
    threshold: number,
    expiryTime: number,
    isAbove: boolean
  ) => {
    console.log('🔐 configurePythMarket hook called with:', {
      marketId,
      priceId,
      threshold,
      expiryTime,
      isAbove
    });
    
    // Convert threshold to Pyth format (scaled by 10^8)
    // int64 max value is 9223372036854775807
    const thresholdScaled = Math.floor(threshold * 1e8);
    
    console.log('� Threshold scaling:', {
      original: threshold,
      scaled: thresholdScaled,
      max: 9223372036854775807
    });
    
    // Ensure it fits in int64
    if (thresholdScaled > 9223372036854775807 || thresholdScaled < -9223372036854775808) {
      console.error('❌ Threshold too large:', thresholdScaled);
      throw new Error('Threshold value too large for int64');
    }
    
    const args = [
      BigInt(marketId),
      priceId as `0x${string}`,
      BigInt(thresholdScaled),
      BigInt(expiryTime),
      isAbove,
    ];
    
    console.log('📝 Calling writeContract with args:', args);
    
    try {
      writeContract({
        address: PYTH_RESOLVER_ADDRESS,
        abi: PYTH_RESOLVER_ABI,
        functionName: 'configurePythMarket',
        args,
        chainId: baseSepolia.id,
      });
      console.log('✅ writeContract called successfully');
    } catch (error) {
      console.error('❌ Error calling writeContract:', error);
      throw error;
    }
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
