#!/bin/bash

# HTCL Contract Deployment Script
# This script deploys the HTCL contract to a local or remote Cosmos chain

set -e

# Configuration
CHAIN_ID=${CHAIN_ID:-"osmo-test-5"}
NODE=${NODE:-"https://rpc.osmotest5.osmosis.zone:443"}
KEY_NAME=${KEY_NAME:-"eth-global-hackaton"}
KEYRING_BACKEND=${KEYRING_BACKEND="test"}
GAS_PRICES=${GAS_PRICES:-"0.025uosmo"}
GAS_ADJUSTMENT=${GAS_ADJUSTMENT:-"1.5"}

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
osmosisd tx wasm store artifacts/htcl.wasm \
    --from $KEY_NAME \
    --keyring-backend $KEYRING_BACKEND \
    --label "HTCL Contract" \
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