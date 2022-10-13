import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Topup contract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [owner, platform, partner, treasury] = await ethers.getSigners();

    const DENOMINATOR = 10 ** 10;
    const platformPercent = ethers.BigNumber.from(5 * 10 ** 8); // 5%
    const partnerPercent = ethers.BigNumber.from(4 * 10 ** 8); //4%

    const currencyTokenContractFactory = await ethers.getContractFactory("ERC20Token");
    const currencyContract = await currencyTokenContractFactory.deploy("Currency", "CURRENCY");

    const topupContractFactory = await ethers.getContractFactory("ROP2ETopupContract");
    const topupContract = await topupContractFactory.deploy(
      currencyContract.address,
      platform.address,
      partner.address,
      treasury.address,
      platformPercent,
      partnerPercent,
    );

    return { currencyContract, topupContract, platformPercent, partnerPercent, DENOMINATOR, owner, platform, partner, treasury };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { topupContract, owner } = await loadFixture(deployFixture);
      expect(await topupContract.owner()).to.equal(owner.address);
    });

    it("Should set the right currency", async function () {
      const { topupContract, currencyContract } = await loadFixture(deployFixture);
      expect(await topupContract.currencyContract()).to.equal(currencyContract.address);
    });

    it("Should set the right percent", async function () {
      const { topupContract, partnerPercent, platformPercent, DENOMINATOR } = await loadFixture(deployFixture);
      expect(await topupContract.getPertnerPercent()).to.eq(partnerPercent.mul(DENOMINATOR));
      expect(await topupContract.getPlatformPercent()).to.eq(platformPercent.mul(DENOMINATOR));
    });
  });
});
