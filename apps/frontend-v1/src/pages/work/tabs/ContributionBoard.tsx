import React, { useEffect, useState } from "react";
import { Button, Card, Col, Nav, Row, Tab } from "react-bootstrap";
import { useWorkhard } from "@workhard/react-core";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import { BigNumber } from "ethers";
import { ProjectBox, CreateProject } from "@workhard/react-components";
import config from "../../../config.json";

export const ContributionBoard: React.FC = () => {
  const { workhard } = useWorkhard();
  const history = useHistory();
  const { subtab } = useParams<{ subtab?: string }>();
  const { daoId } = workhard || { daoId: 0 };
  // const { account, library, chainId } = useWeb3React();

  const [projects, setProjects] = useState<BigNumber[]>();

  const [lastFetched, setLastFetched] = useState<number>(0);
  const [lastCreated, setLastCreated] = useState<BigNumber>();
  const [tabKey, setTabKey] = useState<string>(subtab || "projects");

  // TODO listen ContributionBoard events and add dependency to useEffect()

  useEffect(() => {
    if (workhard) {
      const { daoId, project } = workhard;
      let stale = false;
      project
        .projectsOf(daoId)
        .then((n: BigNumber) => {
          if (n.eq(0)) {
            setProjects([]);
            setTabKey("post");
          } else if (!stale) {
            const last = lastFetched;
            Promise.all(
              Array(n.toNumber() - last)
                .fill(undefined)
                .map((_, idx) =>
                  project.projectsOfDAOByIndex(daoId, idx + last)
                )
            ).then((fetched) => {
              setProjects([
                ...(projects || []),
                ...fetched.filter(
                  (projId) =>
                    !config.projects.banned.find((v) =>
                      BigNumber.from(v).eq(projId)
                    )
                ),
              ]);
            });
            setLastFetched(n.toNumber());
          }
        })
        .catch(() => {
          if (!stale) {
            setProjects([]);
          }
        });

      return () => {
        stale = true;
        setProjects([]);
      };
    }
  }, [workhard, lastCreated]); // ensures refresh if referential identity of library doesn't change across chainIds
  return (
    <Tab.Container activeKey={tabKey} onSelect={(k) => k && setTabKey(k)}>
      <Row>
        <Col sm={3}>
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="projects">Projects</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="post">Post a project</Nav.Link>
            </Nav.Item>
          </Nav>
          <hr />
          <Button
            variant="outline-info"
            as={"a"}
            href={"https://forum.workhard.finance"}
            target="_blank"
          >
            Do you have a project idea?
            <br />
            Go to workhard forum!
          </Button>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane
              eventKey="projects"
              onEnter={() => {
                history.push("/work/job/projects");
              }}
            >
              <Row>
                {projects ? (
                  projects.length === 0 ? (
                    <p>No project exists! Post a new one :)</p>
                  ) : (
                    projects.map((id) => (
                      <Col
                        md={4}
                        style={{ cursor: "pointer" }}
                        onClick={() => history.push(`/proj/${id}`)}
                      >
                        <ProjectBox projId={id} active={true} />
                        <br />
                      </Col>
                    ))
                  )
                ) : (
                  <p>Fetching...</p>
                )}
              </Row>
            </Tab.Pane>
            <Tab.Pane
              eventKey="post"
              onEnter={() => history.push("/work/job/post")}
            >
              <Card>
                <Card.Body>
                  <CreateProject onCreated={setLastCreated} />
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};
