import React, { FormEventHandler, useEffect, useState } from "react";
import { providers, constants, BigNumber } from "ethers";
import { Form } from "react-bootstrap";
import { useWorkhard } from "@workhard/react-core";
import { getAddress, randomBytes } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { ConditionalButton } from "../../views/ConditionalButton";
import { getGnosisAPI, safeTxHandler, TxStatus } from "@workhard/react-utils";
import { useToasts } from "react-toast-notifications";

export interface Immortalize {}

export const Immortalize: React.FC<Immortalize> = ({}) => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const { workhard } = useWorkhard();
  const { addToast } = useToasts();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [hasPermission, setHasPermission] = useState<boolean>();

  useEffect(() => {
    if (!!workhard && !!account && !!chainId) {
      const gnosisAPI = getGnosisAPI(chainId);
      if (gnosisAPI) {
        fetch(gnosisAPI + `safes/${workhard.dao.multisig.address}/`)
          .then(async (response) => {
            const result = await response.json();
            if (
              (result.owners as string[])
                .map(getAddress)
                .includes(getAddress(account))
            ) {
              setHasPermission(true);
            }
          })
          .catch((_) => {
            setHasPermission(false);
          });
      }
    }
  }, [workhard, account, chainId]);

  const handleSubmit: FormEventHandler = async (event) => {
    if (!workhard || !chainId || !library || !account) {
      alert("Not connected.");
      return;
    }

    const signer = library.getSigner(account);
    const { project } = workhard;
    const tx = await project.populateTransaction.immortalize(workhard.daoId);
    if (!tx.data) {
      alert("Failed to created tx");
      return;
    }
    const popScheduledTx = await workhard.dao.timelock.populateTransaction.schedule(
      workhard.project.address,
      0,
      tx.data,
      constants.HashZero,
      BigNumber.from(randomBytes(32)).toHexString(),
      await workhard.dao.timelock.getMinDelay()
    );
    safeTxHandler(
      chainId,
      workhard.dao.multisig.address,
      popScheduledTx,
      signer,
      setTxStatus,
      addToast,
      "Immortalized successfully!",
      (receipt) => {
        if (receipt) {
        } else {
          alert("Created Multisig Tx. Go to Gnosis wallet and confirm.");
        }
        setTxStatus(undefined);
      }
    );
  };
  return (
    <Form onSubmit={handleSubmit}>
      <ConditionalButton
        variant="danger"
        type="submit"
        enabledWhen={hasPermission}
        whyDisabled={`Only owner or multisig can call this function.`}
        tooltip={"Create a multisig transaction"}
        children={`Immortalize`}
      />
    </Form>
  );
};
