#!/usr/bin/env python3

import json
import sys
import os
import hashlib
import time

# Add the dogecoin directory to the path to import HTCL modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../dogecoin'))

from htcl_script import HTCLScriptGenerator, generate_hashlock
from htcl_transaction import HTCLTransactionBuilder, get_current_block_height

def create_htcl_on_dogecoin():
    """Bob creates HTCL on Dogecoin with the same hashlock as Alice's EVM HTCL"""
    
    print("🚀 Bob creating HTCL on Dogecoin...")
    
    # Load transaction data from Alice's EVM HTCL
    try:
        with open('evm_htcl_data.json', 'r') as f:
            evm_data = json.load(f)
    except FileNotFoundError:
        print("❌ Error: evm_htcl_data.json not found")
        print("Please run Alice's EVM script first")
        return None
    
    # Extract data from EVM HTCL
    hashlock_dogecoin = evm_data['hashlockDogecoin']
    timelock = evm_data['timelock']
    alice_address = evm_data['aliceAddress']
    bob_address = evm_data['bobAddress']
    amount = evm_data['amount']
    
    print(f"Hashlock (Dogecoin): {hashlock_dogecoin}")
    print(f"Timelock: {timelock}")
    print(f"Alice address: {alice_address}")
    print(f"Bob address: {bob_address}")
    print(f"Amount: {amount}")
    
    # Validate hashlock format
    if not hashlock_dogecoin or len(hashlock_dogecoin) != 64:
        print("❌ Error: Invalid hashlock format")
        return None
    
    # Mock Alice and Bob public keys (in real scenario, these would be actual keys)
    alice_pubkey = "02" + "a" * 64  # Alice's public key
    bob_pubkey = "02" + "b" * 64    # Bob's public key
    
    # Convert timelock to block height (approximate)
    # In practice, you'd need to convert timestamp to block height
    current_block = get_current_block_height()
    timelock_block = current_block + 1000  # Approximate conversion
    
    print(f"Current block: {current_block}")
    print(f"Timelock block: {timelock_block}")
    
    # Create HTCL script
    print("📝 Creating HTCL script...")
    script = HTCLScriptGenerator.create(
        alice_pubkey=alice_pubkey,
        bob_pubkey=bob_pubkey,
        timelock=timelock_block,
        hashlock=hashlock_dogecoin
    )
    
    print(f"Alice pubkey: {script.alice_pubkey[:16]}...")
    print(f"Bob pubkey: {script.bob_pubkey[:16]}...")
    print(f"P2SH Address: {script.p2sh_address}")
    print(f"Script Hex: {script.script_hex[:50]}...")
    
    # Validate the script
    if HTCLScriptGenerator.validate_script(script):
        print("✅ Script validation passed")
    else:
        print("❌ Script validation failed")
        return None
    
    # Create transaction builder
    builder = HTCLTransactionBuilder()
    
    # Mock funding transaction (in real scenario, you'd create actual transaction)
    print("📝 Creating funding transaction...")
    
    # Example input UTXOs (in practice, you'd get these from a wallet)
    input_utxos = [
        {
            'txid': '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            'vout': 0,
            'amount': 1000000  # 1 DOGE in satoshis
        }
    ]
    
    funding_amount = 500000  # 0.5 DOGE
    fee = 1000  # Mock fee
    change_address = 'D8gP6wF1JP5XdQpw4VN3uXJmUixF6RT7b9'
    
    # Mock funding transaction creation
    funding_tx = {
        'txid': 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        'script_address': script.p2sh_address,
        'amount': funding_amount,
        'fee': fee
    }
    
    print(f"Funding transaction created:")
    print(f"  TXID: {funding_tx['txid']}")
    print(f"  Script Address: {funding_tx['script_address']}")
    print(f"  Amount: {funding_tx['amount']} satoshis")
    print(f"  Fee: {funding_tx['fee']} satoshis")
    
    # Save Dogecoin HTCL data
    dogecoin_data = {
        "htclAddress": script.p2sh_address,
        "scriptHex": script.script_hex,
        "creator": bob_address,
        "recipient": alice_address,
        "timelock": timelock_block,
        "hashlock": hashlock_dogecoin,
        "amount": funding_amount,
        "secret": evm_data['secret'],  # Keep secret for later use
        "evmHtclAddress": evm_data['htclAddress'],
        "fundingTxid": funding_tx['txid'],
        "alicePubkey": alice_pubkey,
        "bobPubkey": bob_pubkey
    }
    
    with open('dogecoin_htcl_data.json', 'w') as f:
        json.dump(dogecoin_data, f, indent=2)
    
    print("📄 Dogecoin HTCL data saved to dogecoin_htcl_data.json")
    
    # Verify the setup
    print("\n🔍 Verification:")
    print(f"EVM HTCL: {evm_data['htclAddress']}")
    print(f"Dogecoin HTCL: {script.p2sh_address}")
    print(f"Shared hashlock: {hashlock_dogecoin}")
    print(f"Shared timelock: {timelock}")
    print(f"Secret: {evm_data['secret']}")
    
    print("\n✅ Bob successfully created HTCL on Dogecoin")
    print("📋 Next steps:")
    print("1. Alice will withdraw on Dogecoin with the secret")
    print("2. Bob will withdraw on EVM with the secret")
    
    return dogecoin_data

def main():
    create_htcl_on_dogecoin()

if __name__ == "__main__":
    main() 