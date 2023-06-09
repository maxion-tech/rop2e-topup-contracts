import { ethers } from "hardhat";
import { LedgerSigner } from "@ethersproject/hardware-wallets";
import hre from "hardhat";

async function main() {

  const { ION_TOKEN_ADDRESS, TOPUP_CONTRACT_ADDRESS, ADMIN_ADDRESS } = process.env;

  if (!ION_TOKEN_ADDRESS ||
    !TOPUP_CONTRACT_ADDRESS ||
    !ADMIN_ADDRESS) {
    throw new Error("Parameter form env file not correct");
  }

  const networkUrl = (hre.network.config as any).url;

  if (!networkUrl) throw new Error("Please make sure all environment variable is loaded");

  const provider = new ethers.providers.JsonRpcProvider(networkUrl);
  const type = 'hid';
  const path = `m/44'/60'/0'/0/0`;
  const signer = new LedgerSigner(provider, type, path);

  const address = await signer.getAddress();

  console.log(`Deploying from ${address}`);

  const roverseTopupIntermediaryContractFactory = await ethers.getContractFactory("ROverseTopupIntermediaryContract");

  const roverseTopupIntermediaryContract = await roverseTopupIntermediaryContractFactory.connect(signer).deploy(
    ION_TOKEN_ADDRESS,
    TOPUP_CONTRACT_ADDRESS,
    ADMIN_ADDRESS,
  );

  await roverseTopupIntermediaryContract.deployed();

  console.log(`Deployed ROverse Topup Intermediary contract to ${roverseTopupIntermediaryContract.address}`);
  console.log(`Verify contract by:
  npx hardhat verify --network ${hre.network.name} ${roverseTopupIntermediaryContract.address} ${ION_TOKEN_ADDRESS} ${TOPUP_CONTRACT_ADDRESS} ${ADMIN_ADDRESS}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
