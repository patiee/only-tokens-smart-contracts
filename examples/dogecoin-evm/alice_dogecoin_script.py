#!/usr/bin/env python3

import json
import sys
import os
import time
from shared_secret import generate_secret_and_hashlock

# Add the dogecoin directory to the path to import HTCL modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../dogecoin'))

from htcl_script import HTCLScriptGenerator
from htcl_transaction import HTCLTransactionBuilder, get_current_block_height

def create_htcl_on_dogecoin():
    """Alice creates HTCL on Dogecoin with a hashlock"""
    
    print("🚀 Alice creating HTCL on Dogecoin...")
    
    # Generate secret and hashlock
    result = generate_secret_and_hashlock()
    secret = result['secret']
    hashlock = result['hashlock_string']  # Dogecoin format
    hashlock_evm = result['hashlock']     # EVM format
    
    print(f"Generated secret: {secret}")
    print(f"Generated hashlock (Dogecoin): {hashlock}")
    print(f"Generated hashlock (EVM): {hashlock_evm}")
    
    # Calculate timelock (1 hour from now)
    timelock = int(time.time()) + 3600  # 1 hour
    print(f"Timelock: {timelock}")
    
    # Mock Alice and Bob public keys (in real scenario, these would be actual keys)
    alice_pubkey = "02" + "a" * 64  # Alice's public key
    bob_pubkey = "02" + "b" * 64    # Bob's public key
    
    print(f"Alice pubkey: {alice_pubkey[:16]}...")
    print(f"Bob pubkey: {bob_pubkey[:16]}...")
    
    # Convert timelock to block height (approximate)
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
        hashlock=hashlock
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
        'txid': 'alice_funding_tx_123456789abcdef',
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
        "creator": "alice_dogecoin_address",
        "recipient": "bob_dogecoin_address",
        "timelock": timelock_block,
        "hashlock": hashlock,
        "hashlockEVM": hashlock_evm,
        "amount": funding_amount,
        "secret": secret,  # Keep secret for later use
        "fundingTxid": funding_tx['txid'],
        "alicePubkey": alice_pubkey,
        "bobPubkey": bob_pubkey
    }
    
    # Write to file for Bob to use
    with open('dogecoin_htcl_data.json', 'w') as f:
        json.dump(dogecoin_data, f, indent=2)
    
    print("Transaction data saved to dogecoin_htcl_data.json")
    
    # Verify the setup
    print("\n🔍 Verification:")
    print(f"HTCL Address: {script.p2sh_address}")
    print(f"Creator: alice_dogecoin_address")
    print(f"Recipient: bob_dogecoin_address")
    print(f"Hashlock: {hashlock}")
    print(f"Timelock: {timelock}")
    print(f"Secret: {secret}")
    
    print("\n✅ Alice successfully created HTCL on Dogecoin")
    print("📋 Next steps:")
    print("1. Share dogecoin_htcl_data.json with Bob")
    print("2. Bob should create HTCL on EVM with the same hashlock")
    print("3. Alice will withdraw on EVM with the secret")
    print("4. Bob will withdraw on Dogecoin with the secret")
    
    return dogecoin_data

def main():
    create_htcl_on_dogecoin()

if __name__ == "__main__":
    main() 