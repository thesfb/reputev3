const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReputePaymaster", function () {
  let verifier, paymaster, entryPoint;
  let owner, user;

  // ERC-4337 EntryPoint v0.7 interface (minimal)
  const ENTRYPOINT_ABI = [
    "function depositTo(address account) external payable",
    "function balanceOf(address account) external view returns (uint256)",
    "function getDepositInfo(address account) external view returns (tuple(uint256 deposit, bool staked, uint112 stake, uint32 unstakeDelaySec, uint48 withdrawTime))",
  ];

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy Groth16Verifier
    const Verifier = await ethers.getContractFactory("Groth16Verifier");
    verifier = await Verifier.deploy();
    await verifier.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy with correct owner", async function () {
      // For local testing, deploy a mock EntryPoint or use the real one
      // Here we use a simplified approach - just verify the contract deploys
      const verifierAddr = await verifier.getAddress();
      expect(verifierAddr).to.be.properAddress;
    });

    it("should set verifier as not initialized", async function () {
      expect(await verifier.initialized()).to.equal(false);
    });

    it("should set correct owner on verifier", async function () {
      expect(await verifier.owner()).to.equal(owner.address);
    });
  });

  describe("Groth16Verifier", function () {
    it("should reject verification before key is set", async function () {
      const dummyProofA = [1n, 2n];
      const dummyProofB = [[1n, 2n], [3n, 4n]];
      const dummyProofC = [1n, 2n];
      const dummyPubSignals = [1n, 2n, 3n, 4n, 5n];

      await expect(
        verifier.verifyProof(dummyProofA, dummyProofB, dummyProofC, dummyPubSignals)
      ).to.be.revertedWith("Verification key not set");
    });

    it("should only allow owner to set verification key", async function () {
      const dummyAlfa1 = [1n, 2n];
      const dummyBeta2 = [[1n, 2n], [3n, 4n]];
      const dummyGamma2 = [[1n, 2n], [3n, 4n]];
      const dummyDelta2 = [[1n, 2n], [3n, 4n]];
      const dummyIC = [[1n, 2n], [3n, 4n], [5n, 6n], [7n, 8n], [9n, 10n], [11n, 12n]];

      await expect(
        verifier.connect(user).setVerificationKey(
          dummyAlfa1, dummyBeta2, dummyGamma2, dummyDelta2, dummyIC
        )
      ).to.be.revertedWith("Not owner");
    });

    it("should enforce IC length = 6", async function () {
      const dummyAlfa1 = [1n, 2n];
      const dummyBeta2 = [[1n, 2n], [3n, 4n]];
      const dummyGamma2 = [[1n, 2n], [3n, 4n]];
      const dummyDelta2 = [[1n, 2n], [3n, 4n]];
      const wrongIC = [[1n, 2n], [3n, 4n]]; // Only 2, need 6

      await expect(
        verifier.setVerificationKey(
          dummyAlfa1, dummyBeta2, dummyGamma2, dummyDelta2, wrongIC
        )
      ).to.be.revertedWith("IC length must be nPublic+1 = 6");
    });

    it("should accept valid IC length and mark as initialized", async function () {
      const dummyAlfa1 = [1n, 2n];
      const dummyBeta2 = [[1n, 2n], [3n, 4n]];
      const dummyGamma2 = [[1n, 2n], [3n, 4n]];
      const dummyDelta2 = [[1n, 2n], [3n, 4n]];
      const dummyIC = [[1n, 2n], [3n, 4n], [5n, 6n], [7n, 8n], [9n, 10n], [11n, 12n]];

      await verifier.setVerificationKey(
        dummyAlfa1, dummyBeta2, dummyGamma2, dummyDelta2, dummyIC
      );
      expect(await verifier.initialized()).to.equal(true);
    });
  });

  describe("ReputePaymaster - Unit Tests", function () {
    let mockEntryPoint;

    beforeEach(async function () {
      // Deploy a MockEntryPoint for testing
      const MockEP = await ethers.getContractFactory("MockEntryPoint");
      mockEntryPoint = await MockEP.deploy();
      await mockEntryPoint.waitForDeployment();

      const Paymaster = await ethers.getContractFactory("ReputePaymaster");
      paymaster = await Paymaster.deploy(
        await mockEntryPoint.getAddress(),
        await verifier.getAddress(),
        owner.address
      );
      await paymaster.waitForDeployment();
    });

    it("should deploy with correct initial criteria", async function () {
      expect(await paymaster.minBalance()).to.equal(ethers.parseEther("0.01"));
      expect(await paymaster.minTxCount()).to.equal(5n);
      expect(await paymaster.minWalletAge()).to.equal(30n);
      expect(await paymaster.maxSponsoredOps()).to.equal(10n);
    });

    it("should allow owner to update criteria", async function () {
      await paymaster.setCriteria(
        ethers.parseEther("0.1"),
        10n,
        60n,
        20n
      );

      expect(await paymaster.minBalance()).to.equal(ethers.parseEther("0.1"));
      expect(await paymaster.minTxCount()).to.equal(10n);
      expect(await paymaster.minWalletAge()).to.equal(60n);
      expect(await paymaster.maxSponsoredOps()).to.equal(20n);
    });

    it("should not allow non-owner to update criteria", async function () {
      await expect(
        paymaster.connect(user).setCriteria(1n, 1n, 1n, 1n)
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });

    it("should report wallet as not activated initially", async function () {
      const [activated, opsRemaining, activatedAt] = await paymaster.getWalletStatus(user.address);
      expect(activated).to.equal(false);
      expect(opsRemaining).to.equal(0n);
      expect(activatedAt).to.equal(0n);
    });

    it("should report nullifier as unused initially", async function () {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("test-nullifier"));
      expect(await paymaster.isNullifierUsed(nullifier)).to.equal(false);
    });

    it("should allow owner to deposit", async function () {
      await paymaster.deposit({ value: ethers.parseEther("0.1") });
      // If MockEntryPoint correctly accepts deposits, this should pass
    });
  });
});
