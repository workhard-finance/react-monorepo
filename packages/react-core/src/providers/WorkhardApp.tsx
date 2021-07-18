import React from "react";
import { providers } from "ethers";
import { useWeb3React, Web3ReactProvider } from "@web3-react/core";
import { IPFSProvider, useIPFS } from "./IPFSProvider";
import { WorkhardCtxProvider } from "./WorkhardCtxProvider";
import { BlockNumberProvider } from "./BlockNumberProvider";

const Web3Workhard = ({
  daoId,
  children,
}: {
  daoId: number;
  children: any;
}) => {
  const web3 = useWeb3React<providers.Web3Provider>();
  const { ipfs } = useIPFS();
  return (
    <WorkhardCtxProvider daoId={daoId} ipfs={ipfs} web3={web3}>
      {children}
    </WorkhardCtxProvider>
  );
};

const getLibrary = (
  provider: providers.ExternalProvider | providers.JsonRpcFetchFunc,
  _: any
) => {
  const library = new providers.Web3Provider(provider); // this will vary according to whether you use e.g. ethers or web3.js
  library.pollingInterval = 12000;
  return library;
};

export const WorkhardApp = ({
  children,
  daoId,
}: {
  children: any;
  daoId: number;
}) => {
  // const match = useRouteMatch<{ daoId?: string }>("/:daoId?/");
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <BlockNumberProvider>
        <IPFSProvider>
          <Web3Workhard daoId={daoId}>{children}</Web3Workhard>
        </IPFSProvider>
      </BlockNumberProvider>
    </Web3ReactProvider>
  );
};
