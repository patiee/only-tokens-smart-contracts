const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting deployment of all contracts...");

    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log(`📝 Deploying contracts with account: ${deployer.address}`);
    console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

    const deploymentData = {
        network: process.env.HARDHAT_NETWORK || "hardhat",
        deployer: deployer.address,
        contracts: {},
        timestamp: new Date().toISOString()
    };

    try {
        // 1. Deploy HTCL Contract
        console.log("\n📦 Deploying HTCL contract...");
        const HTCL = await ethers.getContractFactory("HTCL");
        const htcl = await HTCL.deploy();
        await htcl.waitForDeployment();
        const htclAddress = await htcl.getAddress();

        deploymentData.contracts.HTCL = {
            address: htclAddress,
            constructor: {
                description: "HTCL contract for cross-chain transactions",
                parameters: ["bob", "timelock", "hashlock"]
            }
        };

        console.log(`✅ HTCL deployed to: ${htclAddress}`);

        // 2. Deploy Limit Order Protocol
        console.log("\n📦 Deploying Limit Order Protocol contract...");
        const LimitOrderProtocol = await ethers.getContractFactory("LimitOrderProtocol");
        const limitOrderProtocol = await LimitOrderProtocol.deploy();
        await limitOrderProtocol.waitForDeployment();
        const limitOrderAddress = await limitOrderProtocol.getAddress();

        deploymentData.contracts.LimitOrderProtocol = {
            address: limitOrderAddress,
            constructor: {
                description: "Cross-chain HTCL order management protocol",
                parameters: []
            }
        };

        console.log(`✅ Limit Order Protocol deployed to: ${limitOrderAddress}`);

        // 3. Save deployment data
        const deploymentPath = path.join(__dirname, "..", "deployment.json");
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));

        console.log("\n🎉 All contracts deployed successfully!");
        console.log("\n📋 Deployment Summary:");
        console.log(`   Network: ${deploymentData.network}`);
        console.log(`   Deployer: ${deploymentData.deployer}`);
        console.log(`   HTCL: ${htclAddress}`);
        console.log(`   Limit Order Protocol: ${limitOrderAddress}`);
        console.log(`   Deployment data saved to: ${deploymentPath}`);

        // 4. Verify contracts (if on supported network)
        if (process.env.HARDHAT_NETWORK && process.env.HARDHAT_NETWORK !== "hardhat") {
            console.log("\n🔍 Verifying contracts on Etherscan...");
            try {
                await hre.run("verify:verify", {
                    address: htclAddress,
                    constructorArguments: [],
                });
                console.log("✅ HTCL contract verified");

                await hre.run("verify:verify", {
                    address: limitOrderAddress,
                    constructorArguments: [],
                });
                console.log("✅ Limit Order Protocol contract verified");
            } catch (error) {
                console.log("⚠️  Contract verification failed (this is normal for some networks):", error.message);
            }
        }

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 