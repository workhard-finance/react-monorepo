import React, { useEffect, useContext, useState } from "react";
import {
  // deployed,
  Deployed,
  getNetworkName,
  Workhard as WorkhardContracts,
} from "@workhard/protocol";
import deployed from "@workhard/protocol/deployed.json";
import { providers } from "ethers";
import { StableReserveStore } from "../stores/stableReserveStore";
import { MineStore } from "../stores/mineStore";
import { UserStore } from "../stores/userStore";
import { Workhard } from "../workhard";
import { IPFS } from "ipfs-core";
import { Web3ReactContextInterface } from "@web3-react/core/dist/types";

let deployedContracts: Deployed;
if (process.env.NODE_ENV === "development") {
  try {
    const devDeployed = require("../deployed.dev.json");
    const { mainnet, rinkeby, localhost, hardhat } = devDeployed;
    deployedContracts = {
      mainnet: Object.keys(mainnet).length !== 0 ? mainnet : deployed.mainnet,
      rinkeby: Object.keys(rinkeby).length !== 0 ? rinkeby : deployed.rinkeby,
      localhost,
      hardhat,
    };
  } catch (_err) {
    deployedContracts = deployed;
  }
} else {
  deployedContracts = deployed;
}

export const WorkhardCtx = React.createContext<{ workhard?: Workhard }>({});

export function useWorkhard() {
  const ctx = useContext(WorkhardCtx);
  return ctx;
}

export const WorkhardCtxProvider: React.FC<{
  daoId: number;
  web3: Web3ReactContextInterface<providers.Web3Provider>;
  ipfs?: IPFS;
}> = ({ children, daoId, ipfs, web3 }) => {
  const [context, setContext] = useState<{ workhard?: Workhard }>({});

  const getContext = async (
    daoId: number
  ): Promise<{ workhard?: Workhard }> => {
    if (!web3.library) return {};
    if (!web3.chainId) return {};
    if (!web3.account) return {};
    if (!ipfs) return {};
    const contracts = deployedContracts[getNetworkName(web3.chainId)];
    const workhardAddress = contracts?.Project;

    if (!workhardAddress) return {};
    const workhardContracts = await WorkhardContracts.from(
      web3.library,
      workhardAddress
    );
    const [dao, periphery, daoName, daoSymbol] = await Promise.all([
      workhardContracts.getDAO(daoId),
      workhardContracts.getPeriphery(daoId),
      workhardContracts.project.nameOf(daoId),
      workhardContracts.project.symbolOf(daoId),
    ]);

    if (!dao || !periphery) return {};
    const [
      visionName,
      visionSymbol,
      commitName,
      commitSymbol,
      rightName,
      rightSymbol,
      baseCurrencySymbol,
    ] = await Promise.all([
      dao.vision.name(),
      dao.vision.symbol(),
      dao.commit.name(),
      dao.commit.symbol(),
      dao.right.name(),
      dao.right.symbol(),
      dao.baseCurrency.symbol(),
    ]);
    const store = {
      stableReserveStore: new StableReserveStore(),
      mineStore: new MineStore(web3.library, dao, periphery),
      userStore: new UserStore(),
    };
    const workhard = new Workhard({
      daoId,
      workhard: workhardContracts,
      dao,
      periphery,
      commons: workhardContracts.commons,
      project: workhardContracts.project,
      metadata: {
        daoName,
        daoSymbol,
        visionName,
        visionSymbol,
        commitName,
        commitSymbol,
        rightName,
        rightSymbol,
        baseCurrencySymbol,
      },
      web3: {
        ...web3,
        chainId: web3.chainId,
        library: web3.library,
        account: web3.account,
      },
      ipfs,
      store,
    });
    return { workhard };
  };

  useEffect(() => {
    // dao id = 0 : master dao
    if (context) {
      if (context.workhard?.daoId !== daoId) {
        setContext({});
      }
    }
    getContext(daoId).then((ctx) => {
      setContext(ctx);
      ctx.workhard?.store.mineStore.init();
    });
  }, [web3.active, web3.library, web3.chainId, web3.account, ipfs, daoId]);

  return (
    <WorkhardCtx.Provider value={context}>{children}</WorkhardCtx.Provider>
  );
};
