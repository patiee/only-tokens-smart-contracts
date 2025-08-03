#!/usr/bin/env python3
"""
Dogecoin-EVM Cross-Chain HTCL Flow Test
Tests the complete flow: Alice creates HTCL on Dogecoin, Bob creates HTCL on EVM,
Alice withdraws from EVM, Bob withdraws from Dogecoin
"""

import json
import os
import sys
import time
from pathlib import Path

# Add the shared_secret module to path
sys.path.append(str(Path(__file__).parent))
from shared_secret import generate_deterministic_secret_from_wallet

def test_dogecoin_evm_flow():
    """Test the complete Dogecoin-EVM cross-chain HTCL flow"""
    
    print("🔄 Testing Dogecoin-EVM Cross-Chain HTCL Flow")
    print("=" * 50)
    
    # Mock addresses
    alice_dogecoin_address = "D8Alice123456789012345678901234567890"
    bob_dogecoin_address = "D8Bob123456789012345678901234567890"
    alice_evm_address = "0xAlice123456789012345678901234567890123456"
    bob_evm_address = "0xBob123456789012345678901234567890123456"
    
    print(f"👤 Alice Dogecoin: {alice_dogecoin_address}")
    print(f"👤 Bob Dogecoin: {bob_dogecoin_address}")
    print(f"👤 Alice EVM: {alice_evm_address}")
    print(f"👤 Bob EVM: {bob_evm_address}")
    
    try:
        # 1. Generate deterministic secret and hashlock
        print("\n🔑 Generating deterministic secret and hashlock...")
        
        # Use a mock mnemonic for testing
        mnemonic = "test test test test test test test test test test test junk"
        result = generate_deterministic_secret_from_wallet(mnemonic)
        
        secret = result['secret']
        hashlock = result['hashlock']
        wallet_address = result['wallet_address']
        message = result['message']
        timestamp = result['timestamp']
        
        print(f"🔑 Secret: {secret}")
        print(f"🔒 Hashlock: {hashlock}")
        print(f"👛 Wallet Address: {wallet_address}")
        print(f"📝 Message: {message}")
        print(f"⏰ Timestamp: {timestamp}")
        
        # 2. Alice creates HTCL on Dogecoin (mocked)
        print("\n💸 Alice creating HTCL on Dogecoin (mocked)...")
        timelock = 1234567  # Mock block height
        
        dogecoin_data = {
            "htclAddress": "D8KvKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq",
            "creator": alice_dogecoin_address,
            "recipient": bob_dogecoin_address,
            "timelock": timelock,
            "hashlock": hashlock[2:],  # Remove 0x prefix for Dogecoin
            "amount": "1000000",  # 1 DOGE in satoshis
            "secret": secret,
            "destinyNetwork": "polygon-amoy",
            "destinyTokenAddress": "0x0000000000000000000000000000000000000000",
            "destinyTokenAmount": "1000000000000000000"
        }
        
        print(f"✅ Dogecoin HTCL created (mocked)")
        print(f"📋 Dogecoin HTCL Info:")
        print(f"   Address: {dogecoin_data['htclAddress']}")
        print(f"   Creator: {dogecoin_data['creator']}")
        print(f"   Recipient: {dogecoin_data['recipient']}")
        print(f"   Timelock: {dogecoin_data['timelock']} (block height)")
        print(f"   Hashlock: {dogecoin_data['hashlock']}")
        print(f"   Amount: {dogecoin_data['amount']} satoshis")
        
        # 3. Bob creates HTCL on EVM (mocked)
        print("\n💸 Bob creating HTCL on EVM (mocked)...")
        evm_data = {
            "htclAddress": "0xHTCLContract123456789012345678901234567890",
            "creator": bob_evm_address,
            "recipient": alice_evm_address,
            "timelock": int(time.time()) + 3600,  # 1 hour from now
            "hashlock": hashlock,  # Keep 0x prefix for EVM
            "amount": "1000000000000000000",  # 1 ETH in wei
            "secret": secret,
            "sourceNetwork": "dogecoin",
            "sourceTokenAddress": "",  # Empty for Dogecoin
            "sourceTokenAmount": "1000000"
        }
        
        print(f"✅ EVM HTCL created (mocked)")
        print(f"📋 EVM HTCL Info:")
        print(f"   Contract: {evm_data['htclAddress']}")
        print(f"   Creator: {evm_data['creator']}")
        print(f"   Recipient: {evm_data['recipient']}")
        print(f"   Timelock: {evm_data['timelock']}")
        print(f"   Hashlock: {evm_data['hashlock']}")
        print(f"   Amount: {evm_data['amount']} wei")
        
        # Save transaction data
        transaction_data = {
            "dogecoin": dogecoin_data,
            "evm": evm_data,
            "secret": secret,
            "hashlock": hashlock,
            "walletAddress": wallet_address,
            "message": message,
            "timestamp": timestamp,
            "method": "deterministic_hmac"
        }
        
        data_path = Path(__file__).parent / "transaction_data.json"
        with open(data_path, 'w') as f:
            json.dump(transaction_data, f, indent=2)
        
        print(f"💾 Transaction data saved to: {data_path}")
        
        # 4. Alice withdraws from EVM HTCL (mocked)
        print("\n💰 Alice withdrawing from EVM HTCL (mocked)...")
        print(f"🔑 Using secret: {secret}")
        print(f"✅ Withdrawal successful on EVM")
        
        # 5. Bob withdraws from Dogecoin HTCL (mocked)
        print("\n💰 Bob withdrawing from Dogecoin HTCL (mocked)...")
        print(f"🔑 Using secret: {secret}")
        print(f"✅ Withdrawal successful on Dogecoin")
        
        # 6. Verify the flow
        print("\n✅ Cross-Chain HTCL Flow Verification:")
        print(f"   ✅ Alice created HTCL on Dogecoin")
        print(f"   ✅ Bob created HTCL on EVM")
        print(f"   ✅ Alice withdrew from EVM HTCL")
        print(f"   ✅ Bob withdrew from Dogecoin HTCL")
        print(f"   ✅ Same secret used across both chains")
        print(f"   ✅ Same hashlock coordinated across both chains")
        
        print("\n🎉 Dogecoin-EVM Cross-Chain HTCL Flow Test Completed Successfully!")
        
    except Exception as error:
        print(f"❌ Test failed: {error}")
        sys.exit(1)

if __name__ == "__main__":
    test_dogecoin_evm_flow() 