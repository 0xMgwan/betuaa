// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../PythResolver.sol";

contract DeployPythResolver is Script {
    function run() external {
        // Base Sepolia addresses
        address pythContract = 0xA2aa501b19aff244D90cc15a4Cf739D2725B5729;
        address ctfMarket = 0x692C052Ca3765FCf24a38Ea0c1F653259dF2E8e7;
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        PythResolver resolver = new PythResolver(pythContract, ctfMarket);
        
        console.log("PythResolver deployed to:", address(resolver));
        console.log("Pyth Contract:", pythContract);
        console.log("CTF Market:", ctfMarket);
        
        vm.stopBroadcast();
    }
}
