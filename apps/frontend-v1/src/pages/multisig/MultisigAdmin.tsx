import React, { useState } from "react";
import Page from "../../layouts/Page";
import { Col, Row, Nav, Tab, Button, Container } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom";
import { useWorkhard } from "@workhard/react-core";
import { FatherSays, SetEmission, SerHelpPlz } from "@workhard/react-components";
import { MultisigProposal } from "./tabs/MultisigProposal";
import { getNetworkName } from "@workhard/protocol";
import { useWeb3React } from "@web3-react/core";
import { providers } from "ethers";
import { ProjectDetails } from "./tabs/ProjectDetails";

export const MultisigAdmin = () => {
  const history = useHistory();
  const { chainId } = useWeb3React<providers.Web3Provider>();
  const { subtab } = useParams<{ subtab?: string }>();
  const { workhard } = useWorkhard();
  const { daoId } = workhard || { daoId: 0 };
  const [tabKey, setTabKey] = useState<string>(subtab || "project-details");

  const fetching = (
    <Page>
      <FatherSays say={`Loading...`} />
    </Page>
  );

  const getGnosisLink = () => {
    let hostname: string;
    if (!chainId) return undefined;
    if (getNetworkName(chainId) === "rinkeby") {
      hostname = `rinkeby.gnosis-safe.io`;
    } else if (getNetworkName(chainId) === "mainnet") {
      hostname = `gnosis-safe.io`;
    } else {
      return undefined;
    }
    const multisig = workhard?.dao.multisig.address;
    return `https://${hostname}/app/#/safes/${multisig}/transactions`;
  };

  const fetched = (
    <Page>
      <Tab.Container activeKey={tabKey} onSelect={(k) => k && setTabKey(k)}>
        <Row>
          <Col sm={3}>
            <Nav
              variant="pills"
              className="flex-column"
              defaultActiveKey={"project-details"}
            >
              <Nav.Item>
                <Nav.Link eventKey="project-details">Project details</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="emission">Emission setting</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="transaction">Multisig transaction</Nav.Link>
              </Nav.Item>
            </Nav>
            <hr />
            <Button
              variant="outline-info"
              as={"a"}
              href={getGnosisLink()}
              target="_blank"
            >
              Go to Gnosis Safe
            </Button>
          </Col>
          <Col sm={9}>
            <Tab.Content>
              <Tab.Pane
                eventKey="project-details"
                onEnter={() => {
                  history.push("/multisig/project-details");
                }}
              >
                <ProjectDetails />
              </Tab.Pane>
              <Tab.Pane
                eventKey="emission"
                onEnter={() => {
                  history.push("/multisig/emission");
                }}
              >
                <SetEmission />
              </Tab.Pane>
              <Tab.Pane
                eventKey="transaction"
                onEnter={() => {
                  history.push("/multisig/transaction");
                }}
              >
                <MultisigProposal />
              </Tab.Pane>
            </Tab.Content>
            <hr />
            <Container>
              <SerHelpPlz>
                <p>
                  Here, you are scheduling a governance transaction to the
                  timelock contract using Gnosis Multisig Wallet. Confirm the
                  scheduling on Gnosis and go to transaction tab in Gov menu.
                  You will be able to execute them after the timelock delay.
                </p>
              </SerHelpPlz>
            </Container>
          </Col>
        </Row>
      </Tab.Container>
    </Page>
  );

  return !!workhard ? fetched : fetching;
};
