// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CTFPredictionMarketV2.sol";
import "../src/OrderBookV2.sol";

contract UpgradeV2Script is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Existing proxy addresses (redeployed Feb 10 2026)
        address ctfProxy = 0xfb4224B9826b0e1c4d2113103dAD1167D0EdE69d;
        address obProxy = 0x90E274E7AbD5eb7c4b164455c158a649b8012a84;
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy new CTFPredictionMarketV2 implementation
        CTFPredictionMarketV2 ctfImpl = new CTFPredictionMarketV2();
        console.log("New CTFPredictionMarketV2 impl:", address(ctfImpl));
        
        // 2. Upgrade CTF proxy to new implementation
        CTFPredictionMarketV2(ctfProxy).upgradeToAndCall(address(ctfImpl), "");
        console.log("CTF proxy upgraded");
        
        // 3. Deploy new OrderBookV2 implementation
        OrderBookV2 obImpl = new OrderBookV2();
        console.log("New OrderBookV2 impl:", address(obImpl));
        
        // 4. Upgrade OrderBook proxy to new implementation
        OrderBookV2(obProxy).upgradeToAndCall(address(obImpl), "");
        console.log("OrderBook proxy upgraded");
        
        vm.stopBroadcast();
        
        console.log("\n=== Upgrade Complete ===");
        console.log("CTF proxy (unchanged):", ctfProxy);
        console.log("CTF new impl:", address(ctfImpl));
        console.log("OB proxy (unchanged):", obProxy);
        console.log("OB new impl:", address(obImpl));
    }
}
