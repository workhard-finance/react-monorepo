import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Image,
  Button,
  Card,
  Badge,
} from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { UpdateDAO, Immortalize, OverlayTooltip } from "@workhard/react-components";
import { useWorkhard } from "@workhard/react-core";
import {
  errorHandler,
  fetchProjectMetadataFromIPFS,
  ProjectMetadata,
  uriToURL,
} from "@workhard/react-utils";

export const ProjectDetails: React.FC = () => {
  const { workhard } = useWorkhard();
  const { addToast } = useToasts();
  const { daoId, ipfs } = workhard || { daoId: 0 };
  const [metadata, setMetadata] = useState<ProjectMetadata>();
  const [immortalized, setImmortalized] = useState<boolean>();
  const [projectOwner, setProjectOwner] = useState<string>();
  const [preview, setPreview] = useState<{
    name?: string;
    description?: string;
    file?: File;
    url?: string;
  }>();
  const [previewImg, setPreviewImg] = useState<string>();

  useEffect(() => {
    if (!!workhard && !!ipfs) {
      const projId = daoId || 0;
      workhard.project
        .immortalized(projId)
        .then(setImmortalized)
        .catch(errorHandler(addToast));

      workhard.project
        .tokenURI(projId)
        .then(async (uri) => {
          setMetadata(await fetchProjectMetadataFromIPFS(ipfs, uri));
        })
        .catch(errorHandler(addToast));
    }
  }, [workhard, daoId, ipfs]);

  useEffect(() => {
    if (workhard) {
      workhard.project
        .ownerOf(daoId)
        .then(setProjectOwner)
        .catch(errorHandler(addToast));
    }
  }, [workhard]);

  useEffect(() => {
    if (preview?.file) {
      getPreviewFromFile(preview.file)
        .then(setPreviewImg)
        .catch(errorHandler(addToast));
    }
  }, [preview?.file]);

  const getPreviewFromFile = (file: File): Promise<string> => {
    return new Promise<string>((res, err) => {
      let reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          res(reader.result);
        } else {
          err("Failed to read file");
        }
      };
      reader.onerror = err;
      reader.readAsDataURL(file);
    });
  };

  return (
    <Container>
      <Card>
        <Card.Body>
          <Card.Title>Preview</Card.Title>
          <Row>
            <Col md={5}>
              <Image
                src={
                  previewImg ||
                  (metadata
                    ? uriToURL(metadata.image)
                    : process.env.PUBLIC_URL + "/images/daily-life.jpeg")
                }
                style={{ maxWidth: "100%" }}
              />
            </Col>
            <Col md={7}>
              <h2>
                What is <b>{preview?.name || metadata?.name}?</b>
              </h2>
              <p>{preview?.description || metadata?.description}</p>
              {immortalized && <Badge variant={`success`}>immortalized</Badge>}
              <br />
              {(daoId || 0) !== 0 && (preview?.url || metadata?.url) && (
                <Button
                  as={"a"}
                  href={preview?.url || metadata?.url}
                  target="_blank"
                  variant="info"
                >
                  Go to app
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <br />
      {!immortalized && (
        <>
          <Card>
            <Card.Body>
              <Card.Title>Owner</Card.Title>
              <Card.Text>{projectOwner}</Card.Text>
              <hr />
              <Card.Title>Update URI</Card.Title>
              <UpdateDAO onPreview={setPreview} />
              <hr />
              <Card.Title>
                Immortalize URI
                <OverlayTooltip
                  tip={`You'll never be able to change the information once you immortalize it.`}
                  text={`❔`}
                />
              </Card.Title>
              <Immortalize />
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};
