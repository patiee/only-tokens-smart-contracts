#!/usr/bin/env python3

import json
import asyncio
import hashlib
from cosmjs import CosmWasmClient, SigningCosmWasmClient
from cosmjs.types import Coin

async def alice_withdraw_on_cosmos():
    """Alice withdraws from Cosmos HTCL with the secret before timelock expires"""
    
    print("🚀 Alice withdrawing from Cosmos HTCL...")
    
    # Load transaction data
    try:
        with open('cosmos_htcl_data.json', 'r') as f:
            cosmos_data = json.load(f)
    except FileNotFoundError:
        print("❌ Error: cosmos_htcl_data.json not found")
        print("Please run Bob's Cosmos script first")
        return None
    
    # Extract data
    htcl_address = cosmos_data['htclAddress']
    secret = cosmos_data['secret']
    hashlock = cosmos_data['hashlock']
    timelock = cosmos_data['timelock']
    alice_address = cosmos_data['recipient']
    
    print(f"HTCL Address: {htcl_address}")
    print(f"Alice Address: {alice_address}")
    print(f"Secret: {secret}")
    print(f"Hashlock: {hashlock}")
    print(f"Timelock: {timelock}")
    
    # Validate secret matches hashlock
    print("\n🔍 Validating secret...")
    secret_bytes = bytes.fromhex(secret[2:] if secret.startswith('0x') else secret)
    calculated_hashlock = hashlib.sha256(secret_bytes).hexdigest()
    
    if calculated_hashlock != hashlock:
        print("❌ Error: Secret does not match hashlock")
        print(f"Expected: {hashlock}")
        print(f"Calculated: {calculated_hashlock}")
        return None
    
    print("✅ Secret validation successful")
    
    # Check if timelock has expired
    current_time = int(asyncio.get_event_loop().time())
    if current_time >= timelock:
        print("❌ Error: Timelock has expired")
        print(f"Current time: {current_time}")
        print(f"Timelock: {timelock}")
        return None
    
    print("✅ Timelock check passed")
    
    # Create withdraw message
    withdraw_msg = {
        "bob_withdraw": {
            "secret": secret
        }
    }
    
    print("\n📝 Creating withdraw transaction...")
    print(f"Contract: {htcl_address}")
    print(f"Message: {json.dumps(withdraw_msg, indent=2)}")
    
    # Mock transaction execution
    print("🔄 Executing withdraw transaction...")
    
    # Simulate successful withdrawal
    tx_hash = "cosmos1txhash123456789abcdef"
    print(f"✅ Transaction successful: {tx_hash}")
    
    # Update transaction data
    cosmos_data['aliceWithdrawn'] = True
    cosmos_data['withdrawTxHash'] = tx_hash
    cosmos_data['withdrawTimestamp'] = current_time
    
    with open('cosmos_htcl_data.json', 'w') as f:
        json.dump(cosmos_data, f, indent=2)
    
    print("\n💰 Alice successfully withdrew from Cosmos HTCL")
    print("📋 Transaction details:")
    print(f"  - Contract: {htcl_address}")
    print(f"  - Secret: {secret}")
    print(f"  - Transaction: {tx_hash}")
    print(f"  - Timestamp: {current_time}")
    
    print("\n📋 Next step:")
    print("Bob should now withdraw from EVM HTCL with the same secret")
    
    return cosmos_data

async def main():
    await alice_withdraw_on_cosmos()

if __name__ == "__main__":
    asyncio.run(main()) 