import { ClobClient, Side } from '@polymarket/clob-client';
import { ethers } from 'ethers';

// Initialize CLOB client for Polymarket trading
const CLOB_API_URL = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon mainnet

let clobClient: ClobClient | null = null;
let clobClientWithSigner: ClobClient | null = null;

export function initializeClobClient() {
  if (!clobClient) {
    // Initialize without signer for read-only operations
    clobClient = new ClobClient(
      CLOB_API_URL,
      CHAIN_ID
    );
  }
  return clobClient;
}

export function getClobClient(): ClobClient {
  if (!clobClient) {
    initializeClobClient();
  }
  return clobClient!;
}

/**
 * Initialize CLOB client with wallet signer for trading operations
 */
export async function initializeClobClientWithSigner(provider: any): Promise<ClobClient> {
  try {
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    
    clobClientWithSigner = new ClobClient(
      CLOB_API_URL,
      CHAIN_ID,
      signer
    );
    
    return clobClientWithSigner;
  } catch (error) {
    console.error('Error initializing CLOB client with signer:', error);
    throw error;
  }
}

export function getClobClientWithSigner(): ClobClient | null {
  return clobClientWithSigner;
}

export interface PolymarketOrder {
  tokenId: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
}

export interface PolymarketOrderbook {
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}

/**
 * Get current orderbook for a market token
 */
export async function getOrderbook(tokenId: string): Promise<PolymarketOrderbook | null> {
  try {
    const client = getClobClient();
    const orderbook = await client.getOrderBook(tokenId);
    return orderbook as PolymarketOrderbook;
  } catch (error) {
    console.error('Error fetching orderbook:', error);
    return null;
  }
}

/**
 * Get all markets
 */
export async function getMarkets(): Promise<any[]> {
  try {
    const client = getClobClient();
    const markets = await client.getMarkets();
    return markets;
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}

/**
 * Get market by condition ID
 */
export async function getMarket(conditionId: string): Promise<any> {
  try {
    const client = getClobClient();
    const market = await client.getMarket(conditionId);
    return market;
  } catch (error) {
    console.error('Error fetching market:', error);
    return null;
  }
}

/**
 * Create and place an order with wallet signer
 */
export async function placeOrder(
  tokenId: string,
  price: number,
  size: number,
  side: 'BUY' | 'SELL',
  provider: any
): Promise<any> {
  try {
    // Initialize client with signer if not already done
    let client = getClobClientWithSigner();
    if (!client) {
      client = await initializeClobClientWithSigner(provider);
    }
    
    // Convert side to Side enum
    const orderSide: Side = side === 'BUY' ? Side.BUY : Side.SELL;
    
    // Create order payload with correct types
    const orderArgs = {
      tokenID: tokenId,
      price: price,
      size: size,
      side: orderSide,
      feeRateBps: 0,
    };
    
    // Create and sign the order
    const signedOrder = await client.createOrder(orderArgs);
    
    // Post the order to the orderbook
    const resp = await client.postOrder(signedOrder);
    
    return {
      success: true,
      orderId: resp.orderID,
      order: signedOrder,
    };
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
}

/**
 * Cancel an order (requires wallet signer)
 */
export async function cancelOrder(orderPayload: any): Promise<any> {
  try {
    const client = getClobClient();
    const response = await client.cancelOrder(orderPayload);
    return response;
  } catch (error) {
    console.error('Error canceling order:', error);
    throw error;
  }
}

/**
 * Get simplified market data for trading UI
 */
export async function getMarketData(conditionId: string): Promise<{
  tokenIds: string[];
  prices: number[];
  volumes: number[];
} | null> {
  try {
    const market = await getMarket(conditionId);
    if (!market) return null;

    // Extract token IDs and prices from market data
    const tokenIds = market.tokens?.map((t: any) => t.token_id) || [];
    const prices = market.tokens?.map((t: any) => parseFloat(t.price || '0.5')) || [];
    const volumes = market.tokens?.map((t: any) => parseFloat(t.volume || '0')) || [];

    return { tokenIds, prices, volumes };
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}
