// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

interface IPalma {

   /// @dev Error thrown when the token in the parameter is not among the allowed ones
   /// @param token's address
   error TokenNotAllowed(address token);

   /// @dev Error thrown when the provided amount is less or equal to zero
   error ZeroAmount();
   
   /// @dev Error thrown when the amount that user wants to repay is bigger than the actual debt
   error AmountBiggerThanDebt();

   /// @dev Error thrown when account cannot be liquidated because the health factor is not low enough
   error AccountCannotBeLiquidated();

   /// @dev Error thrown when user is trying to borrow zero amount
   error ZeroBorrowAmount();

   /// @dev Error thrown when the user has below the necessary health factor
   error PlatformWillGoInsolvent();

   /// @dev Error thrown when the user has below the necessary health factor after the first check for withdraw
   error WithdrawLesserAmount();

   /// @dev Error thrown when the user doesn't have enough funds
   error NotEnoughFundsToWithdraw();

   /// @dev Error thrown when tries to borrow more than the allowed amount
   error BorrowLesserAmount();

   /// @dev Error thrown when half the debt is under 50$
   error LiquidationForbidden();

   /// @dev Event emitted when a deposit is made
   /// @param account The address that has made the deposit
   /// @param token The `token` address 
   /// @param amount The amount that will be deposited
   event Deposit(address indexed account, address indexed token, uint256 indexed amount);

   /// @dev Event emitted when someone borrows
   /// @param account The address that borrows
   /// @param token The `token` address
   /// @param amount borrowed
   event Borrow(address indexed account, address indexed token, uint256 indexed amount);

   /// @dev Event emitted when someone withdraw 
   /// @param account The address that is making the withdraw
   /// @param token The `token` address
   /// @param amount The amount that will be withdrawn
   event Withdraw(address indexed account, address indexed token, uint256 indexed amount);

   /// @dev Event emitted when someone repay an amount of his debt
   /// @param account The address which is repaying the debt
   /// @param token The `token` address
   /// @param amount The amount that will be repaid
   event Repay(address indexed account, address indexed token, uint256 indexed amount);

   /// @dev Event emitted when a position is liquidated
   /// @param account The address which position is liquidated
   /// @param collateralToken The collateral token from which comes the liquidator and protocol reward
   /// @param repayToken The token which should be repaid
   /// @param halfDebtInUSD The value for half debt in USD
   /// @param liquidator The liquidator's address
   event Liquidate(
        address indexed account,
        address indexed collateralToken,
        address indexed repayToken,
        uint256 halfDebtInUSD,
        address liquidator
    );

   /// @dev Sets token's  availability
   /// @param token The address that will be set as allowed
   /// @param allowed If true adds the token address to allowedTokens
   /// @notice This function can only be called by the owner.
   function setAllowedToken(address token, bool allowed) external;

   /// @dev Deposits the underlying asset 
   /// @param token The address of the asset which will be deposited
   /// @param amount The amount of tokens that the user wants to deposit
   function deposit(address token, uint256 amount) external;
    
   /// @dev Withdraws funds from user's account
   /// @param collateralToken The address of the underlying asset 
   /// @param borrowToken The address of the borrowed token(to calculate the health factor)
   function withdraw(address collateralToken, address borrowToken, uint256 amount) external;

    /// @dev Allows users to borrow a specific amount of the reserve currency
    /// @param collateralToken The address of the underlying token
    /// @param borrowToken The address of the token which the user wants to borrow
    /// @param amount The amount of tokens which the user wants to borrow
   function borrow(address collateralToken, address borrowToken, uint256 amount) external; 
   
   /// @dev Repays a borrow on the specific reserve
   /// @param token The address of the borrowed token which will be repaid 
   /// @param amount The amount of tokens which will be repaid
   function repay(address token, uint256 amount) external;

   /// @dev Users can invoke this function to liquidate an undercollateralized position of an account
   /// @param account The address of the account which will be liquidated
   /// @param collateralToken  The address of the underlying asset in the position
   /// @param repayToken The address of the token which creates the debt
   function liquidate(
     address account,
     address collateralToken,
     address repayToken
    ) external;

   /// @dev Gets account collateral value in USD
   /// @param account The address of the account which collateral value will be calculated
   /// @param token The address of the token which value will be calculated
   /// @return The collateral value in USD
   function getCollateralValueInUSD(address account, address token) external view returns(uint256);
   
   /// @dev Gets account borrowed value in USD
   /// @param account The address of the account which borrowed value will be calculated
   /// @param token The address of the token from which the value will be calculated
   /// @return The borrowed value in USD
   function getBorrowedValueInUSD(address account, address token) external view returns(uint256);
   
   /// @dev Gets the value of a certain token in USD
   /// @param token The address of the token which value we want to return
   /// @param amount The amount of tokens that the user posses 
   /// @return The token value in USD
   function getValueInUSD(address token, uint amount) external view returns(uint256);

   /// @dev Gets the token price in USD
   /// @param token The address of the token which price will be returned
   /// @return The token price in USD
   function getPriceInUSD(address token) external view returns(uint256);
 
   /// @dev Gets the account health factor 
   /// @param account The address of the account which health factor will be calculated
   /// @param collateralToken The address of the underlying token
   /// @param borrowToken The address of the borrowed token
   /// @return Account's health factor
   function getAccountHealthFactor(
     address account,
     address collateralToken, 
     address borrowToken
    ) external view returns(uint256);

   /// @dev Calculates the maximum amount which user can borrow
   /// @notice borrow Amount can be maximum 80% from the collateral
   /// @param account The address of the account which Max Borrow Amount we want to calculate
   /// @param collateralToken The address of the underlying token
   /// @param borrowToken The address of the borrowed token
   /// @return The maximum amount which user can borrow
   function getMaxBorrowAmount(
     address account, 
     address collateralToken, 
     address borrowToken
    ) external view returns(uint256); 

}