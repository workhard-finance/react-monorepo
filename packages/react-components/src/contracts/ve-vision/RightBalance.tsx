import React, { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { Card } from "react-bootstrap";
import { useWorkhard, useBlockNumber } from "@workhard/react-core";
import { useWeb3React } from "@web3-react/core";
import { bigNumToFixed, errorHandler } from "@workhard/react-utils";
import { OverlayTooltip } from "../../views/OverlayTooltip";
import { useToasts } from "react-toast-notifications";

export interface RightBalanceProps {}

export const RightBalance: React.FC<RightBalanceProps> = ({}) => {
  const { account } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const { workhard } = useWorkhard();
  const [rightBalance, setRightBalance] = useState<BigNumber>();

  useEffect(() => {
    if (!!account && !!workhard) {
      const { right } = workhard.dao;
      right
        .balanceOf(account)
        .then(setRightBalance)
        .catch(errorHandler(addToast));
    }
  }, [account, workhard, blockNumber]);

  return (
    <Card>
      <Card.Body>
        <Card.Title>
          Your current {workhard?.metadata.rightName || `$RIGHT`}
          <OverlayTooltip
            tip={`= staked amount x locking period`}
            text={`❔`}
          />
        </Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>
          {bigNumToFixed(rightBalance || 0)}
          <span style={{ fontSize: "1rem" }}>
            {" "}
            {workhard?.metadata.rightSymbol || `$veVISION(a.k.a.$RIGHT)`}
          </span>
        </Card.Text>
      </Card.Body>
    </Card>
  );
};
