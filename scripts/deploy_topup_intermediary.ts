import { ethers } from "hardhat";

async function main() {

  const { ION_STABLECOIN_ADDRESS, TOPUP_CONTRACT_ADDRESS } = process.env;

  if (!ION_STABLECOIN_ADDRESS ||
    !TOPUP_CONTRACT_ADDRESS) {
    throw new Error("Parameter form env file not correct");
  }
  const roP2ETopupIntermediaryContractFactory = await ethers.getContractFactory("ROP2ETopupIntermediaryContract");

 
  const roP2ETopupIntermediaryContract = await roP2ETopupIntermediaryContractFactory.deploy(
    ION_STABLECOIN_ADDRESS,
    TOPUP_CONTRACT_ADDRESS,
  );

  await roP2ETopupIntermediaryContract.deployed();

  console.log(`Deployed ROP2E Topup Intermediary contract to ${roP2ETopupIntermediaryContract.address}`);
  console.log(`Verify contract by:
  npx hardhat verify --network ??? ${roP2ETopupIntermediaryContract.address} ${ION_STABLECOIN_ADDRESS} ${TOPUP_CONTRACT_ADDRESS}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
