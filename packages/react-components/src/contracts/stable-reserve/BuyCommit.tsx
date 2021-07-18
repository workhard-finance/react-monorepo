import React, { useEffect, useState } from "react";
import { constants } from "ethers";
import { Card, Col, Form, InputGroup, Row } from "react-bootstrap";
import { useWorkhard, useBlockNumber } from "@workhard/react-core";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../views/ConditionalButton";
import {
  errorHandler,
  handleTransaction,
  isApproved,
  TxStatus,
} from "@workhard/react-utils";
import { useToasts } from "react-toast-notifications";
import { observer } from "mobx-react";

export interface BuyCommitProps {
  style?: React.CSSProperties;
}

export const BuyCommit: React.FC<BuyCommitProps> = observer(({ style }) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const { workhard } = useWorkhard();
  const { dao } = workhard || {};
  const [spendingDai, setSpendingDai] = useState<string>();
  const [approveTxStatus, setApproveTxStatus] = useState<TxStatus>();
  const [buyTxStatus, setBuyTxStatus] = useState<TxStatus>();

  const getMaxSpending = () =>
    formatEther(workhard?.store.stableReserveStore.daiBalance || "0");

  const approveAndBuy = () => {
    if (!account || !workhard || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      workhard.dao.baseCurrency
        .connect(signer)
        .approve(workhard.dao.stableReserve.address, constants.MaxUint256),
      setApproveTxStatus,
      addToast,
      "Approved StableReserve.",
      buyCommit
    );
  };

  const buyCommit = () => {
    const store = workhard?.store.stableReserveStore;
    if (!account || !workhard || !library || !store) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const stableReserve = workhard.dao.stableReserve;
    const buyAmountInWei = parseEther(spendingDai || "0").div(2);
    if (!store.daiBalance) {
      alert("Fetching balance..");
      return;
    } else if (
      store.daiBalance &&
      parseEther(spendingDai || "0").gt(store.daiBalance)
    ) {
      alert("Not enough amount of base currency");
      return;
    }
    handleTransaction(
      stableReserve.connect(signer).payInsteadOfWorking(buyAmountInWei),
      setBuyTxStatus,
      addToast,
      `Successfully bought ${workhard.metadata.commitSymbol}`,
      () => {
        workhard.dao.commit.balanceOf(account).then(store.setCommitBalance);
        setSpendingDai("");
      }
    );
  };

  useEffect(() => {
    if (!!account && !!workhard) {
      const store = workhard.store.stableReserveStore;
      const baseCurrency = workhard.dao.baseCurrency;
      baseCurrency
        .balanceOf(account)
        .then(store.setDaiBalance)
        .catch(errorHandler(addToast));
      baseCurrency
        .allowance(account, workhard.dao.stableReserve.address)
        .then(store.setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, workhard, approveTxStatus, blockNumber]);

  return (
    <Card border={"primary"} style={style}>
      <Card.Header className="text-primary border-primary bg-white">
        Buy
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={7}>
            <Card.Title>Stable balance</Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>
                {parseFloat(
                  formatEther(
                    workhard?.store.stableReserveStore.daiBalance || 0
                  )
                ).toFixed(2)}
              </span>{" "}
              {workhard?.metadata.baseCurrencySymbol || `$DAI`}
            </Card.Text>
          </Col>
          <Col md={5}>
            <Card.Title>Rate</Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>2</span>{" "}
              {workhard?.metadata.baseCurrencySymbol || `DAI`} per{" "}
              {workhard?.metadata.commitSymbol || `COMMIT`}
            </Card.Text>
          </Col>
        </Row>
        <br />
        <Form>
          <Form.Group>
            <InputGroup className="mb-2">
              <InputGroup.Prepend>
                <InputGroup.Text>$DAI</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                value={spendingDai}
                onChange={({ target: { value } }) => setSpendingDai(value)}
                placeholder={getMaxSpending()}
              />
              <InputGroup.Append
                style={{ cursor: "pointer" }}
                onClick={() => setSpendingDai(getMaxSpending())}
              >
                <InputGroup.Text>MAX</InputGroup.Text>
              </InputGroup.Append>
            </InputGroup>
          </Form.Group>
          <Card.Text>
            {`= ${formatEther(parseEther(spendingDai || "0").div(2))} ${
              workhard?.metadata.commitSymbol || `$COMMIT`
            }`}
          </Card.Text>
          <ConditionalButton
            variant={"outline-danger"}
            className={"text-danger"}
            onClick={
              isApproved(
                workhard?.store.stableReserveStore.allowance,
                spendingDai
              )
                ? buyCommit
                : approveAndBuy
            }
            enabledWhen={
              buyTxStatus !== TxStatus.PENDING &&
              approveTxStatus !== TxStatus.PENDING
            }
            whyDisabled={
              isApproved(
                workhard?.store.stableReserveStore.allowance,
                spendingDai
              )
                ? "Approving contract"
                : "Buying"
            }
            children={
              approveTxStatus === TxStatus.PENDING
                ? "Approving..."
                : isApproved(
                    workhard?.store.stableReserveStore.allowance,
                    spendingDai
                  )
                ? buyTxStatus === TxStatus.PENDING
                  ? "Buying..."
                  : `Buy ${
                      workhard?.metadata.commitSymbol || `$COMMIT`
                    } at a premium`
                : "Approve"
            }
          />
        </Form>
      </Card.Body>
    </Card>
  );
});
