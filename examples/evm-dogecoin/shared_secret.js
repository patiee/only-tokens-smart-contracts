const crypto = require('crypto');
const { ethers } = require('ethers');

function generateDeterministicSecretFromWallet(privateKey) {
    try {
        const wallet = new ethers.Wallet(privateKey);
        const address = wallet.address;

        // Create a deterministic secret using private key + timestamp
        // This ensures the same wallet generates the same secret for the same timestamp
        const timestamp = Math.floor(Date.now() / 3600000) * 3600000; // Round to hour for consistency
        const message = `HTCL_CROSS_CHAIN_SECRET_${timestamp}`;

        // Use HMAC-SHA256 with private key as key and message as data
        // This creates a deterministic secret that's the same across all chains
        const hmac = crypto.createHmac('sha256', privateKey);
        hmac.update(message);
        const secretBytes = hmac.digest();
        const secretHex = '0x' + secretBytes.toString('hex');

        // Create hashlock (sha256 hash of the secret)
        const hashlock = crypto.createHash('sha256').update(secretBytes).digest('hex');
        const hashlockHex = '0x' + hashlock;

        return {
            secret: secretHex,
            secretBytes: secretBytes,
            hashlock: hashlockHex,  // Universal hashlock (0x format)
            walletAddress: address,
            message: message,
            timestamp: timestamp,
            method: 'deterministic_hmac'
        };
    } catch (error) {
        throw new Error(`Deterministic secret generation failed: ${error.message}`);
    }
}

function generateDeterministicSecretFromMnemonic(mnemonic, derivationPath = "m/44'/60'/0'/0/0") {
    try {
        const wallet = ethers.Wallet.fromPhrase(mnemonic, derivationPath);
        const address = wallet.address;
        const privateKey = wallet.privateKey;

        // Create a deterministic secret using private key + timestamp
        const timestamp = Math.floor(Date.now() / 3600000) * 3600000; // Round to hour for consistency
        const message = `HTCL_CROSS_CHAIN_SECRET_${timestamp}`;

        // Use HMAC-SHA256 with private key as key and message as data
        const hmac = crypto.createHmac('sha256', privateKey);
        hmac.update(message);
        const secretBytes = hmac.digest();
        const secretHex = '0x' + secretBytes.toString('hex');

        // Create hashlock (sha256 hash of the secret)
        const hashlock = crypto.createHash('sha256').update(secretBytes).digest('hex');
        const hashlockHex = '0x' + hashlock;

        return {
            secret: secretHex,
            secretBytes: secretBytes,
            hashlock: hashlockHex,  // Universal hashlock (0x format)
            walletAddress: address,
            message: message,
            timestamp: timestamp,
            method: 'deterministic_hmac'
        };
    } catch (error) {
        throw new Error(`Deterministic secret generation failed: ${error.message}`);
    }
}

function generateSecretAndHashlock() {
    // Generate a random 32-byte secret
    const secret = crypto.randomBytes(32);
    const secretHex = '0x' + secret.toString('hex');

    // Create hashlock (sha256 hash of the secret)
    const hashlock = crypto.createHash('sha256').update(secret).digest('hex');
    const hashlockHex = '0x' + hashlock;

    return {
        secret: secretHex,
        secretBytes: secret,
        hashlock: hashlockHex,  // Universal hashlock (0x format)
        method: 'random'
    };
}

function validateSecret(secret, hashlock) {
    const cleanSecret = secret.startsWith('0x') ? secret.slice(2) : secret;
    const secretBytes = Buffer.from(cleanSecret, 'hex');

    // Create hashlock from secret
    const calculatedHashlock = crypto.createHash('sha256').update(secretBytes).digest('hex');
    const expectedHashlock = hashlock.startsWith('0x') ? hashlock.slice(2) : hashlock;

    return calculatedHashlock === expectedHashlock;
}

function dogecoinToEvmHashlock(dogecoinHashlock) {
    return dogecoinHashlock.startsWith('0x') ? dogecoinHashlock : '0x' + dogecoinHashlock;
}

function evmToDogecoinHashlock(evmHashlock) {
    return evmHashlock.startsWith('0x') ? evmHashlock.slice(2) : evmHashlock;
}

if (require.main === module) {
    console.log("=== Cross-Chain Compatible Secret Generation ===");

    // Example 1: Using deterministic HMAC (RECOMMENDED for production)
    console.log("\n1. Generating deterministic secret from wallet...");
    try {
        const privateKey = process.env.ALICE_PRIVATE_KEY || "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        const result = generateDeterministicSecretFromWallet(privateKey);

        console.log("Generated values:");
        console.log("Wallet Address:", result.walletAddress);
        console.log("Message:", result.message);
        console.log("Timestamp:", result.timestamp);
        console.log("Method:", result.method);
        console.log("Secret (EVM):", result.secret);
        console.log("Hashlock:", result.hashlock);
        
        console.log("\nValidation test:");
        const isValid = validateSecret(result.secret, result.hashlock);
        console.log("Secret validation:", isValid);
        
        // Test cross-chain compatibility
        console.log("\nCross-chain compatibility test:");
        console.log("Same wallet + same timestamp = same secret across all chains");

    } catch (error) {
        console.error("Error with deterministic method:", error.message);
    }

    // Example 2: Using mnemonic (deterministic)
    console.log("\n2. Generating deterministic secret from mnemonic...");
    try {
        const mnemonic = process.env.ALICE_MNEMONIC || "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        const result = generateDeterministicSecretFromMnemonic(mnemonic);

        console.log("Generated values:");
        console.log("Wallet Address:", result.walletAddress);
        console.log("Message:", result.message);
        console.log("Timestamp:", result.timestamp);
        console.log("Method:", result.method);
        console.log("Secret (EVM):", result.secret);
        console.log("Hashlock:", result.hashlock);

        console.log("\nValidation test:");
        const isValid = validateSecret(result.secret, result.hashlock);
        console.log("Secret validation:", isValid);

    } catch (error) {
        console.error("Error with mnemonic method:", error.message);
    }

    // Example 3: Fallback random generation
    console.log("\n3. Fallback: Random secret generation...");
    const result = generateSecretAndHashlock();

    console.log("Generated values:");
    console.log("Secret (EVM):", result.secret);
    console.log("Hashlock:", result.hashlock);
    
    console.log("\nValidation test:");
    const isValid = validateSecret(result.secret, result.hashlock);
    console.log("Secret validation:", isValid);
    
    console.log("\nFormat conversion:");
    console.log("Dogecoin to EVM:", dogecoinToEvmHashlock(result.hashlock.slice(2)));
    console.log("EVM to Dogecoin:", evmToDogecoinHashlock(result.hashlock));
}

module.exports = {
    generateDeterministicSecretFromWallet,
    generateDeterministicSecretFromMnemonic,
    generateSecretAndHashlock,
    validateSecret,
    dogecoinToEvmHashlock,
    evmToDogecoinHashlock
}; 