import { ethers } from "hardhat";
import { expect, assert } from "chai";

export const palmaContract = (): void => {
  describe(`#deposit`, async function () {
    it("Should set the allowed token", async function () {
      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      const isTokenAllowed = await this.palma.allowedTokens(
        this.mocks.mockUsdc.address
      );
      expect(isTokenAllowed).to.be.true;
    });

    it("Should revert if the amount is 0 on Deposit", async function () {
      const amount = ethers.constants.Zero;
      this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);

      await expect(
        this.palma
          .connect(this.signers.alice)
          .deposit(this.mocks.mockUsdc.address, amount)
      ).to.be.revertedWith(`ZeroAmount`);
    });

    it("Should emit Deposit event", async function () {
      const amount = ethers.constants.One;
      this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await expect(
        this.palma
          .connect(this.signers.alice)
          .deposit(this.mocks.mockUsdc.address, amount)
      ).to.emit(this.palma, "Deposit");
    });

    it("Should update accountToTokenDeposits properly", async function () {
      const previousAccountToTokenDeposits =
        await this.palma.accountToTokenDeposits(
          this.signers.alice.address,
          this.mocks.mockUsdc.address
        );

      const amount = ethers.constants.One;
      this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, amount);

      const newAccountToTokenDeposits = await this.palma.accountToTokenDeposits(
        this.signers.alice.address,
        this.mocks.mockUsdc.address
      );
      assert(
        newAccountToTokenDeposits.toBigInt() ===
          previousAccountToTokenDeposits.add(amount).toBigInt(),
        `New value should equal previous value plus amount`
      );
    });

    it("Should revert if token is not allowed", async function () {
      const amount = ethers.constants.One;

      await expect(
        this.palma
          .connect(this.signers.alice)
          .deposit(this.mocks.mockUsdc.address, amount)
      ).to.be.revertedWith(`TokenNotAllowed`);
    });
  });
  describe(`#withdraw`, async function () {
    it("Should revert if the amount is 0 on Withdraw", async function () {
      const depositAmount = ethers.constants.One;
      const withdrawAmount = ethers.constants.Zero;
      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, depositAmount);

      await expect(
        this.palma
          .connect(this.signers.alice)
          .withdraw(
            this.mocks.mockUsdc.address,
            this.mocks.mockUsdt.address,
            withdrawAmount
          )
      ).to.be.revertedWith(`ZeroAmount`);
    });

    it("Should revert if you try to withdraw with low health factor", async function () {
      const amount = ethers.utils.parseUnits("10.0", 6);
      const borrowAmount = ethers.utils.parseUnits("6.0", 6);
      const newAmount = ethers.utils.parseUnits("3.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, amount);

      await this.palma
        .connect(this.signers.alice)
        .borrow(
          this.mocks.mockUsdc.address,
          this.mocks.mockUsdt.address,
          borrowAmount
        );

      await this.mocks.mockAggrUSDC.mock.latestRoundData.returns(
        1,
        7 * 1e8,
        20,
        30,
        40
      );

      await expect(
        this.palma
          .connect(this.signers.alice)
          .withdraw(
            this.mocks.mockUsdc.address,
            this.mocks.mockUsdt.address,
            newAmount
          )
      ).to.be.revertedWith(`PlatformWillGoInsolvent`);
    });

    it("Should revert if there is not enough collateral to withdraw", async function () {
      const depositAmount = ethers.utils.parseUnits("10.0", 6);
      const withdrawAmount = ethers.utils.parseUnits("11.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, depositAmount);

      await expect(
        this.palma
          .connect(this.signers.alice)
          .withdraw(
            this.mocks.mockUsdc.address,
            this.mocks.mockUsdt.address,
            withdrawAmount
          )
      ).to.be.revertedWith(`NotEnoughFundsToWithdraw`);
    });

    it("Should revert when you try to withdraw more than you can", async function () {
      const depositAmount = ethers.utils.parseUnits("10.0", 6);
      const borrowAmount = ethers.utils.parseUnits("6.0", 6);
      const withdrawAmount = ethers.utils.parseUnits("8.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, depositAmount);

      await this.palma
        .connect(this.signers.alice)
        .borrow(
          this.mocks.mockUsdc.address,
          this.mocks.mockUsdt.address,
          borrowAmount
        );

      await expect(
        this.palma
          .connect(this.signers.alice)
          .withdraw(
            this.mocks.mockUsdc.address,
            this.mocks.mockUsdt.address,
            withdrawAmount
          )
      ).to.be.revertedWith(`WithdrawLesserAmount`);
    });

    it("Should emit Withdraw event", async function () {
      const depositAmount = ethers.utils.parseUnits("10.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, depositAmount);

      await expect(
        this.palma
          .connect(this.signers.alice)
          .withdraw(
            this.mocks.mockUsdc.address,
            this.mocks.mockUsdt.address,
            depositAmount
          )
      ).to.emit(this.palma, "Withdraw");
    });
  });

  describe(`#borrow`, async function () {
    it("Should revert if the amount is 0 on Borrow", async function () {
      const amount = ethers.constants.Zero;
      this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);

      await expect(
        this.palma
          .connect(this.signers.alice)
          .borrow(
            this.mocks.mockUsdc.address,
            this.mocks.mockUsdc.address,
            amount
          )
      ).to.be.revertedWith(`ZeroAmount`);
    });

    it("Should revert if you try to borrow amount bigger than your health factor allows", async function () {
      const depositAmount = ethers.utils.parseUnits("10.0", 6);
      const borrowAmount = ethers.utils.parseUnits("8.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, depositAmount);

      await expect(
        this.palma
          .connect(this.signers.alice)
          .borrow(
            this.mocks.mockUsdc.address,
            this.mocks.mockUsdt.address,
            borrowAmount
          )
      ).to.be.revertedWith(`BorrowLesserAmount`);
    });

    it("Should update accountToTokenBorrows properly", async function () {
      const depositAmount = ethers.utils.parseUnits("10.0", 6);
      const borrowAmount = ethers.utils.parseUnits("6.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, depositAmount);

      const accountToTokenBorrows = await this.palma.accountToTokenBorrows(
        this.signers.alice.address,
        this.mocks.mockUsdt.address
      );

      await this.palma
        .connect(this.signers.alice)
        .borrow(
          this.mocks.mockUsdc.address,
          this.mocks.mockUsdt.address,
          borrowAmount
        );

      const newAccountToTokenBorrows = await this.palma.accountToTokenBorrows(
        this.signers.alice.address,
        this.mocks.mockUsdt.address
      );

      assert(
        newAccountToTokenBorrows.toBigInt() ===
          accountToTokenBorrows.add(borrowAmount).toBigInt(),
        `New value should equal previous value plus borrowAmount`
      );
    });

    it("Should emit Borrow event", async function () {
      const depositAmount = ethers.utils.parseUnits("10.0", 6);
      const borrowAmount = ethers.utils.parseUnits("6.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, depositAmount);

      await expect(
        this.palma
          .connect(this.signers.alice)
          .borrow(
            this.mocks.mockUsdc.address,
            this.mocks.mockUsdt.address,
            borrowAmount
          )
      ).to.emit(this.palma, "Borrow");
    });
  });

  describe(`#repay`, async function () {
    it("Should revert if the amount is 0 on REPAY", async function () {
      const amount = ethers.constants.Zero;
      this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);

      await expect(
        this.palma
          .connect(this.signers.alice)
          .repay(this.mocks.mockUsdc.address, amount)
      ).to.be.revertedWith(`ZeroAmount`);
    });

    it("Should revert if you try to borrow less than 1 token", async function () {
      const depositAmount = ethers.utils.parseUnits("10.0", 6);
      const borrowAmount = ethers.utils.parseUnits("1.0", 17);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);
      await this.palma.setAllowedToken(this.mocks.mockWeth.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, depositAmount);

      await expect(
        this.palma
          .connect(this.signers.alice)
          .borrow(
            this.mocks.mockUsdc.address,
            this.mocks.mockWeth.address,
            borrowAmount
          )
      ).to.be.revertedWith(`ZeroBorrowAmount`);
    });

    it("should update accountToTokenBorrows properly ON REPAY", async function () {
      const depositAmount = ethers.utils.parseUnits("10.0", 6);
      const borrowAmount = ethers.utils.parseUnits("4.0", 6);
      const repayAmount = ethers.utils.parseUnits("4.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, depositAmount);

      await this.palma
        .connect(this.signers.alice)
        .borrow(
          this.mocks.mockUsdc.address,
          this.mocks.mockUsdt.address,
          borrowAmount
        );

      const accountToTokenBorrows = await this.palma.accountToTokenBorrows(
        this.signers.alice.address,
        this.mocks.mockUsdt.address
      );

      await this.palma
        .connect(this.signers.alice)
        .repay(this.mocks.mockUsdt.address, repayAmount);

      const newAccountToTokenBorrows = await this.palma.accountToTokenBorrows(
        this.signers.alice.address,
        this.mocks.mockUsdt.address
      );

      assert(
        newAccountToTokenBorrows.toBigInt() ===
          accountToTokenBorrows.sub(repayAmount).toBigInt(),
        `New value should equal previous value minus amount`
      );
    });

    it("Should emit Repay event", async function () {
      const depositAmount = ethers.utils.parseUnits("10.0", 6);
      const borrowAmount = ethers.utils.parseUnits("4.0", 6);
      const repayAmount = ethers.utils.parseUnits("4.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, depositAmount);

      await this.palma
        .connect(this.signers.alice)
        .borrow(
          this.mocks.mockUsdc.address,
          this.mocks.mockUsdt.address,
          borrowAmount
        );

      await expect(
        this.palma
          .connect(this.signers.alice)
          .repay(this.mocks.mockUsdt.address, repayAmount)
      ).to.emit(this.palma, "Repay");
    });
  });

  describe(`#liquidate`, async function () {
    it("Should revert if the health factor is more than the minimum health factor", async function () {
      const depositAmount = ethers.utils.parseUnits("10.0", 6);
      const borrowAmount = ethers.utils.parseUnits("4.0", 6);
      const repayAmount = ethers.utils.parseUnits("2.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, depositAmount);

      await this.palma
        .connect(this.signers.alice)
        .borrow(
          this.mocks.mockUsdc.address,
          this.mocks.mockUsdt.address,
          borrowAmount
        );

      await expect(
        this.palma
          .connect(this.signers.alice)
          .liquidate(
            this.signers.bob.address,
            this.mocks.mockUsdc.address,
            this.mocks.mockUsdt.address
          )
      ).to.be.revertedWith(`AccountCannotBeLiquidated`);
    });

    it("Should revert if the reward in half debt is under 50 USD", async function () {
      const amount = ethers.utils.parseUnits("10.0", 6);
      const borrowAmount = ethers.utils.parseUnits("6.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, amount);

      await this.palma
        .connect(this.signers.alice)
        .borrow(
          this.mocks.mockUsdc.address,
          this.mocks.mockUsdt.address,
          borrowAmount
        );

      const oldAccountDeposits = await this.palma.accountToTokenDeposits(
        this.signers.alice.address,
        this.mocks.mockUsdc.address
      );

      const accountToTokenBorrows = await this.palma.accountToTokenBorrows(
        this.signers.alice.address,
        this.mocks.mockUsdt.address
      );

      await this.mocks.mockAggrUSDC.mock.latestRoundData.returns(
        1,
        7 * 1e8,
        20,
        30,
        40
      );

      const accountDeposits = await this.palma.accountToTokenDeposits(
        this.signers.alice.address,
        this.mocks.mockUsdc.address
      );

      await expect(
        this.palma
          .connect(this.signers.bob)
          .liquidate(
            this.signers.alice.address,
            this.mocks.mockUsdc.address,
            this.mocks.mockUsdt.address
          )
      ).to.be.revertedWith(`LiquidationForbidden`);
    });

    it("Should update protocolEarning mapping properly on Liquidate", async function () {
      const amount = ethers.utils.parseUnits("130.0", 6);
      const borrowAmount = ethers.utils.parseUnits("70.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, amount);

      await this.palma
        .connect(this.signers.alice)
        .borrow(
          this.mocks.mockUsdc.address,
          this.mocks.mockUsdt.address,
          borrowAmount
        );

      const oldProtocolEarnings = await this.palma.protocolEarnings(
        this.mocks.mockUsdc.address
      );

      await this.mocks.mockAggrUSDC.mock.latestRoundData.returns(
        1,
        5 * 1e8,
        20,
        30,
        40
      );

      const protocolEarnings = await this.palma.protocolEarnings(
        this.mocks.mockUsdc.address
      );
    });

    it("Should emit event on Liquidate", async function () {
      const amount = ethers.utils.parseUnits("18.0", 6);
      const borrowAmount = ethers.utils.parseUnits("10.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, amount);

      await this.palma
        .connect(this.signers.alice)
        .borrow(
          this.mocks.mockUsdc.address,
          this.mocks.mockUsdt.address,
          borrowAmount
        );

      await this.mocks.mockAggrUSDC.mock.latestRoundData.returns(
        1,
        7 * 1e8,
        20,
        30,
        40
      );

      await expect(
        this.palma
          .connect(this.signers.bob)
          .liquidate(
            this.signers.alice.address,
            this.mocks.mockUsdc.address,
            this.mocks.mockUsdt.address
          )
      ).to.emit(this.palma, "Liquidate");
    });

    it("Should update accountToTokenDeposits properly on Liquidate", async function () {
      const amount = ethers.utils.parseUnits("18.0", 6);
      const borrowAmount = ethers.utils.parseUnits("10.0", 6);

      await this.palma.setAllowedToken(this.mocks.mockUsdc.address, true);
      await this.palma.setAllowedToken(this.mocks.mockUsdt.address, true);

      await this.palma
        .connect(this.signers.alice)
        .deposit(this.mocks.mockUsdc.address, amount);

      await this.palma
        .connect(this.signers.alice)
        .borrow(
          this.mocks.mockUsdc.address,
          this.mocks.mockUsdt.address,
          borrowAmount
        );

      const oldAccountDeposits = await this.palma.accountToTokenDeposits(
        this.signers.alice.address,
        this.mocks.mockUsdc.address
      );

      const accountToTokenBorrows = await this.palma.accountToTokenBorrows(
        this.signers.alice.address,
        this.mocks.mockUsdt.address
      );

      await this.mocks.mockAggrUSDC.mock.latestRoundData.returns(
        1,
        7 * 1e8,
        20,
        30,
        40
      );

      const accountDeposits = await this.palma.accountToTokenDeposits(
        this.signers.alice.address,
        this.mocks.mockUsdc.address
      );

      await this.palma
        .connect(this.signers.bob)
        .liquidate(
          this.signers.alice.address,
          this.mocks.mockUsdc.address,
          this.mocks.mockUsdt.address
        );
    });
  });
};
