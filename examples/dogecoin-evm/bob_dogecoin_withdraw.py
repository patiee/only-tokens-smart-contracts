#!/usr/bin/env python3

import json
import sys
import os
import hashlib
import time

# Add the dogecoin directory to the path to import HTCL modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../dogecoin'))

from htcl_script import HTCLScriptValidator
from htcl_transaction import HTCLTransactionBuilder

def bob_withdraw_on_dogecoin():
    """Bob withdraws from Dogecoin HTCL with the secret before timelock expires"""
    
    print("🚀 Bob withdrawing from Dogecoin HTCL...")
    
    # Load transaction data
    try:
        with open('dogecoin_htcl_data.json', 'r') as f:
            dogecoin_data = json.load(f)
    except FileNotFoundError:
        print("❌ Error: dogecoin_htcl_data.json not found")
        print("Please run Alice's Dogecoin script first")
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
    htcl_address = dogecoin_data['htclAddress']
    secret = dogecoin_data['secret']
    hashlock = dogecoin_data['hashlock']
    timelock = dogecoin_data['timelock']
    bob_address = dogecoin_data['recipient']
    
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
    
    # Create HTCL script object for validation
    script = type('Script', (), {
        'alice_pubkey': dogecoin_data['alicePubkey'],
        'bob_pubkey': dogecoin_data['bobPubkey'],
        'timelock': timelock,
        'hashlock': hashlock,
        'p2sh_address': htcl_address,
        'script_hex': dogecoin_data['scriptHex']
    })()
    
    # Mock Bob's signature (in real scenario, you'd create actual signature)
    bob_signature = "bob_signature_123456789abcdef"
    
    # Validate Bob's spending path
    print("\n🔍 Validating withdrawal conditions...")
    
    # Mock validation (in real scenario, you'd validate against actual script)
    is_valid = HTCLScriptValidator.validate_bob_spending(
        script=script,
        secret=secret,
        signature=bob_signature,
        pubkey=dogecoin_data['bobPubkey']
    )
    
    if not is_valid:
        print("❌ Error: Withdrawal validation failed")
        return None
    
    print("✅ Withdrawal validation successful")
    
    # Create withdrawal transaction
    print("\n📝 Creating withdrawal transaction...")
    
    # Mock input UTXO (in real scenario, you'd use the funding transaction output)
    input_utxo = {
        'txid': dogecoin_data['fundingTxid'],
        'vout': 0,
        'amount': dogecoin_data['amount'],
        'script_pubkey': f"OP_HASH160 {hashlock} OP_EQUAL"
    }
    
    # Mock withdrawal transaction
    withdrawal_tx = {
        'txid': 'bob_withdrawal_tx_123456789abcdef',
        'input': input_utxo,
        'output': {
            'address': bob_address,
            'amount': dogecoin_data['amount'] - 1000  # Subtract fee
        },
        'secret': secret,
        'signature': bob_signature
    }
    
    print(f"Withdrawal transaction created:")
    print(f"  TXID: {withdrawal_tx['txid']}")
    print(f"  Input: {withdrawal_tx['input']['txid']}")
    print(f"  Output Address: {withdrawal_tx['output']['address']}")
    print(f"  Amount: {withdrawal_tx['output']['amount']} satoshis")
    print(f"  Secret: {secret}")
    
    # Update transaction data
    dogecoin_data['bobWithdrawn'] = True
    dogecoin_data['withdrawTxid'] = withdrawal_tx['txid']
    dogecoin_data['withdrawTimestamp'] = current_time
    
    with open('dogecoin_htcl_data.json', 'w') as f:
        json.dump(dogecoin_data, f, indent=2)
    
    print("\n💰 Bob successfully withdrew from Dogecoin HTCL")
    print("📋 Transaction details:")
    print(f"  - Contract: {htcl_address}")
    print(f"  - Secret: {secret}")
    print(f"  - Transaction: {withdrawal_tx['txid']}")
    print(f"  - Timestamp: {current_time}")
    
    print("\n🎉 Cross-chain HTCL transaction completed successfully!")
    print("📋 Summary:")
    print("  1. Alice created HTCL on Dogecoin")
    print("  2. Bob created HTCL on EVM")
    print("  3. Alice withdrew from EVM with secret")
    print("  4. Bob withdrew from Dogecoin with secret")
    
    return dogecoin_data

def main():
    bob_withdraw_on_dogecoin()

if __name__ == "__main__":
    main() 