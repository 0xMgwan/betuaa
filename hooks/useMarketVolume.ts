import { useState, useEffect } from 'react';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACTS } from '@/lib/contracts';

const CONTRACT_ADDRESS = CONTRACTS.baseSepolia.ctfPredictionMarket as `0x${string}`;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

interface MarketVolumeData {
  totalVolume: bigint;
  participantCount: number;
  isLoading: boolean;
}

export function useMarketVolume(marketId: number): MarketVolumeData {
  const [data, setData] = useState<MarketVolumeData>({
    totalVolume: BigInt(0),
    participantCount: 0,
    isLoading: true,
  });

  useEffect(() => {
    async function fetchVolumeFromLogs() {
      try {
        // Get all Transfer events for this market's outcome tokens
        // TransferSingle(address operator, address from, address to, uint256 id, uint256 value)
        const transferEvent = parseAbiItem('event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)');
        
        // Get logs from the last 10000 blocks (adjust as needed)
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - BigInt(10000);
        
        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: transferEvent,
          fromBlock,
          toBlock: 'latest',
        });

        // Filter for minting events (from = 0x0) and calculate volume
        let totalVolume = BigInt(0);
        const uniqueUsers = new Set<string>();

        for (const log of logs) {
          const { from, to, value } = log.args;
          
          // Minting event: from = zero address
          if (from === '0x0000000000000000000000000000000000000000') {
            totalVolume += value || BigInt(0);
            if (to) uniqueUsers.add(to.toLowerCase());
          }
        }

        setData({
          totalVolume,
          participantCount: uniqueUsers.size,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching market volume from logs:', error);
        setData({
          totalVolume: BigInt(0),
          participantCount: 0,
          isLoading: false,
        });
      }
    }

    fetchVolumeFromLogs();
  }, [marketId]);

  return data;
}
