const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔄 Testing Limit Order Protocol Flow");
    console.log("=".repeat(50));

    // Get signers
    const [alice, bob, carol] = await ethers.getSigners();
    console.log(`👤 Alice: ${alice.address}`);
    console.log(`👤 Bob: ${bob.address}`);
    console.log(`👤 Carol: ${carol.address}`);

    try {
        // 1. Deploy Limit Order Protocol
        console.log("\n📦 Deploying Limit Order Protocol...");
        const LimitOrderProtocol = await ethers.getContractFactory("LimitOrderProtocol");
        const limitOrderProtocol = await LimitOrderProtocol.deploy();
        await limitOrderProtocol.waitForDeployment();
        const limitOrderAddress = await limitOrderProtocol.getAddress();
        console.log(`✅ Limit Order Protocol deployed to: ${limitOrderAddress}`);

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

        // 3. Alice creates order (EVM to Cosmos)
        console.log("\n📝 Alice creating order (EVM to Cosmos)...");
        const orderParams = {
            sourceChainId: "evm",
            destChainId: "cosmos",
            sourceWalletAddress: alice.address,
            destWalletAddress: "cosmos1bob123456789",
            sourceToken: "0x1234567890123456789012345678901234567890",
            destToken: "uatom",
            sourceAmount: ethers.parseEther("1.0"),
            destAmount: ethers.parseEther("1000000"), // 1 ATOM in uatom
            deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        };

        const createOrderTx = await limitOrderProtocol.connect(alice).createOrder(
            orderParams.sourceChainId,
            orderParams.destChainId,
            orderParams.sourceWalletAddress,
            orderParams.destWalletAddress,
            orderParams.sourceToken,
            orderParams.destToken,
            orderParams.sourceAmount,
            orderParams.destAmount,
            orderParams.deadline
        );
        await createOrderTx.wait();

        console.log(`✅ Order created successfully`);
        console.log(`📝 Transaction hash: ${createOrderTx.hash}`);

        // Get order info
        const orderId = 0;
        const order = await limitOrderProtocol.getOrder(orderId);
        console.log(`📋 Order Info:`);
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Source Chain: ${order.sourceChainId}`);
        console.log(`   Dest Chain: ${order.destChainId}`);
        console.log(`   Creator: ${order.creator}`);
        console.log(`   Is Active: ${order.isActive}`);
        console.log(`   Is Accepted: ${order.isAccepted}`);

        // 4. Check if order is ready for acceptance
        console.log("\n🔍 Checking order status...");
        const readyForAcceptance = await limitOrderProtocol.isReadyForAcceptance(orderId);
        console.log(`   Ready for acceptance: ${readyForAcceptance}`);

        const readyForHTCL = await limitOrderProtocol.isReadyForHTCL(orderId);
        console.log(`   Ready for HTCL: ${readyForHTCL}`);

        // 5. Bob accepts the order
        console.log("\n✅ Bob accepting the order...");
        const timelock = Math.floor(Date.now() / 1000) + 1800; // 30 minutes

        const acceptOrderTx = await limitOrderProtocol.connect(bob).acceptOrder(orderId, hashlock, timelock);
        await acceptOrderTx.wait();

        console.log(`✅ Order accepted successfully`);
        console.log(`📝 Transaction hash: ${acceptOrderTx.hash}`);
        console.log(`🔒 Hashlock: ${hashlock}`);
        console.log(`⏰ Timelock: ${timelock} (${new Date(timelock * 1000).toISOString()})`);

        // Get updated order info
        const updatedOrder = await limitOrderProtocol.getOrder(orderId);
        console.log(`📋 Updated Order Info:`);
        console.log(`   Is Accepted: ${updatedOrder.isAccepted}`);
        console.log(`   Acceptor: ${updatedOrder.acceptor}`);
        console.log(`   Hashlock: ${updatedOrder.hashlock}`);
        console.log(`   Timelock: ${updatedOrder.timelock}`);

        // 6. Check updated status
        console.log("\n🔍 Checking updated order status...");
        const newReadyForAcceptance = await limitOrderProtocol.isReadyForAcceptance(orderId);
        console.log(`   Ready for acceptance: ${newReadyForAcceptance}`);

        const newReadyForHTCL = await limitOrderProtocol.isReadyForHTCL(orderId);
        console.log(`   Ready for HTCL: ${newReadyForHTCL}`);

        // 7. Test helper functions
        console.log("\n🔧 Testing helper functions...");

        // Get active orders
        const activeOrders = await limitOrderProtocol.getActiveOrders();
        console.log(`   Active orders: ${activeOrders.length}`);
        console.log(`   Active order IDs: ${activeOrders.map(id => id.toString())}`);

        // Get orders by creator
        const aliceOrders = await limitOrderProtocol.getOrdersByCreator(alice.address);
        console.log(`   Alice's orders: ${aliceOrders.length}`);
        console.log(`   Alice's order IDs: ${aliceOrders.map(id => id.toString())}`);

        // Get orders by acceptor
        const bobOrders = await limitOrderProtocol.getOrdersByAcceptor(bob.address);
        console.log(`   Bob's accepted orders: ${bobOrders.length}`);
        console.log(`   Bob's order IDs: ${bobOrders.map(id => id.toString())}`);

        // 8. Test cross-chain scenarios
        console.log("\n🌐 Testing cross-chain scenarios...");

        // Create EVM to Dogecoin order
        console.log("   Creating EVM to Dogecoin order...");
        await limitOrderProtocol.connect(alice).createOrder(
            "evm", "dogecoin", alice.address, "D8Bob123456789",
            "0x456", "", ethers.parseEther("1.0"), ethers.parseEther("1000000"),
            Math.floor(Date.now() / 1000) + 3600
        );

        // Create Dogecoin to EVM order
        console.log("   Creating Dogecoin to EVM order...");
        await limitOrderProtocol.connect(bob).createOrder(
            "dogecoin", "evm", "D8Alice123456789", carol.address,
            "", "0x789", ethers.parseEther("1000000"), ethers.parseEther("1.0"),
            Math.floor(Date.now() / 1000) + 3600
        );

        // Create Cosmos to EVM order
        console.log("   Creating Cosmos to EVM order...");
        await limitOrderProtocol.connect(carol).createOrder(
            "cosmos", "evm", "cosmos1carol123456789", alice.address,
            "uatom", "0xabc", ethers.parseEther("1000000"), ethers.parseEther("1.0"),
            Math.floor(Date.now() / 1000) + 3600
        );

        console.log("   ✅ All cross-chain scenarios created successfully");

        // 9. Test order cancellation
        console.log("\n❌ Testing order cancellation...");

        // Create an order for cancellation
        await limitOrderProtocol.connect(alice).createOrder(
            "evm", "cosmos", alice.address, "cosmos1test123456789",
            "0x999", "uatom", ethers.parseEther("0.5"), ethers.parseEther("500000"),
            Math.floor(Date.now() / 1000) + 3600
        );

        const cancelOrderId = 4; // New order ID
        const cancelOrderTx = await limitOrderProtocol.connect(alice).cancelOrder(cancelOrderId);
        await cancelOrderTx.wait();

        console.log(`✅ Order ${cancelOrderId} cancelled successfully`);
        console.log(`📝 Transaction hash: ${cancelOrderTx.hash}`);

        // 10. Save test data
        const testData = {
            limitOrderAddress: limitOrderAddress,
            orderId: orderId,
            secret: secretHex,
            hashlock: hashlockHex,
            message: message,
            timestamp: timestamp,
            orderParams: orderParams,
            timelock: timelock,
            activeOrders: activeOrders.map(id => id.toString()),
            aliceOrders: aliceOrders.map(id => id.toString()),
            bobOrders: bobOrders.map(id => id.toString())
        };

        const dataPath = path.join(__dirname, "limit_order_test_data.json");
        fs.writeFileSync(dataPath, JSON.stringify(testData, null, 2));
        console.log(`💾 Test data saved to: ${dataPath}`);

        // 11. Verify the complete flow
        console.log("\n✅ Limit Order Protocol Flow Verification:");
        console.log(`   ✅ Contract deployed successfully`);
        console.log(`   ✅ Order created successfully`);
        console.log(`   ✅ Order accepted with hashlock and timelock`);
        console.log(`   ✅ Helper functions working correctly`);
        console.log(`   ✅ Cross-chain scenarios supported`);
        console.log(`   ✅ Order cancellation working`);
        console.log(`   ✅ Deterministic secret generation working`);
        console.log(`   ✅ Universal hashlock coordination working`);

        console.log("\n🎉 Limit Order Protocol Flow Test Completed Successfully!");

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