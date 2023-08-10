import { ethers } from "hardhat";
import { LedgerSigner } from "@ethersproject/hardware-wallets";
import hre from "hardhat";

async function main() {

    const { CURRENCY_TOKEN_ADDRESS, TREASURY_ADDRESS, PARTNER_ADDRESS, PLATFORM_ADDRESS, ADMIN_ADDRESS } = process.env;

    if (!CURRENCY_TOKEN_ADDRESS ||
        !TREASURY_ADDRESS ||
        !PARTNER_ADDRESS ||
        !PLATFORM_ADDRESS ||
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

    const landverseTopupContractFactory = await ethers.getContractFactory("LandVerseTopupContract");

    const treasuryPercent = ethers.BigNumber.from(25 * 10 ** 8); // 25%
    const partnerPercent = ethers.BigNumber.from(30 * 10 ** 8); // 30%
    const platformPercent = ethers.BigNumber.from(45 * 10 ** 8); // 45%

    const landverseTopupContract = await landverseTopupContractFactory.connect(signer).deploy(
        CURRENCY_TOKEN_ADDRESS,
        TREASURY_ADDRESS,
        PARTNER_ADDRESS,
        PLATFORM_ADDRESS,
        treasuryPercent,
        partnerPercent,
        platformPercent,
        ADMIN_ADDRESS,
    );

    await landverseTopupContract.deployed();

    console.log(`Deployed LandVerse Topup contract to ${landverseTopupContract.address}`);
    console.log(`Verify contract by:
  npx hardhat verify --network ${hre.network.name} ${landverseTopupContract.address} ${CURRENCY_TOKEN_ADDRESS} ${TREASURY_ADDRESS} ${PARTNER_ADDRESS} ${PLATFORM_ADDRESS} ${treasuryPercent} ${partnerPercent} ${platformPercent} ${ADMIN_ADDRESS}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
