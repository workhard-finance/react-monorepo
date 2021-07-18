import React, { useEffect, useState } from "react";
import { useWorkhard } from "@workhard/react-core";
import { errorHandler } from "@workhard/react-utils";
import { useToasts } from "react-toast-notifications";
import { BigNumberish } from "ethers";
import { ContributorChart } from "../../views/ContributorChart";
import { RecordContribution } from "../contribution-board/RecordContribution";
import { Button } from "react-bootstrap";

export const InitialContribution: React.FC<{
  id?: BigNumberish;
  onSetup?: () => void;
}> = ({ id, onSetup }) => {
  const projId = id || 0;
  const { workhard } = useWorkhard();
  const { addToast } = useToasts();

  const [projectOwner, setProjectOwner] = useState<string>();

  useEffect(() => {
    if (workhard) {
      const { project } = workhard;
      project
        .ownerOf(projId)
        .then(setProjectOwner)
        .catch(errorHandler(addToast));
    }
  }, [workhard, projId]);

  return (
    <div>
      <ContributorChart id={projId} />
      {!!projectOwner && (
        <RecordContribution projId={projId} budgetOwner={projectOwner} />
      )}
      <br />
      <Button onClick={onSetup}>Go to next</Button>
    </div>
  );
};
