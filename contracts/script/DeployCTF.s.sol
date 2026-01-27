// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CTFPredictionMarket.sol";
import "../src/MockUSDC.sol";

contract DeployCTFScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy MockUSDC for testing
        MockUSDC mockUSDC = new MockUSDC();
        console.log("MockUSDC deployed at:", address(mockUSDC));
        
        // Deploy CTFPredictionMarket
        CTFPredictionMarket market = new CTFPredictionMarket();
        console.log("CTFPredictionMarket deployed at:", address(market));
        
        // Mint some test USDC to deployer
        mockUSDC.mint(msg.sender, 1000000e6); // 1M USDC
        console.log("Minted 1M USDC to deployer:", msg.sender);
        
        vm.stopBroadcast();
        
        // Log deployment info
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Base Sepolia");
        console.log("Deployer:", msg.sender);
        console.log("MockUSDC:", address(mockUSDC));
        console.log("CTFPredictionMarket:", address(market));
        console.log("========================\n");
    }
}
