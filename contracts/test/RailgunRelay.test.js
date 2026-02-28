const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RailgunRelay", function () {
  let relay, paymaster, mockEntryPoint, verifier;
  let owner, feeRecipient, user, attacker;
  let mockUSDT, mockUSDC;

  // Deploy a minimal ERC-20 mock for testing
  async function deployMockToken(name, symbol, decimals = 18) {
    const Token = await ethers.getContractFactory("MockERC20");
    const token = await Token.deploy(name, symbol, decimals);
    await token.waitForDeployment();
    return token;
  }

  beforeEach(async function () {
    [owner, feeRecipient, user, attacker] = await ethers.getSigners();

    // Deploy Groth16Verifier
    const Verifier = await ethers.getContractFactory("Groth16Verifier");
    verifier = await Verifier.deploy();
    await verifier.waitForDeployment();

    // Deploy MockEntryPoint
    const MockEP = await ethers.getContractFactory("MockEntryPoint");
    mockEntryPoint = await MockEP.deploy();
    await mockEntryPoint.waitForDeployment();

    // Deploy ReputePaymaster
    const Paymaster = await ethers.getContractFactory("ReputePaymaster");
    paymaster = await Paymaster.deploy(
      await mockEntryPoint.getAddress(),
      await verifier.getAddress(),
      owner.address
    );
    await paymaster.waitForDeployment();

    // Deploy mock tokens
    mockUSDT = await deployMockToken("Tether USD", "USDT", 18);
    mockUSDC = await deployMockToken("USD Coin", "USDC", 18);

    // Deploy RailgunRelay
    const Relay = await ethers.getContractFactory("RailgunRelay");
    relay = await Relay.deploy(
      await paymaster.getAddress(),
      ethers.ZeroAddress, // No real Railgun on testnet
      feeRecipient.address
    );
    await relay.waitForDeployment();

    // Configure accepted tokens
    await relay.configureToken(
      await mockUSDT.getAddress(),
      ethers.parseUnits("1", 18), // min 1 USDT
      true
    );
    await relay.configureToken(
      await mockUSDC.getAddress(),
      ethers.parseUnits("1", 18), // min 1 USDC
      true
    );
  });

  describe("Deployment", function () {
    it("should deploy with correct paymaster", async function () {
      expect(await relay.paymaster()).to.equal(await paymaster.getAddress());
    });

    it("should deploy with correct fee recipient", async function () {
      expect(await relay.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("should deploy with 5% default fee", async function () {
      expect(await relay.feeBps()).to.equal(500n);
    });

    it("should deploy with correct min native deposit", async function () {
      expect(await relay.minNativeDeposit()).to.equal(ethers.parseEther("0.001"));
    });

    it("should revert deployment with zero paymaster", async function () {
      const Relay = await ethers.getContractFactory("RailgunRelay");
      await expect(
        Relay.deploy(ethers.ZeroAddress, ethers.ZeroAddress, feeRecipient.address)
      ).to.be.revertedWithCustomError(relay, "ZeroAddress");
    });

    it("should revert deployment with zero fee recipient", async function () {
      const Relay = await ethers.getContractFactory("RailgunRelay");
      await expect(
        Relay.deploy(await paymaster.getAddress(), ethers.ZeroAddress, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(relay, "ZeroAddress");
    });
  });

  describe("Token Configuration", function () {
    it("should configure accepted tokens", async function () {
      expect(await relay.acceptedTokens(await mockUSDT.getAddress())).to.be.true;
      expect(await relay.acceptedTokens(await mockUSDC.getAddress())).to.be.true;
    });

    it("should set correct minimum deposits", async function () {
      expect(await relay.minDeposit(await mockUSDT.getAddress())).to.equal(
        ethers.parseUnits("1", 18)
      );
    });

    it("should reject token configuration from non-owner", async function () {
      await expect(
        relay.connect(user).configureToken(await mockUSDT.getAddress(), 0n, false)
      ).to.be.revertedWithCustomError(relay, "OwnableUnauthorizedAccount");
    });

    it("should reject configuring zero address token", async function () {
      await expect(
        relay.configureToken(ethers.ZeroAddress, 0n, true)
      ).to.be.revertedWithCustomError(relay, "ZeroAddress");
    });

    it("should allow disabling a token", async function () {
      await relay.configureToken(await mockUSDT.getAddress(), 0n, false);
      expect(await relay.acceptedTokens(await mockUSDT.getAddress())).to.be.false;
    });
  });

  describe("ERC-20 Forwarding", function () {
    it("should forward tokens to paymaster with fee deduction", async function () {
      const usdtAddr = await mockUSDT.getAddress();
      const relayAddr = await relay.getAddress();
      const paymasterAddr = await paymaster.getAddress();

      // Simulate Railgun unshield: mint tokens to relay
      const depositAmount = ethers.parseUnits("100", 18); // 100 USDT
      await mockUSDT.mint(relayAddr, depositAmount);

      // Forward to paymaster
      const tx = await relay.forwardToPaymaster(usdtAddr);

      // Check fee: 5% of 100 = 5 USDT
      const expectedFee = ethers.parseUnits("5", 18);
      const expectedNet = ethers.parseUnits("95", 18);

      expect(await mockUSDT.balanceOf(feeRecipient.address)).to.equal(expectedFee);
      expect(await mockUSDT.balanceOf(paymasterAddr)).to.equal(expectedNet);
      expect(await mockUSDT.balanceOf(relayAddr)).to.equal(0n);

      // Check event
      await expect(tx)
        .to.emit(relay, "ShieldedPaymentReceived")
        .withArgs(usdtAddr, depositAmount, expectedFee, expectedNet);
    });

    it("should track total received", async function () {
      const usdtAddr = await mockUSDT.getAddress();
      const relayAddr = await relay.getAddress();

      await mockUSDT.mint(relayAddr, ethers.parseUnits("50", 18));
      await relay.forwardToPaymaster(usdtAddr);

      expect(await relay.totalReceived(usdtAddr)).to.equal(ethers.parseUnits("50", 18));

      // Second deposit
      await mockUSDT.mint(relayAddr, ethers.parseUnits("30", 18));
      await relay.forwardToPaymaster(usdtAddr);

      expect(await relay.totalReceived(usdtAddr)).to.equal(ethers.parseUnits("80", 18));
    });

    it("should reject forwarding unaccepted tokens", async function () {
      const unacceptedToken = await deployMockToken("Random", "RND");
      const relayAddr = await relay.getAddress();

      await unacceptedToken.mint(relayAddr, ethers.parseUnits("10", 18));

      await expect(
        relay.forwardToPaymaster(await unacceptedToken.getAddress())
      ).to.be.revertedWithCustomError(relay, "TokenNotAccepted");
    });

    it("should reject forwarding below minimum deposit", async function () {
      const usdtAddr = await mockUSDT.getAddress();
      const relayAddr = await relay.getAddress();

      // Send less than minimum (1 USDT)
      await mockUSDT.mint(relayAddr, ethers.parseUnits("0.5", 18));

      await expect(
        relay.forwardToPaymaster(usdtAddr)
      ).to.be.revertedWithCustomError(relay, "BelowMinimumDeposit");
    });

    it("should forward with zero fee when fee is 0", async function () {
      await relay.setFee(0);
      const usdtAddr = await mockUSDT.getAddress();
      const relayAddr = await relay.getAddress();
      const paymasterAddr = await paymaster.getAddress();

      const amount = ethers.parseUnits("10", 18);
      await mockUSDT.mint(relayAddr, amount);
      await relay.forwardToPaymaster(usdtAddr);

      // All goes to paymaster
      expect(await mockUSDT.balanceOf(paymasterAddr)).to.equal(amount);
      expect(await mockUSDT.balanceOf(feeRecipient.address)).to.equal(0n);
    });
  });

  describe("Native BNB Forwarding", function () {
    it("should forward native BNB to paymaster with fee", async function () {
      const relayAddr = await relay.getAddress();
      const paymasterAddr = await paymaster.getAddress();

      // Send BNB to relay (simulating Railgun unshield)
      const amount = ethers.parseEther("1.0");
      await owner.sendTransaction({ to: relayAddr, value: amount });

      const feeRecipientBefore = await ethers.provider.getBalance(feeRecipient.address);
      const paymasterBefore = await ethers.provider.getBalance(paymasterAddr);

      const tx = await relay.forwardNativeToPaymaster();

      const expectedFee = ethers.parseEther("0.05"); // 5% of 1.0
      const expectedNet = ethers.parseEther("0.95");

      const feeRecipientAfter = await ethers.provider.getBalance(feeRecipient.address);
      const paymasterAfter = await ethers.provider.getBalance(paymasterAddr);

      expect(feeRecipientAfter - feeRecipientBefore).to.equal(expectedFee);
      expect(paymasterAfter - paymasterBefore).to.equal(expectedNet);

      await expect(tx)
        .to.emit(relay, "NativePaymentReceived")
        .withArgs(amount, expectedFee, expectedNet);
    });

    it("should reject native forward below minimum", async function () {
      const relayAddr = await relay.getAddress();

      // Send less than minimum (0.001 BNB)
      await owner.sendTransaction({
        to: relayAddr,
        value: ethers.parseEther("0.0005"),
      });

      await expect(
        relay.forwardNativeToPaymaster()
      ).to.be.revertedWithCustomError(relay, "BelowMinimumDeposit");
    });

    it("should emit NativeReceived on receive", async function () {
      const relayAddr = await relay.getAddress();
      const amount = ethers.parseEther("0.5");

      await expect(
        owner.sendTransaction({ to: relayAddr, value: amount })
      ).to.emit(relay, "NativeReceived").withArgs(owner.address, amount);
    });

    it("should track total native received", async function () {
      const relayAddr = await relay.getAddress();

      await owner.sendTransaction({ to: relayAddr, value: ethers.parseEther("1.0") });
      await relay.forwardNativeToPaymaster();
      expect(await relay.totalNativeReceived()).to.equal(ethers.parseEther("1.0"));

      await owner.sendTransaction({ to: relayAddr, value: ethers.parseEther("0.5") });
      await relay.forwardNativeToPaymaster();
      expect(await relay.totalNativeReceived()).to.equal(ethers.parseEther("1.5"));
    });
  });

  describe("View Functions", function () {
    it("should report pending token balance", async function () {
      const usdtAddr = await mockUSDT.getAddress();
      const relayAddr = await relay.getAddress();

      await mockUSDT.mint(relayAddr, ethers.parseUnits("42", 18));
      expect(await relay.pendingTokenBalance(usdtAddr)).to.equal(
        ethers.parseUnits("42", 18)
      );
    });

    it("should report pending native balance", async function () {
      const relayAddr = await relay.getAddress();
      await owner.sendTransaction({ to: relayAddr, value: ethers.parseEther("2.0") });
      expect(await relay.pendingNativeBalance()).to.equal(ethers.parseEther("2.0"));
    });

    it("should calculate net correctly", async function () {
      const [net, fee] = await relay.calculateNet(ethers.parseEther("100"));
      expect(fee).to.equal(ethers.parseEther("5")); // 5%
      expect(net).to.equal(ethers.parseEther("95"));
    });
  });

  describe("Admin Functions", function () {
    it("should allow owner to update paymaster", async function () {
      const newPaymaster = user.address;
      await relay.setPaymaster(newPaymaster);
      expect(await relay.paymaster()).to.equal(newPaymaster);
    });

    it("should reject updating paymaster to zero address", async function () {
      await expect(
        relay.setPaymaster(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(relay, "ZeroAddress");
    });

    it("should allow owner to update fee", async function () {
      await relay.setFee(300); // 3%
      expect(await relay.feeBps()).to.equal(300n);
    });

    it("should reject fee above MAX_FEE_BPS", async function () {
      await expect(relay.setFee(1001)).to.be.revertedWithCustomError(relay, "FeeTooHigh");
    });

    it("should allow owner to update fee recipient", async function () {
      await relay.setFeeRecipient(user.address);
      expect(await relay.feeRecipient()).to.equal(user.address);
    });

    it("should reject non-owner admin calls", async function () {
      await expect(
        relay.connect(attacker).setFee(0)
      ).to.be.revertedWithCustomError(relay, "OwnableUnauthorizedAccount");

      await expect(
        relay.connect(attacker).setPaymaster(attacker.address)
      ).to.be.revertedWithCustomError(relay, "OwnableUnauthorizedAccount");

      await expect(
        relay.connect(attacker).setFeeRecipient(attacker.address)
      ).to.be.revertedWithCustomError(relay, "OwnableUnauthorizedAccount");
    });

    it("should allow owner to update Railgun Relay Adapt address", async function () {
      const newAdapt = user.address;
      await relay.setRailgunRelayAdapt(newAdapt);
      expect(await relay.railgunRelayAdapt()).to.equal(newAdapt);
    });

    it("should allow owner to update min native deposit", async function () {
      await relay.setMinNativeDeposit(ethers.parseEther("0.01"));
      expect(await relay.minNativeDeposit()).to.equal(ethers.parseEther("0.01"));
    });
  });

  describe("Emergency Rescue", function () {
    it("should rescue stuck ERC-20 tokens", async function () {
      const usdtAddr = await mockUSDT.getAddress();
      const relayAddr = await relay.getAddress();

      // Accidentally sent tokens while token is disabled
      await relay.configureToken(usdtAddr, 0n, false);
      const amount = ethers.parseUnits("50", 18);
      await mockUSDT.mint(relayAddr, amount);

      await relay.rescueTokens(usdtAddr, owner.address, amount);
      expect(await mockUSDT.balanceOf(owner.address)).to.equal(amount);
    });

    it("should rescue stuck native BNB", async function () {
      const relayAddr = await relay.getAddress();
      const amount = ethers.parseEther("0.5");
      await owner.sendTransaction({ to: relayAddr, value: amount });

      const before = await ethers.provider.getBalance(user.address);
      await relay.rescueNative(user.address, amount);
      const after = await ethers.provider.getBalance(user.address);

      expect(after - before).to.equal(amount);
    });

    it("should reject rescue to zero address", async function () {
      await expect(
        relay.rescueTokens(await mockUSDT.getAddress(), ethers.ZeroAddress, 1n)
      ).to.be.revertedWithCustomError(relay, "ZeroAddress");

      await expect(
        relay.rescueNative(ethers.ZeroAddress, 1n)
      ).to.be.revertedWithCustomError(relay, "ZeroAddress");
    });
  });
});
