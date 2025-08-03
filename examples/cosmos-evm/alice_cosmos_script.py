#!/usr/bin/env python3

import json
import sys
import os
import time
from shared_secret import generate_deterministic_secret_from_wallet, generate_deterministic_secret_from_private_key, generate_secret_and_hashlock

# Add the cosmos directory to the path to import HTCL modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../cosmos'))

from htcl_contract.src.msg import InstantiateMsg

def create_htcl_on_cosmos():
    """Alice creates HTCL on Cosmos for Bob (both on Cosmos network) using deterministic wallet-based secret"""
    
    print("🚀 Alice creating HTCL on Cosmos for Bob...")
    
    # Method 1: Try deterministic wallet-based secret generation (RECOMMENDED for production)
    try:
        # In production, use actual wallet credentials
        # Option A: Using mnemonic
        mnemonic = os.getenv('ALICE_MNEMONIC', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')
        print("🔐 Using deterministic wallet mnemonic for secret generation...")
        result = generate_deterministic_secret_from_wallet(mnemonic)
        
        print(f"✅ Deterministic wallet-based secret generated successfully!")
        print(f"Wallet Address: {result['wallet_address']}")
        print(f"Message: {result['message']}")
        print(f"Timestamp: {result['timestamp']}")
        print(f"Method: {result['method']}")
        
    except Exception as e:
        print(f"⚠️ Deterministic mnemonic generation failed: {e}")
        print("🔄 Trying private key method...")
        
        # Method 2: Try private key
        try:
            private_key = os.getenv('ALICE_PRIVATE_KEY', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
            print("🔐 Using deterministic private key for secret generation...")
            result = generate_deterministic_secret_from_private_key(private_key)
            
            print(f"✅ Deterministic private key-based secret generated successfully!")
            print(f"Wallet Address: {result['wallet_address']}")
            print(f"Message: {result['message']}")
            print(f"Timestamp: {result['timestamp']}")
            print(f"Method: {result['method']}")
            
        except Exception as e2:
            print(f"⚠️ Deterministic private key generation failed: {e2}")
            print("🔄 Falling back to random secret generation...")
            
            # Method 3: Fallback to random generation
            result = generate_secret_and_hashlock()
            print("✅ Random secret generated (for testing only)")
    
    # Extract values
    secret = result['secret']
    hashlock = result['hashlock']  # Universal hashlock (0x format)
    
    print(f"\n📋 Generated values:")
    print(f"Secret: {secret}")
    print(f"Hashlock: {hashlock}")
    
    # Calculate timelock (1 hour from now)
    timelock = int(time.time()) + 3600  # 1 hour
    print(f"Timelock: {timelock}")
    
    # Alice and Bob both have Cosmos addresses (same network)
    alice_cosmos_address = "cosmos1aliceaddress123456789"
    bob_cosmos_address = "cosmos1bobaddress123456789"
    
    print(f"Alice Cosmos address: {alice_cosmos_address}")
    print(f"Bob Cosmos address: {bob_cosmos_address}")
    
    # Create instantiate message for Cosmos HTCL
    instantiate_msg = InstantiateMsg(
        bob=bob_cosmos_address,  # Bob is the recipient on Cosmos
        timelock=timelock,
        hashlock=hashlock[2:],  # Remove 0x prefix for Cosmos format
    )
    
    print("📝 Creating instantiate message...")
    print(f"Alice (creator): {alice_cosmos_address}")
    print(f"Bob (recipient): {bob_cosmos_address}")
    print(f"Timelock: {timelock}")
    print(f"Hashlock: {hashlock}")
    
    # Simulate contract deployment
    htcl_address = "cosmos1htclcontractaddress123456789"  # Mock address
    print(f"✅ HTCL deployed at: {htcl_address}")
    
    # Save Cosmos HTCL data
    cosmos_data = {
        "htclAddress": htcl_address,
        "creator": alice_cosmos_address,
        "recipient": bob_cosmos_address,
        "timelock": timelock,
        "hashlock": hashlock,  # Universal hashlock (0x format)
        "amount": "1000000",  # Mock amount in uatom
        "secret": secret,  # Keep secret for later use
        "destinyNetwork": "polygon-amoy",
        "destinyTokenAddress": "0x0000000000000000000000000000000000000000",  # Native token
        "destinyTokenAmount": "1000000000000000000",  # 1 MATIC in wei
        "walletAddress": result.get('wallet_address'),
        "message": result.get('message'),
        "timestamp": result.get('timestamp'),
        "method": result.get('method')
    }
    
    # Write to file for Bob to use
    with open('cosmos_htcl_data.json', 'w') as f:
        json.dump(cosmos_data, f, indent=2)
    
    print("Transaction data saved to cosmos_htcl_data.json")
    
    # Verify the setup
    print("\n🔍 Verification:")
    print(f"HTCL Address: {htcl_address}")
    print(f"Creator (Alice): {alice_cosmos_address}")
    print(f"Recipient (Bob): {bob_cosmos_address}")
    print(f"Hashlock: {hashlock}")
    print(f"Timelock: {timelock}")
    print(f"Secret: {secret}")
    print(f"Destiny Network: {cosmos_data['destinyNetwork']}")
    print(f"Destiny Token: {cosmos_data['destinyTokenAddress']}")
    print(f"Destiny Amount: {cosmos_data['destinyTokenAmount']}")
    if result.get('wallet_address'):
        print(f"Wallet Address: {result['wallet_address']}")
    if result.get('method'):
        print(f"Secret Method: {result['method']}")
    
    print("\n✅ Alice successfully created HTCL on Cosmos for Bob")
    print("📋 Next steps:")
    print("1. Share cosmos_htcl_data.json with Bob")
    print("2. Bob should create HTCL on EVM (Polygon Amoy) for Alice")
    print("3. Alice will withdraw on EVM with the secret")
    print("4. Bob will withdraw on Cosmos with the secret")
    
    return cosmos_data

def main():
    create_htcl_on_cosmos()

if __name__ == "__main__":
    main() 