const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LimitOrderProtocol", function () {
    let limitOrderProtocol;
    let alice, bob, carol;
    let orderId;
    
    beforeEach(async function () {
        [alice, bob, carol] = await ethers.getSigners();
        
        const LimitOrderProtocol = await ethers.getContractFactory("LimitOrderProtocol");
        limitOrderProtocol = await LimitOrderProtocol.deploy();
        await limitOrderProtocol.waitForDeployment();
    });
    
    describe("Order Creation", function () {
        it("Should create an order successfully", async function () {
            const orderParams = {
                sourceChainId: "evm",
                destChainId: "cosmos",
                sourceWalletAddress: alice.address,
                destWalletAddress: "cosmos1aliceaddress123456789",
                sourceToken: "0x1234567890123456789012345678901234567890",
                destToken: "uatom",
                sourceAmount: ethers.parseEther("1.0"),
                destAmount: ethers.parseEther("1000000"), // 1 ATOM in uatom
                deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
            };
            
            await expect(limitOrderProtocol.connect(alice).createOrder(
                orderParams.sourceChainId,
                orderParams.destChainId,
                orderParams.sourceWalletAddress,
                orderParams.destWalletAddress,
                orderParams.sourceToken,
                orderParams.destToken,
                orderParams.sourceAmount,
                orderParams.destAmount,
                orderParams.deadline
            )).to.emit(limitOrderProtocol, "OrderCreated")
                .withArgs(0, orderParams.sourceChainId, orderParams.destChainId,
                    orderParams.sourceWalletAddress, orderParams.destWalletAddress,
                    orderParams.sourceToken, orderParams.destToken,
                    orderParams.sourceAmount, orderParams.destAmount,
                    orderParams.deadline, alice.address);
            
            orderId = 0;
            const order = await limitOrderProtocol.getOrder(orderId);
            expect(order.sourceChainId).to.equal(orderParams.sourceChainId);
            expect(order.destChainId).to.equal(orderParams.destChainId);
            expect(order.creator).to.equal(alice.address);
            expect(order.isActive).to.be.true;
        });
        
        it("Should fail with empty source chain ID", async function () {
            await expect(limitOrderProtocol.connect(alice).createOrder(
                "", "cosmos", alice.address, "cosmos1bob", "0x123", "uatom",
                ethers.parseEther("1.0"), ethers.parseEther("1000000"),
                Math.floor(Date.now() / 1000) + 3600
            )).to.be.revertedWith("LOP: Source chain ID cannot be empty");
        });
        
        it("Should fail with past deadline", async function () {
            await expect(limitOrderProtocol.connect(alice).createOrder(
                "evm", "cosmos", alice.address, "cosmos1bob", "0x123", "uatom",
                ethers.parseEther("1.0"), ethers.parseEther("1000000"),
                Math.floor(Date.now() / 1000) - 3600 // Past time
            )).to.be.revertedWith("LOP: Deadline must be in the future");
        });
    });
    
    describe("Order Acceptance", function () {
        beforeEach(async function () {
            // Create an order first
            await limitOrderProtocol.connect(alice).createOrder(
                "evm", "cosmos", alice.address, "cosmos1bob", "0x123", "uatom",
                ethers.parseEther("1.0"), ethers.parseEther("1000000"),
                Math.floor(Date.now() / 1000) + 3600
            );
            orderId = 0;
        });
        
        it("Should accept an order successfully", async function () {
            const hashlock = ethers.keccak256(ethers.toUtf8Bytes("test_secret"));
            const timelock = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
            
            await expect(limitOrderProtocol.connect(bob).acceptOrder(orderId, hashlock, timelock))
                .to.emit(limitOrderProtocol, "OrderAccepted")
                .withArgs(orderId, bob.address, hashlock, timelock);
            
            const order = await limitOrderProtocol.getOrder(orderId);
            expect(order.isAccepted).to.be.true;
            expect(order.acceptor).to.equal(bob.address);
            expect(order.hashlock).to.equal(hashlock);
            expect(order.timelock).to.equal(timelock);
        });
        
        it("Should fail if order already accepted", async function () {
            const hashlock = ethers.keccak256(ethers.toUtf8Bytes("test_secret"));
            const timelock = Math.floor(Date.now() / 1000) + 1800;
            
            await limitOrderProtocol.connect(bob).acceptOrder(orderId, hashlock, timelock);
            
            await expect(limitOrderProtocol.connect(carol).acceptOrder(orderId, hashlock, timelock))
                .to.be.revertedWith("LOP: Order already accepted");
        });
        
        it("Should fail with zero hashlock", async function () {
            const timelock = Math.floor(Date.now() / 1000) + 1800;
            
            await expect(limitOrderProtocol.connect(bob).acceptOrder(orderId, ethers.ZeroHash, timelock))
                .to.be.revertedWith("LOP: Hashlock cannot be zero");
        });
        
        it("Should fail with past timelock", async function () {
            const hashlock = ethers.keccak256(ethers.toUtf8Bytes("test_secret"));
            const timelock = Math.floor(Date.now() / 1000) - 1800; // Past time
            
            await expect(limitOrderProtocol.connect(bob).acceptOrder(orderId, hashlock, timelock))
                .to.be.revertedWith("LOP: Timelock must be in the future");
        });
    });
    
    describe("Order Cancellation", function () {
        beforeEach(async function () {
            await limitOrderProtocol.connect(alice).createOrder(
                "evm", "cosmos", alice.address, "cosmos1bob", "0x123", "uatom",
                ethers.parseEther("1.0"), ethers.parseEther("1000000"),
                Math.floor(Date.now() / 1000) + 3600
            );
            orderId = 0;
        });
        
        it("Should cancel order successfully", async function () {
            await expect(limitOrderProtocol.connect(alice).cancelOrder(orderId))
                .to.emit(limitOrderProtocol, "OrderCancelled")
                .withArgs(orderId, alice.address);
            
            const order = await limitOrderProtocol.getOrder(orderId);
            expect(order.isActive).to.be.false;
        });
        
        it("Should fail if not order creator", async function () {
            await expect(limitOrderProtocol.connect(bob).cancelOrder(orderId))
                .to.be.revertedWith("LOP: Only order creator can call this");
        });
        
        it("Should fail if order already accepted", async function () {
            const hashlock = ethers.keccak256(ethers.toUtf8Bytes("test_secret"));
            const timelock = Math.floor(Date.now() / 1000) + 1800;
            await limitOrderProtocol.connect(bob).acceptOrder(orderId, hashlock, timelock);
            
            await expect(limitOrderProtocol.connect(alice).cancelOrder(orderId))
                .to.be.revertedWith("LOP: Cannot cancel accepted order");
        });
    });
    
    describe("Helper Functions", function () {
        beforeEach(async function () {
            await limitOrderProtocol.connect(alice).createOrder(
                "evm", "cosmos", alice.address, "cosmos1bob", "0x123", "uatom",
                ethers.parseEther("1.0"), ethers.parseEther("1000000"),
                Math.floor(Date.now() / 1000) + 3600
            );
            orderId = 0;
        });
        
        it("Should check if ready for acceptance", async function () {
            expect(await limitOrderProtocol.isReadyForAcceptance(orderId)).to.be.true;
            
            const hashlock = ethers.keccak256(ethers.toUtf8Bytes("test_secret"));
            const timelock = Math.floor(Date.now() / 1000) + 1800;
            await limitOrderProtocol.connect(bob).acceptOrder(orderId, hashlock, timelock);
            
            expect(await limitOrderProtocol.isReadyForAcceptance(orderId)).to.be.false;
        });
        
        it("Should check if ready for HTCL creation", async function () {
            expect(await limitOrderProtocol.isReadyForHTCL(orderId)).to.be.false; // Not accepted yet
            
            const hashlock = ethers.keccak256(ethers.toUtf8Bytes("test_secret"));
            const timelock = Math.floor(Date.now() / 1000) + 1800;
            await limitOrderProtocol.connect(bob).acceptOrder(orderId, hashlock, timelock);
            
            expect(await limitOrderProtocol.isReadyForHTCL(orderId)).to.be.true;
        });
        
        it("Should get active orders", async function () {
            // Create another order
            await limitOrderProtocol.connect(bob).createOrder(
                "cosmos", "evm", "cosmos1bob", carol.address, "uatom", "0x456",
                ethers.parseEther("1000000"), ethers.parseEther("1.0"),
                Math.floor(Date.now() / 1000) + 3600
            );
            
            const activeOrders = await limitOrderProtocol.getActiveOrders();
            expect(activeOrders.length).to.equal(2);
            expect(activeOrders).to.include(0);
            expect(activeOrders).to.include(1);
        });
        
        it("Should get orders by creator", async function () {
            // Create another order by Alice
            await limitOrderProtocol.connect(alice).createOrder(
                "dogecoin", "evm", "D8KvKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq", bob.address, "", "0x789",
                ethers.parseEther("1000000"), ethers.parseEther("1.0"),
                Math.floor(Date.now() / 1000) + 3600
            );
            
            const aliceOrders = await limitOrderProtocol.getOrdersByCreator(alice.address);
            expect(aliceOrders.length).to.equal(2);
            expect(aliceOrders).to.include(0);
            expect(aliceOrders).to.include(1);
        });
        
        it("Should get orders by acceptor", async function () {
            const hashlock = ethers.keccak256(ethers.toUtf8Bytes("test_secret"));
            const timelock = Math.floor(Date.now() / 1000) + 1800;
            await limitOrderProtocol.connect(bob).acceptOrder(orderId, hashlock, timelock);
            
            const bobOrders = await limitOrderProtocol.getOrdersByAcceptor(bob.address);
            expect(bobOrders.length).to.equal(1);
            expect(bobOrders).to.include(0);
        });
    });
    
    describe("Cross-Chain Scenarios", function () {
        it("Should handle EVM to Cosmos order", async function () {
            // Create EVM to Cosmos order
            await limitOrderProtocol.connect(alice).createOrder(
                "evm", "cosmos", alice.address, "cosmos1bob", "0x123", "uatom",
                ethers.parseEther("1.0"), ethers.parseEther("1000000"),
                Math.floor(Date.now() / 1000) + 3600
            );
            
            const order = await limitOrderProtocol.getOrder(0);
            expect(order.sourceChainId).to.equal("evm");
            expect(order.destChainId).to.equal("cosmos");
        });
        
        it("Should handle Cosmos to EVM order", async function () {
            // Create Cosmos to EVM order
            await limitOrderProtocol.connect(alice).createOrder(
                "cosmos", "evm", "cosmos1alice", bob.address, "uatom", "0x456",
                ethers.parseEther("1000000"), ethers.parseEther("1.0"),
                Math.floor(Date.now() / 1000) + 3600
            );
            
            const order = await limitOrderProtocol.getOrder(0);
            expect(order.sourceChainId).to.equal("cosmos");
            expect(order.destChainId).to.equal("evm");
        });
        
        it("Should handle Dogecoin to EVM order", async function () {
            // Create Dogecoin to EVM order (empty token addresses)
            await limitOrderProtocol.connect(alice).createOrder(
                "dogecoin", "evm", "D8KvKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq", bob.address, "", "0x789",
                ethers.parseEther("1000000"), ethers.parseEther("1.0"),
                Math.floor(Date.now() / 1000) + 3600
            );
            
            const order = await limitOrderProtocol.getOrder(0);
            expect(order.sourceChainId).to.equal("dogecoin");
            expect(order.destChainId).to.equal("evm");
            expect(order.sourceToken).to.equal("");
            expect(order.destToken).to.equal("0x789");
        });
    });
}); 