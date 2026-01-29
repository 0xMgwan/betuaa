#!/usr/bin/env python3
"""
Create a test Pyth market
Usage: python3 scripts/create_pyth_market.py YOUR_PRIVATE_KEY
"""

import sys
import subprocess
import time
from datetime import datetime, timedelta

def run_command(cmd):
    """Run a shell command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip(), result.returncode
    except Exception as e:
        return str(e), 1

def main():
    if len(sys.argv) < 2:
        print("❌ Error: Private key required")
        print("Usage: python3 scripts/create_pyth_market.py YOUR_PRIVATE_KEY")
        print("\nExample:")
        print("  python3 scripts/create_pyth_market.py 0x6dcc95137df3036c625c7d8f125e5c643ff2a7d19d24fe9d3634dfdb3b2af8b1")
        sys.exit(1)
    
    private_key = sys.argv[1]
    
    # Remove 0x prefix if present
    if private_key.startswith("0x"):
        private_key = private_key[2:]
    
    # Add 0x prefix
    private_key = "0x" + private_key
    
    # Contract addresses
    CTF_ADDRESS = "0xA5Bf04D3D079BE92981EE8208b18B0514eBd370C"
    PYTH_RESOLVER = "0xc3c8523FaC61b6E35DC553BB5a1F542982753F62"
    USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    RPC_URL = "https://sepolia.base.org"
    
    # Market parameters
    question = "Will ETH be above $3500 in 5 minutes?"
    description = "Test Pyth market - auto-resolves based on ETH/USD price feed"
    outcome_count = 2
    closing_time = int(time.time()) + 300  # 5 minutes from now
    
    print("\n🚀 Creating Test Pyth Market\n")
    print("📊 Market Details:")
    print(f"   Question: {question}")
    print(f"   Expires: {datetime.fromtimestamp(closing_time).strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Step 1: Create market
    print("📝 Step 1: Creating market...")
    cmd = f"""cast send {CTF_ADDRESS} \
  "createMarket(string,string,uint256,uint256,address)" \
  "{question}" \
  "{description}" \
  {outcome_count} \
  {closing_time} \
  {USDC_ADDRESS} \
  --rpc-url {RPC_URL} \
  --private-key {private_key}"""
    
    output, code = run_command(cmd)
    
    if code != 0 or "error" in output.lower():
        print(f"❌ Failed to create market")
        print(f"Error: {output}")
        sys.exit(1)
    
    print("   ✅ Market created!")
    print()
    
    # Get market ID
    print("📊 Getting market ID...")
    cmd = f'cast call {CTF_ADDRESS} "marketCount()" --rpc-url {RPC_URL} | xargs printf "%d"'
    market_id, code = run_command(cmd)
    
    if code != 0:
        print(f"❌ Failed to get market ID")
        sys.exit(1)
    
    print(f"   Market ID: {market_id}")
    print()
    
    # Step 2: Configure Pyth resolution
    print("🔮 Step 2: Configuring Pyth resolution...")
    
    # ETH/USD price feed ID
    price_id = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
    # Threshold: $3500 in Pyth format (scaled by 10^8)
    threshold = "350000000000"
    is_above = "true"
    
    cmd = f"""cast send {PYTH_RESOLVER} \
  "configurePythMarket(uint256,bytes32,int64,uint256,bool)" \
  {market_id} \
  {price_id} \
  {threshold} \
  {closing_time} \
  {is_above} \
  --rpc-url {RPC_URL} \
  --private-key {private_key}"""
    
    output, code = run_command(cmd)
    
    if code != 0 or "error" in output.lower():
        print(f"❌ Failed to configure Pyth resolution")
        print(f"Error: {output}")
        sys.exit(1)
    
    print("   ✅ Pyth resolution configured!")
    print()
    
    # Summary
    print("✅ Test Market Created Successfully!\n")
    print("📋 Summary:")
    print(f"   Market ID: {market_id}")
    print(f"   Question: {question}")
    print(f"   Threshold: $3500")
    print(f"   Expires: {datetime.fromtimestamp(closing_time).strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Auto-resolves: Yes (via Pyth)")
    print()
    print("🧪 Next Steps:")
    print("   1. Go to http://localhost:3000")
    print(f"   2. Look for the new market (ID: {market_id})")
    print("   3. Wait 5 minutes for expiry")
    print("   4. Market will auto-resolve based on ETH/USD price")
    print()

if __name__ == "__main__":
    main()
