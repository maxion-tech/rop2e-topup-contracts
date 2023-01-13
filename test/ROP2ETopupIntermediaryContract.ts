import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { rand } from "../utils";

describe("Intermediary contract", function () {


    async function deployFixtureIONStablecoinContract() {
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

        // ION stablecoin
        const IONStablecoin = await ethers.getContractFactory("IONStablecoin");
        const ionStablecoin = await IONStablecoin.deploy(
            "ION Stablecoin",
            "ION",
            underlyingToken.address,
            INIT_DEPOSIT_FEE_PERCENT,
            INIT_WITHDRAW_FEE_PERCENT,
            admin.address
        );

        await ionStablecoin.deployed();

        const ZERO_FEE_ROLE = await ionStablecoin.ZERO_FEE_ROLE();

        return {
            underlyingToken,
            ionStablecoin,
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


        const topupContractFactory = await ethers.getContractFactory("ROP2ETopupContract");

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

        const { ionStablecoin, underlyingToken, owner: IONStablecoinOwner, admin: IONStablecoinAdmin, ZERO_FEE_ROLE } = await deployFixtureIONStablecoinContract();
        const { topupContract, owner: topupContractOwner } = await deployFixtureTopupContract();

        const [owner, admin, topupAccount] = await ethers.getSigners();

        const roP2ETopupIntermediaryContractFactory = await ethers.getContractFactory("ROP2ETopupIntermediaryContract");
        const roP2ETopupIntermediaryContract = await roP2ETopupIntermediaryContractFactory.deploy(ionStablecoin.address, topupContract.address, admin.address);

        const TOPUP_ROLE = await roP2ETopupIntermediaryContract.TOPUP_ROLE();

        // Set new currency
        await topupContract.connect(admin).setCurrencyTokenAddress(ionStablecoin.address);


        return {
            // ION stablecoin
            IONStablecoinOwner,
            IONStablecoinAdmin,
            underlyingToken,
            ionStablecoin,
            ZERO_FEE_ROLE,

            // Topup contract
            topupContract,
            topupContractOwner,

            // Topup intermediary
            owner,
            admin,
            roP2ETopupIntermediaryContract,
            topupAccount,
            TOPUP_ROLE,
        };
    }

    describe("Topup", () => {
        it("Should topup successfully by topup account with topup role", async () => {
            const {
                // Topup intermediary
                roP2ETopupIntermediaryContract,
                topupAccount,
                TOPUP_ROLE,
                // ION stablecoin
                ionStablecoin,
                underlyingToken,
                owner,
                admin,
                IONStablecoinOwner,
                IONStablecoinAdmin,
                ZERO_FEE_ROLE
            } = await deployFixtureTopupIntermediaryContract();
            // Add zero fee role to intermediary contract
            await ionStablecoin.connect(IONStablecoinAdmin).grantRole(ZERO_FEE_ROLE, roP2ETopupIntermediaryContract.address);
            await roP2ETopupIntermediaryContract.connect(admin).grantRole(TOPUP_ROLE, topupAccount.address);

            await underlyingToken.mint(topupAccount.address, ethers.utils.parseEther("1000"));
            expect(await underlyingToken.balanceOf(topupAccount.address)).to.eq(ethers.utils.parseEther("1000"));
            await underlyingToken.connect(topupAccount).approve(roP2ETopupIntermediaryContract.address, ethers.constants.MaxUint256);

            await roP2ETopupIntermediaryContract.connect(topupAccount).topup(ethers.utils.parseEther("100"), "REF_CODE");
            expect(await underlyingToken.balanceOf(topupAccount.address)).to.eq(ethers.utils.parseEther("900"));
        });
    });

});