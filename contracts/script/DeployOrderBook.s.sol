// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/OrderBook.sol";
import "../src/CTFPredictionMarket.sol";

contract DeployOrderBook is Script {
    // Base Sepolia USDC
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    
    // Updated CTF contract on Base Sepolia (with isMarketActive view)
    address constant CTF_CONTRACT = 0xb46Ff34C716570b90472D2b8d709252618126052;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy OrderBook pointing to existing CTF contract
        OrderBook orderBook = new OrderBook(
            CTF_CONTRACT,
            USDC_BASE_SEPOLIA,
            6 // USDC decimals
        );
        
        console.log("OrderBook deployed to:", address(orderBook));
        
        // Authorize OrderBook as operator on CTF contract
        // (Only works if deployer is the CTF contract owner)
        CTFPredictionMarket ctf = CTFPredictionMarket(CTF_CONTRACT);
        ctf.setAuthorizedOperator(address(orderBook), true);
        
        console.log("OrderBook authorized as operator on CTF contract");
        
        vm.stopBroadcast();
    }
}
