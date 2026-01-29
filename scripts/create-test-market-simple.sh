#!/bin/bash

# Simple script to create a test Pyth market
# Usage: PRIVATE_KEY=0x... ./scripts/create-test-market-simple.sh

if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ Error: PRIVATE_KEY environment variable required"
  echo "Usage: PRIVATE_KEY=0x... ./scripts/create-test-market-simple.sh"
  exit 1
fi

echo "🚀 Creating Test Pyth Market"
echo ""

# Market parameters
QUESTION="Will ETH be above \$3500 in 5 minutes?"
DESCRIPTION="Test market using Pyth oracle for ETH/USD price feed. Market expires in 5 minutes and will resolve automatically."
OUTCOME_COUNT=2
CLOSING_TIME=$(($(date +%s) + 300))  # 5 minutes from now
USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
CTF_ADDRESS="0xA5Bf04D3D079BE92981EE8208b18B0514eBd370C"
PYTH_RESOLVER="0xc3c8523FaC61b6E35DC553BB5a1F542982753F62"

echo "📊 Market Details:"
echo "   Question: $QUESTION"
echo "   Expires: $(date -r $CLOSING_TIME)"
echo ""

# Step 1: Create market
echo "📝 Step 1: Creating market in CTF contract..."
RESULT=$(cast send $CTF_ADDRESS \
  "createMarket(string,string,uint256,uint256,address)" \
  "$QUESTION" \
  "$DESCRIPTION" \
  $OUTCOME_COUNT \
  $CLOSING_TIME \
  $USDC_ADDRESS \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --json)

if [ $? -ne 0 ]; then
  echo "❌ Failed to create market"
  exit 1
fi

echo "   ✅ Market created!"
echo ""

# Get market ID
echo "📊 Getting market ID..."
MARKET_ID=$(cast call $CTF_ADDRESS "marketCount()" --rpc-url https://sepolia.base.org)
MARKET_ID=$((MARKET_ID))

echo "   Market ID: $MARKET_ID"
echo ""

# Step 2: Configure Pyth resolution
echo "🔮 Step 2: Configuring Pyth resolution..."

# ETH/USD price feed ID
PRICE_ID="0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
# Threshold: $3500 in Pyth format (scaled by 10^8)
THRESHOLD="350000000000"
IS_ABOVE="true"

cast send $PYTH_RESOLVER \
  "configurePythMarket(uint256,bytes32,int64,uint256,bool)" \
  $MARKET_ID \
  $PRICE_ID \
  $THRESHOLD \
  $CLOSING_TIME \
  $IS_ABOVE \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY

if [ $? -ne 0 ]; then
  echo "❌ Failed to configure Pyth resolution"
  exit 1
fi

echo "   ✅ Pyth resolution configured!"
echo ""

# Summary
echo "✅ Test Market Created Successfully!"
echo ""
echo "📋 Summary:"
echo "   Market ID: $MARKET_ID"
echo "   Question: $QUESTION"
echo "   Threshold: \$3500"
echo "   Expires in: 5 minutes"
echo "   View on BaseScan: https://sepolia.basescan.org/address/$CTF_ADDRESS"
echo ""
echo "🧪 Next Steps:"
echo "   1. View market on your platform"
echo "   2. Wait 5 minutes for expiry"
echo "   3. Test resolution"
echo ""
