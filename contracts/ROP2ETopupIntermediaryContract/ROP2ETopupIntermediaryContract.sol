// SPDX-License-Identifier: MIT
pragma solidity =0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IIONStablecoin.sol";
import "./interfaces/IROP2ETopupContract.sol";

contract ROP2ETopupIntermediaryContract is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant TOPUP_ROLE = keccak256("TOPUP_ROLE");
    uint256 constant MAX_INT = 2**256 - 1;

    IIONStablecoin ionStablecoin;
    IIROP2ETopupContract roP2ETopupContract;
    IERC20 ionStablecoinUnderlying;

    event EventTopup(uint256 amount, string refCode);

    constructor(address _ionStablecoinAddress, address _topupContractAddress, address _adminAddress) {
        ionStablecoin = IIONStablecoin(_ionStablecoinAddress);
        ionStablecoinUnderlying = IERC20(ionStablecoin.underlying());
        roP2ETopupContract = IIROP2ETopupContract(_topupContractAddress);
        ionStablecoinUnderlying.approve(_ionStablecoinAddress, MAX_INT);
        IERC20(address(ionStablecoin)).approve(_topupContractAddress, MAX_INT);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _adminAddress);
    }

    function approveIONStablecoinUnderlying(uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        ionStablecoinUnderlying.approve(address(ionStablecoin), amount);
    }

    function approveIONStablecoin(uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        IERC20(address(ionStablecoin)).approve(
            address(roP2ETopupContract),
            amount
        );
    }

    function topup(uint256 amount, string calldata refCode)
        external
        onlyRole(TOPUP_ROLE)
    {
        emit EventTopup(amount, refCode);
        uint256 balanceBefore = ionStablecoinUnderlying.balanceOf(
            address(this)
        );
        ionStablecoinUnderlying.safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        uint256 balanceAfter = ionStablecoinUnderlying.balanceOf(address(this));
        uint256 amountToDeposit = balanceAfter - balanceBefore;
        ionStablecoin.depositFor(address(this), amountToDeposit);
        roP2ETopupContract.topup(amountToDeposit, refCode);
    }
}
