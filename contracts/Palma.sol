// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./IPalma.sol";

interface IERC20ExtendedLike {
    function decimals() external view returns (uint8);
}

contract Palma is IPalma, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    mapping(address => bool) public allowedTokens;
    mapping(address => address) public tokenToOracleAddress;
    /// account -> token -> amount
    mapping(address => mapping(address => uint256)) public accountToTokenDeposits;
    mapping(address => mapping(address => uint256)) public accountToTokenBorrows;
    mapping(address => uint256) public protocolEarnings;

    uint256 public constant CHAINLINK_USD_DECIMALS = 1e8;
    uint256 public constant LIQUIDATOR_REWARD_PERCENTAGE = 2;

    uint256 public constant MIN_HEALTH_FACTOR_PERCENTAGE = 115;
    uint256 public constant SCALING_FACTOR_PERCENTAGE = 100;

    uint256 public constant BORROW_THRESHOLD_PERCENTAGE = 150;
    uint256 public constant LIQUIDATION_THRESHOLD_PERCENTAGE = 80;

    constructor(
        address weth,
        address dai,
        address usdc,
        address usdt,
        address wethOracle,
        address daiOracle,
        address usdcOracle,
        address usdtOracle
    ) {
        tokenToOracleAddress[weth] = wethOracle;
        tokenToOracleAddress[dai] = daiOracle;
        tokenToOracleAddress[usdc] = usdcOracle;
        tokenToOracleAddress[usdt] = usdtOracle;
    }

    modifier isAllowedToken(address token) {
        if (!allowedTokens[token]) {
            revert TokenNotAllowed(token);
        }
        _;
    }

    modifier moreThanZero(uint256 amount) {
        if (amount == 0) {
            revert ZeroAmount();
        }
        _;
    }

    function setAllowedToken(address token, bool allowed) external override onlyOwner {
        allowedTokens[token] = allowed;
    }

    function deposit(address token, uint256 amount)
        external
        override
        nonReentrant
        isAllowedToken(token)
        moreThanZero(amount)
    {
        accountToTokenDeposits[msg.sender][token] += amount;
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit Deposit(msg.sender, token, amount);
    }

    function withdraw(
        address collateralToken,
        address borrowToken,
        uint256 amount
    ) external override nonReentrant moreThanZero(amount) {
        if (getAccountHealthFactor(msg.sender, collateralToken, borrowToken) < MIN_HEALTH_FACTOR_PERCENTAGE) {
            revert PlatformWillGoInsolvent();
        }
        _pullFunds(msg.sender, collateralToken, amount);
        if (getAccountHealthFactor(msg.sender, collateralToken, borrowToken) < MIN_HEALTH_FACTOR_PERCENTAGE) {
            revert WithdrawLesserAmount();
        }
        emit Withdraw(msg.sender, collateralToken, amount);
    }

    function _pullFunds(
        address account,
        address token,
        uint256 amount
    ) private {
        if (accountToTokenDeposits[account][token] < amount) {
            revert NotEnoughFundsToWithdraw();
        }
        if (amount == 0) {
            return;
        }
        // On 0.8+ of solidity, it auto reverts math that would drop below 0 for a uint256
        accountToTokenDeposits[account][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    function borrow(
        address collateralToken,
        address borrowToken,
        uint256 amount
    ) external override nonReentrant isAllowedToken(collateralToken) isAllowedToken(borrowToken) moreThanZero(amount) {
        uint256 currentBorrowedAmount = accountToTokenBorrows[msg.sender][borrowToken];
        if (getMaxBorrowAmount(msg.sender, collateralToken, borrowToken) - currentBorrowedAmount < amount) {
            revert BorrowLesserAmount();
        }
        accountToTokenBorrows[msg.sender][borrowToken] += amount;
        IERC20(borrowToken).safeTransfer(msg.sender, amount);
        if (getAccountHealthFactor(msg.sender, collateralToken, borrowToken) < MIN_HEALTH_FACTOR_PERCENTAGE) {
            revert PlatformWillGoInsolvent();
        }
        emit Borrow(msg.sender, borrowToken, amount);
    }

    function repay(address token, uint256 amount)
        external
        override
        nonReentrant
        isAllowedToken(token)
        moreThanZero(amount)
    {
        if (amount > accountToTokenBorrows[msg.sender][token]) {
            revert AmountBiggerThanDebt();
        }
        _repay(msg.sender, token, amount);
        emit Repay(msg.sender, token, amount);
    }

    function _repay(
        address account,
        address token,
        uint256 amount
    ) private {
        accountToTokenBorrows[account][token] -= amount;
        IERC20(token).safeTransferFrom(account, address(this), amount);
    }

    function liquidate(
        address account,
        address collateralToken,
        address repayToken
    ) external override nonReentrant isAllowedToken(collateralToken) isAllowedToken(repayToken) {
        if (getAccountHealthFactor(account, collateralToken, repayToken) >= MIN_HEALTH_FACTOR_PERCENTAGE) {
            revert AccountCannotBeLiquidated();
        }
        uint256 halfDebt = accountToTokenBorrows[account][repayToken] / 2;
        uint256 halfDebtInUSD = getValueInUSD(repayToken, halfDebt);
        if (halfDebtInUSD < 50) {
            revert LiquidationForbidden();
        }
        uint256 rewardValueInUSD = (halfDebtInUSD * LIQUIDATOR_REWARD_PERCENTAGE) / 100;
        uint256 rewardAmount = rewardValueInUSD / getPriceInUSD(collateralToken);
        accountToTokenDeposits[account][collateralToken] -= rewardAmount;
        protocolEarnings[collateralToken] += rewardAmount;
        _repay(account, repayToken, halfDebt);
        _pullFunds(account, collateralToken, rewardAmount);

        emit Liquidate(account, repayToken, collateralToken, halfDebtInUSD, msg.sender);
    }

    function getCollateralValueInUSD(address account, address token)
        public
        view
        override
        returns (uint256 collateralValueInUSD)
    {
        uint256 depositedAmount = accountToTokenDeposits[account][token];
        collateralValueInUSD = (depositedAmount * getPriceInUSD(token)) / 1e6;
    }

    function getBorrowedValueInUSD(address account, address token)
        public
        view
        override
        isAllowedToken(token)
        returns (uint256 borrowedValueInUSD)
    {
        uint256 borrowedAmount = accountToTokenBorrows[account][token];
        uint8 tokenDecimals = IERC20ExtendedLike(token).decimals();
        borrowedValueInUSD = (borrowedAmount * getPriceInUSD(token)) / 10**tokenDecimals;
    }

    function getAccountHealthFactor(
        address account,
        address collateralToken,
        address borrowToken
    ) public view override returns (uint256 healthFactor) {
        uint256 collateralValue = getCollateralValueInUSD(account, collateralToken);
        uint256 borrowedValue = getBorrowedValueInUSD(account, borrowToken);
        if (borrowedValue == 0) {
            healthFactor = type(uint256).max;
        } else if (borrowedValue > 0) {
            healthFactor = (collateralValue * LIQUIDATION_THRESHOLD_PERCENTAGE) / borrowedValue;
        }
    }

    function getPriceInUSD(address token) public view override returns (uint256) {
        (, int256 answer, , , ) = AggregatorV3Interface(tokenToOracleAddress[token]).latestRoundData();
        return uint256(answer) / CHAINLINK_USD_DECIMALS;
    }

    function getValueInUSD(address token, uint256 amount) public view override returns (uint256) {
        uint8 tokenDecimals = IERC20ExtendedLike(token).decimals();
        return (getPriceInUSD(token) * amount) / 10**tokenDecimals;
    }

    function getMaxBorrowAmount(
        address account,
        address collateralToken,
        address borrowToken
    ) public view override returns (uint256) {
        uint256 maxBorrowValue = (getCollateralValueInUSD(account, collateralToken) * SCALING_FACTOR_PERCENTAGE) /
            BORROW_THRESHOLD_PERCENTAGE;
        uint256 maxBorrowAmount = maxBorrowValue / getPriceInUSD(borrowToken);
        if (maxBorrowAmount == 0) {
            revert ZeroBorrowAmount();
        }
        uint8 tokenDecimals = IERC20ExtendedLike(borrowToken).decimals();
        return maxBorrowAmount * 10**tokenDecimals;
    }
}
