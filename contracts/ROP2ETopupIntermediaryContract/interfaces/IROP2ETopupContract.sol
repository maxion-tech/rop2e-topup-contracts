// SPDX-License-Identifier: MIT
pragma solidity =0.8.7;

interface IIROP2ETopupContract {
    function topup(uint256 amount, string calldata refCode) external;
}
