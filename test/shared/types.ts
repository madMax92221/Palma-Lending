import { Fixture, MockContract } from "ethereum-waffle";
import { Wallet } from "@ethersproject/wallet";
import { Palma } from "../../typechain-types";

declare module "mocha" {
  export interface Context {
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
    mocks: Mocks;
    palma: Palma;
  }
}

export interface Signers {
  deployer: Wallet;
  alice: Wallet;
  bob: Wallet;
  addr1: Wallet;
  addr2: Wallet;
  addr3: Wallet;
  addr4: Wallet;
  addr5: Wallet;
  addr6: Wallet;
  addr7: Wallet;
  addr8: Wallet;
}

export interface Mocks {
  mockUsdc: MockContract;
  mockUsdt: MockContract;
  mockDai: MockContract;
  mockWeth: MockContract;
  mockAggrUSDC: MockContract;
  mockAggrUSDT: MockContract;
  mockAggrDAI: MockContract;
  mockAggrWETH: MockContract;
}
