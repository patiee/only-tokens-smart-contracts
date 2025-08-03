# Cosmos-EVM Cross-Chain HTCL Example

This example demonstrates a cross-chain HTCL (Hash Time-Locked Contract) transaction between Cosmos and Ethereum (EVM) chains.

## Scenario

1. **Alice creates HTCL on Cosmos** with a hashlock for Bob (source network)
2. **Bob sees Alice's HTCL** and creates a matching HTCL on EVM (destiny network - Polygon Amoy) for Alice
3. **Alice withdraws on EVM** (destiny network) with the secret before timelock expires
4. **Bob withdraws on Cosmos** (source network) with the same secret before timelock expires

## Flow

```
Alice (Cosmos)                    Bob (Cosmos)
     |                              |
     |-- Create HTCL for Bob ------->|
     |                              |
     |                              |-- See Alice's HTCL
     |                              |-- Create HTCL on EVM for Alice
     |                              |
     |<-- Secret -------------------|
     |                              |
     |-- Withdraw on EVM ----------->|
     |                              |
     |<-- Withdraw on Cosmos --------|
```

## Network Configuration

- **Source Network**: Cosmos (Alice and Bob both have Cosmos addresses)
- **Destiny Network**: EVM/Polygon Amoy (Alice and Bob both have EVM addresses)
- **Token**: Native tokens on both networks
- **Amount**: Equivalent amounts on both networks

## Files

- `alice_cosmos_script.py` - Alice's script to create HTCL on Cosmos for Bob
- `bob_evm_script.js` - Bob's script to create HTCL on EVM for Alice
- `alice_evm_withdraw.js` - Alice's script to withdraw on EVM with secret
- `bob_cosmos_withdraw.py` - Bob's script to withdraw on Cosmos with secret
- `shared_secret.py` - Shared secret generation and validation
- `deploy_and_test.sh` - Complete test script

## Prerequisites

- Node.js and npm
- Python 3.8+
- Hardhat (for EVM)
- CosmJS (for Cosmos)
- Access to Cosmos and EVM testnets

## Usage

1. Set up your environment variables
2. Run the complete test: `./deploy_and_test.sh`
3. Or run individual scripts for specific steps

## Security Notes

- The secret must be shared securely between Alice and Bob
- Both chains must use the same hashlock (hash of the secret)
- Timelocks should be coordinated between chains
- Always test on testnets before mainnet 