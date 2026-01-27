// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StablecoinRegistry
 * @notice Registry of supported stablecoins on Base network
 * @dev Real contract addresses for Base mainnet and Base Sepolia
 */
library StablecoinRegistry {
    // Base Mainnet Stablecoin Addresses
    address public constant USDC_BASE = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public constant USDT_BASE = 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2;
    address public constant CNGN_BASE = 0x46C85152bFe9f96829aA94755D9f915F9B10EF5F; // cNGN (Nigerian Naira)
    address public constant IDRX_BASE = 0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22; // IDRX (Indonesian Rupiah)
    
    // Base Sepolia Testnet Addresses
    address public constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address public constant USDT_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e; // Using USDC address for testing
    address public constant CNGN_BASE_SEPOLIA = 0x929A08903C22440182646Bb450a67178Be402f7f;
    
    struct StablecoinInfo {
        address tokenAddress;
        string symbol;
        string name;
        uint8 decimals;
        bool isActive;
    }
    
    /**
     * @notice Get stablecoin info by address
     * @param _token Token address to query
     * @return info Stablecoin information
     */
    function getStablecoinInfo(address _token) internal pure returns (StablecoinInfo memory info) {
        if (_token == USDC_BASE || _token == USDC_BASE_SEPOLIA) {
            return StablecoinInfo({
                tokenAddress: _token,
                symbol: "USDC",
                name: "USD Coin",
                decimals: 6,
                isActive: true
            });
        } else if (_token == USDT_BASE || _token == USDT_BASE_SEPOLIA) {
            return StablecoinInfo({
                tokenAddress: _token,
                symbol: "USDT",
                name: "Tether USD",
                decimals: 6,
                isActive: true
            });
        } else if (_token == CNGN_BASE || _token == CNGN_BASE_SEPOLIA) {
            return StablecoinInfo({
                tokenAddress: _token,
                symbol: "cNGN",
                name: "cNGN Stablecoin",
                decimals: 18,
                isActive: true
            });
        } else if (_token == IDRX_BASE) {
            return StablecoinInfo({
                tokenAddress: _token,
                symbol: "IDRX",
                name: "IDRX Stablecoin",
                decimals: 18,
                isActive: true
            });
        }
        
        // Return empty info for unsupported tokens
        return StablecoinInfo({
            tokenAddress: address(0),
            symbol: "",
            name: "",
            decimals: 0,
            isActive: false
        });
    }
    
    /**
     * @notice Check if a token is supported
     * @param _token Token address to check
     * @return bool True if token is supported
     */
    function isSupported(address _token) internal pure returns (bool) {
        return _token == USDC_BASE || 
               _token == USDC_BASE_SEPOLIA ||
               _token == USDT_BASE ||
               _token == USDT_BASE_SEPOLIA ||
               _token == CNGN_BASE ||
               _token == CNGN_BASE_SEPOLIA ||
               _token == IDRX_BASE;
    }
}
