import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { rand } from "../utils";

describe("Intermediary contract", function () {


    async function deployFixtureIONTokenContract() {
        const FEE_DENOMINATOR = 1e10; // 1e18 - 1e10 = 1e8
        const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;

        const MAX_FEE_PERCENT = ethers.utils.parseEther((90).toString()).div(FEE_DENOMINATOR); // 90%
        const INIT_DEPOSIT_FEE_PERCENT = 0; // 0%
        const INIT_WITHDRAW_FEE_PERCENT = ethers.utils.parseEther((1).toString()).div(
            FEE_DENOMINATOR
        ); // 1%

        // Contracts are deployed using the first signer/account by default
        const [owner, admin, zeroFeeAccount, otherAccount] = await ethers.getSigners();

        // Underlying token
        const UnderlyingToken = await ethers.getContractFactory("ERC20Token");
        const underlyingToken = await UnderlyingToken.deploy("USD Coin", "USDC");

        await underlyingToken.deployed();

        // ION token
        const IONToken = await ethers.getContractFactory("IONToken");
        const ionToken = await IONToken.deploy(
            "ION Token",
            "ION",
            underlyingToken.address,
            INIT_DEPOSIT_FEE_PERCENT,
            INIT_WITHDRAW_FEE_PERCENT,
            admin.address
        );

        await ionToken.deployed();

        const ZERO_FEE_ROLE = await ionToken.ZERO_FEE_ROLE();

        return {
            underlyingToken,
            ionToken,
            owner,
            admin,
            zeroFeeAccount,
            otherAccount,
            ZERO_FEE_ROLE,
        };
    }

    async function deployFixtureTopupContract() {
        const [
            owner,
            admin,
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


        const topupContractFactory = await ethers.getContractFactory("ROverseTopupContract");

        const topupContract = await topupContractFactory.deploy(
            currencyTokenContract.address,
            treasury.address,
            partner.address,
            platform.address,
            treasuryPercent,
            partnerPercent,
            platformPercent,
            admin.address,
        );

        return {
            currencyTokenContract,
            currencyTokenContractNew,
            topupContract,
            treasuryPercent,
            partnerPercent,
            platformPercent,

            owner,
            admin,

            treasury,
            platform,
            partner,

            user,

            treasuryNew,
            partnerNew,
            platformNew,

        };
    }

    async function deployFixtureTopupIntermediaryContract() {

        const { ionToken, underlyingToken, owner: IONTokenOwner, admin: IONTokenAdmin, ZERO_FEE_ROLE } = await deployFixtureIONTokenContract();
        const { topupContract, owner: topupContractOwner } = await deployFixtureTopupContract();

        const [owner, admin, topupAccount] = await ethers.getSigners();

        const roverseTopupIntermediaryContractFactory = await ethers.getContractFactory("ROverseTopupIntermediaryContract");
        const roverseTopupIntermediaryContract = await roverseTopupIntermediaryContractFactory.deploy(ionToken.address, topupContract.address, admin.address);

        const TOPUP_ROLE = await roverseTopupIntermediaryContract.TOPUP_ROLE();

        // Set new currency
        await topupContract.connect(admin).setCurrencyTokenAddress(ionToken.address);

        return {
            // ION token
            IONTokenOwner,
            IONTokenAdmin,
            underlyingToken,
            ionToken,
            ZERO_FEE_ROLE,

            // Topup contract
            topupContract,
            topupContractOwner,

            // Topup intermediary
            owner,
            admin,
            roverseTopupIntermediaryContract,
            topupAccount,
            TOPUP_ROLE,
        };
    }

    describe("Topup", () => {
        it("Should topup successfully by topup account with topup role", async () => {
            const {
                // Topup intermediary
                roverseTopupIntermediaryContract,
                topupAccount,
                TOPUP_ROLE,
                // ION token
                ionToken,
                underlyingToken,
                owner,
                admin,
                IONTokenOwner,
                IONTokenAdmin,
                ZERO_FEE_ROLE
            } = await deployFixtureTopupIntermediaryContract();
            // Add zero fee role to intermediary contract
            await ionToken.connect(IONTokenAdmin).grantRole(ZERO_FEE_ROLE, roverseTopupIntermediaryContract.address);
            await roverseTopupIntermediaryContract.connect(admin).grantRole(TOPUP_ROLE, topupAccount.address);

            await underlyingToken.mint(topupAccount.address, ethers.utils.parseEther("1000"));
            expect(await underlyingToken.balanceOf(topupAccount.address)).to.eq(ethers.utils.parseEther("1000"));
            await underlyingToken.connect(topupAccount).approve(roverseTopupIntermediaryContract.address, ethers.constants.MaxUint256);

            await roverseTopupIntermediaryContract.connect(topupAccount).topup(ethers.utils.parseEther("100"), "REF_CODE");
            expect(await underlyingToken.balanceOf(topupAccount.address)).to.eq(ethers.utils.parseEther("900"));
        });
    });

});