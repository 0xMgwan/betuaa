// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CTFPredictionMarketNTZS.sol";

contract DeployNTZS is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        CTFPredictionMarketNTZS ctf = new CTFPredictionMarketNTZS();
        
        console.log("CTFPredictionMarketNTZS deployed to:", address(ctf));
        
        vm.stopBroadcast();
    }
}
