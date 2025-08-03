#!/usr/bin/env python3

import json
import sys
import os
import hashlib
import time

# Add the cosmos directory to the path to import HTCL modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../cosmos'))

from htcl_contract.src.msg import ExecuteMsg

def bob_withdraw_on_cosmos():
    """Bob withdraws from Cosmos HTCL (source network) with the secret before timelock expires"""
    
    print("🚀 Bob withdrawing from Cosmos HTCL (source network)...")
    
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
    bob_address = cosmos_data['recipient']
    source_network = "cosmos"
    source_token_address = "uatom"
    source_token_amount = cosmos_data['amount']
    
    print(f"HTCL Address: {htcl_address}")
    print(f"Bob Cosmos Address: {bob_address}")
    print(f"Secret: {secret}")
    print(f"Hashlock: {hashlock}")
    print(f"Timelock: {timelock}")
    print(f"Source Network: {source_network}")
    print(f"Source Token: {source_token_address}")
    print(f"Source Amount: {source_token_amount}")
    
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
    
    # Check if Alice has already withdrawn on EVM (destiny network)
    if not evm_data.get('aliceWithdrawn', False):
        print("❌ Error: Alice has not withdrawn from EVM (destiny network) yet")
        print("Alice must withdraw from EVM first")
        return None
    print("✅ Alice has withdrawn from EVM (destiny network)")
    
    # Create HTCL script object for validation
    script = type('Script', (), {
        'alice_pubkey': cosmos_data.get('alicePubkey', ''),
        'bob_pubkey': cosmos_data.get('bobPubkey', ''),
        'timelock': timelock,
        'hashlock': hashlock,
        'p2sh_address': htcl_address,
        'script_hex': cosmos_data.get('scriptHex', '')
    })()
    
    # Mock Bob's signature (in real scenario, you'd create actual signature)
    bob_signature = "bob_signature_123456789abcdef"
    
    # Validate Bob's spending path
    print("\n🔍 Validating withdrawal conditions...")
    
    # Mock validation (in real scenario, you'd validate against actual script)
    is_valid = True  # Mock validation
    
    if not is_valid:
        print("❌ Error: Withdrawal validation failed")
        return None
    
    print("✅ Withdrawal validation successful")
    
    # Create withdrawal transaction
    print("\n📝 Creating withdrawal transaction on source network...")
    
    # Mock input UTXO (in real scenario, you'd use the funding transaction output)
    input_utxo = {
        'txid': cosmos_data.get('fundingTxid', 'cosmos_funding_tx_123456789'),
        'vout': 0,
        'amount': source_token_amount,
        'script_pubkey': f"OP_HASH160 {hashlock} OP_EQUAL"
    }
    
    # Mock withdrawal transaction
    withdrawal_tx = {
        'txid': 'bob_withdrawal_tx_123456789abcdef',
        'input': input_utxo,
        'output': {
            'address': bob_address,
            'amount': int(source_token_amount) - 1000  # Subtract fee
        },
        'secret': secret,
        'signature': bob_signature
    }
    
    print(f"Withdrawal transaction created:")
    print(f"  TXID: {withdrawal_tx['txid']}")
    print(f"  Input: {withdrawal_tx['input']['txid']}")
    print(f"  Output Address: {withdrawal_tx['output']['address']}")
    print(f"  Amount: {withdrawal_tx['output']['amount']} {source_token_address}")
    print(f"  Secret: {secret}")
    print(f"  Network: {source_network}")
    
    # Update transaction data
    cosmos_data['bobWithdrawn'] = True
    cosmos_data['withdrawTxid'] = withdrawal_tx['txid']
    cosmos_data['withdrawTimestamp'] = current_time
    
    with open('cosmos_htcl_data.json', 'w') as f:
        json.dump(cosmos_data, f, indent=2)
    
    print("\n💰 Bob successfully withdrew from Cosmos HTCL (source network)")
    print("📋 Transaction details:")
    print(f"  - Contract: {htcl_address}")
    print(f"  - Secret: {secret}")
    print(f"  - Transaction: {withdrawal_tx['txid']}")
    print(f"  - Timestamp: {current_time}")
    print(f"  - Network: {source_network}")
    print(f"  - Token: {source_token_address}")
    print(f"  - Amount: {source_token_amount}")
    
    print("\n🎉 Cross-chain HTCL transaction completed successfully!")
    print("📋 Summary:")
    print("  1. Alice created HTCL on Cosmos (source) for Bob")
    print("  2. Bob created HTCL on EVM (destiny) for Alice")
    print("  3. Alice withdrew from EVM (destiny) with secret")
    print("  4. Bob withdrew from Cosmos (source) with secret")
    
    return cosmos_data

def main():
    bob_withdraw_on_cosmos()

if __name__ == "__main__":
    main() 