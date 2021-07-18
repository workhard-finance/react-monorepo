import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Image, Col, Row, Card, Button, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  OverlayTooltip,
  Erc20Balance,
  FatherSays,
  Allocation,
  EmissionChart,
} from "@workhard/react-components";
import { useWorkhard, useIPFS } from "@workhard/react-core";
import { BigNumber } from "ethers";
import { useToasts } from "react-toast-notifications";
import {
  bigNumToFixed,
  errorHandler,
  fetchProjectMetadataFromIPFS,
  ProjectMetadata,
  uriToURL,
} from "@workhard/react-utils";
import { getAddress } from "ethers/lib/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import { CopyToClipboard } from "react-copy-to-clipboard";

const Dashboard = () => {
  const { addToast } = useToasts();

  const { workhard } = useWorkhard();
  const { daoId, ipfs } = workhard || { daoId: 0, ipfs: undefined };

  const [emissionRule, setEmissionRule] = useState<{
    initialEmission: BigNumber;
    emissionCut: number;
    minimumRate: number;
    currentWeek: number;
  }>({
    initialEmission: BigNumber.from(0),
    emissionCut: 0,
    minimumRate: 0,
    currentWeek: 0,
  });

  const [metadata, setMetadata] = useState<ProjectMetadata>();
  const [emissionStarted, setEmissionStarted] = useState<number>();
  const [mintable, setMintable] = useState<BigNumber>();
  const [burnedCommit, setBurnedCommit] = useState<BigNumber>();
  const [baseCurrencySymbol, setBaseCurrencySymbol] = useState<string>();
  const [visionSupply, setVisionSupply] = useState<BigNumber>();
  const [rightSupply, setRightSupply] = useState<BigNumber>();

  useEffect(() => {
    if (daoId === 0) {
      // fast load for master dao
      setMetadata({
        name: "Work Hard Finance",
        description:
          "Work Hard Finance empowers contributors with the choice to be compensated now, in stablecoins, or in the future via liquid stock options. No more stressful haggling over what’s fair — your compensation, in your hands, real time.",
        image: "ipfs://QmPj8nm5d9hPVp7te9qiAWYvDkdnQaz1uNgU9mxN5ym5Ei",
        url: "https://workhard.finance",
      });
    }
    if (workhard) {
      // get emission rule
      Promise.all([
        workhard.dao.visionEmitter.INITIAL_EMISSION(),
        workhard.dao.visionEmitter.emissionCutRate(),
        workhard.dao.visionEmitter.minEmissionRatePerWeek(),
        workhard.dao.visionEmitter.emissionWeekNum(),
      ])
        .then(([initialEmission, emissionCut, minimumRate, currentWeek]) => {
          setEmissionRule({
            initialEmission,
            emissionCut: emissionCut.toNumber(),
            minimumRate: minimumRate.toNumber(),
            currentWeek: currentWeek.toNumber(),
          });
        })
        .catch(errorHandler(addToast));
      workhard.dao.visionEmitter
        .emissionStarted()
        .then((num) => setEmissionStarted(num.toNumber()))
        .catch(errorHandler(addToast));
      workhard.dao.stableReserve
        .mintable()
        .then(setMintable)
        .catch(errorHandler(addToast));
      workhard.dao.baseCurrency
        .symbol()
        .then(setBaseCurrencySymbol)
        .catch(errorHandler(addToast));
      workhard.dao.vision
        .totalSupply()
        .then(setVisionSupply)
        .catch(errorHandler(addToast));
      workhard.dao.right
        .totalSupply()
        .then(setRightSupply)
        .catch(errorHandler(addToast));
      workhard.dao.commit
        .totalBurned()
        .then(setBurnedCommit)
        .catch(errorHandler(addToast));
    }
  }, [workhard, daoId]);

  useEffect(() => {
    if (!!workhard && !!ipfs) {
      const projId = daoId || 0;
      workhard.project
        .tokenURI(projId)
        .then(async (uri) => {
          setMetadata(await fetchProjectMetadataFromIPFS(ipfs, uri));
        })
        .catch(errorHandler(addToast));
    }
  }, [workhard, daoId, ipfs]);

  const poolName = (address: string): string => {
    if (workhard) {
      if (
        getAddress(address) ===
        getAddress(workhard.periphery.liquidityMining.address)
      ) {
        return "Liquidity Providers";
      } else if (
        getAddress(address) ===
        getAddress(workhard.periphery.commitMining.address)
      ) {
        return "Commit Burners";
      }
    }
    return address;
  };

  const fetching = (
    <Page>
      <FatherSays say={`Loading...`} />
    </Page>
  );
  const fetched = (
    <Page>
      <Row>
        <Col md={5}>
          <Image
            src={
              metadata
                ? uriToURL(metadata.image)
                : process.env.PUBLIC_URL + "/images/daily-life.jpeg"
            }
            style={{ maxWidth: "100%" }}
          />
        </Col>
        <Col md={7}>
          <h2>
            What is <b>{metadata?.name}?</b>
          </h2>
          <p>{metadata?.description}</p>
          {(daoId || 0) !== 0 && metadata?.url && (
            <Button as={"a"} href={metadata.url} target="_blank" variant="info">
              Go to app
            </Button>
          )}
        </Col>
      </Row>
      <hr />
      <h2>
        <b>Your balance</b>
      </h2>
      <Row>
        <Col md={4}>
          <Erc20Balance
            title={workhard?.metadata.commitName || "COMMIT Token"}
            address={workhard?.dao.commit.address}
            symbolAlt={workhard?.metadata.commitSymbol || "COMMIT"}
          >
            <Button as={Link} to={"work"}>
              Go to work
            </Button>
          </Erc20Balance>
        </Col>
        <Col md={4}>
          <Erc20Balance
            title={workhard?.metadata.visionName || "VISION Token"}
            address={workhard?.dao.vision.address}
            symbolAlt={workhard?.metadata.visionSymbol || "VISION"}
          >
            <Button as={Link} to={"mine"}>
              Go to mine
            </Button>
          </Erc20Balance>
        </Col>
        <Col md={4}>
          <Erc20Balance
            title={workhard?.metadata.rightName || "RIGHT Token"}
            address={workhard?.dao.right.address}
            symbolAlt={workhard?.metadata.rightSymbol || "RIGHT"}
          >
            <Button as={Link} to={"gov"}>
              Go to lock ${workhard?.metadata.visionSymbol}
            </Button>
          </Erc20Balance>
        </Col>
      </Row>
      <br />
      <Row>
        <Col md={6}>
          <h2>
            <b>Emission</b> schedule
          </h2>
          <EmissionChart {...emissionRule} />
          <p>
            Emission started at{" "}
            {emissionStarted && new Date(emissionStarted * 1000).toDateString()}{" "}
            and its first distribution was{" "}
            {emissionStarted &&
              new Date(
                emissionStarted * 1000 + 86400 * 7 * 1000
              ).toDateString()}
          </p>
        </Col>
        <Col md={6}>
          <h2>
            <b>Allocation</b>
          </h2>
          <Allocation />
        </Col>
      </Row>
      <h2>
        <b>Statistics</b>
      </h2>
      <Row>
        <Col md={3}>
          <Card border={"primary"}>
            <Card.Body>
              <Card.Title className={"text-primary"}>
                <strong>Mintable COMMIT</strong>
                <OverlayTooltip
                  tip={`Governance can mint more ${
                    workhard?.metadata.commitSymbol || "COMMIT"
                  } and give grants to contributors.`}
                  text={`❔`}
                />
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(mintable || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${baseCurrencySymbol}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card border={"primary"}>
            <Card.Body>
              <Card.Title className={"text-primary"}>
                <strong>
                  Burned {workhard?.metadata.commitSymbol || "COMMIT"}
                  <OverlayTooltip
                    tip={`A stablecoin to tokenize your revenue stream. Pay your workers with value-added money.`}
                    text={`❔`}
                  />
                </strong>
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(burnedCommit || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${workhard?.metadata.commitSymbol || "COMMIT"}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card border={"primary"}>
            <Card.Body>
              <Card.Title className={"text-primary"}>
                <strong>
                  Total {workhard?.metadata.visionSymbol || "VISION"}
                  <OverlayTooltip
                    tip={`Liquid stock options for your project. Believers are ${
                      workhard?.metadata.visionSymbol || "VISION"
                    } long term HODLers. Unbelievers can easily exit.`}
                    text={`❔`}
                  />
                </strong>
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(visionSupply || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${workhard?.metadata.visionSymbol || "VISION"}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card border={"primary"}>
            <Card.Body>
              <Card.Title className={"text-primary"}>
                <strong>
                  Total {workhard?.metadata.rightSymbol || "RIGHT"}
                  <OverlayTooltip
                    tip={`
                  Reward your long term ${
                    workhard?.metadata.visionSymbol || "VISION"
                  } believers with access to devidends and voting power.`}
                    text={`❔`}
                  />
                </strong>
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(rightSupply || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${workhard?.metadata.rightSymbol || "RIGHT"}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <br />
      <br />
      <h2>
        <b>Contracts</b>
      </h2>
      <Row>
        <Col md={7}>
          <Table>
            <thead>
              <tr>
                <th scope="col">Contract Name</th>
                <th scope="col">Address</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Workhard Project Contract", workhard?.project.address],
                ["Multisig", workhard?.dao.multisig.address],
                ["Timelock", workhard?.dao.timelock.address],
                [
                  workhard?.metadata.visionName,
                  workhard?.dao.vision.address,
                ],
                [
                  workhard?.metadata.commitName,
                  workhard?.dao.commit.address,
                ],
                [
                  workhard?.metadata.rightName,
                  workhard?.dao.right.address,
                ],
                [
                  workhard?.metadata.baseCurrencySymbol,
                  workhard?.dao.baseCurrency.address,
                ],
                ["Stable Reserve", workhard?.dao.stableReserve.address],
                [
                  "Contribution Board",
                  workhard?.dao.contributionBoard.address,
                ],
                ["Marketplace", workhard?.dao.marketplace.address],
                ["Dividend Pool", workhard?.dao.dividendPool.address],
                ["Vote Counter", workhard?.dao.voteCounter.address],
                ["Workers Union", workhard?.dao.workersUnion.address],
                ["Token Emitter", workhard?.dao.visionEmitter.address],
                ["Voting Escrow", workhard?.dao.votingEscrow.address],
                [
                  "Commit Mining Pool",
                  workhard?.periphery.commitMining.address,
                ],
                [
                  "Liquidity Mining Pool",
                  workhard?.periphery.liquidityMining.address,
                ],
                [
                  `${workhard?.metadata.visionSymbol}/ETH LP`,
                  workhard?.periphery.visionLP.address,
                ],
              ].map((contract) => (
                <tr>
                  <td>{contract[0]}</td>
                  <td>
                    <>
                      <a
                        href={`https://etherscan.io/address/${contract[1]}`}
                        target="_blank"
                      >
                        {contract[1]}
                      </a>
                    </>
                  </td>
                  <td>
                    <CopyToClipboard
                      text={contract[1] || ""}
                      onCopy={() =>
                        addToast({
                          variant: "info",
                          content: "copied!",
                        })
                      }
                    >
                      <FontAwesomeIcon
                        icon={faCopy}
                        style={{ cursor: "pointer" }}
                      />
                    </CopyToClipboard>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Page>
  );

  return !!metadata && !!workhard ? fetched : fetching;
};

export default Dashboard;
