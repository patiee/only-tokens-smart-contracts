const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying contracts with MetaMask...");

    // Check if MetaMask is available
    if (typeof window !== 'undefined' && window.ethereum) {
        console.log("✅ MetaMask detected");
    } else {
        console.log("⚠️  MetaMask not detected - this script should be run in a browser environment");
        console.log("📋 Instructions for browser deployment:");
        console.log("1. Copy the contract artifacts from evm/artifacts/contracts/");
        console.log("2. Use the deployment code below in your browser console");
        return;
    }

    try {
        // Get contract artifacts
        const htclArtifact = require("../artifacts/contracts/HTCL.sol/HTCL.json");
        const limitOrderArtifact = require("../artifacts/contracts/LimitOrderProtocol.sol/LimitOrderProtocol.json");

        console.log("📦 Contract artifacts loaded successfully");

        // Create deployment data
        const deploymentData = {
            network: "sepolia", // or whatever network you're using
            deployer: "", // Will be filled by MetaMask
            contracts: {},
            timestamp: new Date().toISOString()
        };

        console.log("\n📋 Deployment Instructions:");
        console.log("1. Open your browser console on a page with MetaMask");
        console.log("2. Copy and paste the deployment code below");
        console.log("3. Connect your MetaMask wallet");
        console.log("4. Run the deployment");

        // Generate deployment code for browser
        const browserDeploymentCode = `
// MetaMask Deployment Code
// Copy this to your browser console

async function deployWithMetaMask() {
    try {
        // Check if MetaMask is available
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask not found! Please install MetaMask.');
        }
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const deployer = accounts[0];
        console.log('Deploying with account:', deployer);
        
        // Get provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Contract artifacts (copy from evm/artifacts/contracts/)
        const HTCL_ARTIFACT = ${JSON.stringify(htclArtifact)};
        const LIMIT_ORDER_ARTIFACT = ${JSON.stringify(limitOrderArtifact)};
        
        console.log('📦 Deploying HTCL contract...');
        
        // Deploy HTCL
        const HTCL = new ethers.ContractFactory(
            HTCL_ARTIFACT.abi,
            HTCL_ARTIFACT.bytecode,
            signer
        );
        
        const htcl = await HTCL.deploy();
        await htcl.deployed();
        console.log('✅ HTCL deployed to:', htcl.address);
        
        console.log('📦 Deploying Limit Order Protocol...');
        
        // Deploy Limit Order Protocol
        const LimitOrderProtocol = new ethers.ContractFactory(
            LIMIT_ORDER_ARTIFACT.abi,
            LIMIT_ORDER_ARTIFACT.bytecode,
            signer
        );
        
        const limitOrderProtocol = await LimitOrderProtocol.deploy();
        await limitOrderProtocol.deployed();
        console.log('✅ Limit Order Protocol deployed to:', limitOrderProtocol.address);
        
        // Save deployment info
        const deploymentInfo = {
            network: 'sepolia',
            deployer: deployer,
            contracts: {
                HTCL: {
                    address: htcl.address,
                    abi: HTCL_ARTIFACT.abi
                },
                LimitOrderProtocol: {
                    address: limitOrderProtocol.address,
                    abi: LIMIT_ORDER_ARTIFACT.abi
                }
            },
            timestamp: new Date().toISOString()
        };
        
        console.log('📋 Deployment Summary:');
        console.log('Network:', deploymentInfo.network);
        console.log('Deployer:', deploymentInfo.deployer);
        console.log('HTCL:', deploymentInfo.contracts.HTCL.address);
        console.log('Limit Order Protocol:', deploymentInfo.contracts.LimitOrderProtocol.address);
        
        // Copy to clipboard
        navigator.clipboard.writeText(JSON.stringify(deploymentInfo, null, 2));
        console.log('📋 Deployment info copied to clipboard!');
        
        return deploymentInfo;
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    }
}

// Run deployment
deployWithMetaMask().then(console.log).catch(console.error);
`;

        // Save deployment code to file
        const codePath = path.join(__dirname, "browser_deployment_code.js");
        fs.writeFileSync(codePath, browserDeploymentCode);
        console.log(`💾 Browser deployment code saved to: ${codePath}`);

        console.log("\n📝 To deploy:");
        console.log("1. Open browser console on any page with MetaMask");
        console.log("2. Copy the code from the file above");
        console.log("3. Paste and run in console");
        console.log("4. Approve the MetaMask transactions");

    } catch (error) {
        console.error("❌ Error preparing deployment:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 