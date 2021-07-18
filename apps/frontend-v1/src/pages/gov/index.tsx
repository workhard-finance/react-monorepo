import React from "react";
import Page from "../../layouts/Page";
import { Tab, Tabs } from "react-bootstrap";
import { TimelockTxs } from "./tabs/TimelockTxs";
import Vote from "./tabs/Vote";
import { EscrowAndDividend } from "./tabs/EscrowAndDividend";
import { useWorkhard } from "@workhard/react-core";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import { TitleButSer } from "@workhard/react-components";

const Gov: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const history = useHistory();
  const { workhard } = useWorkhard();
  const { daoId } = workhard || { daoId: 0 };

  return (
    <Page>
      <p>
        True believers who stake & lock the project’s{" "}
        {workhard ? `$${workhard.metadata.visionSymbol}` : "$VISION"}{" "}
        tokens unlock non-transferable{" "}
        {workhard ? `$${workhard.metadata.rightSymbol}` : "$RIGHT"}{" "}
        tokens. Claim your project’s revenue dividends with{" "}
        {workhard ? `$${workhard.metadata.rightSymbol}` : "$RIGHT"} and
        vote with{" "}
        {workhard ? `$${workhard.metadata.rightSymbol}` : "$RIGHT"} in the
        WORKER’S UNION.
      </p>
      {/* <Alert variant={"warning"}>
        All men must work, even the rich, because to work was the will of God
      </Alert> */}
      <TitleButSer link="https://whf.gitbook.io/docs/governance" />
      <Tabs defaultActiveKey={tab || "dividend"}>
        <Tab
          eventKey="dividend"
          title="Escrow & Dividend"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push("/gov/dividend")}
        >
          <EscrowAndDividend />
        </Tab>
        <Tab
          eventKey="timelock"
          title="Transactions"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push("/gov/timelock")}
        >
          <TimelockTxs />
        </Tab>
        <Tab
          eventKey="vote"
          title="Vote"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push("/gov/vote")}
        >
          <Vote />
        </Tab>
      </Tabs>
    </Page>
  );
};

export default Gov;
