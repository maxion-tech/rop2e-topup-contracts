// SPDX-License-Identifier: MIT
pragma solidity =0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import "hardhat/console.sol";

contract ROP2ETopupContract is Pausable, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    uint256 private constant DENOMINATOR = 10**10; // 10**10
    IERC20 public currencyContract;
    address public partnerAddress;
    address public platformAddress;

    // Split of  percent
    uint256 private platformPercent;
    uint256 private partnerPercent;

    constructor(
        address _currencyContractAddress,
        address _platformAddress,
        address _partnerAddress,
        address _treasuryAddress,
        uint256 _platformPercent,
        uint256 _partnerPercent
        ){
        require(_currencyContractAddress != address(0), "Currency contract must not be zero");
        require(_platformAddress != address(0), "Platform address must not be zero");
        require(_partnerAddress != address(0), "Partner address must not be zero");
        require(_treasuryAddress != address(0), "Treasury address must not be zero");

        require(_platformPercent > 0, "Platform percent must not be zero");
        require(_partnerPercent > 0, "Partner percent must not be zero");

        uint256 partnerPercentDeno = partnerPercent.mul(100).div(
            DENOMINATOR
        );
        uint256 platformPercentDeno = platformPercent.mul(100).div(
            DENOMINATOR
        );
        uint256 totalPercent = partnerPercentDeno.add(platformPercentDeno);
        require(totalPercent < 100, "Total percent must less than 100");

        // Set currency contract
        currencyContract = IERC20(_currencyContractAddress);
        
        // Set percent
        platformPercent = _platformPercent;
        partnerPercent = _partnerPercent;

        // Set address
        platformAddress = _platformAddress;
        partnerAddress = _partnerAddress;
    }

    function calculatePlatformAmount(uint256 topupAmount)
        external
        view
        returns (uint256 amount)
    {
        return topupAmount.mul(platformPercent).div(DENOMINATOR);
    }

   function calculatePartnerAmount(uint256 _topupAmount)
        external
        view
        returns (uint256 amount)
    {
        return _topupAmount.mul(partnerPercent).div(DENOMINATOR);
    }

    // For display don't use for calculation use calculatePlatformAmount instead
    function getPlatformPercent() external view returns (uint256 percent) {
        return platformPercent.mul(DENOMINATOR);
    }

    // For display don't use for calculation use calculatePartnerAmount instead
    function getPertnerPercent() external view returns (uint256 percent) {
        return partnerPercent.mul(DENOMINATOR);
    }

    function topup(uint256 amount, string calldata refCode) external nonReentrant whenNotPaused{

    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}