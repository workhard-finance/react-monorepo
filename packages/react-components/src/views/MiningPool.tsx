import { MiningPool__factory } from "@workhard/protocol";
import { UniswapV2Pair__factory } from "@workhard/protocol/dist/build/@uniswap";
import { BigNumber } from "ethers";
import { isAddress } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { useWorkhard } from "@workhard/react-core";
import {
  errorHandler,
  getTokenLogo,
  getTokenSymbol,
  getTokenType,
  TokenType,
  ERC165Hashes,
} from "@workhard/react-utils";
import { ERC20BurnMiningV1 } from "../contracts/mining-pool/ERC20BurnMiningV1";
import { ERC20StakeMiningV1 } from "../contracts/mining-pool/ERC20StakeMiningV1";

export interface MiningPoolProps {
  poolAddress: string;
  poolIdx: number;
  title?: string;
  tokenSymbol?: string;
  totalEmission: BigNumber;
  apy: number;
  emissionWeightSum: BigNumber;
  description?: string;
  collapsible?: boolean;
  link?: string;
}

export const MiningPool: React.FC<MiningPoolProps> = (props) => {
  const { workhard } = useWorkhard();
  const { addToast } = useToasts();
  const [poolType, setPoolType] = useState<ERC165Hashes.PoolTypeHash>();
  const [baseToken, setBaseToken] = useState<string>();
  const [tokenType, setTokenType] = useState<TokenType>();
  const [tokenSymbol, setTokenSymbol] = useState<string | undefined>(
    props.tokenSymbol
  );
  const [logos, setLogos] = useState<string[]>();

  useEffect(() => {
    if (workhard) {
      workhard.dao.visionEmitter
        .poolTypes(props.poolAddress)
        .then((sigHash) => setPoolType(sigHash as ERC165Hashes.PoolTypeHash))
        .catch(errorHandler(addToast));
      MiningPool__factory.connect(props.poolAddress, workhard.web3.library)
        .baseToken()
        .then(setBaseToken)
        .catch(errorHandler(addToast));
    }
  }, [workhard]);

  useEffect(() => {
    if (baseToken && isAddress(baseToken) && workhard) {
      getTokenType(baseToken, workhard.web3.library)
        .then(setTokenType)
        .catch(errorHandler(addToast));
    }
  }, [workhard, baseToken]);

  useEffect(() => {
    if (workhard && baseToken && tokenType) {
      getTokenSymbol(baseToken, tokenType, workhard.web3.library)
        .then(setTokenSymbol)
        .catch(errorHandler(addToast));
    }
  }, [workhard, baseToken, tokenType]);

  useEffect(() => {
    if (workhard && baseToken) {
      if (tokenSymbol === "UNI-V2") {
        Promise.all([
          UniswapV2Pair__factory.connect(
            baseToken,
            workhard.web3.library
          ).token0(),
          UniswapV2Pair__factory.connect(
            baseToken,
            workhard.web3.library
          ).token1(),
        ]).then(([token0, token1]) => {
          setLogos([token0, token1].map(getTokenLogo));
        });
      } else {
        setLogos([getTokenLogo(baseToken)]);
      }
    }
  }, [workhard, tokenSymbol]);
  if (poolType === ERC165Hashes.PoolType.ERC20BurnV1) {
    return (
      <ERC20BurnMiningV1
        poolIdx={props.poolIdx}
        title={props.title || `Burn Mining: ${tokenSymbol || baseToken}`}
        tokenName={tokenSymbol || baseToken}
        poolAddress={props.poolAddress}
        totalEmission={props.totalEmission}
        emissionWeightSum={props.emissionWeightSum}
        apy={props.apy || 0}
        collapsible={props.collapsible}
        logos={logos}
      />
    );
  } else if (poolType === ERC165Hashes.PoolType.ERC20StakeV1) {
    return (
      <ERC20StakeMiningV1
        poolIdx={props.poolIdx}
        title={props.title || `Stake Mining: ${tokenSymbol || baseToken}`}
        tokenName={tokenSymbol || baseToken}
        poolAddress={props.poolAddress}
        totalEmission={props.totalEmission}
        emissionWeightSum={props.emissionWeightSum}
        apy={props.apy || 0}
        collapsible={props.collapsible}
        logos={logos}
      />
    );
  } else if (poolType === undefined) {
    return (
      <Card>
        <Card.Body>
          <p>Fetching...</p>
        </Card.Body>
      </Card>
    );
  } else {
    return (
      <Card>
        <Card.Body>
          <p>Unsupported pool type. Please Make a PR!</p>
        </Card.Body>
      </Card>
    );
  }
};
