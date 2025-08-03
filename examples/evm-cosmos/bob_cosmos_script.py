#!/usr/bin/env python3

import json
import asyncio
from datetime import datetime, timedelta
from cosmwasm_schema import cw_serde
from cosmjs import CosmWasmClient, SigningCosmWasmClient
from cosmjs.types import Coin
import hashlib

# Mock HTCL contract interface for Cosmos
@cw_serde
class InstantiateMsg:
    bob: str
    timelock: int
    hashlock: str

@cw_serde
class ExecuteMsg:
    bob_withdraw: dict = None
    alice_withdraw: dict = None

async def create_htcl_on_cosmos():
    """Bob creates HTCL on Cosmos with the same hashlock as Alice's EVM HTCL"""
    
    print("🚀 Bob creating HTCL on Cosmos...")
    
    # Load transaction data from Alice's EVM HTCL
    try:
        with open('evm_htcl_data.json', 'r') as f:
            evm_data = json.load(f)
    except FileNotFoundError:
        print("❌ Error: evm_htcl_data.json not found")
        print("Please run Alice's EVM script first")
        return None
    
    # Extract data from EVM HTCL
    hashlock_cosmos = evm_data['hashlockCosmos']
    timelock = evm_data['timelock']
    alice_address = evm_data['aliceAddress']
    bob_address = evm_data['bobAddress']
    amount = evm_data['amount']
    
    print(f"Hashlock (Cosmos): {hashlock_cosmos}")
    print(f"Timelock: {timelock}")
    print(f"Alice address: {alice_address}")
    print(f"Bob address: {bob_address}")
    print(f"Amount: {amount}")
    
    # Validate hashlock format
    if not hashlock_cosmos or len(hashlock_cosmos) != 64:
        print("❌ Error: Invalid hashlock format")
        return None
    
    # Create instantiate message for Cosmos HTCL
    instantiate_msg = InstantiateMsg(
        bob=alice_address,  # Alice is the recipient on Cosmos
        timelock=timelock,
        hashlock=hashlock_cosmos
    )
    
    # Mock deployment (in real scenario, you'd use CosmJS)
    print("📝 Creating instantiate message...")
    print(f"Bob (creator): {bob_address}")
    print(f"Alice (recipient): {alice_address}")
    print(f"Timelock: {timelock}")
    print(f"Hashlock: {hashlock_cosmos}")
    
    # Simulate contract deployment
    htcl_address = "cosmos1htclcontractaddress123456789"  # Mock address
    print(f"✅ HTCL deployed at: {htcl_address}")
    
    # Save Cosmos HTCL data
    cosmos_data = {
        "htclAddress": htcl_address,
        "creator": bob_address,
        "recipient": alice_address,
        "timelock": timelock,
        "hashlock": hashlock_cosmos,
        "amount": amount,
        "secret": evm_data['secret'],  # Keep secret for later use
        "evmHtclAddress": evm_data['htclAddress']
    }
    
    with open('cosmos_htcl_data.json', 'w') as f:
        json.dump(cosmos_data, f, indent=2)
    
    print("📄 Cosmos HTCL data saved to cosmos_htcl_data.json")
    
    # Verify the setup
    print("\n🔍 Verification:")
    print(f"EVM HTCL: {evm_data['htclAddress']}")
    print(f"Cosmos HTCL: {htcl_address}")
    print(f"Shared hashlock: {hashlock_cosmos}")
    print(f"Shared timelock: {timelock}")
    print(f"Secret: {evm_data['secret']}")
    
    print("\n✅ Bob successfully created HTCL on Cosmos")
    print("📋 Next steps:")
    print("1. Alice will withdraw on Cosmos with the secret")
    print("2. Bob will withdraw on EVM with the secret")
    
    return cosmos_data

async def main():
    await create_htcl_on_cosmos()

if __name__ == "__main__":
    asyncio.run(main()) 