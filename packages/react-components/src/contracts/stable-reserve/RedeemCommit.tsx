import React, { useEffect, useState } from "react";
import { constants } from "ethers";
import { Card, Form, InputGroup, Row, Col } from "react-bootstrap";
import { useWorkhard, useBlockNumber } from "@workhard/react-core";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import {
  errorHandler,
  handleTransaction,
  isApproved,
  TxStatus,
} from "@workhard/react-utils";
import { ConditionalButton } from "../../views/ConditionalButton";
import { useToasts } from "react-toast-notifications";
import { observer } from "mobx-react";

export const RedeemCommit: React.FC = observer(() => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const { workhard } = useWorkhard();
  const [redeemAmount, setRedeemAmount] = useState<string>();
  const [approveTxStatus, setApproveTxStatus] = useState<TxStatus>();
  const [redeemTxStatus, setRedeemTxStatus] = useState<TxStatus>();
  const { stableReserveStore: store } = workhard?.store || {};

  const getMaxRedeem = () => formatEther(store?.commitBalance || "0");

  const approveAndRedeem = () => {
    if (!account || !workhard || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    handleTransaction(
      workhard.dao.commit
        .connect(signer)
        .approve(workhard.dao.stableReserve.address, constants.MaxUint256),
      setApproveTxStatus,
      addToast,
      "Approved StableReserve.",
      redeem
    );
  };

  const redeem = () => {
    if (!account || !workhard || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const stableReserve = workhard.dao.stableReserve;
    const redeemAmountInWei = parseEther(redeemAmount || "0");
    if (store?.commitBalance && redeemAmountInWei.gt(store.commitBalance)) {
      alert("Not enough amount of commit balance");
      return;
    }

    handleTransaction(
      stableReserve.connect(signer).redeem(redeemAmountInWei),
      setRedeemTxStatus,
      addToast,
      `Successfully bought ${workhard.metadata.commitSymbol}`,
      () => {
        setRedeemAmount("");
      }
    );
  };

  useEffect(() => {
    if (!!account && !!workhard && !!store) {
      const commitToken = workhard.dao.commit;
      commitToken
        .balanceOf(account)
        .then(store.setCommitBalance)
        .catch(errorHandler(addToast));
      commitToken
        .allowance(account, workhard.dao.stableReserve.address)
        .then(store.setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, workhard, blockNumber]);
  return (
    <Card border={"primary"}>
      <Card.Header className="text-primary border-primary bg-white">
        Redeem
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={7}>
            <Card.Title>
              {workhard?.metadata.commitSymbol || `$COMMIT`} balance
            </Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>
                {parseFloat(formatEther(store?.commitBalance || 0)).toFixed(2)}
              </span>{" "}
              {workhard?.metadata.commitSymbol || `$COMMIT`}
            </Card.Text>
          </Col>
          <Col md={5}>
            <Card.Title>Rate</Card.Title>
            <Card.Text>
              <span style={{ fontSize: "2rem" }}>1</span>{" "}
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
                <InputGroup.Text>
                  {workhard?.metadata.commitSymbol || "$COMMIT"}
                </InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                value={redeemAmount}
                onChange={({ target: { value } }) => setRedeemAmount(value)}
                placeholder={getMaxRedeem()}
              />
              <InputGroup.Append
                style={{ cursor: "pointer" }}
                onClick={() => setRedeemAmount(getMaxRedeem())}
              >
                <InputGroup.Text>MAX</InputGroup.Text>
              </InputGroup.Append>
            </InputGroup>
          </Form.Group>
          <Card.Text>
            {`= ${formatEther(parseEther(redeemAmount || "0"))} $DAI`}
          </Card.Text>
          <ConditionalButton
            variant={"outline-success"}
            className={"text-success"}
            onClick={
              isApproved(store?.allowance, redeemAmount)
                ? redeem
                : approveAndRedeem
            }
            enabledWhen={
              redeemTxStatus !== TxStatus.PENDING &&
              approveTxStatus !== TxStatus.PENDING
            }
            whyDisabled={
              isApproved(store?.allowance, redeemAmount)
                ? "Approving contract"
                : "Redeeming..."
            }
            children={
              approveTxStatus === TxStatus.PENDING
                ? "Approving..."
                : isApproved(store?.allowance, redeemAmount)
                ? redeemTxStatus === TxStatus.PENDING
                  ? "Redeeming..."
                  : `Redeem ${
                      workhard?.metadata.commitSymbol || "$COMMIT"
                    } for $DAI`
                : "Approve"
            }
          />
        </Form>
      </Card.Body>
    </Card>
  );
});
