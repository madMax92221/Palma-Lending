import { waffle } from "hardhat";
import { unitPalmaFixture } from "../shared/fixtures";
import { Mocks, Signers } from "../shared/types";
import { palmaContract } from "../unit/testingPalma";

describe(`Unit tests`, async () => {
  before(async function () {
    const wallets = waffle.provider.getWallets();

    this.signers = {} as Signers;
    this.signers.deployer = wallets[0];
    this.signers.alice = wallets[1];
    this.signers.bob = wallets[2];

    this.loadFixture = waffle.createFixtureLoader(wallets);
  });

  describe(`Palma`, async () => {
    beforeEach(async function () {
      const {
        palma,
        mockUsdc,
        mockUsdt,
        mockDai,
        mockWeth,
        mockAggrWETH,
        mockAggrDAI,
        mockAggrUSDC,
        mockAggrUSDT,
      } = await this.loadFixture(unitPalmaFixture);

      this.palma = palma;

      this.mocks = {} as Mocks;
      this.mocks.mockUsdc = mockUsdc;
      this.mocks.mockUsdt = mockUsdt;
      this.mocks.mockDai = mockDai;
      this.mocks.mockWeth = mockWeth;
      this.mocks.mockAggrWETH = mockAggrWETH;
      this.mocks.mockAggrUSDC = mockAggrUSDC;
      this.mocks.mockAggrUSDT = mockAggrUSDT;
      this.mocks.mockAggrDAI = mockAggrDAI;
    });

    palmaContract();
  });
});
