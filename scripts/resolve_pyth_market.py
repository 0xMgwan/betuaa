#!/usr/bin/env python3
"""
Automatically resolve a Pyth market using current price data
Usage: python3 scripts/resolve_pyth_market.py YOUR_PRIVATE_KEY MARKET_ID
"""

import sys
import subprocess
import requests
import json

def run_command(cmd):
    """Run a shell command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip(), result.returncode
    except Exception as e:
        return str(e), 1

def get_pyth_price(price_id):
    """Fetch current price from Pyth Hermes API"""
    try:
        url = f"https://hermes.pyth.network/api/latest_price_feeds?ids[]={price_id}"
        response = requests.get(url)
        data = response.json()
        
        if not data or len(data) == 0:
            print("❌ No price data from Pyth")
            return None, None
        
        price_data = data[0]
        price = int(price_data['price']['price'])
        expo = int(price_data['price']['expo'])
        
        # Convert to human-readable format
        human_price = price * (10 ** expo)
        
        return price, human_price
    except Exception as e:
        print(f"❌ Error fetching Pyth price: {e}")
        return None, None

def get_price_update_data(price_id):
    """Get price update data for on-chain resolution"""
    try:
        url = f"https://hermes.pyth.network/api/latest_vaas?ids[]={price_id}"
        response = requests.get(url)
        data = response.json()
        return data
    except Exception as e:
        print(f"❌ Error fetching price update data: {e}")
        return None

def main():
    if len(sys.argv) < 3:
        print("❌ Error: Private key and market ID required")
        print("Usage: python3 scripts/resolve_pyth_market.py YOUR_PRIVATE_KEY MARKET_ID")
        print("\nExample:")
        print("  python3 scripts/resolve_pyth_market.py 0x6dcc95137df3036c625c7d8f125e5c643ff2a7d19d24fe9d3634dfdb3b2af8b1 2")
        sys.exit(1)
    
    private_key = sys.argv[1]
    market_id = sys.argv[2]
    
    # Remove 0x prefix if present
    if private_key.startswith("0x"):
        private_key = private_key[2:]
    
    # Add 0x prefix
    private_key = "0x" + private_key
    
    # Contract addresses
    PYTH_RESOLVER = "0xc3c8523FaC61b6E35DC553BB5a1F542982753F62"
    RPC_URL = "https://sepolia.base.org"
    
    # ETH/USD price feed ID
    PRICE_ID = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
    THRESHOLD = 350000000000  # $3500 in Pyth format
    
    print("\n🔮 Resolving Pyth Market Automatically\n")
    
    # Step 1: Get current price
    print("📊 Step 1: Fetching current ETH price from Pyth...")
    price, human_price = get_pyth_price(PRICE_ID)
    
    if price is None:
        sys.exit(1)
    
    print(f"   Current ETH price: ${human_price:.2f}")
    print()
    
    # Step 2: Determine outcome
    print("🎯 Step 2: Determining winning outcome...")
    threshold_human = THRESHOLD / 1e8
    
    if human_price >= threshold_human:
        outcome = 1  # YES - above threshold
        outcome_name = "YES (Above $3500)"
        print(f"   ETH price (${human_price:.2f}) >= Threshold (${threshold_human:.2f})")
    else:
        outcome = 0  # NO - below threshold
        outcome_name = "NO (Below $3500)"
        print(f"   ETH price (${human_price:.2f}) < Threshold (${threshold_human:.2f})")
    
    print(f"   Winning outcome: {outcome_name}")
    print()
    
    # Step 3: Get price update data
    print("📦 Step 3: Fetching price update data...")
    update_data = get_price_update_data(PRICE_ID)
    
    if update_data is None or len(update_data) == 0:
        print("❌ No update data available")
        sys.exit(1)
    
    print(f"   Got {len(update_data)} price update(s)")
    print()
    
    # Step 4: Calculate update fee
    print("💰 Step 4: Calculating Pyth update fee...")
    
    # Format update data for cast command
    update_data_str = " ".join([f'"{item}"' for item in update_data])
    
    # Get update fee from Pyth contract
    fee_cmd = f"""cast call 0xA2aa501b19aff244D90cc15a4Cf739D2725B5729 \
  "getUpdateFee(bytes[])" \
  [{update_data_str}] \
  --rpc-url {RPC_URL}"""
    
    fee_output, fee_code = run_command(fee_cmd)
    
    if fee_code != 0:
        print(f"❌ Failed to get update fee")
        print(f"Error: {fee_output}")
        # Use default 0.001 ETH
        update_fee = "0.001ether"
    else:
        # Convert fee from wei to ether
        fee_wei = int(fee_output.strip(), 16) if fee_output.strip().startswith('0x') else int(fee_output.strip())
        fee_eth = fee_wei / 1e18
        update_fee = f"{fee_eth + 0.0001}ether"  # Add buffer
    
    print(f"   Update fee: {update_fee}")
    print()
    
    # Step 5: Resolve market
    print("⚙️  Step 5: Resolving market on-chain...")
    
    cmd = f"""cast send {PYTH_RESOLVER} \
  "resolveMarket(uint256,bytes[])" \
  {market_id} \
  [{update_data_str}] \
  --rpc-url {RPC_URL} \
  --private-key {private_key} \
  --value {update_fee}"""
    
    output, code = run_command(cmd)
    
    if code != 0 or "error" in output.lower():
        print(f"❌ Failed to resolve market")
        print(f"Error: {output}")
        sys.exit(1)
    
    print("   ✅ Market resolved!")
    print()
    
    # Summary
    print("✅ Market Resolved Successfully!\n")
    print("📋 Summary:")
    print(f"   Market ID: {market_id}")
    print(f"   ETH Price: ${human_price:.2f}")
    print(f"   Threshold: ${threshold_human:.2f}")
    print(f"   Winning Outcome: {outcome_name}")
    print()
    print("🎉 This is how the keeper bot will work in production!")
    print("   It automatically detects expired markets and resolves them")
    print("   using the current Pyth price data.")
    print()

if __name__ == "__main__":
    main()
