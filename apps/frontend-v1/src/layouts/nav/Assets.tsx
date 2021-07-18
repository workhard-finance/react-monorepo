import React, { useEffect } from "react";
import { Badge, Row } from "react-bootstrap";
import { observer } from "mobx-react";
import { useWorkhard } from "@workhard/react-core";
import { useWeb3React } from "@web3-react/core";
import { bigNumToFixed } from "@workhard/react-utils";

const Assets: React.FC = observer(() => {
  const { workhard } = useWorkhard();
  const userStore = workhard?.store.userStore;
  const { account } = useWeb3React();
  useEffect(() => {
    if (workhard && account && userStore) {
      workhard.dao.vision
        .balanceOf(account)
        .then(userStore.setVisionTokenBalance);
      workhard.dao.commit.balanceOf(account).then(userStore.setCommitBalance);
    }
  }, [workhard, account]);

  return (
    <div style={{ marginRight: "2rem" }}>
      <Row style={{ padding: "0.3rem" }}>
        <Badge pill variant="info">
          {`${bigNumToFixed(userStore?.visionTokenBalance || 0)} `}
          <span style={{ fontSize: "0.5rem" }}>
            {workhard?.metadata.visionSymbol}
          </span>
        </Badge>
      </Row>
      <Row style={{ padding: "0.3rem" }}>
        <Badge pill variant="success">
          {`${bigNumToFixed(userStore?.commitTokenBalance || 0)} `}
          <span style={{ fontSize: "0.5rem" }}>
            {workhard?.metadata.commitSymbol}
          </span>
        </Badge>
      </Row>
    </div>
  );
});
export default Assets;
