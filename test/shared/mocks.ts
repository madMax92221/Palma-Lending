import { MockContract } from "ethereum-waffle";
import { Signer } from "ethers";
import { artifacts, waffle } from "hardhat";
import { Artifact } from "hardhat/types";
import ERC_20_ABI from "../../abis/erc20.abi.json";
import AGGR_V3_ABI from "../../abis/aggrv3.abi.json";

export async function deployMockUsdc(deployer: Signer): Promise<MockContract> {
  // const erc20Artifact: Artifact = await artifacts.readArtifact("ERC20");
  const erc20: MockContract = await waffle.deployMockContract(
    deployer,
    ERC_20_ABI
  );

  await erc20.mock.decimals.returns(6);
  await erc20.mock.name.returns(`USD Coin`);
  await erc20.mock.symbol.returns(`USDC`);
  await erc20.mock.transferFrom.returns(true);
  await erc20.mock.transfer.returns(true);

  return erc20;
}

export async function deployMockUsdt(deployer: Signer): Promise<MockContract> {
  // const erc20Artifact: Artifact = await artifacts.readArtifact("ERC20");
  const erc20: MockContract = await waffle.deployMockContract(
    deployer,
    ERC_20_ABI
  );

  await erc20.mock.decimals.returns(6);
  await erc20.mock.name.returns(`USDT Coin`);
  await erc20.mock.symbol.returns(`USDT`);
  await erc20.mock.transferFrom.returns(true);
  await erc20.mock.transfer.returns(true);

  return erc20;
}

export async function deployMockDai(deployer: Signer): Promise<MockContract> {
  // const erc20Artifact: Artifact = await artifacts.readArtifact("ERC20");
  const erc20: MockContract = await waffle.deployMockContract(
    deployer,
    ERC_20_ABI
  );

  await erc20.mock.decimals.returns(6);
  await erc20.mock.name.returns(`DAI Coin`);
  await erc20.mock.symbol.returns(`DAI`);
  await erc20.mock.transferFrom.returns(true);
  await erc20.mock.transfer.returns(true);

  return erc20;
}

export async function deployMockWeth(deployer: Signer): Promise<MockContract> {
  // const erc20Artifact: Artifact = await artifacts.readArtifact("ERC20");
  const erc20: MockContract = await waffle.deployMockContract(
    deployer,
    ERC_20_ABI
  );

  await erc20.mock.decimals.returns(18);
  await erc20.mock.name.returns(`WETH Token`);
  await erc20.mock.symbol.returns(`WETH`);
  await erc20.mock.transferFrom.returns(true);
  await erc20.mock.transfer.returns(true);

  return erc20;
}

export async function deployMockAggrUSDC(
  deployer: Signer
): Promise<MockContract> {
  const aggrv3: MockContract = await waffle.deployMockContract(
    deployer,
    AGGR_V3_ABI
  );

  await aggrv3.mock.latestRoundData.returns(1, 10 * 1e8, 20, 30, 40);

  return aggrv3;
}

export async function deployMockAggrUSDT(
  deployer: Signer
): Promise<MockContract> {
  const aggrv3: MockContract = await waffle.deployMockContract(
    deployer,
    AGGR_V3_ABI
  );

  await aggrv3.mock.latestRoundData.returns(1, 10 * 1e8, 20, 30, 40);

  return aggrv3;
}

export async function deployMockAggrDAI(
  deployer: Signer
): Promise<MockContract> {
  const aggrv3: MockContract = await waffle.deployMockContract(
    deployer,
    AGGR_V3_ABI
  );

  await aggrv3.mock.latestRoundData.returns(1, 10 * 1e8, 20, 30, 40);

  return aggrv3;
}

export async function deployMockAggrWETH(
  deployer: Signer
): Promise<MockContract> {
  const aggrv3: MockContract = await waffle.deployMockContract(
    deployer,
    AGGR_V3_ABI
  );

  await aggrv3.mock.latestRoundData.returns(1, 2000 * 1e8, 20, 30, 40);

  return aggrv3;
}
