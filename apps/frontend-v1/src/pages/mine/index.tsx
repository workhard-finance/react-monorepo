import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Col, Row } from "react-bootstrap";
import {
  TitleButSer,
  SerHelpPlz,
  ERC20StakeMiningV1,
  ERC20BurnMiningV1,
  InitialContributorSharePool,
  MiningPool,
} from "@workhard/react-components";
import { useWorkhard, useBlockNumber } from "@workhard/react-core";
import { BigNumber } from "@ethersproject/bignumber";
import { useWeb3React } from "@web3-react/core";
import { errorHandler, handleTransaction, TxStatus } from "@workhard/react-utils";
import { useToasts } from "react-toast-notifications";
import { observer } from "mobx-react";
import {
  ContributionBoard__factory,
  InitialContributorShare__factory,
} from "@workhard/protocol";
import { Link } from "react-router-dom";

const Mine = observer(() => {
  const { addToast } = useToasts();
  const { account, library, chainId } = useWeb3React();
  const { workhard } = useWorkhard();
  const { daoId, dao } = workhard || {};
  const mineStore = workhard?.store.mineStore;
  const { blockNumber } = useBlockNumber();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [initialContributor, setInitialContributor] = useState<boolean>();
  const [
    initialContributorShare,
    setInitialContributorShare,
  ] = useState<string>();
  const [
    initialContributorPool,
    setInitialContributorPool,
  ] = useState<string>();

  useEffect(() => {
    if (!!dao && account && library && mineStore) {
      const signer = library.getSigner(account);
      mineStore.loadPools().then(async () => {
        await mineStore.loadVisionPrice();
        await mineStore.loadCommitPrice();
        mineStore.loadAPYs();
      });
      mineStore.isDistributable(signer);
      dao.visionEmitter
        .initialContributorShare()
        .then(setInitialContributorShare)
        .catch(errorHandler(addToast));
      dao.visionEmitter
        .initialContributorPool()
        .then(setInitialContributorPool)
        .catch(errorHandler(addToast));
    }
  }, [dao, blockNumber, account, library]);

  useEffect(() => {
    if (
      !!initialContributorPool &&
      !!initialContributorShare &&
      !!library &&
      !!account
    ) {
      ContributionBoard__factory.connect(initialContributorShare, library)
        .balanceOf(account, daoId || "0")
        .then((bal) => {
          if (bal.gt(0)) {
            setInitialContributor(true);
          }
        });
      InitialContributorShare__factory.connect(initialContributorPool, library)
        .dispatchedMiners(account)
        .then((miners) => {
          if (miners.gt(0)) {
            setInitialContributor(true);
          }
        });
    }
  }, [account, library, initialContributorShare, initialContributorPool]);

  useEffect(() => {
    if (!!dao && !!mineStore?.pools) {
      mineStore.loadEmission();
      mineStore.loadEmissionWeightSum();
    }
  }, [library, dao, txStatus]);

  const distribute = () => {
    if (!!account && !!dao && !!library) {
      const signer = library.getSigner(account);
      handleTransaction(
        dao.visionEmitter.connect(signer).distribute(),
        setTxStatus,
        addToast,
        "You've mined the distribution transaction!!",
        () => mineStore?.isDistributable(signer)
      );
    }
  };

  const subPools = mineStore?.pools
    ?.map((addr, idx) => {
      if (
        !addr ||
        idx === mineStore.liquidityMiningIdx() ||
        idx === mineStore.commitMiningIdx() ||
        !mineStore.emissionWeightSum
      )
        return undefined;
      else
        return (
          <div key={`mine-${addr}-${idx}`}>
            <br />
            <MiningPool
              poolIdx={idx}
              poolAddress={addr}
              totalEmission={mineStore.emission}
              emissionWeightSum={mineStore.emissionWeightSum}
              apy={mineStore.apy(addr)}
              collapsible
            />
          </div>
        );
    })
    .filter((pool) => pool !== undefined);

  return (
    <Page>
      <TitleButSer link="https://whf.gitbook.io/docs/mine#main-pools">
        Main pools
      </TitleButSer>
      <p>
        Got some hard earned{" "}
        {workhard && workhard.daoId !== 0
          ? `${workhard.metadata.commitName}(${workhard.metadata.commitSymbol})`
          : "$COMMIT"}{" "}
        wages? Prove your dedication and belief by mining your project's
        on-chain stock option,{" "}
        {workhard && workhard.daoId !== 0
          ? `${workhard.metadata.visionName}(${workhard.metadata.visionSymbol})`
          : "$VISION"}{" "}
        or LP{" "}
        {workhard && workhard.daoId !== 0
          ? workhard.metadata.visionSymbol
          : "$VISION"}
        !
      </p>
      <Row>
        <Col md={6}>
          {mineStore?.pools &&
            mineStore.liquidityMiningIdx() !== -1 &&
            workhard &&
            mineStore.emissionWeightSum && (
              <ERC20StakeMiningV1
                poolIdx={mineStore.liquidityMiningIdx()}
                title={"Liquidity Mining"}
                description={`Provide more liquidity for your project's on-chain stock options. LP your ${
                  workhard && workhard.daoId !== 0
                    ? `${workhard.metadata.visionName}(${workhard.metadata.visionSymbol})`
                    : "$VISION"
                } to earn more ${
                  workhard && workhard.daoId !== 0
                    ? workhard.metadata.visionSymbol
                    : "$VISION"
                }`}
                tokenName={`${
                  workhard?.metadata.visionSymbol || "VISION"
                }/ETH LP`}
                link={
                  chainId === 1
                    ? `https://app.sushi.com/add/ETH/${workhard.dao.vision.address}`
                    : `https://app.uniswap.org/#/add/v2/ETH/${workhard.dao.vision.address}`
                }
                poolAddress={workhard.periphery.liquidityMining.address}
                totalEmission={mineStore.emission}
                emissionWeightSum={mineStore.emissionWeightSum}
                apy={mineStore.apy(
                  workhard.periphery.liquidityMining.address
                )}
              />
            )}
        </Col>
        <Col md={6}>
          {mineStore?.pools &&
            mineStore.commitMiningIdx() !== -1 &&
            workhard &&
            mineStore.emissionWeightSum && (
              <ERC20BurnMiningV1
                poolIdx={mineStore.commitMiningIdx()}
                title={"Commit Mining"}
                tokenName={workhard.metadata.commitSymbol}
                description={`Show your true, long-term belief in your project. Burn ${
                  workhard && workhard.daoId !== 0
                    ? `${workhard.metadata.commitName}(${workhard.metadata.commitSymbol})`
                    : "$COMMIT"
                } to continuously mine ${
                  workhard && workhard.daoId !== 0
                    ? `${workhard.metadata.visionName}(${workhard.metadata.visionSymbol})`
                    : "$VISION"
                }`}
                link={"/work"}
                poolAddress={workhard.periphery.commitMining.address}
                totalEmission={mineStore.emission || BigNumber.from(0)}
                emissionWeightSum={mineStore.emissionWeightSum}
                apy={
                  mineStore.apy(workhard.periphery.commitMining.address) ||
                  NaN
                }
                maxAPY={mineStore.maxAPY(
                  workhard.periphery.commitMining.address
                )}
              />
            )}
        </Col>
      </Row>

      {subPools && subPools.length > 0 && (
        <>
          <br />
          <br />
          <TitleButSer link="https://whf.gitbook.io/docs/mine#sub-pools">
            Sub pools
          </TitleButSer>
          <Row>
            {subPools.map((subPool) => (
              <Col md={4}>{subPool}</Col>
            ))}
          </Row>
        </>
      )}
      {mineStore && initialContributor && initialContributorPool && (
        <>
          <br />
          <TitleButSer link="https://whf.gitbook.io/docs/mine#icsp">
            Early Stage Contributors Pool!
          </TitleButSer>
          <p>
            Congratulations! You can mine for more $VISION here with your
            special early stage contributor tokens! Keep in mind that if you
            completely withdraw, you will lose out on more $VISION emission
            rewards.
          </p>
          <InitialContributorSharePool
            poolAddress={initialContributorPool}
            totalEmission={mineStore.emission || BigNumber.from(0)}
            emissionWeightSum={mineStore.emissionWeightSum}
            apy={mineStore.apy(initialContributorPool)}
          />
        </>
      )}
      <br />

      <SerHelpPlz>
        <p>
          The two ways to mine{" "}
          {workhard && workhard.daoId !== 0
            ? `${workhard.metadata.visionName}(${workhard.metadata.visionSymbol})`
            : "$VISION"}{" "}
          <Link to={"/#emission-schedule"} className="text-info">
            (Emission Detail)
          </Link>
          :
          <ol>
            <li>
              Burn{" "}
              {workhard && workhard.daoId !== 0
                ? `${workhard.metadata.commitName}(${workhard.metadata.commitSymbol})`
                : "$COMMIT"}{" "}
              to get{" "}
              {workhard && workhard.daoId !== 0
                ? `${workhard.metadata.visionName}(${workhard.metadata.visionSymbol})`
                : "$VISION"}{" "}
              through COMMIT MINING.
              <a
                href="https://whf.gitbook.io/docs/mine#needs-updated"
                className="text-info"
              >
                (Example)
              </a>
            </li>
            <li>
              Provide {workhard?.metadata.visionSymbol || "$VISION"}/ETH LP
              token to LIQUIDITY MINE{" "}
              {workhard?.metadata.visionName || "$VISION"}
            </li>
          </ol>
          Stake & lock{" "}
          {workhard && workhard.daoId !== 0
            ? workhard.metadata.visionName
            : "$VISION"}{" "}
          to receive{" "}
          <a
            href="https://whf.gitbook.io/docs/tokens#usdright"
            className="text-info"
          >
            {workhard && workhard.daoId !== 0
              ? workhard.metadata.rightName
              : "$RIGHT"}
          </a>{" "}
          (
          {workhard && workhard.daoId !== 0
            ? workhard.metadata.rightSymbol
            : "$veVISION"}
          ) and join to{" "}
          <Link to={"/gov"} target="_blank" className="text-info">
            govern
          </Link>{" "}
          the WORKER???S UNION. With{" "}
          {workhard?.metadata.rightSymbol || "$RIGHT"} you can claim a share
          of the{" "}
          {workhard && workhard.daoId !== 0
            ? workhard.metadata.daoName
            : "Work Hard Finance"}
          ???s profit.
        </p>
      </SerHelpPlz>
    </Page>
  );
});

export default Mine;
