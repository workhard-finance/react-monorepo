import React from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import Page from "../../layouts/Page";
import { useWorkhard } from "@workhard/react-core";
import DAOs from "./tabs/DAOs";

const DAO: React.FC = () => {
  const { workhard } = useWorkhard();
  const { daoId } = workhard || { daoId: 0 };
  return (
    <Page id="hi" style={{ minHeight: "90vh" }}>
      <Button as={Link} to={`/dao/new`} variant="info">
        Fork and launch your DAO
      </Button>
      <br />
      <br />
      <DAOs />
    </Page>
  );
};

export default DAO;
