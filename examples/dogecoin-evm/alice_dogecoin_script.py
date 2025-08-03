#!/usr/bin/env python3

import os
import json
from shared_secret import generate_deterministic_secret_from_wallet, generate_deterministic_secret_from_private_key, generate_secret_and_hashlock
from htcl_script import HTCLScriptGenerator

def create_htcl_on_dogecoin():
    """
    Alice creates HTCL on Dogecoin for Bob
    This simulates the first step of the cross-chain HTCL flow
    """
    print("🔐 Alice creating HTCL on Dogecoin...")
    
    # Network configuration
    dogecoin_network = "dogecoin-mainnet"
    alice_dogecoin_address = "D8KvKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq"  # Mock address
    bob_dogecoin_address = "D9LvLrLrLrLrLrLrLrLrLrLrLrLrLrLrLr"  # Mock address
    
    # Generate deterministic secret and hashlock
    print("🔑 Generating deterministic secret and hashlock...")
    try:
        # Method 1: Try deterministic wallet-based generation
        mnemonic = os.getenv('ALICE_MNEMONIC', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')
        result = generate_deterministic_secret_from_wallet(mnemonic)
        print(f"✅ Using deterministic wallet-based generation")
    except Exception as e:
        try:
            # Method 2: Try deterministic private key-based generation
            private_key = os.getenv('ALICE_PRIVATE_KEY', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
            result = generate_deterministic_secret_from_private_key(private_key)
            print(f"✅ Using deterministic private key-based generation")
        except Exception as e2:
            # Method 3: Fallback to random generation
            result = generate_secret_and_hashlock()
            print(f"⚠️ Using fallback random generation")
    
    secret = result['secret']
    hashlock = result['hashlock']  # Universal hashlock (0x format)
    
    print(f"🔑 Secret: {secret}")
    print(f"🔒 Hashlock: {hashlock}")
    print(f"👛 Wallet Address: {result.get('wallet_address', 'N/A')}")
    print(f"📝 Message: {result.get('message', 'N/A')}")
    print(f"⏰ Timestamp: {result.get('timestamp', 'N/A')}")
    print(f"🔧 Method: {result.get('method', 'N/A')}")
    
    # Create HTCL script
    print("📝 Creating HTCL script...")
    script = HTCLScriptGenerator.create(
        alice_pubkey=alice_dogecoin_address,
        bob_pubkey=bob_dogecoin_address,
        timelock=1234567,  # Mock block height
        hashlock=hashlock[2:]  # Remove 0x prefix for Dogecoin format
    )
    
    print(f"📄 Script created:")
    print(f"   Alice pubkey: {script.alice_pubkey[:16]}...")
    print(f"   Bob pubkey: {script.bob_pubkey[:16]}...")
    print(f"   Hashlock: {script.hashlock}")
    print(f"   P2SH Address: {script.p2sh_address}")
    print(f"   Script Hex: {script.script_hex[:50]}...")
    
    # Save Dogecoin HTCL data
    dogecoin_data = {
        "htclAddress": script.p2sh_address,
        "creator": alice_dogecoin_address,
        "recipient": bob_dogecoin_address,
        "timelock": 1234567,
        "hashlock": hashlock,  # Universal hashlock (0x format)
        "amount": "1000000",  # Mock amount in satoshis
        "secret": secret,  # Keep secret for later use
        "destinyNetwork": "polygon-amoy",
        "destinyTokenAddress": "0x0000000000000000000000000000000000000000",  # Native token
        "destinyTokenAmount": "1000000000000000000",  # 1 MATIC in wei
        "walletAddress": result.get('wallet_address'),
        "message": result.get('message'),
        "timestamp": result.get('timestamp'),
        "method": result.get('method')
    }
    
    # Save to file
    with open('dogecoin_htcl_data.json', 'w') as f:
        json.dump(dogecoin_data, f, indent=2)
    
    print(f"💾 Dogecoin HTCL data saved to dogecoin_htcl_data.json")
    print(f"🎯 HTCL created on Dogecoin for Bob")
    print(f"🔗 P2SH Address: {script.p2sh_address}")
    print(f"💰 Amount: 1,000,000 satoshis")
    print(f"⏰ Timelock: Block 1,234,567")
    
    return dogecoin_data

if __name__ == "__main__":
    create_htcl_on_dogecoin() 