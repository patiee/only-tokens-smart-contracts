const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HTCL Contract", function () {
    let htcl;
    let alice, bob, charlie;
    let secret, hashlock, timelock;
    const amount = ethers.parseEther("1.0"); // 1 ETH

    beforeEach(async function () {
        // Get signers
        [alice, bob, charlie] = await ethers.getSigners();

        // Generate a random secret and its hash
        secret = ethers.randomBytes(32);
        hashlock = ethers.keccak256(secret);

        // Set timelock to 1 hour from now
        timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

        // Deploy the contract
        const HTCL = await ethers.getContractFactory("HTCL");
        htcl = await HTCL.connect(alice).deploy(bob.address, timelock, hashlock, { value: amount });
    });

    describe("Deployment", function () {
        it("Should set the correct initial state", async function () {
            expect(await htcl.alice()).to.equal(alice.address);
            expect(await htcl.bob()).to.equal(bob.address);
            expect(await htcl.timelock()).to.equal(timelock);
            expect(await htcl.hashlock()).to.equal(hashlock);
            expect(await htcl.amount()).to.equal(amount);
            expect(await htcl.getBalance()).to.equal(amount);
        });

        it("Should emit HTCLCreated event", async function () {
            const HTCL = await ethers.getContractFactory("HTCL");
            const tx = await HTCL.connect(alice).deploy(bob.address, timelock, hashlock, { value: amount });
            await expect(tx)
                .to.emit(htcl, "HTCLCreated")
                .withArgs(alice.address, bob.address, amount, timelock, hashlock);
        });

        it("Should reject deployment with invalid parameters", async function () {
            const HTCL = await ethers.getContractFactory("HTCL");

            // Test with zero address for Bob
            await expect(
                HTCL.connect(alice).deploy(ethers.ZeroAddress, timelock, hashlock, { value: amount })
            ).to.be.revertedWith("HTCL: Bob address cannot be zero");

            // Test with past timelock
            const pastTimelock = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
            await expect(
                HTCL.connect(alice).deploy(bob.address, pastTimelock, hashlock, { value: amount })
            ).to.be.revertedWith("HTCL: Timelock must be in the future");

            // Test with zero hashlock
            await expect(
                HTCL.connect(alice).deploy(bob.address, timelock, ethers.ZeroHash, { value: amount })
            ).to.be.revertedWith("HTCL: Hashlock cannot be zero");

            // Test with zero value
            await expect(
                HTCL.connect(alice).deploy(bob.address, timelock, hashlock, { value: 0 })
            ).to.be.revertedWith("HTCL: Contract must be funded");
        });
    });

    describe("Bob's Withdrawal", function () {
        it("Should allow Bob to withdraw with correct secret before timelock", async function () {
            await expect(htcl.connect(bob).bobWithdraw(secret))
                .to.emit(htcl, "BobWithdrawn")
                .withArgs(bob.address, amount, secret);

            expect(await htcl.getBalance()).to.equal(0);
        });

        it("Should reject Bob's withdrawal with incorrect secret", async function () {
            const wrongSecret = ethers.randomBytes(32);
            await expect(
                htcl.connect(bob).bobWithdraw(wrongSecret)
            ).to.be.revertedWith("HTCL: Invalid secret");
        });

        it("Should reject Bob's withdrawal after timelock expires", async function () {
            // Fast forward time past timelock
            await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
            await ethers.provider.send("evm_mine");

            await expect(
                htcl.connect(bob).bobWithdraw(secret)
            ).to.be.revertedWith("HTCL: Timelock has already expired");
        });

        it("Should reject withdrawal from non-Bob address", async function () {
            await expect(
                htcl.connect(charlie).bobWithdraw(secret)
            ).to.be.revertedWith("HTCL: Only Bob can call this function");
        });
    });

    describe("Alice's Withdrawal", function () {
        it("Should allow Alice to withdraw after timelock expires", async function () {
            // Fast forward time past timelock
            await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
            await ethers.provider.send("evm_mine");

            await expect(htcl.connect(alice).aliceWithdraw())
                .to.emit(htcl, "AliceWithdrawn")
                .withArgs(alice.address, amount);

            expect(await htcl.getBalance()).to.equal(0);
        });

        it("Should reject Alice's withdrawal before timelock expires", async function () {
            await expect(
                htcl.connect(alice).aliceWithdraw()
            ).to.be.revertedWith("HTCL: Timelock has not expired yet");
        });

        it("Should reject withdrawal from non-Alice address", async function () {
            // Fast forward time past timelock
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");

            await expect(
                htcl.connect(charlie).aliceWithdraw()
            ).to.be.revertedWith("HTCL: Only Alice can call this function");
        });
    });

    describe("Utility Functions", function () {
        it("Should correctly check if timelock has expired", async function () {
            expect(await htcl.isTimelockExpired()).to.be.false;

            // Fast forward time past timelock
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");

            expect(await htcl.isTimelockExpired()).to.be.true;
        });

        it("Should correctly validate secrets", async function () {
            expect(await htcl.isValidSecret(secret)).to.be.true;

            const wrongSecret = ethers.randomBytes(32);
            expect(await htcl.isValidSecret(wrongSecret)).to.be.false;
        });

        it("Should return correct contract information", async function () {
            const info = await htcl.getContractInfo();
            expect(info[0]).to.equal(alice.address); // _alice
            expect(info[1]).to.equal(bob.address);   // _bob
            expect(info[2]).to.equal(timelock);      // _timelock
            expect(info[3]).to.equal(hashlock);      // _hashlock
            expect(info[4]).to.equal(amount);        // _amount
            expect(info[5]).to.equal(amount);        // _balance
        });
    });

    describe("Complete Workflow", function () {
        it("Should handle the complete HTCL workflow - Bob withdraws first", async function () {
            // Bob withdraws with correct secret before timelock
            await htcl.connect(bob).bobWithdraw(secret);

            // Alice should not be able to withdraw after Bob has withdrawn
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");

            await expect(
                htcl.connect(alice).aliceWithdraw()
            ).to.be.revertedWith("HTCL: No funds to withdraw");
        });

        it("Should handle the complete HTCL workflow - Alice withdraws after timelock", async function () {
            // Wait for timelock to expire
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");

            // Alice withdraws after timelock expires
            await htcl.connect(alice).aliceWithdraw();

            // Bob should not be able to withdraw after Alice has withdrawn
            await expect(
                htcl.connect(bob).bobWithdraw(secret)
            ).to.be.revertedWith("HTCL: No funds to withdraw");
        });
    });
}); 