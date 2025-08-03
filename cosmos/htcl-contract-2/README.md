# HTCL - Hash Time-Locked Contract (CosmWasm)

A CosmWasm smart contract implementation of a Hash Time-Locked Contract (HTCL) that enables secure conditional payments with time-based and hash-based constraints, supporting both native tokens and CW20 tokens.

## Overview

The HTCL contract implements a two-party escrow system where:

- **Alice** (creator) can withdraw funds only **after** the timelock expires
- **Bob** (recipient) can withdraw funds only **before** the timelock expires by providing the correct secret

This creates a secure mechanism for conditional payments where Bob must reveal a secret to claim the funds before time runs out.

## Features

### Core Functionality
- **Hash-based security**: Bob must provide a secret that hashes to the pre-defined hashlock
- **Time-based constraints**: Alice can only withdraw after the timelock expires
- **Multi-token support**: Supports both native tokens and CW20 tokens
- **Exclusive withdrawal**: Only one party can withdraw the funds
- **Immutable parameters**: All contract parameters are set at instantiation and cannot be changed

### Security Features
- **Access control**: Only Alice can call `alice_withdraw`, only Bob can call `bob_withdraw`
- **Time validation**: Bob cannot withdraw after timelock, Alice cannot withdraw before timelock
- **Secret validation**: Bob must provide the correct secret that hashes to the hashlock
- **Fund protection**: Prevents double-spending and unauthorized withdrawals

## Contract Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `alice` | `String` | The contract creator who can withdraw after timelock |
| `bob` | `String` | The recipient who can withdraw before timelock with secret |
| `timelock` | `u64` | Unix timestamp when the timelock expires |
| `hashlock` | `String` | SHA256 hash of the secret that Bob must provide |

## Messages

### InstantiateMsg
```rust
pub struct InstantiateMsg {
    pub bob: String,
    pub timelock: u64,
    pub hashlock: String,
}
```

### ExecuteMsg
```rust
pub enum ExecuteMsg {
    // Bob can withdraw before timelock with correct secret
    BobWithdraw {
        secret: String,
    },
    // Alice can withdraw after timelock expires
    AliceWithdraw {},
    // Receive cw20 tokens
    Receive(Cw20ReceiveMsg),
}
```

### QueryMsg
```rust
pub enum QueryMsg {
    GetConfig {},
    GetBalance {},
    IsTimelockExpired {},
    IsValidSecret { secret: String },
    GetContractInfo {},
}
```

## Usage Examples

### Deployment

```bash
# Build the contract
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.16.0

# Deploy to local wasmd
wasmd tx wasm store target/wasm32-unknown-unknown/release/htcl_contract.wasm \
    --from alice --gas-prices 0.025stake --chain-id localnet --yes
```

### Instantiation

```bash
# Generate secret and hashlock
SECRET="my_secret_123"
HASHLOCK=$(echo -n "$SECRET" | sha256sum | cut -d' ' -f1)

# Instantiate contract
wasmd tx wasm instantiate <CODE_ID> "{
  \"bob\": \"cosmos1bob_address_here\",
  \"timelock\": 1000000000,
  \"hashlock\": \"$HASHLOCK\"
}" --from alice --label "HTCL Contract" --gas-prices 0.025stake --chain-id localnet
```

### Bob's Withdrawal (Before Timelock)

```bash
# Bob withdraws with the correct secret
wasmd tx wasm execute <CONTRACT_ADDRESS> "{
  \"bob_withdraw\": {
    \"secret\": \"my_secret_123\"
  }
}" --from bob --gas-prices 0.025stake --chain-id localnet
```

### Alice's Withdrawal (After Timelock)

```bash
# Alice withdraws after timelock expires
wasmd tx wasm execute <CONTRACT_ADDRESS> "{
  \"alice_withdraw\": {}
}" --from alice --gas-prices 0.025stake --chain-id localnet
```

### Sending CW20 Tokens

```bash
# Send CW20 tokens to the contract
wasmd tx wasm execute <CW20_TOKEN_ADDRESS> "{
  \"send\": {
    \"contract\": \"<HTCL_CONTRACT_ADDRESS>\",
    \"amount\": \"1000000\",
    \"msg\": \"{}\"
  }
}" --from alice --gas-prices 0.025stake --chain-id localnet
```

## Workflow Scenarios

### Scenario 1: Bob Claims Funds
1. Alice instantiates the contract with funds, Bob's address, timelock, and hashlock
2. Bob provides the correct secret before the timelock expires
3. Bob receives all funds (native + CW20)
4. Alice cannot withdraw (no funds remaining)

### Scenario 2: Alice Claims Funds
1. Alice instantiates the contract with funds, Bob's address, timelock, and hashlock
2. Bob does not provide the secret before timelock expires
3. Alice withdraws all funds after timelock expires
4. Bob cannot withdraw (timelock expired)

## Token Support

### Native Tokens
- Supports all native tokens on the Cosmos chain
- Tokens are sent to the contract address during instantiation
- Withdrawal transfers all native tokens to the recipient

### CW20 Tokens
- Supports any CW20-compliant token
- Tokens are sent to the contract using the `send` message
- Contract stores CW20 balances separately from native tokens
- Withdrawal transfers all CW20 tokens to the recipient

## Security Considerations

1. **Secret Management**: The secret should be securely shared between parties
2. **Timelock Duration**: Choose appropriate timelock duration based on use case
3. **Gas Costs**: Consider gas costs for deployment and withdrawals
4. **Network Congestion**: Account for potential network delays
5. **Secret Collision**: Ensure unique secrets to prevent conflicts
6. **Token Validation**: Verify CW20 token addresses before sending

## Testing

Run the comprehensive test suite:

```bash
cargo test
```

The tests cover:
- Contract instantiation and parameter validation
- Bob's withdrawal scenarios (valid/invalid secret, timing)
- Alice's withdrawal scenarios (before/after timelock)
- Access control and security measures
- CW20 token integration
- Complete workflow testing

## Development

### Prerequisites
- Rust 1.70+
- wasmd (for deployment)
- CosmWasm dependencies

### Build
```bash
cargo build
cargo wasm
```

### Test
```bash
cargo test
```

### Deploy
```bash
./scripts/deploy.sh
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