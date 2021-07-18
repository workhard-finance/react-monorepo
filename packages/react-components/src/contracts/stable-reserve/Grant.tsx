import React, { useEffect, useState } from "react";
import {
  BigNumber,
  BigNumberish,
  constants,
  PopulatedTransaction,
} from "ethers";
import { Form, Modal } from "react-bootstrap";
import { useWorkhard, useBlockNumber } from "@workhard/react-core";
import {
  defaultAbiCoder,
  formatEther,
  getAddress,
  parseEther,
} from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { getNetworkName } from "@workhard/protocol";
import { errorHandler, TxStatus } from "@workhard/react-utils";
import { ConditionalButton } from "../../views/ConditionalButton";
import { useToasts } from "react-toast-notifications";

export interface GrantProps {
  projId: BigNumberish;
}

export const Grant: React.FC<GrantProps> = ({ projId }) => {
  const { account, chainId, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { workhard } = useWorkhard();
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [amount, setAmount] = useState("0");
  const [allowance, setAllowance] = useState<BigNumber>();
  const [projectApproved, setProjectApproved] = useState(false);
  const [multisigOwner, setMultisigOwner] = useState<boolean>();
  const [mintable, setMintable] = useState<BigNumber>();
  const [show, setShow] = useState(false);
  const [popTx, setPopTx] = useState<PopulatedTransaction>();

  useEffect(() => {
    if (workhard) {
      workhard.dao.stableReserve
        .mintable()
        .then(setMintable)
        .catch(errorHandler(addToast));
    }
  }, [account, workhard?.dao, blockNumber]);

  useEffect(() => {
    if (!!account && !!workhard && !!chainId) {
      const network = getNetworkName(chainId);
      const { dao } = workhard;
      const { multisig } = dao;
      if (multisig.address === account) {
        setMultisigOwner(true);
      } else {
        const gnosisAPI =
          network === "mainnet"
            ? `https://safe-transaction.gnosis.io/api/v1/`
            : network === "rinkeby"
            ? `https://safe-transaction.rinkeby.gnosis.io/api/v1/`
            : undefined;

        if (gnosisAPI) {
          fetch(gnosisAPI + `safes/${multisig.address}/`).then(
            async (response) => {
              const result = await response.json();
              if (
                (result.owners as string[])
                  .map(getAddress)
                  .includes(getAddress(account))
              ) {
                setMultisigOwner(true);
              }
            }
          );
        }
      }
    }
  }, [account, workhard, chainId]);

  const grant = async () => {
    if (!account || !workhard || !library) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const stableReserve = workhard.dao.stableReserve;
    const amountInWei = parseEther(amount);
    if (amountInWei.gt(mintable || 0)) {
      alert(`Not enough amount of ${workhard.metadata.commitSymbol} tokens`);
      return;
    }
    const grantTx = await stableReserve
      .connect(signer)
      .populateTransaction.grant(
        workhard.dao.contributionBoard.address,
        amountInWei,
        defaultAbiCoder.encode(["uint256"], [projId])
      );
    const timelockTx = await workhard.dao.timelock.populateTransaction.schedule(
      stableReserve.address,
      grantTx.value || 0,
      grantTx.data || "0x",
      constants.HashZero,
      constants.HashZero,
      chainId === 1 ? 86400 * 1 : 60
    );
    setPopTx(timelockTx);
  };

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  return (
    <div>
      <Form>
        <Form.Group>
          <Form.Label>
            Mintable - (balance:{" "}
            {mintable
              ? `${formatEther(mintable.toString())} ${
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
        <ConditionalButton
          variant="outline"
          enabledWhen={multisigOwner}
          whyDisabled={`Only dev multisig or Workers Union can call this function.`}
          onClick={() => {
            grant().then(handleShow);
          }}
          children={"ABI Data"}
        />
      </Form>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Here's the custom data for gnosis safe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Address:</h5>
          <code style={{ color: "black", fontFamily: "Neucha" }}>
            {popTx?.to}
          </code>
          <br />
          <br />
          <h5>Value:</h5>
          <code style={{ color: "black", fontFamily: "Neucha" }}>
            {popTx?.value || 0}
          </code>
          <br />
          <br />
          <h5>Data:</h5>
          <code style={{ color: "black", fontFamily: "Neucha" }}>
            {popTx?.data}
          </code>
        </Modal.Body>
      </Modal>
    </div>
  );
};
