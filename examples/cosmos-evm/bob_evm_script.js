const { ethers } = require('hardhat');

async function main() {
    console.log('🚀 Bob creating HTCL on EVM (Polygon Amoy) for Alice...');

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
    const destinyNetwork = cosmosData.destinyNetwork;
    const destinyTokenAddress = cosmosData.destinyTokenAddress;
    const destinyTokenAmount = cosmosData.destinyTokenAmount;

    console.log('Hashlock (EVM):', hashlockEVM);
    console.log('Timelock:', timelock);
    console.log('Destiny Network:', destinyNetwork);
    console.log('Destiny Token Address:', destinyTokenAddress);
    console.log('Destiny Token Amount:', destinyTokenAmount);

    // Validate hashlock format
    if (!hashlockEVM || !hashlockEVM.startsWith('0x') || hashlockEVM.length !== 66) {
        console.error('❌ Error: Invalid hashlock format');
        return;
    }

    // Alice and Bob both have EVM addresses (same network - Polygon Amoy)
    const aliceEvmAddress = "0xAliceAddress123456789abcdef";
    const bobEvmAddress = "0xBobAddress123456789abcdef";

    console.log('Alice EVM address:', aliceEvmAddress);
    console.log('Bob EVM address:', bobEvmAddress);

    // Deploy HTCL contract on Polygon Amoy
    const HTCL = await ethers.getContractFactory('HTCL');
    const htclAmount = ethers.parseEther('1.0'); // 1 MATIC

    console.log('Deploying HTCL contract on Polygon Amoy...');
    const htcl = await HTCL.deploy(aliceEvmAddress, timelock, hashlockEVM, {
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
        aliceAddress: aliceEvmAddress,
        bobAddress: bobEvmAddress,
        amount: ethers.formatEther(htclAmount),
        cosmosHtclAddress: cosmosData.htclAddress,
        destinyNetwork: destinyNetwork,
        destinyTokenAddress: destinyTokenAddress,
        destinyTokenAmount: destinyTokenAmount,
        sourceNetwork: "cosmos",
        sourceTokenAddress: "uatom",
        sourceTokenAmount: cosmosData.amount
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
    console.log('Source Network: Cosmos');
    console.log('Destiny Network:', destinyNetwork);
    console.log('Source Token: uatom');
    console.log('Destiny Token: MATIC');

    console.log('\n✅ Bob successfully created HTCL on EVM (Polygon Amoy) for Alice');
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