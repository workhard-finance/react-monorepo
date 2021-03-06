import React, { useState, useEffect } from "react";
import { Card, Form, Image, Row, Col } from "react-bootstrap";
import { useWorkhard } from "@workhard/react-core";
import {
  permaPinToArweave,
  TxStatus,
  uriToURL,
  errorHandler,
  ProjectMetadata,
  fetchProjectMetadataFromIPFS,
  safeTxHandler,
  getGnosisAPI,
} from "@workhard/react-utils";
import { ConditionalButton } from "../../views/ConditionalButton";
import { useToasts } from "react-toast-notifications";
import { BigNumber } from "@ethersproject/bignumber";
import { constants } from "ethers";
import { getAddress, randomBytes } from "ethers/lib/utils";

export const UpdateDAO: React.FC<{
  onUpdated?: () => void;
  onPreview?: (preview: {
    name?: string;
    description?: string;
    file?: File;
    url?: string;
  }) => void;
}> = ({ onUpdated, onPreview }) => {
  const { workhard } = useWorkhard();
  const { ipfs } = workhard || {};
  const { account, library, chainId } = workhard?.web3 || {};
  const { addToast } = useToasts();

  const [description, setDescription] = useState<string>();
  const [file, setFile] = useState<File>();
  const [name, setName] = useState<string>();
  const [metadata, setMetadata] = useState<ProjectMetadata>();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [url, setURL] = useState<string | undefined>();
  const [uri, setURI] = useState<string>();
  const [imageURI, setImageURI] = useState<string>();
  const [previewURL, setPreviewURL] = useState<string>();
  const [uploaded, setUploaded] = useState<boolean>();
  const [uploading, setUploading] = useState<boolean>();
  const [hasPermission, setHasPermission] = useState<boolean>();

  useEffect(() => {
    if (!!workhard && !!ipfs) {
      workhard.project
        .tokenURI(workhard.daoId)
        .then(async (uri) => {
          const metadata = await fetchProjectMetadataFromIPFS(ipfs, uri);
          setMetadata(metadata);
          setName(metadata.name);
          setImageURI(metadata.image);
          setDescription(metadata.description);
          setURL(metadata.url);
        })
        .catch(errorHandler(addToast));
    }
  }, [workhard, ipfs]);

  useEffect(() => {
    if (onPreview) {
      onPreview({ name, description, file, url });
    }
  }, [name, description, file, url]);

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

  const uploadImageToIPFS = async (file: File): Promise<string> => {
    if (!ipfs) {
      throw "IPFS is not connected.";
    }
    const result = await ipfs.add(file);
    const cid = result.cid.toString();
    await permaPinToArweave(cid);
    return cid;
  };

  const uploadMetadataToIPFS = async (
    name: string,
    description: string,
    image: string,
    url?: string
  ): Promise<string> => {
    if (!ipfs) {
      throw "IPFS is not connected.";
    }
    const obj = url
      ? {
          name,
          description,
          image,
          url,
        }
      : { name, description, image };
    const result = await ipfs.add(JSON.stringify(obj));
    const cid = result.cid.toString();
    await permaPinToArweave(cid);
    return cid;
  };
  const update = async () => {
    if (!name || !description || !imageURI) {
      alert("Fill out the form.");
      return;
    }
    setUploading(true);
    if (file) {
      uploadImageToIPFS(file)
        .then((imageURI) => {
          uploadMetadataToIPFS(name, description, imageURI, url)
            .then((uri) => {
              setImageURI(imageURI);
              setUploaded(true);
              setUploading(undefined);
              setURI(uri);
              updateProject(uri);
            })
            .catch((_) => {
              setUploaded(false);
              setUploading(undefined);
            });
        })
        .catch((_) => {
          setUploaded(false);
          setUploading(undefined);
        });
    } else {
      uploadMetadataToIPFS(name, description, imageURI, url)
        .then((uri) => {
          setImageURI(imageURI);
          setUploaded(true);
          setUploading(undefined);
          setURI(uri);
          updateProject(uri);
        })
        .catch((_) => {
          setUploaded(false);
          setUploading(undefined);
        });
    }
  };

  const updateProject = async (uri: string) => {
    if (!workhard || !library || !account || !chainId) {
      alert("Not connected");
      return;
    }
    const { project } = workhard;
    const signer = library.getSigner(account);
    const tx = await project.populateTransaction.updateURI(workhard.daoId, uri);
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
      "Successfully updated project",
      (receipt) => {
        if (receipt) {
        } else {
          alert("Created Multisig Tx. Go to Gnosis wallet and confirm.");
        }
        setTxStatus(undefined);
        setUploaded(false);
        onUpdated && onUpdated();
      }
    );
  };

  return (
    <Form>
      <Form.Group>
        <Form.Label>Project title</Form.Label>
        <Form.Control
          type="text"
          placeholder="Workhard Core Dev"
          onChange={({ target: { value } }) => setName(value)}
          value={name}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Description</Form.Label>
        <Form.Control
          type="text"
          as="textarea"
          placeholder="describe the job here."
          onChange={({ target: { value } }) => setDescription(value)}
          value={description}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>URL(forum url or etc)</Form.Label>
        <Form.Control
          type="text"
          placeholder="eg) https://hackmd.io/samplejobpost"
          onChange={({ target: { value } }) => setURL(value)}
          value={url}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Thumbnail</Form.Label>
        <Form.File
          onChange={(e: { target: HTMLInputElement }) => {
            if (!ipfs) {
              alert("IPFS client is not set");
            } else if (e.target.files) {
              const fileToUpload = e.target.files[0];
              let reader = new FileReader();
              reader.onloadend = () => {
                if (typeof reader.result === "string") {
                  setPreviewURL(reader.result);
                }
              };
              reader.readAsDataURL(fileToUpload);
            }
          }}
        />
        <br />
        <Row>
          <Col md={4}>
            <Card>
              <Image
                src={
                  previewURL
                    ? previewURL
                    : uriToURL(
                        imageURI ||
                          "QmZ6WAhrUArQPQHQZFJBaQnHDcu5MhcrnfyfX4uwLHWMj1"
                      )
                }
              />
            </Card>
          </Col>
        </Row>
      </Form.Group>
      <Form.Text>{uri && `URI: ${uri}`}</Form.Text>
      <br />
      {/** TODO: IPFS & NFT */}
      <ConditionalButton
        variant="primary"
        onClick={update}
        enabledWhen={hasPermission && txStatus === undefined && !uploading}
        whyDisabled={
          uploading
            ? "Uploading Metadata to IPFS"
            : "Submitted transaction is in pending"
        }
        children={
          txStatus
            ? "Pending"
            : uploading
            ? "Uploading..."
            : uploaded
            ? "Update"
            : "Upload"
        }
      />
    </Form>
  );
};
