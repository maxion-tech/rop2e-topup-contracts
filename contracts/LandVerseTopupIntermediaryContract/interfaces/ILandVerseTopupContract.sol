// SPDX-License-Identifier: MIT
pragma solidity =0.8.7;

interface ILandVerseTopupContract {
    function topup(uint256 amount, string calldata refCode) external;
}
