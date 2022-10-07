import { Fixture, MockContract } from "ethereum-waffle";
import { ContractFactory, Wallet } from "ethers";
import { ethers } from "hardhat";
import { Palma } from "../../typechain-types";
import {
  deployMockAggrWETH,
  deployMockAggrUSDC,
  deployMockAggrUSDT,
  deployMockAggrDAI,
  deployMockWeth,
  deployMockDai,
  deployMockUsdc,
  deployMockUsdt,
} from "./mocks";

type UnitPalmaFixtureType = {
  palma: Palma;
  mockUsdc: MockContract;
  mockUsdt: MockContract;
  mockDai: MockContract;
  mockWeth: MockContract;
  mockAggrWETH: MockContract;
  mockAggrUSDC: MockContract;
  mockAggrUSDT: MockContract;
  mockAggrDAI: MockContract;
};

export const unitPalmaFixture: Fixture<UnitPalmaFixtureType> = async (
  signers: Wallet[]
) => {
  const deployer: Wallet = signers[0];
  const addr1: Wallet = signers[1];
  const addr2: Wallet = signers[2];
  const addr3: Wallet = signers[3];
  const addr4: Wallet = signers[4];
  const addr5: Wallet = signers[5];
  const addr6: Wallet = signers[6];
  const addr8: Wallet = signers[8];

  const palmaFactory: ContractFactory = await ethers.getContractFactory(
    `Palma`
  );
  const mockWeth = await deployMockWeth(deployer);
  const mockDai = await deployMockDai(deployer);
  const mockUsdt = await deployMockUsdt(deployer);
  const mockUsdc = await deployMockUsdc(deployer);
  const mockAggrWETH = await deployMockAggrWETH(deployer);
  const mockAggrUSDC = await deployMockAggrUSDC(deployer);
  const mockAggrUSDT = await deployMockAggrUSDT(deployer);
  const mockAggrDAI = await deployMockAggrDAI(deployer);

  const palma: Palma = (await palmaFactory
    .connect(deployer)
    .deploy(
      mockWeth.address,
      mockDai.address,
      mockUsdc.address,
      mockUsdt.address,
      mockAggrWETH.address,
      mockAggrDAI.address,
      mockAggrUSDC.address,
      mockAggrUSDT.address
    )) as Palma;

  await palma.deployed();
  return {
    palma,
    mockWeth,
    mockUsdc,
    mockUsdt,
    mockDai,
    mockAggrWETH,
    mockAggrUSDC,
    mockAggrUSDT,
    mockAggrDAI,
  };
};
