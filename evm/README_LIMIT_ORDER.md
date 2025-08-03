# Limit Order Protocol - Cross-Chain HTCL Order Management

## Overview

The **Limit Order Protocol** is a smart contract deployed on EVM chains that manages cross-chain Hash Time-Locked Contract (HTCL) orders. It enables secure cross-chain swaps between EVM, Cosmos, and Dogecoin networks by coordinating order creation and acceptance with deterministic secrets and universal hashlocks.

## 🎯 Key Features

### **Cross-Chain Support**
- **EVM Chains**: Ethereum, Polygon, BSC, etc.
- **Cosmos Chains**: Cosmos Hub, Osmosis, etc.
- **Dogecoin**: Native DOGE transactions

### **Deterministic Secret Generation**
- Uses HMAC-SHA256 for cross-chain compatible secrets
- Same wallet + same timestamp = same secret across all chains
- Universal hashlock format works on all chains

### **Order Management**
- Alice creates limit orders for cross-chain swaps
- Bob accepts orders and provides hashlock for coordination
- Automatic order state tracking and validation

## 📋 Contract Functions

### **1. createOrder**
Creates a new cross-chain limit order.

```solidity
function createOrder(
    string memory sourceChainId,      // "evm", "cosmos", "dogecoin"
    string memory destChainId,        // "evm", "cosmos", "dogecoin"
    string memory sourceWalletAddress, // Wallet address on source chain
    string memory destWalletAddress,   // Wallet address on destination chain
    string memory sourceToken,         // Token address (empty for Dogecoin)
    string memory destToken,           // Token address (empty for Dogecoin)
    uint256 sourceAmount,             // Amount on source chain
    uint256 destAmount,               // Amount on destination chain
    uint256 deadline                  // Order expiration timestamp
) external
```

### **2. acceptOrder**
Accepts an order and provides hashlock for HTCL coordination.

```solidity
function acceptOrder(
    uint256 orderId,    // ID of the order to accept
    bytes32 hashlock,   // Universal hashlock for cross-chain HTCL
    uint256 timelock    // Timelock for HTCL transactions
) external
```

### **3. cancelOrder**
Cancels an unaccepted order.

```solidity
function cancelOrder(
    uint256 orderId    // ID of the order to cancel
) external
```

## 🔄 Cross-Chain Flow

### **Step 1: Order Creation**
```
Alice → createOrder() → Order Created Event
```

### **Step 2: Order Acceptance**
```
Bob → acceptOrder(hashlock, timelock) → Order Accepted Event
```

### **Step 3: HTCL Execution (Off-Chain)**
```
Alice → Create HTCL on source chain with hashlock
Bob → Create HTCL on destination chain with same hashlock
Alice → Withdraw from destination HTCL with secret
Bob → Withdraw from source HTCL with same secret
```

## 🌐 Supported Chain Combinations

### **EVM ↔ Cosmos**
- **EVM → Cosmos**: ETH/ERC20 → ATOM/uATOM
- **Cosmos → EVM**: ATOM/uATOM → ETH/ERC20

### **EVM ↔ Dogecoin**
- **EVM → Dogecoin**: ETH/ERC20 → DOGE
- **Dogecoin → EVM**: DOGE → ETH/ERC20

### **Cosmos ↔ Dogecoin**
- **Cosmos → Dogecoin**: ATOM/uATOM → DOGE
- **Dogecoin → Cosmos**: DOGE → ATOM/uATOM

## 🔐 Security Features

### **Deterministic Secret Generation**
```javascript
// Same wallet + same timestamp = same secret across all chains
timestamp = round_to_hour(current_time)
message = f"HTCL_CROSS_CHAIN_SECRET_{timestamp}"
secret = HMAC_SHA256(private_key, message)
hashlock = SHA256(secret)  // Same hashlock everywhere!
```

### **Order State Validation**
- Orders must be accepted before HTCL creation
- Only order creator can cancel unaccepted orders
- HTCL completion happens off-chain on respective chains

### **Access Control**
- Only order creator can cancel unaccepted orders
- Only order acceptor can accept orders
- HTCL operations happen independently on each chain

## 📊 Events

### **OrderCreated**
```solidity
event OrderCreated(
    uint256 indexed orderId,
    string indexed sourceChainId,
    string indexed destChainId,
    string sourceWalletAddress,
    string destWalletAddress,
    string sourceToken,
    string destToken,
    uint256 sourceAmount,
    uint256 destAmount,
    uint256 deadline,
    address indexed creator
);
```

### **OrderAccepted**
```solidity
event OrderAccepted(
    uint256 indexed orderId,
    address indexed acceptor,
    bytes32 hashlock,
    uint256 timelock
);
```

### **OrderCancelled**
```solidity
event OrderCancelled(
    uint256 indexed orderId,
    address indexed creator
);
```

## 🚀 Deployment

### **Deploy Contract**
```bash
cd evm
npx hardhat run scripts/deploy_limit_order.js --network <network>
```

### **Run Tests**
```bash
cd evm
npx hardhat test test/LimitOrderProtocol.test.js
```

## 📝 Usage Examples

### **EVM to Cosmos Order**
```javascript
// Alice creates order
await limitOrderProtocol.createOrder(
    "evm", "cosmos",
    alice.address, "cosmos1bob",
    "0x1234567890123456789012345678901234567890", "uatom",
    ethers.parseEther("1.0"), ethers.parseEther("1000000"),
    Math.floor(Date.now() / 1000) + 3600
);

// Bob accepts order
const hashlock = ethers.keccak256(ethers.toUtf8Bytes("secret"));
const timelock = Math.floor(Date.now() / 1000) + 1800;
await limitOrderProtocol.acceptOrder(0, hashlock, timelock);

// HTCL execution happens off-chain on respective chains
```

### **Dogecoin to EVM Order**
```javascript
// Alice creates Dogecoin to EVM order
await limitOrderProtocol.createOrder(
    "dogecoin", "evm",
    "D8KvKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq", bob.address,
    "", "0x789", // Empty token for Dogecoin
    ethers.parseEther("1000000"), ethers.parseEther("1.0"),
    Math.floor(Date.now() / 1000) + 3600
);
```

## 🔧 Integration with HTCL Contracts

### **EVM HTCL Integration**
```javascript
// Deploy HTCL on EVM
const HTCL = await ethers.getContractFactory('HTCL');
const htcl = await HTCL.deploy(bob.address, timelock, hashlock, {
    value: ethers.parseEther("1.0")
});

// Withdraw with secret
await htcl.bobWithdraw(secret);
```

### **Cosmos HTCL Integration**
```python
# Create HTCL on Cosmos
instantiate_msg = InstantiateMsg(
    bob=bob_cosmos_address,
    timelock=timelock,
    hashlock=hashlock[2:]  # Remove 0x prefix
)

# Withdraw with secret
await htcl.bob_withdraw(secret)
```

### **Dogecoin HTCL Integration**
```python
# Create HTCL script on Dogecoin
script = HTCLScriptGenerator.create(
    alice_pubkey=alice_pubkey,
    bob_pubkey=bob_pubkey,
    timelock=timelock_block,
    hashlock=hashlock[2:]  # Remove 0x prefix
)

# Withdraw with secret
await htcl.withdraw_with_secret(secret)
```

## 🛡️ Security Considerations

1. **Deterministic Secrets**: Ensures same secret across all chains
2. **Order State Validation**: Prevents invalid state transitions
3. **Access Control**: Only authorized parties can perform actions
4. **Event Logging**: Complete audit trail of all operations
5. **Timelock Validation**: Ensures HTCL timelocks are in the future
6. **Off-Chain HTCL**: HTCL completion happens independently on each chain

## 🔍 Monitoring

### **Order Status Queries**
```javascript
// Check if ready for acceptance
const readyForAcceptance = await limitOrderProtocol.isReadyForAcceptance(orderId);

// Check if ready for HTCL creation
const readyForHTCL = await limitOrderProtocol.isReadyForHTCL(orderId);

// Get active orders
const activeOrders = await limitOrderProtocol.getActiveOrders();

// Get orders by creator
const creatorOrders = await limitOrderProtocol.getOrdersByCreator(alice.address);

// Get orders by acceptor
const acceptorOrders = await limitOrderProtocol.getOrdersByAcceptor(bob.address);
```

### **Order Information**
```javascript
// Get order details
const order = await limitOrderProtocol.getOrder(orderId);
```

## 📈 Benefits

1. **Cross-Chain Compatibility**: Works with EVM, Cosmos, and Dogecoin
2. **Deterministic Security**: Same secrets work across all chains
3. **Order Management**: Complete lifecycle tracking
4. **Event-Driven**: Rich event system for monitoring
5. **Access Control**: Secure permission system
6. **State Validation**: Prevents invalid operations
7. **Flexible Token Support**: Handles different token formats
8. **Simplified Design**: Focus on core order management
9. **Off-Chain HTCL**: HTCL operations happen independently

## 🔗 Integration Points

- **EVM HTCL Contract**: For EVM chain HTCL operations
- **Cosmos HTCL Contract**: For Cosmos chain HTCL operations  
- **Dogecoin HTCL Scripts**: For Dogecoin chain HTCL operations
- **Deterministic Secret Generation**: For cross-chain compatible secrets
- **Event Monitoring**: For order status tracking

## 🎯 Core Workflow

1. **Alice creates order** → Order is available for acceptance
2. **Bob accepts order** → Provides hashlock and timelock
3. **Both parties create HTCLs** → Using the same hashlock on respective chains
4. **Alice withdraws first** → From destination HTCL with secret
5. **Bob withdraws second** → From source HTCL with same secret
6. **HTCL completion** → Happens off-chain on respective chains

The **Limit Order Protocol** now has the cleanest possible design: it only manages order creation and acceptance, while HTCL operations happen independently on their respective chains! 🚀 