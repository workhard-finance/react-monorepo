import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Alert, Button, Col, Row, Tab, Tabs } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { useWorkhard, useBlockNumber } from "@workhard/react-core";
import { BigNumber, providers } from "ethers";
import { Product, SerHelpPlz, TitleButSer } from "@workhard/react-components";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import config from "../../config.json";

const featured: BigNumber[] = [];
const Store: React.FC = () => {
  const { library } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const { workhard } = useWorkhard();
  const [allProducts, setAllProducts] = useState<BigNumber[]>([]);
  const [fetchedBlock, setFetchedBlock] = useState<number>(0);
  const history = useHistory();
  const { tab } = useParams<{ tab?: string }>();
  const { daoId } = workhard || { daoId: 0 };

  useEffect(() => {
    if (!library || !workhard || !blockNumber) {
      return;
    }
    const { marketplace } = workhard.dao;
    marketplace
      .queryFilter(
        marketplace.filters.NewProduct(null, null, null),
        fetchedBlock + 1,
        blockNumber
      )
      .then((events) => {
        if (blockNumber) setFetchedBlock(blockNumber);
        setAllProducts([
          ...allProducts,
          ...events.map((event) => event.args.id),
        ]);
      });
  }, [workhard, blockNumber]);

  useEffect(() => {
    if (!library || !workhard || !blockNumber) {
      return;
    }
    const { marketplace } = workhard.dao;
    marketplace
      .queryFilter(
        marketplace.filters.NewProduct(null, null, null),
        fetchedBlock + 1,
        blockNumber
      )
      .then((events) => {
        if (blockNumber) setFetchedBlock(blockNumber);
        setAllProducts([
          ...allProducts,
          ...events.map((event) => event.args.id),
        ]);
      });
  }, [workhard, blockNumber]);

  return (
    <Page>
      <TitleButSer link="https://whf.gitbook.io/docs/store" />
      <Tabs defaultActiveKey={tab || "featured"}>
        <Tab
          eventKey="featured"
          title="Featured"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push("/store/featured")}
        >
          {config.nfts.featured.length === 0 && (
            <p>Coming soon :) We won't let you wait too long.</p>
          )}
          <Row>
            {allProducts
              .filter(
                (tokenId) =>
                  !!config.nfts.featured.find((v) =>
                    BigNumber.from(v).eq(tokenId)
                  ) &&
                  !config.nfts.banned.find((v) => BigNumber.from(v).eq(tokenId))
              )
              .map((tokenId) => (
                <Col key={`featured-${tokenId}`} md={4}>
                  <Product tokenId={tokenId} />
                  <br />
                </Col>
              ))}
          </Row>
        </Tab>
        <Tab
          eventKey="all"
          title="All"
          style={{ marginTop: "1rem" }}
          onEnter={() => history.push("/store/all")}
        >
          {allProducts.length === 0 && (
            <p>Coming soon :) We won't let you wait too long.</p>
          )}
          <Alert variant="warning">
            This is a permisionless marketplace. Please DYOR for each product
            registered here.
          </Alert>
          <Row>
            {allProducts
              .filter(
                (tokenId) =>
                  !config.nfts.banned.find((v) => BigNumber.from(v).eq(tokenId))
              )
              .map((tokenId) => (
                <Col key={`featured-${tokenId}`} md={4}>
                  <Product tokenId={tokenId} />
                  <br />
                </Col>
              ))}
          </Row>
        </Tab>
      </Tabs>
      <br />
      <SerHelpPlz>
        <p>
          Buy NFTs with {workhard?.metadata.commitSymbol || `$COMMIT`}. Earn{" "}
          {workhard?.metadata.commitSymbol || `$COMMIT`} by working or buying
          on Sushiswap.
        </p>
        <Button variant="success">Go Work Hard</Button>{" "}
        <Button variant="danger">Go to Sushiswap</Button>
        <br />
        <br />
        <p>
          Revenues from NFTs sold are shared with{" "}
          <a href="#" className="text-info">
            {workhard?.metadata.rightSymbol || `$RIGHT`}
          </a>{" "}
          holders. NFTs in the store are{" "}
          <a
            href="https://eips.ethereum.org/EIPS/eip-1155"
            target="_blank"
            className="text-info"
          >
            ERC-1155
          </a>{" "}
          and are stored on{" "}
          <a href="https://ipfs.io" target="_blank" className="text-info">
            IPFS
          </a>{" "}
          and{" "}
          <a href="https://arweave.org" target="_blank" className="text-info">
            Arweave.
          </a>
        </p>
      </SerHelpPlz>
    </Page>
  );
};

export default Store;
