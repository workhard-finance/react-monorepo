import React from "react";
import Page from "../../layouts/Page";
import StableReserve from "./tabs/StableReserve";
import { ContributionBoard } from "./tabs/ContributionBoard";
import { TitleButSer, SerHelpPlz, OverlayTooltip } from "@workhard/react-components";
import { useWorkhard } from "@workhard/react-core";
import { Link } from "react-router-dom";

const Work: React.FC = () => {
  const { workhard } = useWorkhard();
  const { daoId } = workhard || { daoId: 0 };

  return (
    <Page>
      <TitleButSer link="https://whf.gitbook.io/docs/work#projects">
        Projects
        <OverlayTooltip
          tip={`Put your back into it fellow Worker! Earn some honest ${
            workhard && workhard.daoId !== 0
              ? `${workhard.metadata.commitName}(COMMIT)`
              : `$COMMIT`
          } wages from a JOB`}
          text="❔"
        />
      </TitleButSer>
      <br />
      <ContributionBoard />
      <hr />
      <TitleButSer link="https://whf.gitbook.io/docs/work#stable-reserve">
        Stable Reserve
        <OverlayTooltip
          tip={
            "Monetize your commitment here! You can exchange your commitment to a stable coin or buy them at a premium instead of working!"
          }
          text="❔"
        />
      </TitleButSer>
      <StableReserve />
      <hr />
      <SerHelpPlz>
        <p>
          Employers{" "}
          <a href={`https://whf.gitbook.io/docs/work#projects`} target="_blank">
            post jobs
          </a>{" "}
          on the JOB BOARD and Workers get paid in{" "}
          <a
            href={`https://whf.gitbook.io/docs/tokens#usdcommit`}
            target="_blank"
          >
            {workhard?.metadata.commitSymbol || `$COMMIT`}
          </a>{" "}
          tokens for completing jobs from the JOB BOARD.
        </p>
        <p>
          The{" "}
          <a
            href="https://whf.gitbook.io/docs/work#stable-reserve"
            target="_blank"
          >
            STABLE RESERVE
          </a>{" "}
          is a vault that allows anyone to redeem hard-earned{" "}
          {workhard?.metadata.commitSymbol || `$COMMIT`} for $DAI at a 1:1
          exchange or buy {workhard?.metadata.commitSymbol || `$COMMIT`}{" "}
          directly for {workhard?.metadata.baseCurrencySymbol || `$DAI`} at a
          premium.
        </p>
        <p>
          Workers can burn their hard earned{" "}
          {workhard?.metadata.commitSymbol || `$COMMIT`} by{" "}
          <Link to={"/mine"} target="_blank">
            mine
          </Link>{" "}
          <a
            href="https://whf.gitbook.io/docs/tokens#usdvision"
            target="_blank"
          >
            {workhard?.metadata.visionSymbol || `$VISION`}
          </a>
        </p>
      </SerHelpPlz>
    </Page>
  );
};

export default Work;
