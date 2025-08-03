const fs = require("fs");
const path = require("path");

async function main() {
    console.log("📦 Extracting contract artifacts for MetaMask deployment...");

    try {
        // Read contract artifacts
        const htclArtifactPath = path.join(__dirname, "..", "artifacts", "contracts", "HTCL.sol", "HTCL.json");
        const limitOrderArtifactPath = path.join(__dirname, "..", "artifacts", "contracts", "LimitOrderProtocol.sol", "LimitOrderProtocol.json");

        if (!fs.existsSync(htclArtifactPath)) {
            throw new Error("HTCL artifact not found. Please run 'npx hardhat compile' first.");
        }

        if (!fs.existsSync(limitOrderArtifactPath)) {
            throw new Error("LimitOrderProtocol artifact not found. Please run 'npx hardhat compile' first.");
        }

        const htclArtifact = JSON.parse(fs.readFileSync(htclArtifactPath, 'utf8'));
        const limitOrderArtifact = JSON.parse(fs.readFileSync(limitOrderArtifactPath, 'utf8'));

        console.log("✅ Contract artifacts loaded successfully");

        // Create JavaScript code for browser
        const browserCode = `// Contract Artifacts for MetaMask Deployment
// Generated on ${new Date().toISOString()}

const HTCL_ARTIFACT = ${JSON.stringify(htclArtifact, null, 2)};

const LIMIT_ORDER_ARTIFACT = ${JSON.stringify(limitOrderArtifact, null, 2)};

// Copy these constants to your browser console or HTML file
console.log('Contract artifacts ready for deployment!');
`;

        // Save to file
        const outputPath = path.join(__dirname, "browser_artifacts.js");
        fs.writeFileSync(outputPath, browserCode);

        console.log(`💾 Browser artifacts saved to: ${outputPath}`);
        console.log("\n📋 Usage Instructions:");
        console.log("1. Copy the content of browser_artifacts.js");
        console.log("2. Paste it into your browser console");
        console.log("3. Use HTCL_ARTIFACT and LIMIT_ORDER_ARTIFACT for deployment");

        // Also update the HTML file
        const htmlPath = path.join(__dirname, "..", "deploy.html");
        if (fs.existsSync(htmlPath)) {
            let htmlContent = fs.readFileSync(htmlPath, 'utf8');

            // Replace the placeholder artifacts with real ones
            const htclPlaceholder = '// Copy the content of evm/artifacts/contracts/HTCL.sol/HTCL.json here\n            abi: [],\n            bytecode: ""';
            const limitOrderPlaceholder = '// Copy the content of evm/artifacts/contracts/LimitOrderProtocol.sol/LimitOrderProtocol.json here\n            abi: [],\n            bytecode: ""';

            const htclReplacement = `abi: ${JSON.stringify(htclArtifact.abi, null, 8)},\n            bytecode: "${htclArtifact.bytecode}"`;
            const limitOrderReplacement = `abi: ${JSON.stringify(limitOrderArtifact.abi, null, 8)},\n            bytecode: "${limitOrderArtifact.bytecode}"`;

            htmlContent = htmlContent.replace(htclPlaceholder, htclReplacement);
            htmlContent = htmlContent.replace(limitOrderPlaceholder, limitOrderReplacement);

            fs.writeFileSync(htmlPath, htmlContent);
            console.log("✅ Updated deploy.html with contract artifacts");
        }

        console.log("\n🎉 Ready for MetaMask deployment!");
        console.log("\n📝 Next steps:");
        console.log("1. Open deploy.html in your browser");
        console.log("2. Connect MetaMask");
        console.log("3. Deploy contracts");

    } catch (error) {
        console.error("❌ Error extracting artifacts:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 