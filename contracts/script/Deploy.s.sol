// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PredictionMarket.sol";
import "../src/MockUSDC.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockUSDC for testing on Base Sepolia
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));

        // Deploy PredictionMarket (now supports multiple stablecoins)
        PredictionMarket market = new PredictionMarket();
        console.log("PredictionMarket deployed at:", address(market));
        console.log("Supported stablecoins initialized:");

        // Mint some USDC for testing
        usdc.mint(msg.sender, 1000000 * 10**6); // 1M USDC
        console.log("Minted 1M USDC to deployer");

        vm.stopBroadcast();
    }
}
