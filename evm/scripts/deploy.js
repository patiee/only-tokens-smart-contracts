const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying HTCL contract...");

    // Get signers
    const [deployer, bob] = await ethers.getSigners();

    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

    // Deploy the contract without any value
    const HTCL = await ethers.getContractFactory("HTCL");
    const htcl = await HTCL.deploy();
    await htcl.waitForDeployment();
    const address = await htcl.getAddress();

    console.log("HTCL deployed to:", address);

    // Generate a secret and its hash for testing
    const secret = ethers.randomBytes(32);
    const hashlock = ethers.keccak256(secret);

    // Set timelock to 1 hour from now
    const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    console.log("\nTest parameters for creating HTCL:");
    console.log("- Bob address:", bob.address);
    console.log("- Timelock:", new Date(timelock * 1000).toISOString());
    console.log("- Hashlock:", hashlock);
    console.log("- Secret (for testing):", secret);

    console.log("\nTo create an HTCL with funds:");
    console.log(`await htcl.connect(deployer).deploy(bob.address, ${timelock}, "${hashlock}", { value: ethers.parseEther("1.0") })`);

    console.log("\nTo test Bob's withdrawal (before timelock):");
    console.log(`await htcl.connect(bob).bobWithdraw("${secret}")`);

    console.log("\nTo test Alice's withdrawal (after timelock):");
    console.log("// Wait for timelock to expire, then:");
    console.log("await htcl.connect(deployer).aliceWithdraw()");

    return htcl;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 