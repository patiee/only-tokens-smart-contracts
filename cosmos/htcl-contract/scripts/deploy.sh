#!/bin/bash

# HTCL Contract Deployment Script
# This script deploys the HTCL contract to a local or remote Cosmos chain

set -e

# Configuration
CHAIN_ID=${CHAIN_ID:-"localnet"}
NODE=${NODE:-"http://localhost:26657"}
KEY_NAME=${KEY_NAME:-"alice"}
GAS_PRICES=${GAS_PRICES:-"0.025stake"}
GAS_ADJUSTMENT=${GAS_ADJUSTMENT:-"1.3"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 HTCL Contract Deployment${NC}"
echo "=================================="
echo "Chain ID: $CHAIN_ID"
echo "Node: $NODE"
echo "Key: $KEY_NAME"
echo "Gas Prices: $GAS_PRICES"
echo ""

# Check if wasmd is installed
if ! command -v wasmd &> /dev/null; then
    echo -e "${RED}❌ wasmd not found. Please install wasmd first.${NC}"
    exit 1
fi

# Build the contract
echo -e "${YELLOW}📦 Building contract...${NC}"
cargo wasm

# Optimize the wasm
echo -e "${YELLOW}🔧 Optimizing wasm...${NC}"
wasmd tx wasm store target/wasm32-unknown-unknown/release/htcl_contract.wasm \
    --from $KEY_NAME \
    --gas-prices $GAS_PRICES \
    --gas-adjustment $GAS_ADJUSTMENT \
    --chain-id $CHAIN_ID \
    --node $NODE \
    --yes

echo -e "${GREEN}✅ Contract deployed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Get the contract address from the transaction"
echo "2. Instantiate the contract with parameters:"
echo "   - bob: recipient address"
echo "   - timelock: unix timestamp"
echo "   - hashlock: sha256 hash of secret"
echo ""
echo "Example instantiation:"
echo "wasmd tx wasm instantiate <CODE_ID> '{\"bob\":\"cosmos1...\",\"timelock\":1000000000,\"hashlock\":\"a665a459...\"}' \\"
echo "    --from $KEY_NAME --label \"HTCL Contract\" --gas-prices $GAS_PRICES --chain-id $CHAIN_ID --node $NODE" 