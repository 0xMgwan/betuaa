// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CTFPredictionMarketV2.sol";
import "../src/OrderBookV2.sol";
import "../src/MockUSDC.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployV2Script is Script {
    // Real Base Sepolia USDC
    address constant BASE_SEPOLIA_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy CTFPredictionMarketV2 implementation
        CTFPredictionMarketV2 ctfImpl = new CTFPredictionMarketV2();
        console.log("CTFPredictionMarketV2 implementation:", address(ctfImpl));
        
        // 2. Deploy CTF proxy with initializer
        bytes memory ctfInitData = abi.encodeWithSelector(
            CTFPredictionMarketV2.initialize.selector,
            deployer
        );
        ERC1967Proxy ctfProxy = new ERC1967Proxy(address(ctfImpl), ctfInitData);
        console.log("CTFPredictionMarketV2 proxy:", address(ctfProxy));
        
        // 3. Deploy OrderBookV2 implementation
        OrderBookV2 obImpl = new OrderBookV2();
        console.log("OrderBookV2 implementation:", address(obImpl));
        
        // 4. Deploy OrderBook proxy with initializer
        bytes memory obInitData = abi.encodeWithSelector(
            OrderBookV2.initialize.selector,
            address(ctfProxy),      // CTF contract (proxy address)
            BASE_SEPOLIA_USDC,      // Real Base Sepolia USDC
            uint8(6),               // USDC decimals
            deployer                // Owner
        );
        ERC1967Proxy obProxy = new ERC1967Proxy(address(obImpl), obInitData);
        console.log("OrderBookV2 proxy:", address(obProxy));
        
        // 5. Authorize OrderBook as operator on CTF
        CTFPredictionMarketV2(address(ctfProxy)).setAuthorizedOperator(address(obProxy), true);
        console.log("OrderBook authorized as operator on CTF");
        
        vm.stopBroadcast();
        
        // Log deployment info
        console.log("\n=== V2 Deployment Summary ===");
        console.log("Network: Base Sepolia");
        console.log("Deployer:", deployer);
        console.log("USDC (Base Sepolia):", BASE_SEPOLIA_USDC);
        console.log("CTFPredictionMarketV2 (proxy):", address(ctfProxy));
        console.log("CTFPredictionMarketV2 (impl):", address(ctfImpl));
        console.log("OrderBookV2 (proxy):", address(obProxy));
        console.log("OrderBookV2 (impl):", address(obImpl));
        console.log("Create Market Fee: 1 USDC");
        console.log("Platform Fee: 0.5%");
        console.log("Creator Fee: 1%");
        console.log("============================\n");
    }
}
