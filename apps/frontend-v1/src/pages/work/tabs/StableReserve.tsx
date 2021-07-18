import React, { useState, useEffect } from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { BuyCommit, RedeemCommit } from "@workhard/react-components";
import { useWorkhard, useBlockNumber } from "@workhard/react-core";

const StableReserve: React.FC = () => {
  const { workhard } = useWorkhard();
  const [commitPrice, setCommitPrice] = useState<number>();
  const { blockNumber } = useBlockNumber();
  const mineStore = workhard?.store.mineStore;

  useEffect(() => {
    if (!!mineStore) {
      mineStore.loadCommitPrice().then(() => {
        setCommitPrice(mineStore.commitPrice);
      });
    }
  }, [workhard, blockNumber]);

  return (
    <Row>
      <Col md={5} style={{ marginTop: "1rem" }}>
        <RedeemCommit />
      </Col>
      <Col md={2} style={{ marginTop: "1rem", height: "inherit" }}>
        <Card style={{ height: "100%" }} border={`primary`}>
          <Card.Header className="text-primary border-primary bg-white">
            Market Price
          </Card.Header>
          <Card.Body>
            <Card.Title>Market Price</Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>{commitPrice || `???`}</span>
              <br />
              {workhard?.metadata.baseCurrencySymbol || `DAI`} per{" "}
              {workhard?.metadata.commitSymbol || `COMMIT`}
            </Card.Text>
            <br />
            <br />
            <Button
              as={`a`}
              variant={"outline-warning"}
              className={"text-warning"}
              children={`Go to Uniswap`}
              style={{
                position: "absolute",
                bottom: "1rem",
              }}
              href={`https://app.uniswap.org/#/swap?inputCurrency=${workhard?.dao.baseCurrency.address}&outputCurrency=${workhard?.dao.commit.address}&use=V3`}
              target="_blank"
            />
          </Card.Body>
        </Card>
      </Col>
      <Col md={5} style={{ marginTop: "1rem", height: "inherit" }}>
        <BuyCommit style={{ height: "100%" }} />
      </Col>
    </Row>
  );
};

export default StableReserve;
