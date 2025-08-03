#!/usr/bin/env python3

import json
import asyncio
import time
from shared_secret import generate_secret_and_hashlock

async def create_htcl_on_cosmos():
    """Alice creates HTCL on Cosmos with a hashlock"""
    
    print("🚀 Alice creating HTCL on Cosmos...")
    
    # Generate secret and hashlock
    result = generate_secret_and_hashlock()
    secret = result['secret']
    hashlock = result['hashlock_string']  # Cosmos format
    hashlock_evm = result['hashlock']     # EVM format
    
    print(f"Generated secret: {secret}")
    print(f"Generated hashlock (Cosmos): {hashlock}")
    print(f"Generated hashlock (EVM): {hashlock_evm}")
    
    # Calculate timelock (1 hour from now)
    timelock = int(time.time()) + 3600  # 1 hour
    print(f"Timelock: {timelock}")
    
    # Mock Alice and Bob addresses
    alice_address = "cosmos1aliceaddress123456789"
    bob_address = "cosmos1bobaddress123456789"
    
    print(f"Alice address: {alice_address}")
    print(f"Bob address: {bob_address}")
    
    # Create instantiate message for Cosmos HTCL
    instantiate_msg = {
        "bob": bob_address,
        "timelock": timelock,
        "hashlock": hashlock
    }
    
    print("📝 Creating instantiate message...")
    print(f"Alice (creator): {alice_address}")
    print(f"Bob (recipient): {bob_address}")
    print(f"Timelock: {timelock}")
    print(f"Hashlock: {hashlock}")
    
    # Simulate contract deployment
    htcl_address = "cosmos1htclcontractaddress123456789"  # Mock address
    print(f"✅ HTCL deployed at: {htcl_address}")
    
    # Save transaction data for Bob
    transaction_data = {
        "secret": secret,
        "hashlock": hashlock,
        "hashlockEVM": hashlock_evm,
        "timelock": timelock,
        "htclAddress": htcl_address,
        "aliceAddress": alice_address,
        "bobAddress": bob_address,
        "amount": "1000000"  # Mock amount
    }
    
    # Write to file for Bob to use
    with open('cosmos_htcl_data.json', 'w') as f:
        json.dump(transaction_data, f, indent=2)
    
    print("Transaction data saved to cosmos_htcl_data.json")
    
    # Verify the setup
    print("\n🔍 Verification:")
    print(f"HTCL Address: {htcl_address}")
    print(f"Creator: {alice_address}")
    print(f"Recipient: {bob_address}")
    print(f"Hashlock: {hashlock}")
    print(f"Timelock: {timelock}")
    print(f"Secret: {secret}")
    
    print("\n✅ Alice successfully created HTCL on Cosmos")
    print("📋 Next steps:")
    print("1. Share cosmos_htcl_data.json with Bob")
    print("2. Bob should create HTCL on EVM with the same hashlock")
    print("3. Alice will withdraw on EVM with the secret")
    print("4. Bob will withdraw on Cosmos with the secret")
    
    return transaction_data

async def main():
    await create_htcl_on_cosmos()

if __name__ == "__main__":
    asyncio.run(main()) 