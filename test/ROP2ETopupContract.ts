import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { rand } from "../utils";

const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
describe("Topup contract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [
      owner,
      treasury,
      partner,
      user,

      treasuryNew,
      partnerNew,
      platformNew,

      platform,
    ] = await ethers.getSigners();

    const treasuryPercent = ethers.BigNumber.from(30 * 10 ** 8); // 30%
    const partnerPercent = ethers.BigNumber.from(42 * 10 ** 8); // 42%
    const platformPercent = ethers.BigNumber.from(28 * 10 ** 8); // 28%

    const currencyTokenContractFactory = await ethers.getContractFactory("ERC20Token");
    const currencyTokenContract = await currencyTokenContractFactory.deploy("Currency", "CURRENCY");
    const currencyTokenContractNew = await currencyTokenContractFactory.deploy("CurrencyNew", "CURRENCY-NEW");


    const topupContractFactory = await ethers.getContractFactory("ROP2ETopupContract");

    const topupContract = await topupContractFactory.deploy(
      currencyTokenContract.address,
      treasury.address,
      partner.address,
      platform.address,
      treasuryPercent,
      partnerPercent,
      platformPercent,
    );

    return {
      currencyTokenContract,
      currencyTokenContractNew,
      topupContract,
      treasuryPercent,
      partnerPercent,
      platformPercent,

      owner,

      treasury,
      platform,
      partner,

      user,

      treasuryNew,
      partnerNew,
      platformNew,

    };
  }

  describe("Deployment", () => {
    it("Should set the right owner", async () => {
      const { topupContract, owner } = await loadFixture(deployFixture);
      expect(await topupContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("Should set the right currency", async () => {
      const { topupContract, currencyTokenContract } = await loadFixture(deployFixture);
      expect(await topupContract.currencyToken()).to.equal(currencyTokenContract.address);
    });

    it("Should set the right percent", async () => {
      const { topupContract, treasuryPercent, partnerPercent, platformPercent } = await loadFixture(deployFixture);
      expect(await topupContract.treasuryPercent()).to.eq(treasuryPercent);
      expect(await topupContract.partnerPercent()).to.eq(partnerPercent);
      expect(await topupContract.platformPercent()).to.eq(platformPercent);
    });

    it("Should set the right address", async () => {
      const { topupContract, treasury, partner, platform } = await loadFixture(deployFixture);
      expect(await topupContract.treasuryAddress()).to.eq(treasury.address);
      expect(await topupContract.partnerAddress()).to.eq(partner.address);
      expect(await topupContract.platformAddress()).to.eq(platform.address);
    });

  });

  describe("State config", () => {

    it("Should set treasury address", async () => {
      const { topupContract, treasuryNew } = await loadFixture(deployFixture);
      await topupContract.setTreasuryAddress(treasuryNew.address);
      expect(await topupContract.treasuryAddress()).to.eq(treasuryNew.address);
    });

    it("Should set treasury address", async () => {
      const { topupContract, partnerNew } = await loadFixture(deployFixture);
      await topupContract.setPartnerAddress(partnerNew.address);
      expect(await topupContract.partnerAddress()).to.eq(partnerNew.address);
    });

    it("Should set platform address", async () => {
      const { topupContract, platformNew } = await loadFixture(deployFixture);
      await topupContract.setPlatformAddress(platformNew.address);
      expect(await topupContract.platformAddress()).to.eq(platformNew.address);
    });

    it("Should not set zero address", async () => {
      const { topupContract } = await loadFixture(deployFixture);
      await expect(topupContract.setTreasuryAddress(ethers.constants.AddressZero)).to.revertedWith("Treasury address must not be zero");
      await expect(topupContract.setPartnerAddress(ethers.constants.AddressZero)).to.revertedWith("Partner address must not be zero");
      await expect(topupContract.setPlatformAddress(ethers.constants.AddressZero)).to.revertedWith("Platform address must not be zero");
      await expect(topupContract.setCurrencyTokenAddress(ethers.constants.AddressZero)).to.revertedWith("Currency contract must not be zero");
    });

    it("Should set percent", async () => {
      const { topupContract } = await loadFixture(deployFixture);
      await topupContract.setPercent(
        ethers.BigNumber.from(30 * 10 ** 8), // 30% treasury
        ethers.BigNumber.from(40 * 10 ** 8), // 40% partner
        ethers.BigNumber.from(30 * 10 ** 8)); // 30% platform

      expect(await topupContract.treasuryPercent()).to.eq(ethers.BigNumber.from(30 * 10 ** 8));
      expect(await topupContract.partnerPercent()).to.eq(ethers.BigNumber.from(40 * 10 ** 8));
      expect(await topupContract.platformPercent()).to.eq(ethers.BigNumber.from(30 * 10 ** 8));
    });

    it("Should can not set percent more than 100%", async () => {
      const { topupContract } = await loadFixture(deployFixture);
      // Error if set total percent more than 100
      await expect(topupContract.setPercent(
        ethers.BigNumber.from(31 * 10 ** 8), // 31% treasury
        ethers.BigNumber.from(42 * 10 ** 8), // 42% partner
        ethers.BigNumber.from(28 * 10 ** 8)) // 28% platform
      ).to.revertedWith("Total percent must be 100");
    });

    it("Should set currency token address", async () => {
      const { topupContract, currencyTokenContractNew } = await loadFixture(deployFixture);
      await topupContract.setCurrencyTokenAddress(currencyTokenContractNew.address);
      expect(await topupContract.currencyToken()).to.eq(currencyTokenContractNew.address);
    });

  });

  describe("Topup", () => {

    it("Should topup 100 times with random fee and topup amount", async () => {
      const topupTestWithRandomNumber = async () => {
        const { topupContract, currencyTokenContract, user, treasury, partner, platform } = await loadFixture(deployFixture);

        const treasuryPercent = rand(10, 20);
        const partnerPercent = rand(10, 20);
        const platformPercent = 100 - (treasuryPercent + partnerPercent);
        const amountToTopup = rand(1, 100_000_000);

        const treasuryMustReceive = Math.floor(amountToTopup * treasuryPercent / 100);
        const partnerMustReceive = Math.floor(amountToTopup * partnerPercent / 100);
        const platformMustReceive = Math.floor(amountToTopup * platformPercent / 100);

        await topupContract.setPercent(
          ethers.BigNumber.from(treasuryPercent * 10 ** 8),
          ethers.BigNumber.from(partnerPercent * 10 ** 8),
          ethers.BigNumber.from(platformPercent * 10 ** 8),
        );

        await currencyTokenContract.mint(user.address, ethers.utils.parseEther(amountToTopup.toString()));
        await currencyTokenContract.connect(user).approve(topupContract.address, ethers.constants.MaxUint256);
        await topupContract.connect(user).topup(amountToTopup.toString(), "REF");

        expect(await currencyTokenContract.balanceOf(treasury.address)).to.eq(treasuryMustReceive);
        expect(await currencyTokenContract.balanceOf(partner.address)).to.eq(partnerMustReceive);
        expect(await currencyTokenContract.balanceOf(platform.address)).to.eq(platformMustReceive);

        expect(await currencyTokenContract.balanceOf(topupContract.address)).to.eq(ethers.constants.Zero);
      }

      // test topup 100 time
      for (let index = 0; index < 100; index++) {
        await topupTestWithRandomNumber();
      }


    });
  });
});
