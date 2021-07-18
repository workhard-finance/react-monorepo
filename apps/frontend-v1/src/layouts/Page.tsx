import React from "react";
import { useRouteMatch } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";
import { Container, Row } from "react-bootstrap";
import { ethers } from "ethers";
import NavBar, { Menu } from "./nav/NavBar";
import Footer from "./Footer";
import { isOnTargetNetwork, getTargetNetworkName } from "@workhard/react-utils";
import { FatherSays } from "@workhard/react-components";

export type PageProps = React.ComponentProps<any>;

const Page = (props: React.ComponentProps<any>) => {
  const { active, chainId } = useWeb3React<ethers.providers.Web3Provider>();
  const targetNetwork = getTargetNetworkName();
  const onTargetNetwork = isOnTargetNetwork(chainId);

  const match = useRouteMatch<{ daoId?: string }>("/:daoId?/");
  const parsed = parseInt(match?.params.daoId || "0");
  const daoId = Number.isNaN(parsed) ? 0 : parsed;
  let menus: Menu[];
  let secondary: Menu[] | undefined;
  let adminMenus: Menu[] | undefined;
  if (daoId === 0) {
    menus = [
      {
        name: "Work",
        url: "/work",
      },
      {
        name: "Mine",
        url: "/mine",
      },
      {
        name: "Gov",
        url: "/gov",
      },
      {
        name: "Store",
        url: "/store",
      },
      {
        name: "DAOs",
        url: "/dao",
      },
    ];
    adminMenus = [
      {
        name: "Multisig",
        url: "/multisig",
      },
    ];
  } else {
    menus = [
      {
        name: "Store",
        url: "/store",
      },
    ];
    secondary = [
      {
        name: "Work",
        url: "/work",
      },
      {
        name: "Mine",
        url: "/mine",
      },
      {
        name: "Gov",
        url: "/gov",
      },
    ];
    adminMenus = [
      {
        name: "Multisig",
        url: "/multisig",
      },
    ];
  }
  return (
    <Container
      style={{
        minHeight: "100vh",
        paddingTop: "98px",
      }}
    >
      <NavBar menus={menus} secondary={secondary} adminMenus={adminMenus} />
      <Row>
        <Container>
          {!active && <FatherSays say={"How about connect wallet ser?"} />}
          {active && !onTargetNetwork && (
            <FatherSays say={`You're not on ${targetNetwork} ser?`} />
          )}
          {active && onTargetNetwork && props.children}
        </Container>
      </Row>
      <br />
      <Footer />
    </Container>
  );
};

export default Page;
