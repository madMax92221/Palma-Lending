# Palma Lending Protocol

Borrow any of the 4 available tokens that the protocol supports against any of the 4 tokens provided as collateral: (wETH, USDC, USDT, DAI).

## Palma Lending Protocol Version 1

For educational purposes only. Not intended for real financial use.

- Protocol Parameters:

  - Protocol is earning 2% of half the debt when someone liquidates a position
  - Collateral can be any of the 4 tokens that are available
  - Available tokens - wETH, USDC, USDT, DAI.
  - Can borrow against collateral up to 150% collateralization ratio
  - Lower than 150% collateralization ratio, positions can be liquidated for the amount that would bring it back to 150% col. ratio.
  - Can only withdraw collateral if the health factor is over the minimum one . Can't withdraw collateral that would make health factor < minimum one (115).

- Liquidation:

  - To keep things simple, liquidation will market sell as much collateral as it is needed to cover half the debt of the user.

  - Half the debt is paid from the collateral of the user. If the health factor is below the minimum again, the user is eligible for liquidation.

  - 2% from half the debt goes to the liquidator and 2% to the protocol earnings. These percents are calculated from the collateral of the user and the transfer of the rewards for the protocol and liquidator are the same token as the collateral one.

  - Example: 200$ collateral, 100$ borrowed
  - Price of the collateral token falls by 30%
  - Now collateral is worth 140$, the user can be liquidated
  - 2 % are calculated from the half debt and send to the liquidator 1.3$ will be rounded to 1$
  - 2 % are calculated from the half debt and send to the protocol 1.3$ will be rounded to 1$
  - Half the debt is paid 50$, rewards are distributed 2x1$ from user's collateral 140- 50- 2 = 88$ current collateral value debt is 50$
  - Health Factor is 140: OK

### The Lend-Borrow Accounting Process

- User deposits any of the available tokens, then calling `deposit()`
  - Stores amount of the deposited token, as `collateral`
  - Emits Deposit event
- User can then call `borrow()`, passing `amount` to borrow
  - Calculates the maximum borrow amount the user can have(`getMaxBorrow amount`) and requires the amount from the parameter to be lower than the max borrow amount of user, given current
  - if (`getMaxBorrow amount`) >= amount, reverts with `BorrowLesserAmount()`
  - if `getMaxBorrow amount` < amount, user can borrow up to the maximum borrow amount
  - Transfers the borrowed amount to the user
  - Calculates `getAccountHealthfactor` and requires the result to be >= than the minimum health factor in order the user has borrow
  - if (`getAccountHealthfactor`) < MIN HEALTH FACTOR, then it reverts with `PlatformWillGoInsolvent()`
  - Emits `Borrow` event
- User can call `repay()` to repay full debt or portion of it.

  - Emits Repay event

- Anyone can call `liquidate()`, passing an address that has a position
  - Checks if health factor is below the minimum, if not reverts with `AccountCannotBeLiquidated()`
  - Calculates `halfDebt` amount for address as debt / 2
  - Checks if halfDebtInUSD is above 50$, if not reverts with 'Can't get a reward if half debt is under 50'
  - Calculates the rewardAmount for the protocol and liquidator
  - Repays half the debt
  - Send the reward to the liquidator

## Version 2 Planned Features

- Adding stable and variable interest rates
- Calculating the interest rates for the deposits and borrows
- More tokens for borrowing and lending
- Gov token that owns treasury, directs development of protocol - pTokens
- Airdrop of gov token
- Borrowing earns gov tokens
- Transferring earns gov tokens
- Liquidating earns gov tokens
- Intended for real financial use
