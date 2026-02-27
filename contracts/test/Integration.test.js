// Full integration test: simulates the complete Repute flow
// Verifier deployment → Key setup → Paymaster deployment → Activation → Gas sponsoring

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Repute Integration Test", function () {
  let verifier, paymaster, mockEntryPoint;
  let owner, walletB, bundler;

  beforeEach(async function () {
    [owner, walletB, bundler] = await ethers.getSigners();

    // 1. Deploy MockEntryPoint
    const MockEP = await ethers.getContractFactory("MockEntryPoint");
    mockEntryPoint = await MockEP.deploy();
    await mockEntryPoint.waitForDeployment();

    // 2. Deploy Groth16Verifier
    const Verifier = await ethers.getContractFactory("Groth16Verifier");
    verifier = await Verifier.deploy();
    await verifier.waitForDeployment();

    // 3. Deploy ReputePaymaster
    const Paymaster = await ethers.getContractFactory("ReputePaymaster");
    paymaster = await Paymaster.deploy(
      await mockEntryPoint.getAddress(),
      await verifier.getAddress(),
      owner.address
    );
    await paymaster.waitForDeployment();

    // 4. Fund the paymaster
    await paymaster.deposit({ value: ethers.parseEther("1.0") });
    await paymaster.addStake(86400, { value: ethers.parseEther("0.5") });
  });

  describe("Full Deployment Flow", function () {
    it("should have all contracts deployed", async function () {
      expect(await mockEntryPoint.getAddress()).to.be.properAddress;
      expect(await verifier.getAddress()).to.be.properAddress;
      expect(await paymaster.getAddress()).to.be.properAddress;
    });

    it("should have paymaster funded on EntryPoint", async function () {
      const deposit = await mockEntryPoint.balanceOf(await paymaster.getAddress());
      expect(deposit).to.equal(ethers.parseEther("1.0"));
    });

    it("should have paymaster staked", async function () {
      const depositInfo = await mockEntryPoint.getDepositInfo(await paymaster.getAddress());
      expect(depositInfo.staked).to.equal(true);
      expect(depositInfo.stake).to.equal(ethers.parseEther("0.5"));
    });

    it("should have correct default criteria", async function () {
      expect(await paymaster.minBalance()).to.equal(ethers.parseEther("0.01"));
      expect(await paymaster.minTxCount()).to.equal(5n);
      expect(await paymaster.minWalletAge()).to.equal(30n);
      expect(await paymaster.maxSponsoredOps()).to.equal(10n);
    });
  });

  describe("Criteria Management", function () {
    it("should update criteria correctly", async function () {
      await paymaster.setCriteria(
        ethers.parseEther("0.1"),  // 0.1 BNB min
        10n,                       // 10 txs
        60n,                       // 60 days
        20n                        // 20 sponsored ops
      );

      expect(await paymaster.minBalance()).to.equal(ethers.parseEther("0.1"));
      expect(await paymaster.minTxCount()).to.equal(10n);
      expect(await paymaster.minWalletAge()).to.equal(60n);
      expect(await paymaster.maxSponsoredOps()).to.equal(20n);
    });

    it("should emit CriteriaUpdated event", async function () {
      await expect(
        paymaster.setCriteria(
          ethers.parseEther("0.1"),
          10n,
          60n,
          20n
        )
      ).to.emit(paymaster, "CriteriaUpdated");
    });
  });

  describe("Wallet Status Tracking", function () {
    it("should report unactivated wallet correctly", async function () {
      const [activated, opsRemaining, activatedAt] = await paymaster.getWalletStatus(walletB.address);
      expect(activated).to.equal(false);
      expect(opsRemaining).to.equal(0n);
      expect(activatedAt).to.equal(0n);
    });

    it("should report unused nullifier correctly", async function () {
      const testNullifier = ethers.keccak256(ethers.toUtf8Bytes("test"));
      expect(await paymaster.isNullifierUsed(testNullifier)).to.equal(false);
    });
  });

  describe("Verifier Setup", function () {
    it("should set verification key and mark initialized", async function () {
      // Mock verification key (6 IC points for 5 public signals)
      const alfa1 = [1n, 2n];
      const beta2 = [[1n, 2n], [3n, 4n]];
      const gamma2 = [[5n, 6n], [7n, 8n]];
      const delta2 = [[9n, 10n], [11n, 12n]];
      const IC = [
        [1n, 2n], [3n, 4n], [5n, 6n],
        [7n, 8n], [9n, 10n], [11n, 12n],
      ];

      await verifier.setVerificationKey(alfa1, beta2, gamma2, delta2, IC);
      expect(await verifier.initialized()).to.equal(true);
    });

    it("should emit VerificationKeySet event", async function () {
      const alfa1 = [1n, 2n];
      const beta2 = [[1n, 2n], [3n, 4n]];
      const gamma2 = [[5n, 6n], [7n, 8n]];
      const delta2 = [[9n, 10n], [11n, 12n]];
      const IC = [
        [1n, 2n], [3n, 4n], [5n, 6n],
        [7n, 8n], [9n, 10n], [11n, 12n],
      ];

      await expect(
        verifier.setVerificationKey(alfa1, beta2, gamma2, delta2, IC)
      ).to.emit(verifier, "VerificationKeySet");
    });
  });

  describe("Paymaster Funding", function () {
    it("should allow additional deposits", async function () {
      await paymaster.deposit({ value: ethers.parseEther("0.5") });
      const deposit = await mockEntryPoint.balanceOf(await paymaster.getAddress());
      expect(deposit).to.equal(ethers.parseEther("1.5")); // 1.0 + 0.5
    });

    it("should return correct deposit amount", async function () {
      const deposit = await paymaster.getDeposit();
      expect(deposit).to.equal(ethers.parseEther("1.0"));
    });
  });

  describe("Access Control", function () {
    it("should prevent non-owner from setting criteria", async function () {
      await expect(
        paymaster.connect(walletB).setCriteria(1n, 1n, 1n, 1n)
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });

    it("should prevent non-owner from adding stake", async function () {
      await expect(
        paymaster.connect(walletB).addStake(86400, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });

    it("should prevent non-owner from withdrawing", async function () {
      await expect(
        paymaster.connect(walletB).withdrawTo(walletB.address, ethers.parseEther("0.1"))
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });
  });
});
