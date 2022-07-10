import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./NewTourneyHome.css";

import { Layout, Card, Button, Modal, notification, message } from "antd";
import { ExclamationCircleOutlined, EditOutlined } from "@ant-design/icons";
import { get, post, hasAccess, prettifyTourney, tokenizeTourney } from "../../utilities";
import { navigate } from "@reach/router";
import ContentManager from "../../ContentManager";
import EditTourneyModal from "../../components/modules/EditTourneyModal";
import CreateTeamModal from "../modules/CreateTeamModal";

const UI = ContentManager.getUI();

const { Content } = Layout;
const { confirm } = Modal;

function NewTourneyHome({ tourney }) {
  const [content, setContent] = useState({ homepage: [] });
  const infoRef = React.createRef();

  useEffect(() => {
    (async () => {
      document.title = `${prettifyTourney(tourney)}: Home`;
      const content = await ContentManager.get(tourney);
      if (!content) return navigate("/404");

      if (content.divisions) {
        const { division } = tokenizeTourney(tourney);
        if (!content.divisions.includes(division)) return navigate("/404");
      }

      setContent(content);
    })();
  }, []);

  const handleRegHover = () => {};
  const scrollToInfo = () =>
    window.scrollTo({
      left: 0,
      top: infoRef.current.offsetTop,
      behavior: "smooth",
    });

  return (
    <Content className="NewTourneyHome-content">
      <div className="NewTourneyHome-bg">
        <div className="NewTourneyHome-header">
          <div className="NewTourneyHome-header-flex">
            <div className="NewTourneyHome-header-inner">
              <h1 className="NewTourneyHome-title u-xbold">{content.name}</h1>
              <div className="NewTourneyHome-description">{content.description}</div>
              <div className="NewTourneyHome-button-box">
                <div>
                  <Button block size="large">
                    Rules
                  </Button>
                </div>
                <div>
                  <Button block size="large" onClick={scrollToInfo}>
                    Information
                  </Button>
                </div>
                <div>
                  <Button block size="large" href={content.discord}>
                    {UI.discord}
                  </Button>
                </div>
                <div onMouseEnter={() => handleRegHover()}>
                  <Button block type="primary" size="large">
                    Register
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="NewTourneyHome-information" ref={infoRef}>
        {content.homepage.map((section) => {
          return (
            <div className="NewTourneyHome-section">
              <h1 className="NewTourneyHome-section-title">{section.title}</h1>
              <ReactMarkdown source={section.body} />
            </div>
          );
        })}
      </div>
    </Content>
  );
}

export default NewTourneyHome;
