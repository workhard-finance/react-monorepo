import { BigNumber, Contract, providers } from "ethers";
import {
  // deployed,
  Project,
  Workhard as WorkhardContracts,
  CommonContracts,
  DAO,
  Periphery,
} from "@workhard/protocol";
import { StableReserveStore } from "./stores/stableReserveStore";
import { MineStore } from "./stores/mineStore";
import { UserStore } from "./stores/userStore";
import { getAddress, Result } from "ethers/lib/utils";
import { IPFS } from "ipfs-core";
import { Web3ReactContextInterface } from "@web3-react/core/dist/types";

export interface DAOMetadata {
  daoName: string;
  daoSymbol: string;
  visionName: string;
  visionSymbol: string;
  commitName: string;
  commitSymbol: string;
  rightName: string;
  rightSymbol: string;
  baseCurrencySymbol: string;
}

export interface DecodedTxData {
  address: string;
  contractName: string;
  methodName: string;
  args: { [key: string]: any };
  value: BigNumber;
  result: Result;
}

export interface WorkhardWeb3ReactContext
  extends Web3ReactContextInterface<providers.Web3Provider> {
  library: providers.Web3Provider;
  chainId: number;
  account: string;
  active: boolean;
}

export class Workhard {
  daoId: number;
  project: Project;
  dao: DAO;
  periphery: Periphery;
  commons: CommonContracts;
  workhard: WorkhardContracts;
  metadata: DAOMetadata;
  web3: WorkhardWeb3ReactContext;
  ipfs: IPFS;
  store: {
    stableReserveStore: StableReserveStore;
    mineStore: MineStore;
    userStore: UserStore;
  };

  constructor({
    daoId,
    project,
    dao,
    periphery,
    commons,
    workhard,
    metadata,
    web3,
    ipfs,
    store,
  }: {
    daoId: number;
    project: Project;
    dao: DAO;
    periphery: Periphery;
    commons: CommonContracts;
    workhard: WorkhardContracts;
    metadata: DAOMetadata;
    ipfs: IPFS;
    web3: WorkhardWeb3ReactContext;
    store: {
      stableReserveStore: StableReserveStore;
      mineStore: MineStore;
      userStore: UserStore;
    };
  }) {
    this.daoId = daoId;
    this.project = project;
    this.dao = dao;
    this.periphery = periphery;
    this.commons = commons;
    this.workhard = workhard;
    this.metadata = metadata;
    this.web3 = web3;
    this.ipfs = ipfs;
    this.store = store;
  }

  decodeTxDetails(
    workhard: Workhard,
    target: string,
    data: string,
    value: BigNumber
  ): DecodedTxData {
    const contracts = [
      ...(Object.entries(workhard.dao) as Array<[string, Contract]>),
      ...(Object.entries(workhard.commons) as Array<[string, Contract]>),
      ...(Object.entries({ Project: workhard.project }) as Array<
        [string, Contract]
      >),
    ];
    const targetContract = contracts.find(
      ([_, contract]) => getAddress(target) === getAddress(contract.address)
    );
    if (targetContract) {
      const [contractName, contract] = targetContract;
      const fragment = contract.interface.getFunction(data.slice(0, 10));
      const methodName = fragment.name;
      const result: Result = contract.interface.decodeFunctionData(
        fragment,
        data
      );
      const argNames = Object.getOwnPropertyNames(result).filter((name) => {
        return ![
          ...Array(result.length)
            .fill(0)
            .map((_, i) => `${i}`),
          "length",
        ].includes(name);
      });
      const args: { [key: string]: any } = {};
      argNames.forEach((key) => {
        args[key] = result[key];
      });
      return {
        address: target,
        contractName:
          contractName.slice(0, 1).toUpperCase() + contractName.slice(1),
        methodName,
        args,
        value,
        result,
      };
    } else {
      throw Error("Failed to find target contract");
    }
  }
}
