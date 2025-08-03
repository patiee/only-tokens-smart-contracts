#!/bin/bash

# Cosmos-EVM Cross-Chain HTCL Test Script
# This script demonstrates the complete flow of a cross-chain HTCL transaction

set -e

echo "🚀 Starting Cosmos-EVM Cross-Chain HTCL Test"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed"
    exit 1
fi

# Check if Hardhat is available
if [ ! -f "../evm/hardhat.config.js" ]; then
    print_error "Hardhat configuration not found"
    print_status "Please ensure you're in the correct directory"
    exit 1
fi

# Check if Cosmos HTCL modules are available
if [ ! -f "../cosmos/htcl-contract/src/msg.rs" ]; then
    print_error "Cosmos HTCL modules not found"
    print_status "Please ensure cosmos directory is available"
    exit 1
fi

print_success "Prerequisites check passed"

# Step 1: Alice creates HTCL on Cosmos (source network) for Bob
print_status "Step 1: Alice creating HTCL on Cosmos (source network) for Bob..."
print_status "Running Alice's Cosmos script..."
python3 alice_cosmos_script.py

if [ $? -eq 0 ]; then
    print_success "Alice successfully created HTCL on Cosmos for Bob"
else
    print_error "Failed to create HTCL on Cosmos"
    exit 1
fi

# Step 2: Bob creates HTCL on EVM (destiny network - Polygon Amoy) for Alice
print_status "Step 2: Bob creating HTCL on EVM (destiny network) for Alice..."
cd ../evm

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing EVM dependencies..."
    npm install
fi

# Copy cosmos data to EVM directory
cp ../examples/cosmos-evm/cosmos_htcl_data.json .

# Run Bob's EVM script
print_status "Running Bob's EVM script..."
npx hardhat run ../examples/cosmos-evm/bob_evm_script.js --network localhost

if [ $? -eq 0 ]; then
    print_success "Bob successfully created HTCL on EVM (destiny network) for Alice"
else
    print_error "Failed to create HTCL on EVM"
    exit 1
fi

# Step 3: Alice withdraws on EVM (destiny network)
print_status "Step 3: Alice withdrawing from EVM (destiny network)..."
print_status "Running Alice's EVM withdrawal script..."
npx hardhat run ../examples/cosmos-evm/alice_evm_withdraw.js --network localhost

if [ $? -eq 0 ]; then
    print_success "Alice successfully withdrew from EVM (destiny network)"
else
    print_error "Failed to withdraw from EVM"
    exit 1
fi

# Step 4: Bob withdraws on Cosmos (source network)
print_status "Step 4: Bob withdrawing from Cosmos (source network)..."
cd ../examples/cosmos-evm

# Copy updated data files
cp ../evm/evm_htcl_data.json .

# Run Bob's Cosmos withdrawal script
print_status "Running Bob's Cosmos withdrawal script..."
python3 bob_cosmos_withdraw.py

if [ $? -eq 0 ]; then
    print_success "Bob successfully withdrew from Cosmos (source network)"
else
    print_error "Failed to withdraw from Cosmos"
    exit 1
fi

# Final verification
print_status "Final verification..."

if [ -f "evm_htcl_data.json" ] && [ -f "cosmos_htcl_data.json" ]; then
    print_status "Checking transaction data..."
    
    # Check if both withdrawals were successful
    EVM_DATA=$(cat evm_htcl_data.json)
    COSMOS_DATA=$(cat cosmos_htcl_data.json)
    
    if echo "$EVM_DATA" | grep -q '"aliceWithdrawn": true' && \
       echo "$COSMOS_DATA" | grep -q '"bobWithdrawn": true'; then
        print_success "✅ Cross-chain HTCL transaction completed successfully!"
        echo ""
        echo "📋 Transaction Summary:"
        echo "  1. ✅ Alice created HTCL on Cosmos (source) for Bob"
        echo "  2. ✅ Bob created HTCL on EVM (destiny) for Alice"
        echo "  3. ✅ Alice withdrew from EVM (destiny) with secret"
        echo "  4. ✅ Bob withdrew from Cosmos (source) with secret"
        echo ""
        echo "🎉 All steps completed successfully!"
    else
        print_error "❌ Transaction verification failed"
        exit 1
    fi
else
    print_error "❌ Transaction data files not found"
    exit 1
fi

echo ""
print_success "Cross-chain HTCL test completed successfully!"
echo ""
echo "📁 Generated files:"
echo "  - cosmos_htcl_data.json: Cosmos transaction data (source network)"
echo "  - evm_htcl_data.json: EVM transaction data (destiny network)"
echo ""
echo "🔍 You can inspect the transaction data files for details" 