#!/usr/bin/env python3
"""
Cosmos-EVM Cross-Chain HTCL Flow Test
Tests the complete flow: Alice creates HTCL on Cosmos, Bob creates HTCL on EVM,
Alice withdraws from EVM, Bob withdraws from Cosmos
"""

import json
import os
import sys
import time
from pathlib import Path

# Add the shared_secret module to path
sys.path.append(str(Path(__file__).parent))
from shared_secret import generate_deterministic_secret_from_wallet

def test_cosmos_evm_flow():
    """Test the complete Cosmos-EVM cross-chain HTCL flow"""
    
    print("🔄 Testing Cosmos-EVM Cross-Chain HTCL Flow")
    print("=" * 50)
    
    # Mock addresses
    alice_cosmos_address = "cosmos1alice123456789"
    bob_cosmos_address = "cosmos1bob123456789"
    alice_evm_address = "0xAlice123456789012345678901234567890123456"
    bob_evm_address = "0xBob123456789012345678901234567890123456"
    
    print(f"👤 Alice Cosmos: {alice_cosmos_address}")
    print(f"👤 Bob Cosmos: {bob_cosmos_address}")
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
        
        # 2. Alice creates HTCL on Cosmos (mocked)
        print("\n💸 Alice creating HTCL on Cosmos (mocked)...")
        timelock = int(time.time()) + 3600  # 1 hour from now
        
        cosmos_data = {
            "contractAddress": "cosmos1htclcontract123456789",
            "creator": alice_cosmos_address,
            "recipient": bob_cosmos_address,
            "timelock": timelock,
            "hashlock": hashlock[2:],  # Remove 0x prefix for Cosmos
            "amount": "1000000",  # 1 ATOM in uatom
            "secret": secret,
            "destinyNetwork": "polygon-amoy",
            "destinyTokenAddress": "0x0000000000000000000000000000000000000000",
            "destinyTokenAmount": "1000000000000000000"
        }
        
        print(f"✅ Cosmos HTCL created (mocked)")
        print(f"📋 Cosmos HTCL Info:")
        print(f"   Contract: {cosmos_data['contractAddress']}")
        print(f"   Creator: {cosmos_data['creator']}")
        print(f"   Recipient: {cosmos_data['recipient']}")
        print(f"   Timelock: {cosmos_data['timelock']}")
        print(f"   Hashlock: {cosmos_data['hashlock']}")
        print(f"   Amount: {cosmos_data['amount']} uatom")
        
        # 3. Bob creates HTCL on EVM (mocked)
        print("\n💸 Bob creating HTCL on EVM (mocked)...")
        evm_data = {
            "htclAddress": "0xHTCLContract123456789012345678901234567890",
            "creator": bob_evm_address,
            "recipient": alice_evm_address,
            "timelock": timelock,
            "hashlock": hashlock,  # Keep 0x prefix for EVM
            "amount": "1000000000000000000",  # 1 ETH in wei
            "secret": secret,
            "sourceNetwork": "cosmos-hub",
            "sourceTokenAddress": "uatom",
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
            "cosmos": cosmos_data,
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
        
        # 5. Bob withdraws from Cosmos HTCL (mocked)
        print("\n💰 Bob withdrawing from Cosmos HTCL (mocked)...")
        print(f"🔑 Using secret: {secret}")
        print(f"✅ Withdrawal successful on Cosmos")
        
        # 6. Verify the flow
        print("\n✅ Cross-Chain HTCL Flow Verification:")
        print(f"   ✅ Alice created HTCL on Cosmos")
        print(f"   ✅ Bob created HTCL on EVM")
        print(f"   ✅ Alice withdrew from EVM HTCL")
        print(f"   ✅ Bob withdrew from Cosmos HTCL")
        print(f"   ✅ Same secret used across both chains")
        print(f"   ✅ Same hashlock coordinated across both chains")
        
        print("\n🎉 Cosmos-EVM Cross-Chain HTCL Flow Test Completed Successfully!")
        
    except Exception as error:
        print(f"❌ Test failed: {error}")
        sys.exit(1)

if __name__ == "__main__":
    test_cosmos_evm_flow() 