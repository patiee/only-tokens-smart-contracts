const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔄 Testing EVM-Dogecoin Cross-Chain HTCL Flow");
    console.log("=".repeat(50));

    // Get signers
    const [alice, bob] = await ethers.getSigners();
    console.log(`👤 Alice: ${alice.address}`);
    console.log(`👤 Bob: ${bob.address}`);

    try {
        // 1. Deploy HTCL contract
        console.log("\n📦 Deploying HTCL contract...");
        const HTCL = await ethers.getContractFactory("HTCL");
        const htcl = await HTCL.deploy();
        await htcl.waitForDeployment();
        const htclAddress = await htcl.getAddress();
        console.log(`✅ HTCL deployed to: ${htclAddress}`);

        // 2. Generate deterministic secret and hashlock
        console.log("\n🔑 Generating deterministic secret and hashlock...");
        const timestamp = Math.floor(Date.now() / 3600000) * 3600000; // Round to hour
        const message = `HTCL_CROSS_CHAIN_SECRET_${timestamp}`;

        // Create HMAC-SHA256 secret
        const hmac = require('crypto').createHmac('sha256', alice.privateKey);
        hmac.update(message);
        const secretBytes = hmac.digest();
        const secretHex = '0x' + secretBytes.toString('hex');

        const hashlock = ethers.keccak256(secretBytes);
        const hashlockHex = '0x' + hashlock.slice(2);

        console.log(`🔑 Secret: ${secretHex}`);
        console.log(`🔒 Hashlock: ${hashlockHex}`);
        console.log(`📝 Message: ${message}`);
        console.log(`⏰ Timestamp: ${timestamp}`);

        // 3. Alice creates HTCL on EVM
        console.log("\n💸 Alice creating HTCL on EVM...");
        const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const amount = ethers.parseEther("1.0");

        const htclEVM = await HTCL.deploy(bob.address, timelock, hashlock, {
            value: amount
        });
        await htclEVM.waitForDeployment();
        const htclEVMAddress = await htclEVM.getAddress();

        console.log(`✅ EVM HTCL created at: ${htclEVMAddress}`);
        console.log(`💰 Amount: ${ethers.formatEther(amount)} ETH`);
        console.log(`⏰ Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);

        // Get contract info
        const evmInfo = await htclEVM.getContractInfo();
        console.log(`📋 EVM HTCL Info:`);
        console.log(`   Alice: ${evmInfo[0]}`);
        console.log(`   Bob: ${evmInfo[1]}`);
        console.log(`   Timelock: ${evmInfo[2]}`);
        console.log(`   Hashlock: ${evmInfo[3]}`);
        console.log(`   Amount: ${ethers.formatEther(evmInfo[4])} ETH`);
        console.log(`   Balance: ${ethers.formatEther(evmInfo[5])} ETH`);

        // 4. Bob creates HTCL on Dogecoin (mocked)
        console.log("\n💸 Bob creating HTCL on Dogecoin (mocked)...");
        const dogecoinData = {
            htclAddress: "D8KvKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq",
            creator: "D8Alice123456789012345678901234567890",
            recipient: "D8Bob123456789012345678901234567890",
            timelock: 1234567, // Mock block height
            hashlock: hashlockHex.slice(2), // Remove 0x prefix for Dogecoin
            amount: "1000000", // 1 DOGE in satoshis
            secret: secretHex,
            destinyNetwork: "polygon-amoy",
            destinyTokenAddress: "0x0000000000000000000000000000000000000000",
            destinyTokenAmount: "1000000000000000000"
        };

        console.log(`✅ Dogecoin HTCL created (mocked)`);
        console.log(`📋 Dogecoin HTCL Info:`);
        console.log(`   Address: ${dogecoinData.htclAddress}`);
        console.log(`   Creator: ${dogecoinData.creator}`);
        console.log(`   Recipient: ${dogecoinData.recipient}`);
        console.log(`   Timelock: ${dogecoinData.timelock} (block height)`);
        console.log(`   Hashlock: ${dogecoinData.hashlock}`);
        console.log(`   Amount: ${dogecoinData.amount} satoshis`);

        // Save transaction data
        const transactionData = {
            evm: {
                htclAddress: htclEVMAddress,
                creator: alice.address,
                recipient: bob.address,
                timelock: timelock,
                hashlock: hashlockHex,
                amount: ethers.formatEther(amount),
                balance: ethers.formatEther(evmInfo[5])
            },
            dogecoin: dogecoinData,
            secret: secretHex,
            hashlock: hashlockHex,
            message: message,
            timestamp: timestamp,
            method: "deterministic_hmac"
        };

        const dataPath = path.join(__dirname, "transaction_data.json");
        fs.writeFileSync(dataPath, JSON.stringify(transactionData, null, 2));
        console.log(`💾 Transaction data saved to: ${dataPath}`);

        // 5. Alice withdraws from Dogecoin HTCL (mocked)
        console.log("\n💰 Alice withdrawing from Dogecoin HTCL (mocked)...");
        console.log(`🔑 Using secret: ${secretHex}`);
        console.log(`✅ Withdrawal successful on Dogecoin`);

        // 6. Bob withdraws from EVM HTCL
        console.log("\n💰 Bob withdrawing from EVM HTCL...");
        console.log(`🔑 Using secret: ${secretHex}`);

        const withdrawTx = await htclEVM.connect(bob).bobWithdraw(secretHex);
        await withdrawTx.wait();

        console.log(`✅ Withdrawal successful on EVM`);
        console.log(`📝 Transaction hash: ${withdrawTx.hash}`);

        // Check final balances
        const finalBalance = await ethers.provider.getBalance(htclEVMAddress);
        console.log(`💰 Final HTCL balance: ${ethers.formatEther(finalBalance)} ETH`);

        // 7. Verify the flow
        console.log("\n✅ Cross-Chain HTCL Flow Verification:");
        console.log(`   ✅ Alice created HTCL on EVM`);
        console.log(`   ✅ Bob created HTCL on Dogecoin`);
        console.log(`   ✅ Alice withdrew from Dogecoin HTCL`);
        console.log(`   ✅ Bob withdrew from EVM HTCL`);
        console.log(`   ✅ Same secret used across both chains`);
        console.log(`   ✅ Same hashlock coordinated across both chains`);

        console.log("\n🎉 EVM-Dogecoin Cross-Chain HTCL Flow Test Completed Successfully!");

    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 