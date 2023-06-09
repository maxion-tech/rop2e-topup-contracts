import { ethers } from "hardhat";

async function main() {

  const { CURRENCY_TOKEN_ADDRESS, TREASURY_ADDRESS, PARTNER_ADDRESS, PLATFORM_ADDRESS, ADMIN_ADDRESS } = process.env;

  if (!CURRENCY_TOKEN_ADDRESS ||
    !TREASURY_ADDRESS ||
    !PARTNER_ADDRESS ||
    !PLATFORM_ADDRESS ||
    !ADMIN_ADDRESS) {
    throw new Error("Parameter form env file not correct");
  }
  const roverseTopupContractFactory = await ethers.getContractFactory("ROverseTopupContract");

  const treasuryPercent = ethers.BigNumber.from(30 * 10 ** 8); // 30%
  const partnerPercent = ethers.BigNumber.from(42 * 10 ** 8); // 42%
  const platformPercent = ethers.BigNumber.from(28 * 10 ** 8); // 28%

  const roverseTopupContract = await roverseTopupContractFactory.deploy(
    CURRENCY_TOKEN_ADDRESS,
    TREASURY_ADDRESS,
    PARTNER_ADDRESS,
    PLATFORM_ADDRESS,
    treasuryPercent,
    partnerPercent,
    platformPercent,
    ADMIN_ADDRESS,
  );

  await roverseTopupContract.deployed();

  console.log(`Deployed ROverse Topup contract to ${roverseTopupContract.address}`);
  console.log(`Verify contract by:
  npx hardhat verify --network ??? ${roverseTopupContract.address} ${CURRENCY_TOKEN_ADDRESS} ${TREASURY_ADDRESS} ${PARTNER_ADDRESS} ${PLATFORM_ADDRESS} ${treasuryPercent} ${partnerPercent} ${platformPercent}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
