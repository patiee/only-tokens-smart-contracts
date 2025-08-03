#!/usr/bin/env python3

import hashlib
import secrets
import binascii

def generate_secret_and_hashlock():
    """
    Generate a random secret and its corresponding hashlock
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
        'hashlock': hashlock_hex,
        'hashlock_string': hashlock  # For Dogecoin (string format)
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
    print("Generating secret and hashlock for cross-chain HTCL...")
    result = generate_secret_and_hashlock()
    
    print("Generated values:")
    print("Secret (EVM):", result['secret'])
    print("Hashlock (EVM):", result['hashlock'])
    print("Hashlock (Dogecoin):", result['hashlock_string'])
    
    print("\nValidation test:")
    is_valid = validate_secret(result['secret'], result['hashlock'])
    print("Secret validation:", is_valid)
    
    print("\nFormat conversion:")
    print("Dogecoin to EVM:", dogecoin_to_evm_hashlock(result['hashlock_string']))
    print("EVM to Dogecoin:", evm_to_dogecoin_hashlock(result['hashlock'])) 