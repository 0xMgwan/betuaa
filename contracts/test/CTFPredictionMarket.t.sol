// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CTFPredictionMarket.sol";
import "../src/MockUSDC.sol";

contract CTFPredictionMarketTest is Test {
    CTFPredictionMarket public market;
    MockUSDC public usdc;
    
    address public owner;
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public creator = address(0x4);
    
    uint256 public marketId;
    bytes32 public conditionId;
    
    function setUp() public {
        owner = msg.sender; // Use the test contract as owner
        
        usdc = new MockUSDC();
        market = new CTFPredictionMarket();
        
        // Mint tokens to test users
        usdc.mint(user1, 10000e6);
        usdc.mint(user2, 10000e6);
        usdc.mint(creator, 10000e6);
    }
    
    // ============ Market Creation Tests ============
    
    function test_CreateMarket() public {
        vm.prank(creator);
        (uint256 id, bytes32 cId) = market.createMarket(
            "Will ETH reach $5000?",
            "Market resolves YES if ETH reaches $5000 by end of 2024",
            2,
            block.timestamp + 30 days,
            address(usdc)
        );
        
        marketId = id;
        conditionId = cId;
        
        assertEq(id, 1);
        assertNotEq(cId, bytes32(0));
        
        CTFPredictionMarket.Market memory m = market.getMarket(id);
        assertEq(m.id, 1);
        assertEq(m.outcomeCount, 2);
        assertEq(m.creator, creator);
        assertFalse(m.resolved);
    }
    
    function test_CreateMarket_InvalidOutcomeCount() public {
        vm.prank(creator);
        vm.expectRevert("Need at least 2 outcomes");
        market.createMarket(
            "Invalid market",
            "Only 1 outcome",
            1,
            block.timestamp + 30 days,
            address(usdc)
        );
    }
    
    function test_CreateMarket_InvalidClosingTime() public {
        vm.prank(creator);
        vm.expectRevert("Invalid closing time");
        market.createMarket(
            "Invalid market",
            "Closing in past",
            2,
            block.timestamp - 1 days,
            address(usdc)
        );
    }
    
    // ============ Position Token Tests ============
    
    function test_MintPositionTokens() public {
        _createTestMarket();
        
        vm.startPrank(user1);
        usdc.approve(address(market), 1000e6);
        market.mintPositionTokens(marketId, 1000e6);
        vm.stopPrank();
        
        // Check that user received outcome tokens
        uint256 yesTokenId = market.getOutcomeToken(marketId, 0);
        uint256 noTokenId = market.getOutcomeToken(marketId, 1);
        
        assertEq(market.balanceOf(user1, yesTokenId), 1000e6);
        assertEq(market.balanceOf(user1, noTokenId), 1000e6);
    }
    
    function test_RedeemPositionTokens() public {
        _createTestMarket();
        
        // Mint tokens first
        vm.startPrank(user1);
        usdc.approve(address(market), 1000e6);
        market.mintPositionTokens(marketId, 1000e6);
        
        uint256 yesTokenId = market.getOutcomeToken(marketId, 0);
        uint256 noTokenId = market.getOutcomeToken(marketId, 1);
        
        // Approve tokens for burning
        market.setApprovalForAll(address(market), true);
        
        uint256 balanceBefore = usdc.balanceOf(user1);
        market.redeemPositionTokens(marketId, 500e6);
        uint256 balanceAfter = usdc.balanceOf(user1);
        
        assertEq(balanceAfter - balanceBefore, 500e6);
        assertEq(market.balanceOf(user1, yesTokenId), 500e6);
        assertEq(market.balanceOf(user1, noTokenId), 500e6);
        vm.stopPrank();
    }
    
    // ============ Order Matching Tests ============
    
    function test_FillOrder_BuyOrder() public {
        _createTestMarket();
        _setupUserPositions();
        
        uint256 yesTokenId = market.getOutcomeToken(marketId, 0);
        
        // Create a buy order (without signature first)
        CTFPredictionMarket.Order memory order = CTFPredictionMarket.Order({
            maker: user1,
            taker: address(0),
            tokenId: yesTokenId,
            makerAmount: 100e6,
            takerAmount: 60e6,
            expiration: block.timestamp + 1 days,
            nonce: 0,
            feeRateBps: 50,
            side: CTFPredictionMarket.OrderSide.BUY,
            signatureType: CTFPredictionMarket.SignatureType.EOA,
            signature: bytes("")
        });
        
        // Sign the order
        order.signature = _signOrder(user1, order);
        
        vm.startPrank(user2);
        usdc.approve(address(market), 100e6);
        market.fillOrder(order, 100e6);
        vm.stopPrank();
        
        // Check balances
        assertEq(market.balanceOf(user1, yesTokenId), 100e6);
        assertEq(market.balanceOf(user2, yesTokenId), 0);
    }
    
    function test_CancelOrder() public {
        _createTestMarket();
        
        uint256 yesTokenId = market.getOutcomeToken(marketId, 0);
        
        CTFPredictionMarket.Order memory order = CTFPredictionMarket.Order({
            maker: user1,
            taker: address(0),
            tokenId: yesTokenId,
            makerAmount: 100e6,
            takerAmount: 60e6,
            expiration: block.timestamp + 1 days,
            nonce: 0,
            feeRateBps: 50,
            side: CTFPredictionMarket.OrderSide.BUY,
            signatureType: CTFPredictionMarket.SignatureType.EOA,
            signature: bytes("")
        });
        
        order.signature = _signOrder(user1, order);
        
        vm.prank(user1);
        market.cancelOrder(order);
        
        // Try to fill cancelled order - should fail
        vm.prank(user2);
        vm.expectRevert("Already filled or cancelled");
        market.fillOrder(order, 100e6);
    }
    
    // ============ Market Resolution Tests ============
    
    function test_ResolveMarket() public {
        _createTestMarket();
        
        vm.warp(block.timestamp + 31 days);
        
        vm.prank(creator);
        market.resolveMarket(marketId, 0); // YES wins
        
        CTFPredictionMarket.Market memory m = market.getMarket(marketId);
        assertTrue(m.resolved);
        assertEq(m.winningOutcome, 0);
    }
    
    function test_ResolveMarket_NotAuthorized() public {
        _createTestMarket();
        
        vm.warp(block.timestamp + 31 days);
        
        vm.prank(user1);
        vm.expectRevert();
        market.resolveMarket(marketId, 0);
    }
    
    function test_RedeemWinningTokens() public {
        _createTestMarket();
        _setupUserPositions();
        
        // Resolve market
        vm.warp(block.timestamp + 31 days);
        vm.prank(creator);
        market.resolveMarket(marketId, 0); // YES wins
        
        uint256 yesTokenId = market.getOutcomeToken(marketId, 0);
        
        // User1 has YES tokens, should be able to redeem
        vm.startPrank(user1);
        market.setApprovalForAll(address(market), true);
        
        uint256 balanceBefore = usdc.balanceOf(user1);
        market.redeemWinningTokens(marketId, 500e6);
        uint256 balanceAfter = usdc.balanceOf(user1);
        
        assertEq(balanceAfter - balanceBefore, 500e6);
        vm.stopPrank();
    }
    
    // ============ Fee Tests ============
    
    function test_SetPlatformFee() public {
        vm.prank(owner);
        market.setPlatformFee(100); // 1%
        
        // Try to set fee too high
        vm.prank(owner);
        vm.expectRevert("Fee too high");
        market.setPlatformFee(600); // 6% - exceeds 5% max
    }
    
    function test_WithdrawFees() public {
        _createTestMarket();
        _setupUserPositions();
        
        // Simulate some trading to accumulate fees
        uint256 yesTokenId = market.getOutcomeToken(marketId, 0);
        
        CTFPredictionMarket.Order memory order = CTFPredictionMarket.Order({
            maker: user1,
            taker: address(0),
            tokenId: yesTokenId,
            makerAmount: 100e6,
            takerAmount: 60e6,
            expiration: block.timestamp + 1 days,
            nonce: 0,
            feeRateBps: 50,
            side: CTFPredictionMarket.OrderSide.BUY,
            signatureType: CTFPredictionMarket.SignatureType.EOA,
            signature: bytes("")
        });
        
        order.signature = _signOrder(user1, order);
        
        vm.startPrank(user2);
        usdc.approve(address(market), 100e6);
        market.fillOrder(order, 100e6);
        vm.stopPrank();
        
        // Owner withdraws fees
        vm.prank(owner);
        market.withdrawFees(address(usdc));
    }
    
    function test_WithdrawFeesAmount() public {
        _createTestMarket();
        
        // Send some USDC to contract as "fees"
        vm.prank(user1);
        usdc.transfer(address(market), 100e6);
        
        uint256 ownerBalanceBefore = usdc.balanceOf(owner);
        
        vm.prank(owner);
        market.withdrawFeesAmount(address(usdc), 50e6);
        
        uint256 ownerBalanceAfter = usdc.balanceOf(owner);
        assertEq(ownerBalanceAfter - ownerBalanceBefore, 50e6);
    }
    
    // ============ Pause Tests ============
    
    function test_PauseMarket() public {
        _createTestMarket();
        
        vm.prank(owner);
        market.pauseMarket(marketId);
        
        CTFPredictionMarket.Market memory m = market.getMarket(marketId);
        assertTrue(m.paused);
    }
    
    function test_UnpauseMarket() public {
        _createTestMarket();
        
        vm.prank(owner);
        market.pauseMarket(marketId);
        market.unpauseMarket(marketId);
        
        CTFPredictionMarket.Market memory m = market.getMarket(marketId);
        assertFalse(m.paused);
    }
    
    // ============ Helper Functions ============
    
    function _createTestMarket() internal {
        vm.prank(creator);
        (uint256 id, bytes32 cId) = market.createMarket(
            "Test Market",
            "A test prediction market",
            2,
            block.timestamp + 30 days,
            address(usdc)
        );
        marketId = id;
        conditionId = cId;
    }
    
    function _setupUserPositions() internal {
        vm.startPrank(user1);
        usdc.approve(address(market), 1000e6);
        market.mintPositionTokens(marketId, 1000e6);
        vm.stopPrank();
        
        vm.startPrank(user2);
        usdc.approve(address(market), 1000e6);
        market.mintPositionTokens(marketId, 1000e6);
        vm.stopPrank();
    }
    
    function _signOrder(address signer, CTFPredictionMarket.Order memory order) 
        internal 
        view 
        returns (bytes memory) 
    {
        // This is a simplified signature - in production, use proper EIP-712 signing
        bytes32 orderHash = keccak256(abi.encode(order));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(signer)), orderHash);
        return abi.encodePacked(r, s, v);
    }
}
