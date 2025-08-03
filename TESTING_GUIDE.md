# 🧪 HTCL Cross-Chain Testing Guide

This guide provides comprehensive testing instructions for all HTCL cross-chain functionality, including contract deployment, unit tests, and cross-chain flow tests.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Individual Test Scripts](#individual-test-scripts)
3. [Contract Deployment](#contract-deployment)
4. [Cross-Chain Flow Tests](#cross-chain-flow-tests)
5. [Limit Order Protocol Tests](#limit-order-protocol-tests)
6. [Test Data Files](#test-data-files)
7. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Run All Tests
```bash
# From project root directory
./test_all.sh
```

This will run all tests including:
- Contract deployment
- Unit tests
- Cross-chain flow tests
- Limit Order Protocol tests
- Shared secret generation tests

### Prerequisites
```bash
# Install Node.js dependencies
cd evm && npm install

# Install Python dependencies (for Cosmos/Dogecoin examples)
cd examples/cosmos-evm && pip install -r requirements.txt
cd examples/dogecoin-evm && pip install -r requirements.txt
```

## 🔧 Individual Test Scripts

### 1. Contract Deployment
```bash
# Deploy all contracts
cd evm
npx hardhat run scripts/deploy_all.js

# Deploy to specific network
npx hardhat run scripts/deploy_all.js --network polygon-amoy
```

### 2. Unit Tests
```bash
# Run HTCL contract tests
cd evm
npx hardhat test test/HTCL.test.js

# Run Limit Order Protocol tests
npx hardhat test test/LimitOrderProtocol.test.js

# Run all tests
npx hardhat test
```

### 3. Cross-Chain Flow Tests

#### EVM-Cosmos Flow
```bash
cd examples/evm-cosmos
node test_flow.js
```

#### Cosmos-EVM Flow
```bash
cd examples/cosmos-evm
python3 test_flow.py
```

#### EVM-Dogecoin Flow
```bash
cd examples/evm-dogecoin
node test_flow.js
```

#### Dogecoin-EVM Flow
```bash
cd examples/dogecoin-evm
python3 test_flow.py
```

### 4. Limit Order Protocol Flow
```bash
cd evm
npx hardhat run test_limit_order_flow.js
```

### 5. Shared Secret Generation Tests
```bash
# JavaScript version
cd examples/evm-cosmos
node shared_secret.js

# Python version
cd examples/cosmos-evm
python3 shared_secret.py
```

## 📦 Contract Deployment

### Deployment Scripts

#### `evm/scripts/deploy_all.js`
Deploys all contracts and saves deployment information.

**Features:**
- Deploys HTCL contract
- Deploys Limit Order Protocol contract
- Saves deployment data to `evm/deployment.json`
- Verifies contracts on Etherscan (if supported network)

**Usage:**
```bash
cd evm
npx hardhat run scripts/deploy_all.js
```

**Output:**
```json
{
  "network": "hardhat",
  "deployer": "0x...",
  "contracts": {
    "HTCL": {
      "address": "0x...",
      "constructor": {
        "description": "HTCL contract for cross-chain transactions",
        "parameters": ["bob", "timelock", "hashlock"]
      }
    },
    "LimitOrderProtocol": {
      "address": "0x...",
      "constructor": {
        "description": "Cross-chain HTCL order management protocol",
        "parameters": []
      }
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔄 Cross-Chain Flow Tests

### Test Flow Structure

Each cross-chain test follows this structure:

1. **Generate Deterministic Secret**
   - Uses HMAC-SHA256 with wallet private key
   - Same secret across all chains
   - Universal hashlock format

2. **Create HTCL on Source Chain**
   - Alice creates HTCL with hashlock
   - Bob creates HTCL on destination chain
   - Same hashlock coordinates both chains

3. **Withdraw with Secret**
   - Alice withdraws from destination HTCL
   - Bob withdraws from source HTCL
   - Same secret unlocks both chains

### Test Data Files

Each test generates a `transaction_data.json` file with:

```json
{
  "evm": {
    "htclAddress": "0x...",
    "creator": "0x...",
    "recipient": "0x...",
    "timelock": 1234567890,
    "hashlock": "0x...",
    "amount": "1.0",
    "balance": "1.0"
  },
  "cosmos": {
    "contractAddress": "cosmos1...",
    "creator": "cosmos1...",
    "recipient": "cosmos1...",
    "timelock": 1234567890,
    "hashlock": "...",
    "amount": "1000000"
  },
  "secret": "0x...",
  "hashlock": "0x...",
  "message": "HTCL_CROSS_CHAIN_SECRET_1234567890",
  "timestamp": 1234567890,
  "method": "deterministic_hmac"
}
```

## 🎯 Limit Order Protocol Tests

### Test Features

1. **Order Creation**
   - Alice creates cross-chain orders
   - Supports EVM, Cosmos, Dogecoin chains
   - Flexible token support

2. **Order Acceptance**
   - Bob accepts orders with hashlock
   - Provides timelock for HTCL coordination
   - Validates order state

3. **Helper Functions**
   - Check order readiness
   - Get active orders
   - Get orders by creator/acceptor

4. **Cross-Chain Scenarios**
   - EVM ↔ Cosmos
   - EVM ↔ Dogecoin
   - Cosmos ↔ EVM
   - Dogecoin ↔ EVM

### Test Data

Generated `evm/limit_order_test_data.json`:

```json
{
  "limitOrderAddress": "0x...",
  "orderId": 0,
  "secret": "0x...",
  "hashlock": "0x...",
  "message": "HTCL_CROSS_CHAIN_SECRET_1234567890",
  "timestamp": 1234567890,
  "orderParams": {
    "sourceChainId": "evm",
    "destChainId": "cosmos",
    "sourceWalletAddress": "0x...",
    "destWalletAddress": "cosmos1...",
    "sourceToken": "0x...",
    "destToken": "uatom",
    "sourceAmount": "1000000000000000000",
    "destAmount": "1000000000000000000",
    "deadline": 1234567890
  },
  "timelock": 1234567890,
  "activeOrders": ["0", "1", "2"],
  "aliceOrders": ["0", "1"],
  "bobOrders": ["0"]
}
```

## 📁 Test Data Files

### Generated Files

1. **`evm/deployment.json`**
   - Contract deployment information
   - Network and deployer details
   - Contract addresses and metadata

2. **`examples/*/transaction_data.json`**
   - Cross-chain transaction data
   - Secret and hashlock information
   - Chain-specific contract details

3. **`evm/limit_order_test_data.json`**
   - Limit Order Protocol test data
   - Order creation and acceptance details
   - Helper function results

### File Locations

```
htcl/
├── evm/
│   ├── deployment.json
│   └── limit_order_test_data.json
├── examples/
│   ├── evm-cosmos/
│   │   └── transaction_data.json
│   ├── cosmos-evm/
│   │   └── transaction_data.json
│   ├── evm-dogecoin/
│   │   └── transaction_data.json
│   └── dogecoin-evm/
│       └── transaction_data.json
└── test_all.sh
```

## 🔍 Verification Steps

### 1. Contract Verification

```bash
# Check if contracts compiled successfully
cd evm
npx hardhat compile

# Verify deployment
cat deployment.json | jq '.'
```

### 2. Test Data Verification

```bash
# Check all test data files exist
ls -la examples/*/transaction_data.json
ls -la evm/limit_order_test_data.json
ls -la evm/deployment.json
```

### 3. Cross-Chain Compatibility

```bash
# Verify same hashlock across chains
cd examples/evm-cosmos
node -e "console.log(require('./transaction_data.json').hashlock)"

cd examples/cosmos-evm
python3 -c "import json; print(json.load(open('transaction_data.json'))['hashlock'])"
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Node.js Dependencies
```bash
# Error: Cannot find module 'ethers'
cd evm && npm install

# Error: Cannot find module 'hardhat'
npm install --save-dev hardhat
```

#### 2. Python Dependencies
```bash
# Error: No module named 'eth_account'
cd examples/cosmos-evm
pip install -r requirements.txt

# Error: No module named 'hdwallet'
pip install hdwallet
```

#### 3. Contract Compilation
```bash
# Error: Compilation failed
cd evm
npx hardhat clean
npx hardhat compile
```

#### 4. Test Failures
```bash
# Check Hardhat network
npx hardhat node

# Run tests with verbose output
npx hardhat test --verbose
```

### Debug Commands

#### Check Contract State
```bash
cd evm
npx hardhat console
> const HTCL = await ethers.getContractFactory("HTCL")
> const htcl = await HTCL.deploy()
> await htcl.getContractInfo()
```

#### Check Test Data
```bash
# View transaction data
cat examples/evm-cosmos/transaction_data.json | jq '.'

# Check deployment info
cat evm/deployment.json | jq '.'
```

#### Verify Secret Generation
```bash
# JavaScript
cd examples/evm-cosmos
node -e "
const crypto = require('crypto');
const { ethers } = require('ethers');
const wallet = new ethers.Wallet('0x...');
const timestamp = Math.floor(Date.now() / 3600000) * 3600000;
const message = \`HTCL_CROSS_CHAIN_SECRET_\${timestamp}\`;
const hmac = crypto.createHmac('sha256', wallet.privateKey);
hmac.update(message);
const secretBytes = hmac.digest();
const secretHex = '0x' + secretBytes.toString('hex');
const hashlock = ethers.keccak256(secretBytes);
console.log('Secret:', secretHex);
console.log('Hashlock:', '0x' + hashlock.slice(2));
"

# Python
cd examples/cosmos-evm
python3 -c "
import hmac
import hashlib
import time
from eth_account import Account
account = Account.from_key('0x...')
timestamp = int(time.time() / 3600) * 3600
message = f'HTCL_CROSS_CHAIN_SECRET_{timestamp}'
secret_bytes = hmac.new(
    account.key.encode(),
    message.encode(),
    hashlib.sha256
).digest()
secret_hex = '0x' + secret_bytes.hex()
hashlock = hashlib.sha256(secret_bytes).hexdigest()
print(f'Secret: {secret_hex}')
print(f'Hashlock: 0x{hashlock}')
"
```

## 🎯 Test Coverage

### ✅ Verified Features

1. **Contract Deployment**
   - HTCL contract deployment
   - Limit Order Protocol deployment
   - Deployment data persistence

2. **Unit Tests**
   - HTCL contract functionality
   - Limit Order Protocol functionality
   - Event emission
   - Access control

3. **Cross-Chain Flows**
   - EVM ↔ Cosmos
   - EVM ↔ Dogecoin
   - Deterministic secret generation
   - Universal hashlock coordination

4. **Order Management**
   - Order creation
   - Order acceptance
   - Order cancellation
   - Helper functions

5. **Security Features**
   - Deterministic secrets
   - Cross-chain compatibility
   - Access control
   - State validation

### 📊 Test Results

When all tests pass, you should see:

```
🎉 Test Suite Summary
============================================================
[SUCCESS] All tests completed successfully!

📋 Test Results:
   ✅ Contract deployment
   ✅ Unit tests
   ✅ EVM-Cosmos cross-chain flow
   ✅ Cosmos-EVM cross-chain flow
   ✅ EVM-Dogecoin cross-chain flow
   ✅ Dogecoin-EVM cross-chain flow
   ✅ Limit Order Protocol flow
   ✅ Shared secret generation
   ✅ Contract compilation

🔧 Key Features Verified:
   ✅ Deterministic secret generation
   ✅ Universal hashlock coordination
   ✅ Cross-chain compatibility
   ✅ Order management
   ✅ HTCL operations
   ✅ Event logging
   ✅ Access control
```

## 🚀 Next Steps

After successful testing:

1. **Deploy to Testnet**
   ```bash
   cd evm
   npx hardhat run scripts/deploy_all.js --network polygon-amoy
   ```

2. **Test with Real Transactions**
   - Use real wallet addresses
   - Test with actual cross-chain transactions
   - Verify HTCL operations on each chain

3. **Deploy to Mainnet**
   - When ready for production
   - Ensure all security measures are in place
   - Monitor contract interactions

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all dependencies are installed
3. Ensure you're in the correct directory
4. Check the generated test data files
5. Review the contract deployment information

The comprehensive test suite ensures all HTCL cross-chain functionality works correctly across EVM, Cosmos, and Dogecoin networks! 🎉 