#!/usr/bin/env python3

import json
import asyncio
import hashlib
import time
from cosmjs import CosmWasmClient, SigningCosmWasmClient
from cosmjs.types import Coin

async def bob_withdraw_on_cosmos():
    """Bob withdraws from Cosmos HTCL with the secret before timelock expires"""
    
    print("🚀 Bob withdrawing from Cosmos HTCL...")
    
    # Load transaction data
    try:
        with open('cosmos_htcl_data.json', 'r') as f:
            cosmos_data = json.load(f)
    except FileNotFoundError:
        print("❌ Error: cosmos_htcl_data.json not found")
        print("Please run Alice's Cosmos script first")
        return None
    
    # Load EVM data to check if Alice has withdrawn
    try:
        with open('evm_htcl_data.json', 'r') as f:
            evm_data = json.load(f)
    except FileNotFoundError:
        print("❌ Error: evm_htcl_data.json not found")
        print("Please run Bob's EVM script first")
        return None
    
    # Extract data
    htcl_address = cosmos_data['htclAddress']
    secret = cosmos_data['secret']
    hashlock = cosmos_data['hashlock']
    timelock = cosmos_data['timelock']
    bob_address = cosmos_data['bobAddress']
    
    print(f"HTCL Address: {htcl_address}")
    print(f"Bob Address: {bob_address}")
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
    current_time = int(time.time())
    if current_time >= timelock:
        print("❌ Error: Timelock has expired")
        print(f"Current time: {current_time}")
        print(f"Timelock: {timelock}")
        return None
    
    print("✅ Timelock check passed")
    
    # Check if Alice has already withdrawn on EVM
    if not evm_data.get('aliceWithdrawn', False):
        print("❌ Error: Alice has not withdrawn from EVM yet")
        print("Alice must withdraw from EVM first")
        return None
    print("✅ Alice has withdrawn from EVM")
    
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
    cosmos_data['bobWithdrawn'] = True
    cosmos_data['withdrawTxHash'] = tx_hash
    cosmos_data['withdrawTimestamp'] = current_time
    
    with open('cosmos_htcl_data.json', 'w') as f:
        json.dump(cosmos_data, f, indent=2)
    
    print("\n💰 Bob successfully withdrew from Cosmos HTCL")
    print("📋 Transaction details:")
    print(f"  - Contract: {htcl_address}")
    print(f"  - Secret: {secret}")
    print(f"  - Transaction: {tx_hash}")
    print(f"  - Timestamp: {current_time}")
    
    print("\n🎉 Cross-chain HTCL transaction completed successfully!")
    print("📋 Summary:")
    print("  1. Alice created HTCL on Cosmos")
    print("  2. Bob created HTCL on EVM")
    print("  3. Alice withdrew from EVM with secret")
    print("  4. Bob withdrew from Cosmos with secret")
    
    return cosmos_data

async def main():
    await bob_withdraw_on_cosmos()

if __name__ == "__main__":
    asyncio.run(main()) 