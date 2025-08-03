const { generateDeterministicSecretFromWallet, generateDeterministicSecretFromMnemonic, generateSecretAndHashlock } = require('./shared_secret');
const { ethers } = require('ethers');

async function main() {
    console.log("🔐 Alice creating HTCL on EVM...");

    // Network configuration
    const network = "polygon-amoy";
    const aliceEvmAddress = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";  // Mock address
    const bobEvmAddress = "0x8ba1f109551bD432803012645Hac136c772c3c9";    // Mock address

    // Generate deterministic secret and hashlock
    console.log("🔑 Generating deterministic secret and hashlock...");
    let result;
    try {
        // Method 1: Try deterministic wallet-based generation
        const privateKey = process.env.ALICE_PRIVATE_KEY;
        if (privateKey) {
            result = generateDeterministicSecretFromWallet(privateKey);
            console.log("✅ Using deterministic wallet-based generation");
        } else {
            const mnemonic = process.env.ALICE_MNEMONIC;
            if (mnemonic) {
                result = generateDeterministicSecretFromMnemonic(mnemonic);
                console.log("✅ Using deterministic mnemonic-based generation");
            } else {
                throw new Error('No wallet credentials provided');
            }
        }
    } catch (error) {
        console.log(`⚠️ Deterministic wallet-based generation failed: ${error.message}`);
        console.log('🔄 Falling back to random secret generation...');

        // Method 2: Fallback to random generation
        result = generateSecretAndHashlock();
    }

    const { secret, hashlock } = result;

    console.log(`🔑 Secret: ${secret}`);
    console.log(`🔒 Hashlock: ${hashlock}`);
    console.log(`👛 Wallet Address: ${result.walletAddress || 'N/A'}`);
    console.log(`📝 Message: ${result.message || 'N/A'}`);
    console.log(`⏰ Timestamp: ${result.timestamp || 'N/A'}`);
    console.log(`🔧 Method: ${result.method || 'N/A'}`);

    // Calculate timelock (1 hour from now)
    const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    console.log(`⏰ Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);

    // Deploy HTCL contract
    const HTCL = await ethers.getContractFactory('HTCL');
    const htclAmount = ethers.parseEther('1.0'); // 1 ETH

    console.log('Deploying HTCL contract...');
    const htcl = await HTCL.deploy(bobEvmAddress, timelock, hashlock, {
        value: htclAmount
    });

    await htcl.waitForDeployment();
    const htclAddress = await htcl.getAddress();

    console.log(`✅ HTCL deployed at: ${htclAddress}`);

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

    // Save EVM HTCL data
    const evm_data = {
        "htclAddress": htclAddress,
        "creator": aliceEvmAddress,
        "recipient": bobEvmAddress,
        "timelock": timelock,
        "hashlock": hashlock,  // Universal hashlock
        "amount": htclAmount.toString(),
        "secret": secret,  // Keep secret for later use
        "destinyNetwork": "dogecoin-mainnet",
        "destinyTokenAddress": "DOGE",
        "destinyTokenAmount": "1000000",  // 1 DOGE in satoshis
        "walletAddress": result.walletAddress,
        "message": result.message,
        "timestamp": result.timestamp,
        "method": result.method
    };

    // Save to file
    const fs = require('fs');
    fs.writeFileSync('evm_htcl_data.json', JSON.stringify(evm_data, null, 2));

    console.log(`💾 EVM HTCL data saved to evm_htcl_data.json`);
    console.log(`🎯 HTCL created on EVM for Bob`);
    console.log(`🔗 Contract Address: ${htclAddress}`);
    console.log(`💰 Amount: 1.0 ETH`);
    console.log(`⏰ Timelock: ${new Date(timelock * 1000).toISOString()}`);

    return evm_data;
}

if (require.main === module) {
    main().catch(console.error);
} 