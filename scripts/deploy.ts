import { ethers } from "hardhat";

async function main() {

  const { CURRENCY_TOKEN_ADDRESS, TREASURY_ADDRESS, PARTNER_ADDRESS, PLATFORM_ADDRESS } = process.env;

  if (!CURRENCY_TOKEN_ADDRESS ||
    !TREASURY_ADDRESS ||
    !PARTNER_ADDRESS ||
    !PLATFORM_ADDRESS) {
    throw new Error("Parameter form env file not correct");
  }
  const rop2eTopupContractFactory = await ethers.getContractFactory("ROP2ETopupContract");

  const treasuryPercent = ethers.BigNumber.from(30 * 10 ** 8); // 30%
  const partnerPercent = ethers.BigNumber.from(42 * 10 ** 8); // 42%
  const platformPercent = ethers.BigNumber.from(28 * 10 ** 8); // 28%

  const rop2eTopupContract = await rop2eTopupContractFactory.deploy(
    CURRENCY_TOKEN_ADDRESS,
    TREASURY_ADDRESS,
    PARTNER_ADDRESS,
    PLATFORM_ADDRESS,
    treasuryPercent,
    partnerPercent,
    platformPercent,
  );

  await rop2eTopupContract.deployed();

  console.log(`Deployed ROP2E Topup contract to ${rop2eTopupContract.address}`);
  console.log(`Verify contract by:
  npx hardhat verify --network ??? ${rop2eTopupContract.address} ${CURRENCY_TOKEN_ADDRESS} ${TREASURY_ADDRESS} ${PARTNER_ADDRESS} ${PLATFORM_ADDRESS} ${treasuryPercent} ${partnerPercent} ${platformPercent}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
