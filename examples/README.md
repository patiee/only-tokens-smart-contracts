# Cross-Chain HTCL Examples

This directory contains comprehensive examples demonstrating cross-chain Hash Time-Locked Contract (HTCL) transactions between Ethereum (EVM) and Cosmos chains.

## Overview

HTCL (Hash Time-Locked Contract) is a cryptographic protocol that enables secure cross-chain transactions. It uses:
- **Hashlock**: A cryptographic hash that can only be unlocked with a secret
- **Timelock**: A time-based mechanism that allows withdrawal after a certain period
- **Cross-chain coordination**: Synchronized contracts on different blockchains

## Examples

### 1. EVM-Cosmos Example (`evm-cosmos/`)

**Scenario**: Alice starts on EVM, Bob responds on Cosmos

1. **Alice creates HTCL on EVM** with a hashlock
2. **Bob creates HTCL on Cosmos** with the same hashlock
3. **Alice withdraws on Cosmos** with the secret before timelock
4. **Bob withdraws on EVM** with the same secret before timelock

**Flow**:
```
Alice (EVM)                    Bob (Cosmos)
     |                              |
     |-- Create HTCL --------------->|
     |                              |-- Create HTCL
     |                              |
     |<-- Secret -------------------|
     |                              |
     |-- Withdraw on Cosmos --------->|
     |                              |
     |<-- Withdraw on EVM -----------|
```

### 2. Cosmos-EVM Example (`cosmos-evm/`)

**Scenario**: Alice starts on Cosmos, Bob responds on EVM

1. **Alice creates HTCL on Cosmos** with a hashlock
2. **Bob creates HTCL on EVM** with the same hashlock
3. **Alice withdraws on EVM** with the secret before timelock
4. **Bob withdraws on Cosmos** with the same secret before timelock

**Flow**:
```
Alice (Cosmos)                  Bob (EVM)
     |                              |
     |-- Create HTCL --------------->|
     |                              |-- Create HTCL
     |                              |
     |<-- Secret -------------------|
     |                              |
     |-- Withdraw on EVM ----------->|
     |                              |
     |<-- Withdraw on Cosmos --------|
```

### 3. EVM-Dogecoin Example (`evm-dogecoin/`)

**Scenario**: Alice starts on EVM, Bob responds on Dogecoin

1. **Alice creates HTCL on EVM** with a hashlock
2. **Bob creates HTCL on Dogecoin** with the same hashlock
3. **Alice withdraws on Dogecoin** with the secret before timelock
4. **Bob withdraws on EVM** with the same secret before timelock

**Flow**:
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

### 4. Dogecoin-EVM Example (`dogecoin-evm/`)

**Scenario**: Alice starts on Dogecoin, Bob responds on EVM

1. **Alice creates HTCL on Dogecoin** with a hashlock
2. **Bob creates HTCL on EVM** with the same hashlock
3. **Alice withdraws on EVM** with the secret before timelock
4. **Bob withdraws on Dogecoin** with the same secret before timelock

**Flow**:
```
Alice (Dogecoin)                Bob (EVM)
     |                              |
     |-- Create HTCL --------------->|
     |                              |-- Create HTCL
     |                              |
     |<-- Secret -------------------|
     |                              |
     |-- Withdraw on EVM ----------->|
     |                              |
     |<-- Withdraw on Dogecoin ------|
```

## Key Features

### Security
- **Secret sharing**: The same secret must be used across both chains
- **Hashlock validation**: Secret must hash to the correct hashlock
- **Timelock coordination**: Both contracts use synchronized timelocks
- **Authorization**: Only authorized parties can withdraw

### Cross-Chain Coordination
- **Shared parameters**: Hashlock, timelock, and secret are synchronized
- **State tracking**: Each withdrawal is tracked and verified
- **Error handling**: Comprehensive validation and error messages
- **Transaction verification**: All steps are verified before proceeding

### Contract Compatibility
- **EVM Contract**: Solidity smart contract with full HTCL functionality
- **Cosmos Contract**: CosmWasm contract with equivalent features
- **Format conversion**: Automatic conversion between EVM and Cosmos formats

## Prerequisites

- **Node.js** (v16+) and npm
- **Python** (v3.8+)
- **Hardhat** (for EVM development)
- **CosmJS** (for Cosmos development)
- **Access to testnets** (for real testing)

## Quick Start

### Running EVM-Cosmos Example

```bash
cd examples/evm-cosmos
./deploy_and_test.sh
```

### Running Cosmos-EVM Example

```bash
cd examples/cosmos-evm
./deploy_and_test.sh
```

### Running EVM-Dogecoin Example

```bash
cd examples/evm-dogecoin
./deploy_and_test.sh
```

### Running Dogecoin-EVM Example

```bash
cd examples/dogecoin-evm
./deploy_and_test.sh
```

## Individual Scripts

Each example contains individual scripts that can be run separately:

### EVM-Cosmos
- `alice_evm_script.js` - Alice creates HTCL on EVM
- `bob_cosmos_script.py` - Bob creates HTCL on Cosmos
- `alice_cosmos_withdraw.py` - Alice withdraws on Cosmos
- `bob_evm_withdraw.js` - Bob withdraws on EVM

### Cosmos-EVM
- `alice_cosmos_script.py` - Alice creates HTCL on Cosmos
- `bob_evm_script.js` - Bob creates HTCL on EVM
- `alice_evm_withdraw.js` - Alice withdraws on EVM
- `bob_cosmos_withdraw.py` - Bob withdraws on Cosmos

### EVM-Dogecoin
- `alice_evm_script.js` - Alice creates HTCL on EVM
- `bob_dogecoin_script.py` - Bob creates HTCL on Dogecoin
- `alice_dogecoin_withdraw.py` - Alice withdraws on Dogecoin
- `bob_evm_withdraw.js` - Bob withdraws on EVM

### Dogecoin-EVM
- `alice_dogecoin_script.py` - Alice creates HTCL on Dogecoin
- `bob_evm_script.js` - Bob creates HTCL on EVM
- `alice_evm_withdraw.js` - Alice withdraws on EVM
- `bob_dogecoin_withdraw.py` - Bob withdraws on Dogecoin

## Contract Verification

Both contracts implement the same HTCL logic:

### Withdrawal Rules
- **Bob can withdraw**: Before timelock expires with correct secret
- **Alice can withdraw**: After timelock expires (fallback mechanism)

### Security Checks
- **Secret validation**: Secret must hash to the correct hashlock
- **Timelock enforcement**: Withdrawals respect time constraints
- **Authorization**: Only authorized parties can call functions
- **Balance verification**: Ensures funds are available

## File Structure

```
examples/
├── README.md
├── IMPLEMENTATION_SUMMARY.md    # This document
├── evm-cosmos/                  # EVM-first example
│   ├── README.md
│   ├── shared_secret.js
│   ├── alice_evm_script.js
│   ├── bob_cosmos_script.py
│   ├── alice_cosmos_withdraw.py
│   ├── bob_evm_withdraw.js
│   └── deploy_and_test.sh
├── cosmos-evm/                  # Cosmos-first example
│   ├── README.md
│   ├── shared_secret.py
│   ├── alice_cosmos_script.py
│   ├── bob_evm_script.js
│   ├── alice_evm_withdraw.js
│   ├── bob_cosmos_withdraw.py
│   └── deploy_and_test.sh
├── evm-dogecoin/                # EVM-Dogecoin example
│   ├── README.md
│   ├── shared_secret.js
│   ├── alice_evm_script.js
│   ├── bob_dogecoin_script.py
│   ├── alice_dogecoin_withdraw.py
│   ├── bob_evm_withdraw.js
│   └── deploy_and_test.sh
└── dogecoin-evm/                # Dogecoin-EVM example
    ├── README.md
    ├── shared_secret.py
    ├── alice_dogecoin_script.py
    ├── bob_evm_script.js
    ├── alice_evm_withdraw.js
    ├── bob_dogecoin_withdraw.py
    └── deploy_and_test.sh
```

## Security Considerations

1. **Secret Management**: The secret must be shared securely between parties
2. **Timelock Coordination**: Both chains must use synchronized timelocks
3. **Network Reliability**: Ensure both chains are accessible during the process
4. **Gas Fees**: Account for transaction fees on both chains
5. **Testnet First**: Always test on testnets before mainnet deployment

## Troubleshooting

### Common Issues
- **Missing dependencies**: Install Node.js, Python, and required packages
- **Network connectivity**: Ensure access to both EVM and Cosmos networks
- **Secret mismatch**: Verify the secret is shared correctly between parties
- **Timelock issues**: Check that timelocks are synchronized

### Debugging
- Check transaction data files for detailed information
- Verify contract states on both chains
- Use the shared secret utilities to validate parameters

## Contributing

When adding new examples or modifying existing ones:
1. Follow the established pattern and file structure
2. Include comprehensive error handling
3. Add proper documentation and comments
4. Test thoroughly on testnets
5. Update this README with any new features

## License

This project is licensed under the MIT License. See the main project license for details. 