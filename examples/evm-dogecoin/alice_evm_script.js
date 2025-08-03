const { ethers } = require('hardhat');
const { generateSecretAndHashlock } = require('./shared_secret');

async function main() {
    console.log('🚀 Alice creating HTCL on EVM...');

    // Get signers
    const [alice, bob] = await ethers.getSigners();
    console.log('Alice address:', alice.address);
    console.log('Bob address:', bob.address);

    // Generate secret and hashlock
    const { secret, hashlock } = generateSecretAndHashlock();
    console.log('Generated secret:', secret);
    console.log('Generated hashlock:', hashlock);

    // Calculate timelock (1 hour from now)
    const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    console.log('Timelock:', timelock);

    // Deploy HTCL contract
    const HTCL = await ethers.getContractFactory('HTCL');
    const htclAmount = ethers.parseEther('1.0'); // 1 ETH

    console.log('Deploying HTCL contract...');
    const htcl = await HTCL.deploy(bob.address, timelock, hashlock, {
        value: htclAmount
    });

    await htcl.waitForDeployment();
    const htclAddress = await htcl.getAddress();
    console.log('HTCL deployed at:', htclAddress);

    // Verify contract state
    const contractInfo = await htcl.getContractInfo();
    console.log('Contract info:', {
        alice: contractInfo[0],
        bob: contractInfo[1],
        timelock: contractInfo[2].toString(),
        hashlock: contractInfo[3],
        amount: ethers.formatEther(contractInfo[4]),
        balance: ethers.formatEther(contractInfo[5])
    });

    // Save transaction data for Bob
    const transactionData = {
        secret: secret,
        hashlock: hashlock,
        hashlockDogecoin: hashlock.slice(2), // Remove 0x for Dogecoin
        timelock: timelock,
        htclAddress: htclAddress,
        aliceAddress: alice.address,
        bobAddress: bob.address,
        amount: ethers.formatEther(htclAmount)
    };

    // Write to file for Bob to use
    const fs = require('fs');
    fs.writeFileSync('evm_htcl_data.json', JSON.stringify(transactionData, null, 2));
    console.log('Transaction data saved to evm_htcl_data.json');

    console.log('✅ Alice successfully created HTCL on EVM');
    console.log('📋 Next steps:');
    console.log('1. Share evm_htcl_data.json with Bob');
    console.log('2. Bob should create HTCL on Dogecoin with the same hashlock');
    console.log('3. Alice will withdraw on Dogecoin with the secret');
    console.log('4. Bob will withdraw on EVM with the secret');

    return transactionData;
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