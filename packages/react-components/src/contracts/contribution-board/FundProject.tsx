import React, { useEffect, useState } from "react";
import { BigNumber, BigNumberish, constants } from "ethers";
import { Button, Form } from "react-bootstrap";
import { useWorkhard } from "@workhard/react-core";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import {
  errorHandler,
  handleTransaction,
  isApproved,
  TxStatus,
} from "@workhard/react-utils";
import { useToasts } from "react-toast-notifications";

export interface FundProjectProps {
  projId: BigNumberish;
  fund: BigNumberish;
  budgetOwner: string;
  minimumShare?: BigNumber;
  ownedByMultisig?: boolean;
}

export const FundProject: React.FC<FundProjectProps> = ({
  projId,
  budgetOwner,
  minimumShare,
  ownedByMultisig,
}) => {
  const { account, chainId, library } = useWeb3React();
  const { workhard } = useWorkhard();
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [balance, setBalance] = useState<BigNumber>();
  const [amount, setAmount] = useState("0");
  const [sharePercent, setSharePercent] = useState<number>();
  const [allowance, setAllowance] = useState<BigNumber>();

  useEffect(() => {
    if (!!account && !!workhard) {
      workhard.dao.commit
        .balanceOf(account)
        .then(setBalance)
        .catch(errorHandler(addToast));
      workhard.dao.commit
        .allowance(account, workhard.dao.contributionBoard.address)
        .then(setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, workhard, txStatus]);

  const addBudgetWithCommit = () => {
    if (!account || !workhard) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    if (!isApproved(allowance, amount)) {
      handleTransaction(
        workhard.dao.commit
          .connect(signer)
          .approve(
            workhard.dao.contributionBoard.address,
            constants.MaxUint256
          ),
        setTxStatus,
        addToast,
        `Approved ContributionBoard to use ${
          workhard?.metadata.commitSymbol || `$COMMIT`
        }`
      );
      return;
    }
    const contributionBoard = workhard.dao.contributionBoard;
    if (!contributionBoard) {
      alert("Not connected");
      return;
    }
    const amountInWei = parseEther(amount);
    if (amountInWei.gt(balance || 0)) {
      alert(
        `Not enough amount of ${
          workhard?.metadata.commitSymbol || `$COMMIT`
        } tokens`
      );
      return;
    }
    const txPromise = contributionBoard
      .connect(signer)
      .addProjectFund(projId, amountInWei);

    handleTransaction(
      txPromise,
      setTxStatus,
      addToast,
      "Successfully funded project."
    );
  };

  useEffect(() => {
    if (minimumShare && minimumShare.gt(0)) {
      const val = minimumShare.toNumber();
      setSharePercent((val / (val + 10000)) * 100);
    } else {
      setSharePercent(0);
    }
  }, [minimumShare]);

  return (
    <Form>
      <Form.Group>
        <Form.Label>
          Amount - (balance:{" "}
          {balance
            ? `${formatEther(balance.toString())} ${
                workhard?.metadata.commitSymbol || `$COMMIT`
              }`
            : "?"}
          )
        </Form.Label>
        <Form.Control
          required
          type="text"
          onChange={({ target: { value } }) => setAmount(value)}
          value={amount}
        />
      </Form.Group>
      {sharePercent !== 0 ? (
        <p>
          Thank you for your funding. Your contribution will be recorded
          automatically. Contributors will share the {sharePercent?.toFixed(2)}%
          of the emission when this project gets forked.
        </p>
      ) : (
        <p>
          Thank you for your funding. Please note that this project is not
          running the initial contributor program. Your funding may not be
          recorded for its future shares when this project becomes a new DAO.
        </p>
      )}
      <Button
        variant="success"
        onClick={addBudgetWithCommit}
        children={
          isApproved(allowance, amount)
            ? sharePercent !== 0
              ? "Fund project with contribution record"
              : "Fund project without contribution record"
            : "Approve token usage"
        }
      />
    </Form>
  );
};
