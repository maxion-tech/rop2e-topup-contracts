// SPDX-License-Identifier: MIT
pragma solidity =0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ROP2ETopupContract is Pausable, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant DENOMINATOR = 10**10; // 10**10
    IERC20 public currencyToken;

    address public treasuryAddress;
    address public partnerAddress;
    address public platformAddress;

    // Split of percent
    uint256 public treasuryPercent;
    uint256 public partnerPercent;
    uint256 public platformPercent;

    // Events
    event EventSetTreasuryAddress(address newTreasuryAddress);
    event EventSetPartnerAddress(address newPartnerAddress);
    event EventSetPlatformAddress(address newPlatformAddress);
    event EventSetCurrencyTokenAddress(address newCurrencyTokenAddress);
    event EventSetPercent(
        uint256 newTreasuryPercent,
        uint256 newPartnerPercent,
        uint256 newPlatformPercent
    );
    event EventTopup(
        uint256 amount,
        string refCode,
        uint256 treasuryPercent,
        uint256 partnerPercent,
        uint256 platformPercent,
        uint256 treasuryReceived,
        uint256 partnerReceived,
        uint256 platformReceived
    );

    // Modifter for check not zero and sum of all percent must be 100
    modifier onlyValidPercent(
        uint256 newTreasuryPercent,
        uint256 newPartnerPercent,
        uint256 newPlatformPercent
    ) {
        require(newTreasuryPercent > 0, "Treasury percent must not be zero");
        require(newPartnerPercent > 0, "Partner percent must not be zero");
        require(newPlatformPercent > 0, "Platform percent must not be zero");

        uint256 treasuryPercentDeno = (newTreasuryPercent * 100) / DENOMINATOR;
        uint256 partnerPercentDeno = (newPartnerPercent * 100) / DENOMINATOR;
        uint256 platformPercentDeno = (newPlatformPercent * 100) / DENOMINATOR;
        uint256 totalPercent = treasuryPercentDeno +
            partnerPercentDeno +
            platformPercentDeno;

        require(totalPercent == 100, "Total percent must be 100");
        _;
    }

    constructor(
        address _currencyTokenAddress,
        address _treasuryAddress,
        address _partnerAddress,
        address _platformAddress,
        uint256 _treasuryPercent,
        uint256 _partnerPercent,
        uint256 _platformPercent,
        address _adminAddress
    ) onlyValidPercent(_treasuryPercent, _partnerPercent, _platformPercent) {
        require(
            _currencyTokenAddress != address(0),
            "Currency contract must not be zero"
        );

        require(
            _treasuryAddress != address(0),
            "Treasury address must not be zero"
        );
        require(
            _partnerAddress != address(0),
            "Partner address must not be zero"
        );
        require(
            _platformAddress != address(0),
            "Platform address must not be zero"
        );
        require(
            address(_adminAddress) != address(0) && address(_adminAddress) != msg.sender,
            "Admin address must not be zero or msg.sender"
        );

        // Set currency contract
        currencyToken = IERC20(_currencyTokenAddress);

        // Set address
        treasuryAddress = _treasuryAddress;
        partnerAddress = _partnerAddress;
        platformAddress = _platformAddress;

        // Set percent
        treasuryPercent = _treasuryPercent;
        partnerPercent = _partnerPercent;
        platformPercent = _platformPercent;

        _grantRole(DEFAULT_ADMIN_ROLE, _adminAddress);

        // Init event trigger
        emit EventSetTreasuryAddress(_treasuryAddress);
        emit EventSetPartnerAddress(_partnerAddress);
        emit EventSetPlatformAddress(_platformAddress);
        emit EventSetPercent(
            _treasuryPercent,
            _partnerPercent,
            _platformPercent
        );
    }

    function calculateTreasuryAmount(uint256 topupAmount)
        external
        view
        returns (uint256 amount)
    {
        return (topupAmount * treasuryPercent) / DENOMINATOR;
    }

    function calculatePartnerAmount(uint256 topupAmount)
        external
        view
        returns (uint256 amount)
    {
        return (topupAmount * partnerPercent) / DENOMINATOR;
    }

    function calculatePlatformAmount(uint256 topupAmount)
        external
        view
        returns (uint256 amount)
    {
        return (topupAmount * platformPercent) / DENOMINATOR;
    }

    function topup(uint256 amount, string calldata refCode)
        external
        nonReentrant
        whenNotPaused
    {
        require(bytes(refCode).length > 0, "Ref code must not be empty");
        uint256 treasuryAmount = this.calculateTreasuryAmount(amount);
        uint256 partnerAmount = this.calculatePartnerAmount(amount);
        uint256 platformAmount = this.calculatePlatformAmount(amount);
        emit EventTopup(
            amount,
            refCode,
            treasuryPercent,
            partnerPercent,
            platformPercent,
            treasuryAmount,
            partnerAmount,
            platformAmount
        );
        currencyToken.safeTransferFrom(
            _msgSender(),
            treasuryAddress,
            treasuryAmount
        );
        currencyToken.safeTransferFrom(
            _msgSender(),
            partnerAddress,
            partnerAmount
        );
        currencyToken.safeTransferFrom(
            _msgSender(),
            platformAddress,
            platformAmount
        );
    }

    function setPercent(
        uint256 newTreasuryPercent,
        uint256 newPartnerPercent,
        uint256 newPlatformPercent
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        onlyValidPercent(
            newTreasuryPercent,
            newPartnerPercent,
            newPlatformPercent
        )
    {
        treasuryPercent = newTreasuryPercent;
        partnerPercent = newPartnerPercent;
        platformPercent = newPlatformPercent;
        emit EventSetPercent(
            newTreasuryPercent,
            newPartnerPercent,
            newPlatformPercent
        );
    }

    function setTreasuryAddress(address newTreasuryAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            newTreasuryAddress != address(0),
            "Treasury address must not be zero"
        );
        treasuryAddress = newTreasuryAddress;
        emit EventSetTreasuryAddress(newTreasuryAddress);
    }

    function setPartnerAddress(address newPartnerAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            newPartnerAddress != address(0),
            "Partner address must not be zero"
        );
        partnerAddress = newPartnerAddress;
        emit EventSetPartnerAddress(newPartnerAddress);
    }

    function setPlatformAddress(address newPlatformAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            newPlatformAddress != address(0),
            "Platform address must not be zero"
        );
        platformAddress = newPlatformAddress;
        emit EventSetPlatformAddress(newPlatformAddress);
    }

    function setCurrencyTokenAddress(address newCurrencyTokenAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            newCurrencyTokenAddress != address(0),
            "Currency contract must not be zero"
        );

        currencyToken = IERC20(newCurrencyTokenAddress);
        emit EventSetCurrencyTokenAddress(newCurrencyTokenAddress);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
