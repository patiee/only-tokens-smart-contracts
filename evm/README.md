# HTCL - Hash Time-Locked Contract

A Solidity smart contract implementation of a Hash Time-Locked Contract (HTCL) that enables secure conditional payments with time-based and hash-based constraints.

## Overview

The HTCL contract implements a two-party escrow system where:

- **Alice** (creator) can withdraw funds only **after** the timelock expires
- **Bob** (recipient) can withdraw funds only **before** the timelock expires by providing the correct secret

This creates a secure mechanism for conditional payments where Bob must reveal a secret to claim the funds before time runs out.

## Contract Features

### Core Functionality
- **Hash-based security**: Bob must provide a secret that hashes to the pre-defined hashlock
- **Time-based constraints**: Alice can only withdraw after the timelock expires
- **Exclusive withdrawal**: Only one party can withdraw the funds
- **Immutable parameters**: All contract parameters are set at deployment and cannot be changed

### Security Features
- **Access control**: Only Alice can call `aliceWithdraw()`, only Bob can call `bobWithdraw()`
- **Time validation**: Bob cannot withdraw after timelock, Alice cannot withdraw before timelock
- **Secret validation**: Bob must provide the correct secret that hashes to the hashlock
- **Fund protection**: Prevents double-spending and unauthorized withdrawals

## Contract Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `alice` | `address` | The contract creator who can withdraw after timelock |
| `bob` | `address` | The recipient who can withdraw before timelock with secret |
| `timelock` | `uint256` | Unix timestamp when the timelock expires |
| `hashlock` | `bytes32` | Hash of the secret that Bob must provide |
| `amount` | `uint256` | Original amount deposited in the contract |

## Functions

### Core Functions

#### `constructor(address _bob, uint256 _timelock, bytes32 _hashlock)`
Deploys the contract with the specified parameters and locks the initial funds.

#### `aliceWithdraw()`
Allows Alice to withdraw all funds after the timelock has expired.

#### `bobWithdraw(bytes32 secret)`
Allows Bob to withdraw all funds before the timelock expires by providing the correct secret.

### Utility Functions

#### `getBalance()`
Returns the current balance of the contract.

#### `isTimelockExpired()`
Returns `true` if the timelock has expired, `false` otherwise.

#### `isValidSecret(bytes32 secret)`
Returns `true` if the provided secret hashes to the hashlock, `false` otherwise.

#### `getContractInfo()`
Returns all contract information including addresses, timelock, hashlock, and balances.

## Events

- `HTCLCreated`: Emitted when the contract is deployed
- `AliceWithdrawn`: Emitted when Alice successfully withdraws funds
- `BobWithdrawn`: Emitted when Bob successfully withdraws funds
- `HTCLExpired`: Emitted when the contract expires (if implemented)

## Usage Examples

### Deployment

```javascript
const { ethers } = require("hardhat");

// Generate secret and hashlock
const secret = ethers.randomBytes(32);
const hashlock = ethers.keccak256(secret);

// Set timelock to 1 hour from now
const timelock = Math.floor(Date.now() / 1000) + 3600;

// Deploy contract
const HTCL = await ethers.getContractFactory("HTCL");
const htcl = await HTCL.connect(alice).deploy(bob.address, timelock, hashlock, { 
  value: ethers.parseEther("1.0") 
});
```

### Bob's Withdrawal (Before Timelock)

```javascript
// Bob withdraws with the correct secret
await htcl.connect(bob).bobWithdraw(secret);
```

### Alice's Withdrawal (After Timelock)

```javascript
// Wait for timelock to expire
await ethers.provider.send("evm_increaseTime", [3601]);
await ethers.provider.send("evm_mine");

// Alice withdraws after timelock expires
await htcl.connect(alice).aliceWithdraw();
```

## Workflow Scenarios

### Scenario 1: Bob Claims Funds
1. Alice deploys the contract with funds, Bob's address, timelock, and hashlock
2. Bob provides the correct secret before the timelock expires
3. Bob receives all funds
4. Alice cannot withdraw (no funds remaining)

### Scenario 2: Alice Claims Funds
1. Alice deploys the contract with funds, Bob's address, timelock, and hashlock
2. Bob does not provide the secret before timelock expires
3. Alice withdraws all funds after timelock expires
4. Bob cannot withdraw (timelock expired)

## Security Considerations

1. **Secret Management**: The secret should be securely shared between parties
2. **Timelock Duration**: Choose appropriate timelock duration based on use case
3. **Gas Costs**: Consider gas costs for deployment and withdrawals
4. **Network Congestion**: Account for potential network delays
5. **Secret Collision**: Ensure unique secrets to prevent conflicts

## Testing

Run the comprehensive test suite:

```bash
npm test
```

The tests cover:
- Contract deployment and parameter validation
- Bob's withdrawal scenarios (valid/invalid secret, timing)
- Alice's withdrawal scenarios (before/after timelock)
- Access control and security measures
- Complete workflow testing

## Deployment

Deploy to a local network:

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network amoy
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Disclaimer

This contract is provided for educational and development purposes. Use in production at your own risk and ensure proper security audits. 