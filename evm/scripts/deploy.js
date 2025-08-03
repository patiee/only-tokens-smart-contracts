const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying HTCL contract...");

    // Get signers
    const [deployer, bob] = await ethers.getSigners();

    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

    // Generate a secret and its hash
    const secret = ethers.randomBytes(32);
    const hashlock = ethers.keccak256(secret);

    // Set timelock to 1 hour from now
    const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    // Amount to lock (1 ETH)
    const amount = ethers.parseEther("1.0");

    console.log("Contract parameters:");
    console.log("- Bob address:", bob.address);
    console.log("- Timelock:", new Date(timelock * 1000).toISOString());
    console.log("- Hashlock:", hashlock);
    console.log("- Amount:", ethers.formatEther(amount), "ETH");
    console.log("- Secret (for testing):", secret);

    // Deploy the contract
    const HTCL = await ethers.getContractFactory("HTCL");
    const htcl = await HTCL.connect(deployer).deploy(bob.address, timelock, hashlock, { value: amount });

    await htcl.waitForDeployment();
    const address = await htcl.getAddress();

    console.log("HTCL deployed to:", address);
    console.log("Contract balance:", ethers.formatEther(await htcl.getBalance()), "ETH");

    // Verify the deployment
    const contractInfo = await htcl.getContractInfo();
    console.log("\nContract verification:");
    console.log("- Alice:", contractInfo[0]);
    console.log("- Bob:", contractInfo[1]);
    console.log("- Timelock:", new Date(contractInfo[2] * 1000).toISOString());
    console.log("- Hashlock:", contractInfo[3]);
    console.log("- Original amount:", ethers.formatEther(contractInfo[4]), "ETH");
    console.log("- Current balance:", ethers.formatEther(contractInfo[5]), "ETH");

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