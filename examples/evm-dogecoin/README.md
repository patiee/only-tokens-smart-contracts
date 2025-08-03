# EVM-Dogecoin Cross-Chain HTCL Example

This example demonstrates a cross-chain HTCL (Hash Time-Locked Contract) transaction between Ethereum (EVM) and Dogecoin chains.

## Scenario

1. **Alice creates HTCL on EVM** with a hashlock
2. **Bob creates HTCL on Dogecoin** with the same hashlock
3. **Alice withdraws on Dogecoin** with the secret before timelock expires
4. **Bob withdraws on EVM** with the same secret before timelock expires

## Flow

```
Alice (EVM)                    Bob (Dogecoin)
     |                              |
     |-- Create HTCL --------------->|
     |                              |-- Create HTCL
     |                              |
     |<-- Secret -------------------|
     |                              |
     |-- Withdraw on Dogecoin ------->|
     |                              |
     |<-- Withdraw on EVM -----------|
```

## Files

- `alice_evm_script.js` - Alice's script to create HTCL on EVM
- `bob_dogecoin_script.py` - Bob's script to create HTCL on Dogecoin
- `alice_dogecoin_withdraw.py` - Alice's script to withdraw on Dogecoin
- `bob_evm_withdraw.js` - Bob's script to withdraw on EVM
- `shared_secret.js` - Shared secret generation and validation
- `deploy_and_test.sh` - Complete test script

## Prerequisites

- Node.js and npm
- Python 3.8+
- Hardhat (for EVM)
- Dogecoin HTCL libraries
- Access to EVM and Dogecoin testnets

## Usage

1. Set up your environment variables
2. Run the complete test: `./deploy_and_test.sh`
3. Or run individual scripts for specific steps

## Security Notes

- The secret must be shared securely between Alice and Bob
- Both chains must use the same hashlock (hash of the secret)
- Timelocks should be coordinated between chains
- Always test on testnets before mainnet 