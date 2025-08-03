const { ethers } = require('hardhat');
const { validateSecret } = require('./shared_secret');

async function main() {
    console.log('🚀 Bob withdrawing from EVM HTCL...');

    // Load transaction data
    let evmData;
    try {
        evmData = require('./evm_htcl_data.json');
    } catch (error) {
        console.error('❌ Error: evm_htcl_data.json not found');
        console.log('Please run Alice\'s EVM script first');
        return;
    }

    // Load Dogecoin data to get the secret
    let dogecoinData;
    try {
        dogecoinData = require('./dogecoin_htcl_data.json');
    } catch (error) {
        console.error('❌ Error: dogecoin_htcl_data.json not found');
        console.log('Please run Bob\'s Dogecoin script first');
        return;
    }

    // Extract data
    const htclAddress = evmData.htclAddress;
    const secret = evmData.secret;
    const hashlock = evmData.hashlock;
    const timelock = evmData.timelock;
    const bobAddress = evmData.bobAddress;

    console.log('HTCL Address:', htclAddress);
    console.log('Bob Address:', bobAddress);
    console.log('Secret:', secret);
    console.log('Hashlock:', hashlock);
    console.log('Timelock:', timelock);

    // Validate secret matches hashlock
    console.log('\n🔍 Validating secret...');
    const isValid = validateSecret(secret, hashlock);
    if (!isValid) {
        console.error('❌ Error: Secret does not match hashlock');
        return;
    }
    console.log('✅ Secret validation successful');

    // Get signers
    const [alice, bob] = await ethers.getSigners();

    // Verify Bob is the correct signer
    if (bob.address.toLowerCase() !== bobAddress.toLowerCase()) {
        console.error('❌ Error: Bob signer address does not match');
        console.log('Expected:', bobAddress);
        console.log('Actual:', bob.address);
        return;
    }

    // Connect to HTCL contract
    const HTCL = await ethers.getContractFactory('HTCL');
    const htcl = HTCL.attach(htclAddress);

    // Check contract state
    console.log('\n📋 Contract state:');
    const contractInfo = await htcl.getContractInfo();
    console.log('Alice:', contractInfo[0]);
    console.log('Bob:', contractInfo[1]);
    console.log('Timelock:', contractInfo[2].toString());
    console.log('Hashlock (EVM):', contractInfo[3]);
    console.log('Hashlock (Cosmos):', contractInfo[4]);
    console.log('Hashlock (Dogecoin):', contractInfo[5]);
    console.log('Amount:', ethers.formatEther(contractInfo[6]));
    console.log('Balance:', ethers.formatEther(contractInfo[7]));

    // Check if timelock has expired
    const currentTime = Math.floor(Date.now() / 1000);
    const isTimelockExpired = await htcl.isTimelockExpired();

    console.log('\n⏰ Timelock check:');
    console.log('Current time:', currentTime);
    console.log('Timelock:', timelock);
    console.log('Is expired:', isTimelockExpired);

    if (isTimelockExpired) {
        console.error('❌ Error: Timelock has expired');
        console.log('Bob can only withdraw before timelock expires');
        return;
    }
    console.log('✅ Timelock check passed');

    // Check if Alice has already withdrawn on Dogecoin
    if (!dogecoinData.aliceWithdrawn) {
        console.error('❌ Error: Alice has not withdrawn from Dogecoin yet');
        console.log('Alice must withdraw from Dogecoin first');
        return;
    }
    console.log('✅ Alice has withdrawn from Dogecoin');

    // Execute Bob's withdrawal
    console.log('\n🔄 Executing Bob\'s withdrawal...');

    try {
        const tx = await htcl.bobWithdraw(secret);
        console.log('Transaction hash:', tx.hash);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

        // Check final balance
        const finalBalance = await htcl.getBalance();
        console.log('Final contract balance:', ethers.formatEther(finalBalance));

        // Update transaction data
        evmData.bobWithdrawn = true;
        evmData.withdrawTxHash = tx.hash;
        evmData.withdrawTimestamp = currentTime;

        const fs = require('fs');
        fs.writeFileSync('evm_htcl_data.json', JSON.stringify(evmData, null, 2));

        console.log('\n💰 Bob successfully withdrew from EVM HTCL');
        console.log('📋 Transaction details:');
        console.log('  - Contract:', htclAddress);
        console.log('  - Secret:', secret);
        console.log('  - Transaction:', tx.hash);
        console.log('  - Block:', receipt.blockNumber);
        console.log('  - Timestamp:', currentTime);

        console.log('\n🎉 Cross-chain HTCL transaction completed successfully!');
        console.log('📋 Summary:');
        console.log('  1. Alice created HTCL on EVM');
        console.log('  2. Bob created HTCL on Dogecoin');
        console.log('  3. Alice withdrew from Dogecoin with secret');
        console.log('  4. Bob withdrew from EVM with secret');

    } catch (error) {
        console.error('❌ Error during withdrawal:', error.message);
        if (error.message.includes('Invalid secret')) {
            console.log('The secret provided does not match the hashlock');
        } else if (error.message.includes('Timelock has already expired')) {
            console.log('The timelock has expired, Bob cannot withdraw');
        } else if (error.message.includes('Only Bob can call this function')) {
            console.log('Only Bob can withdraw from this contract');
        }
    }
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