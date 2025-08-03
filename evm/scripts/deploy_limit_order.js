const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Limit Order Protocol...");

    // Get the contract factory
    const LimitOrderProtocol = await ethers.getContractFactory("LimitOrderProtocol");

    // Deploy the contract
    const limitOrderProtocol = await LimitOrderProtocol.deploy();

    // Wait for deployment
    await limitOrderProtocol.waitForDeployment();

    // Get the deployed address
    const address = await limitOrderProtocol.getAddress();

    console.log("✅ Limit Order Protocol deployed to:", address);
    console.log("📋 Contract Details:");
    console.log("   - Name: LimitOrderProtocol");
    console.log("   - Address:", address);
    console.log("   - Network:", (await ethers.provider.getNetwork()).name);

    // Save deployment info
    const deploymentInfo = {
        contractName: "LimitOrderProtocol",
        address: address,
        network: (await ethers.provider.getNetwork()).name,
        deployer: (await ethers.getSigners())[0].address,
        timestamp: new Date().toISOString()
    };

    // Write to file
    const fs = require('fs');
    fs.writeFileSync('deployment_limit_order.json', JSON.stringify(deploymentInfo, null, 2));

    console.log("💾 Deployment info saved to deployment_limit_order.json");

    return limitOrderProtocol;
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { main }; 