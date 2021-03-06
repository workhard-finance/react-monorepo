import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { useWeb3React } from "@web3-react/core";
import {
  ContributionBoard__factory,
  VisionEmitter__factory,
} from "@workhard/protocol";
import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { Pie, Cell, PieChart, Label, ResponsiveContainer } from "recharts";
import { useToasts } from "react-toast-notifications";
import { useWorkhard, useBlockNumber } from "@workhard/react-core";
import { errorHandler } from "@workhard/react-utils";
import { formatEther } from "ethers/lib/utils";
import { constants } from "ethers";

export interface ERC1155HolderChartProps {
  id: BigNumberish;
  color?: string;
}

const defaultColor = "#6610f2";

export const ContributorChart: React.FC<ERC1155HolderChartProps> = ({
  id,
  color,
}) => {
  const { library } = useWeb3React();
  const { workhard } = useWorkhard();
  const { blockNumber } = useBlockNumber();
  const _color = color || defaultColor;

  const [shareAddress, setShareAddress] = useState<string>();
  const [contributors, setContributors] = useState<string[]>();
  const [balances, setBalances] = useState<BigNumber[]>();
  const [data, setData] = useState<
    {
      address: string;
      proportion: number;
      commits: string;
      color: string;
    }[]
  >([]);
  const { addToast } = useToasts();

  useEffect(() => {
    if (!!workhard && !!library) {
      const { project, dao } = workhard;
      project
        .getDAO(id)
        .then((contracts) => {
          if (contracts.visionEmitter === constants.AddressZero) {
            // project
            setShareAddress(dao.contributionBoard.address);
          } else {
            // dao
            VisionEmitter__factory.connect(contracts.visionEmitter, library)
              .initialContributorShare()
              .then(setShareAddress)
              .catch(errorHandler(addToast));
          }
        })
        .catch(() => {
          setShareAddress(dao.contributionBoard.address);
        });
    }
  }, [library, workhard]);

  useEffect(() => {
    if (library && shareAddress) {
      const contributionBoard = ContributionBoard__factory.connect(
        shareAddress,
        library
      );
      contributionBoard
        .getContributors(id)
        .then(setContributors)
        .catch(errorHandler(addToast));
    }
  }, [library, shareAddress, blockNumber]);

  useEffect(() => {
    if (library && shareAddress && contributors) {
      const contributionBoard = ContributionBoard__factory.connect(
        shareAddress,
        library
      );
      Promise.all(
        contributors.map((contributor) =>
          contributionBoard.balanceOf(contributor, id)
        )
      )
        .then(setBalances)
        .catch(errorHandler(addToast));
    }
  }, [library, shareAddress, contributors, blockNumber]);
  const COLORS = [`${_color}ff`, `${_color}dd`, `${_color}bb`, `${_color}99`];
  useEffect(() => {
    if (balances && contributors && balances.length === contributors.length) {
      setData(
        balances
          .map((bal) => parseFloat(formatEther(bal)))
          .map((val, i) => ({
            address: contributors[i],
            proportion: val,
            commits: formatEther(balances[i]),
            color: COLORS[i % 4],
          }))
      );
    }
  }, [balances]);

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    index: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <svg>
        <text
          x={x}
          y={y}
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
        >
          <a
            href={`https://etherscan.io/address/${data[index].address}`}
            target="_blank"
          >{`${data[index].address.slice(0, 6)}...${data[index].address.slice(
            -4
          )}`}</a>
        </text>
        <text
          x={x}
          y={y + 16}
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
        >
          {`${data[index].commits} commits`}
        </text>
      </svg>
    );
  };

  return (
    <Container style={{ height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="proportion"
            nameKey="title"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label={renderCustomizedLabel}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Label value="Holders" offset={0} position="center" />
        </PieChart>
      </ResponsiveContainer>
    </Container>
  );
};
