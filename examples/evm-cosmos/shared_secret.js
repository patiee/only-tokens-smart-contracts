const crypto = require('crypto');

/**
 * Generate a random secret and its corresponding hashlock
 * @returns {Object} Object containing secret and hashlock
 */
function generateSecretAndHashlock() {
    // Generate a random 32-byte secret
    const secret = crypto.randomBytes(32);
    const secretHex = '0x' + secret.toString('hex');

    // Create hashlock (keccak256 hash of the secret)
    const hashlock = crypto.createHash('sha256').update(secret).digest('hex');
    const hashlockHex = '0x' + hashlock;

    return {
        secret: secretHex,
        secretBytes: secret,
        hashlock: hashlockHex,
        hashlockString: hashlock // For Cosmos (string format)
    };
}

/**
 * Validate if a secret matches a given hashlock
 * @param {string} secret - The secret to validate
 * @param {string} hashlock - The hashlock to check against
 * @returns {boolean} True if secret matches hashlock
 */
function validateSecret(secret, hashlock) {
    // Remove 0x prefix if present
    const cleanSecret = secret.startsWith('0x') ? secret.slice(2) : secret;
    const secretBytes = Buffer.from(cleanSecret, 'hex');

    // Create hashlock from secret
    const calculatedHashlock = crypto.createHash('sha256').update(secretBytes).digest('hex');
    const expectedHashlock = hashlock.startsWith('0x') ? hashlock.slice(2) : hashlock;

    return calculatedHashlock === expectedHashlock;
}

/**
 * Convert EVM hashlock format to Cosmos format
 * @param {string} evmHashlock - Hashlock in EVM format (0x...)
 * @returns {string} Hashlock in Cosmos format (hex string without 0x)
 */
function evmToCosmosHashlock(evmHashlock) {
    return evmHashlock.startsWith('0x') ? evmHashlock.slice(2) : evmHashlock;
}

/**
 * Convert Cosmos hashlock format to EVM format
 * @param {string} cosmosHashlock - Hashlock in Cosmos format (hex string)
 * @returns {string} Hashlock in EVM format (0x...)
 */
function cosmosToEvmHashlock(cosmosHashlock) {
    return cosmosHashlock.startsWith('0x') ? cosmosHashlock : '0x' + cosmosHashlock;
}

module.exports = {
    generateSecretAndHashlock,
    validateSecret,
    evmToCosmosHashlock,
    cosmosToEvmHashlock
};

// Example usage
if (require.main === module) {
    console.log('Generating secret and hashlock for cross-chain HTCL...');
    const { secret, hashlock, hashlockString } = generateSecretAndHashlock();

    console.log('Generated values:');
    console.log('Secret (EVM):', secret);
    console.log('Hashlock (EVM):', hashlock);
    console.log('Hashlock (Cosmos):', hashlockString);

    console.log('\nValidation test:');
    const isValid = validateSecret(secret, hashlock);
    console.log('Secret validation:', isValid);

    console.log('\nFormat conversion:');
    console.log('EVM to Cosmos:', evmToCosmosHashlock(hashlock));
    console.log('Cosmos to EVM:', cosmosToEvmHashlock(hashlockString));
} 