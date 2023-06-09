// SPDX-License-Identifier: MIT
pragma solidity =0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IIONToken.sol";
import "./interfaces/IROverseTopupContract.sol";

contract ROverseTopupIntermediaryContract is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant TOPUP_ROLE = keccak256("TOPUP_ROLE");
    uint256 constant MAX_INT = 2**256 - 1;

    IIONToken ionToken;
    IIROverseTopupContract roverseTopupContract;
    IERC20 ionTokenUnderlying;

    event EventTopup(uint256 amount, string refCode);

    constructor(address _ionTokenAddress, address _topupContractAddress, address _adminAddress) {
        ionToken = IIONToken(_ionTokenAddress);
        ionTokenUnderlying = IERC20(ionToken.underlying());
        roverseTopupContract = IIROverseTopupContract(_topupContractAddress);
        ionTokenUnderlying.approve(_ionTokenAddress, MAX_INT);
        IERC20(address(ionToken)).approve(_topupContractAddress, MAX_INT);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _adminAddress);
    }

    function approveIONTokenUnderlying(uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        ionTokenUnderlying.approve(address(ionToken), amount);
    }

    function approveIONToken(uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        IERC20(address(ionToken)).approve(
            address(roverseTopupContract),
            amount
        );
    }

    function topup(uint256 amount, string calldata refCode)
        external
        onlyRole(TOPUP_ROLE)
    {
        emit EventTopup(amount, refCode);
        uint256 balanceBefore = ionTokenUnderlying.balanceOf(
            address(this)
        );
        ionTokenUnderlying.safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        uint256 balanceAfter = ionTokenUnderlying.balanceOf(address(this));
        uint256 amountToDeposit = balanceAfter - balanceBefore;
        ionToken.depositFor(address(this), amountToDeposit);
        roverseTopupContract.topup(amountToDeposit, refCode);
    }
}
