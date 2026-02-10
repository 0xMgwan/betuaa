// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CTFPredictionMarketV2.sol";
import "../src/OrderBookV2.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestPlaceOrderScript is Script {
    address constant BASE_SEPOLIA_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address constant CTF_PROXY = 0xfb4224B9826b0e1c4d2113103dAD1167D0EdE69d;
    address constant OB_PROXY = 0x90E274E7AbD5eb7c4b164455c158a649b8012a84;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Testing Place Limit Order ===");
        console.log("Deployer:", deployer);
        console.log("CTF Proxy:", CTF_PROXY);
        console.log("OrderBook Proxy:", OB_PROXY);
        console.log("USDC:", BASE_SEPOLIA_USDC);
        
        // Check deployer USDC balance
        uint256 balance = IERC20(BASE_SEPOLIA_USDC).balanceOf(deployer);
        console.log("Deployer USDC balance:", balance);
        
        // Check allowance to OrderBook
        uint256 allowance = IERC20(BASE_SEPOLIA_USDC).allowance(deployer, OB_PROXY);
        console.log("Current allowance to OrderBook:", allowance);
        
        // Check market collateral
        address marketCollateral = CTFPredictionMarketV2(CTF_PROXY).getMarketCollateral(1);
        console.log("Market 1 collateral token:", marketCollateral);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Approve USDC to OrderBook if needed
        if (allowance < 1e6) {
            console.log("Approving USDC to OrderBook...");
            IERC20(BASE_SEPOLIA_USDC).approve(OB_PROXY, type(uint256).max);
        }
        
        // Try to place a limit order
        console.log("Placing limit order...");
        try OrderBookV2(OB_PROXY).placeLimitOrder(
            1,      // marketId
            0,      // outcomeIndex (Yes)
            OrderBookV2.Side.BUY,  // side (BUY)
            5000,   // price (50%)
            1e6     // size (1 USDC)
        ) returns (uint256 orderId) {
            console.log("Order placed successfully! Order ID:", orderId);
        } catch Error(string memory reason) {
            console.log("Order placement failed:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("Order placement failed with low-level error");
            console.logBytes(lowLevelData);
        }
        
        vm.stopBroadcast();
    }
}
