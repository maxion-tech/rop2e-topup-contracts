// SPDX-License-Identifier: MIT
pragma solidity =0.8.7;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IIONStablecoin {
    function underlying() external returns (IERC20);
    function depositFor(address account, uint256 amount) external;
}