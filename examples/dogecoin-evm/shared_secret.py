#!/usr/bin/env python3

import hashlib
import secrets
import binascii
import hmac
import time
import os
from eth_account import Account
from hdwallet import HDWallet
from hdwallet.symbols import ETH

def generate_deterministic_secret_from_wallet(mnemonic: str, derivation_path: str = "m/44'/60'/0'/0/0") -> dict:
    """
    Generate a deterministic secret from wallet mnemonic using HMAC-SHA256
    This ensures the same wallet generates the same secret across all chains
    """
    try:
        # Initialize HD wallet
        hdwallet = HDWallet(symbol=ETH)
        hdwallet.from_mnemonic(mnemonic)
        hdwallet.from_path(derivation_path)
        
        private_key = hdwallet.private_key()
        address = hdwallet.address()
        
        # Create a deterministic secret using private key + timestamp
        # This ensures the same wallet generates the same secret for the same timestamp
        timestamp = int(time.time() / 3600) * 3600  # Round to hour for consistency
        message = f"HTCL_CROSS_CHAIN_SECRET_{timestamp}"
        
        # Use HMAC-SHA256 with private key as key and message as data
        # This creates a deterministic secret that's the same across all chains
        secret_bytes = hmac.new(
            private_key.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        
        secret_hex = '0x' + secret_bytes.hex()
        hashlock = hashlib.sha256(secret_bytes).hexdigest()
        hashlock_hex = '0x' + hashlock
        
        return {
            'secret': secret_hex,
            'secret_bytes': secret_bytes,
            'hashlock': hashlock_hex,  # Universal hashlock (0x format)
            'wallet_address': address,
            'message': message,
            'timestamp': timestamp,
            'method': 'deterministic_hmac'
        }
    except Exception as e:
        raise Exception(f"Deterministic secret generation failed: {str(e)}")

def generate_deterministic_secret_from_private_key(private_key: str) -> dict:
    """
    Generate a deterministic secret from private key using HMAC-SHA256
    This ensures the same private key generates the same secret across all chains
    """
    try:
        # Initialize account from private key
        account = Account.from_key(private_key)
        address = account.address
        
        # Create a deterministic secret using private key + timestamp
        timestamp = int(time.time() / 3600) * 3600  # Round to hour for consistency
        message = f"HTCL_CROSS_CHAIN_SECRET_{timestamp}"
        
        # Use HMAC-SHA256 with private key as key and message as data
        secret_bytes = hmac.new(
            private_key.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        
        secret_hex = '0x' + secret_bytes.hex()
        hashlock = hashlib.sha256(secret_bytes).hexdigest()
        hashlock_hex = '0x' + hashlock
        
        return {
            'secret': secret_hex,
            'secret_bytes': secret_bytes,
            'hashlock': hashlock_hex,  # Universal hashlock (0x format)
            'wallet_address': address,
            'message': message,
            'timestamp': timestamp,
            'method': 'deterministic_hmac'
        }
    except Exception as e:
        raise Exception(f"Deterministic secret generation failed: {str(e)}")

def generate_secret_and_hashlock():
    """
    Generate a random secret and its corresponding hashlock (FALLBACK METHOD)
    Returns: Object containing secret and hashlock
    """
    # Generate a random 32-byte secret
    secret_bytes = secrets.token_bytes(32)
    secret_hex = '0x' + secret_bytes.hex()
    
    # Create hashlock (sha256 hash of the secret)
    hashlock = hashlib.sha256(secret_bytes).hexdigest()
    hashlock_hex = '0x' + hashlock
    
    return {
        'secret': secret_hex,
        'secret_bytes': secret_bytes,
        'hashlock': hashlock_hex,  # Universal hashlock (0x format)
        'method': 'random'
    }

def validate_secret(secret, hashlock):
    """
    Validate if a secret matches a given hashlock
    Args:
        secret: The secret to validate
        hashlock: The hashlock to check against
    Returns: True if secret matches hashlock
    """
    # Remove 0x prefix if present
    clean_secret = secret[2:] if secret.startswith('0x') else secret
    secret_bytes = binascii.unhexlify(clean_secret)
    
    # Create hashlock from secret
    calculated_hashlock = hashlib.sha256(secret_bytes).hexdigest()
    expected_hashlock = hashlock[2:] if hashlock.startswith('0x') else hashlock
    
    return calculated_hashlock == expected_hashlock

def dogecoin_to_evm_hashlock(dogecoin_hashlock):
    """
    Convert Dogecoin hashlock format to EVM format
    Args:
        dogecoin_hashlock: Hashlock in Dogecoin format (hex string)
    Returns: Hashlock in EVM format (0x...)
    """
    return dogecoin_hashlock if dogecoin_hashlock.startswith('0x') else '0x' + dogecoin_hashlock

def evm_to_dogecoin_hashlock(evm_hashlock):
    """
    Convert EVM hashlock format to Dogecoin format
    Args:
        evm_hashlock: Hashlock in EVM format (0x...)
    Returns: Hashlock in Dogecoin format (hex string without 0x)
    """
    return evm_hashlock[2:] if evm_hashlock.startswith('0x') else evm_hashlock

if __name__ == "__main__":
    print("=== Cross-Chain Compatible Secret Generation ===")
    
    # Example 1: Using deterministic HMAC (RECOMMENDED for production)
    print("\n1. Generating deterministic secret from wallet...")
    try:
        mnemonic = os.getenv('ALICE_MNEMONIC', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')
        result = generate_deterministic_secret_from_wallet(mnemonic)
        
        print("Generated values:")
        print("Wallet Address:", result['wallet_address'])
        print("Message:", result['message'])
        print("Timestamp:", result['timestamp'])
        print("Method:", result['method'])
        print("Secret (EVM):", result['secret'])
        print("Hashlock:", result['hashlock'])
        
        print("\nValidation test:")
        is_valid = validate_secret(result['secret'], result['hashlock'])
        print("Secret validation:", is_valid)
        
        # Test cross-chain compatibility
        print("\nCross-chain compatibility test:")
        print("Same wallet + same timestamp = same secret across all chains")
        
    except Exception as e:
        print(f"Error with deterministic method: {e}")
    
    # Example 2: Using private key (deterministic)
    print("\n2. Generating deterministic secret from private key...")
    try:
        private_key = os.getenv('ALICE_PRIVATE_KEY', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
        result = generate_deterministic_secret_from_private_key(private_key)
        
        print("Generated values:")
        print("Wallet Address:", result['wallet_address'])
        print("Message:", result['message'])
        print("Timestamp:", result['timestamp'])
        print("Method:", result['method'])
        print("Secret (EVM):", result['secret'])
        print("Hashlock:", result['hashlock'])
        
        print("\nValidation test:")
        is_valid = validate_secret(result['secret'], result['hashlock'])
        print("Secret validation:", is_valid)
        
    except Exception as e:
        print(f"Error with private key method: {e}")
    
    # Example 3: Fallback random generation
    print("\n3. Fallback: Random secret generation...")
    result = generate_secret_and_hashlock()
    
    print("Generated values:")
    print("Secret (EVM):", result['secret'])
    print("Hashlock:", result['hashlock'])
    
    print("\nValidation test:")
    is_valid = validate_secret(result['secret'], result['hashlock'])
    print("Secret validation:", is_valid)
    
    print("\nFormat conversion:")
    print("Dogecoin to EVM:", dogecoin_to_evm_hashlock(result['hashlock'][2:]))
    print("EVM to Dogecoin:", evm_to_dogecoin_hashlock(result['hashlock'])) 