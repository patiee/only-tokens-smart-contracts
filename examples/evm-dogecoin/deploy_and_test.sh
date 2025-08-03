#!/bin/bash

# EVM-Dogecoin Cross-Chain HTCL Test Script
# This script demonstrates the complete flow of a cross-chain HTCL transaction

set -e

echo "🚀 Starting EVM-Dogecoin Cross-Chain HTCL Test"
echo "================================================"

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

# Check if Dogecoin HTCL modules are available
if [ ! -f "../dogecoin/htcl_script.py" ]; then
    print_error "Dogecoin HTCL modules not found"
    print_status "Please ensure dogecoin directory is available"
    exit 1
fi

print_success "Prerequisites check passed"

# Step 1: Alice creates HTCL on EVM
print_status "Step 1: Alice creating HTCL on EVM..."
cd ../evm

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing EVM dependencies..."
    npm install
fi

# Run Alice's EVM script
print_status "Running Alice's EVM script..."
npx hardhat run ../examples/evm-dogecoin/alice_evm_script.js --network localhost

if [ $? -eq 0 ]; then
    print_success "Alice successfully created HTCL on EVM"
else
    print_error "Failed to create HTCL on EVM"
    exit 1
fi

# Step 2: Bob creates HTCL on Dogecoin
print_status "Step 2: Bob creating HTCL on Dogecoin..."
cd ../examples/evm-dogecoin

# Check if evm_htcl_data.json exists
if [ ! -f "evm_htcl_data.json" ]; then
    print_error "evm_htcl_data.json not found"
    print_status "Copying from EVM directory..."
    cp ../evm/evm_htcl_data.json .
fi

# Run Bob's Dogecoin script
print_status "Running Bob's Dogecoin script..."
python3 bob_dogecoin_script.py

if [ $? -eq 0 ]; then
    print_success "Bob successfully created HTCL on Dogecoin"
else
    print_error "Failed to create HTCL on Dogecoin"
    exit 1
fi

# Step 3: Alice withdraws on Dogecoin
print_status "Step 3: Alice withdrawing from Dogecoin HTCL..."
print_status "Running Alice's Dogecoin withdrawal script..."
python3 alice_dogecoin_withdraw.py

if [ $? -eq 0 ]; then
    print_success "Alice successfully withdrew from Dogecoin HTCL"
else
    print_error "Failed to withdraw from Dogecoin HTCL"
    exit 1
fi

# Step 4: Bob withdraws on EVM
print_status "Step 4: Bob withdrawing from EVM HTCL..."
cd ../evm

# Copy updated data files
cp ../examples/evm-dogecoin/dogecoin_htcl_data.json .
cp ../examples/evm-dogecoin/evm_htcl_data.json .

# Run Bob's EVM withdrawal script
print_status "Running Bob's EVM withdrawal script..."
npx hardhat run ../examples/evm-dogecoin/bob_evm_withdraw.js --network localhost

if [ $? -eq 0 ]; then
    print_success "Bob successfully withdrew from EVM HTCL"
else
    print_error "Failed to withdraw from EVM HTCL"
    exit 1
fi

# Final verification
print_status "Final verification..."
cd ../examples/evm-dogecoin

if [ -f "evm_htcl_data.json" ] && [ -f "dogecoin_htcl_data.json" ]; then
    print_status "Checking transaction data..."
    
    # Check if both withdrawals were successful
    EVM_DATA=$(cat evm_htcl_data.json)
    DOGECOIN_DATA=$(cat dogecoin_htcl_data.json)
    
    if echo "$EVM_DATA" | grep -q '"bobWithdrawn": true' && \
       echo "$DOGECOIN_DATA" | grep -q '"aliceWithdrawn": true'; then
        print_success "✅ Cross-chain HTCL transaction completed successfully!"
        echo ""
        echo "📋 Transaction Summary:"
        echo "  1. ✅ Alice created HTCL on EVM"
        echo "  2. ✅ Bob created HTCL on Dogecoin"
        echo "  3. ✅ Alice withdrew from Dogecoin with secret"
        echo "  4. ✅ Bob withdrew from EVM with secret"
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
echo "  - evm_htcl_data.json: EVM transaction data"
echo "  - dogecoin_htcl_data.json: Dogecoin transaction data"
echo ""
echo "🔍 You can inspect the transaction data files for details" 