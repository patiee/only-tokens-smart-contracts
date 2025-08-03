const { ethers } = require('hardhat');

async function main() {
    console.log('🚀 Bob creating HTCL on EVM...');

    // Load transaction data from Alice's Cosmos HTCL
    let cosmosData;
    try {
        cosmosData = require('./cosmos_htcl_data.json');
    } catch (error) {
        console.error('❌ Error: cosmos_htcl_data.json not found');
        console.log('Please run Alice\'s Cosmos script first');
        return;
    }

    // Extract data from Cosmos HTCL
    const hashlockEVM = cosmosData.hashlockEVM;
    const timelock = cosmosData.timelock;
    const aliceAddress = cosmosData.aliceAddress;
    const bobAddress = cosmosData.bobAddress;
    const amount = cosmosData.amount;

    console.log('Hashlock (EVM):', hashlockEVM);
    console.log('Timelock:', timelock);
    console.log('Alice address:', aliceAddress);
    console.log('Bob address:', bobAddress);
    console.log('Amount:', amount);

    // Validate hashlock format
    if (!hashlockEVM || !hashlockEVM.startsWith('0x') || hashlockEVM.length !== 66) {
        console.error('❌ Error: Invalid hashlock format');
        return;
    }

    // Get signers
    const [alice, bob] = await ethers.getSigners();
    console.log('Alice signer address:', alice.address);
    console.log('Bob signer address:', bob.address);

    // Deploy HTCL contract
    const HTCL = await ethers.getContractFactory('HTCL');
    const htclAmount = ethers.parseEther('1.0'); // 1 ETH

    console.log('Deploying HTCL contract...');
    const htcl = await HTCL.deploy(alice.address, timelock, hashlockEVM, {
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

    // Save EVM transaction data
    const evmData = {
        secret: cosmosData.secret,
        hashlock: hashlockEVM,
        hashlockCosmos: cosmosData.hashlock,
        timelock: timelock,
        htclAddress: htclAddress,
        aliceAddress: alice.address,
        bobAddress: bob.address,
        amount: ethers.formatEther(htclAmount),
        cosmosHtclAddress: cosmosData.htclAddress
    };

    // Write to file
    const fs = require('fs');
    fs.writeFileSync('evm_htcl_data.json', JSON.stringify(evmData, null, 2));
    console.log('EVM transaction data saved to evm_htcl_data.json');

    // Verify the setup
    console.log('\n🔍 Verification:');
    console.log('Cosmos HTCL:', cosmosData.htclAddress);
    console.log('EVM HTCL:', htclAddress);
    console.log('Shared hashlock:', hashlockEVM);
    console.log('Shared timelock:', timelock);
    console.log('Secret:', cosmosData.secret);

    console.log('\n✅ Bob successfully created HTCL on EVM');
    console.log('📋 Next steps:');
    console.log('1. Alice will withdraw on EVM with the secret');
    console.log('2. Bob will withdraw on Cosmos with the secret');

    return evmData;
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