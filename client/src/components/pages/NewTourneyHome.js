import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./NewTourneyHome.css";

import { Layout, Card, Button, Modal, notification, message } from "antd";
import { ExclamationCircleOutlined, EditOutlined } from "@ant-design/icons";
import { get, post, prettifyTourney, tokenizeTourney } from "../../utilities";
import { navigate } from "@reach/router";
import ContentManager from "../../ContentManager";
import EditTourneyModal from "../../components/modules/EditTourneyModal";
import CreateTeamModal from "../modules/CreateTeamModal";
import { UserAuth } from "../../permissions/UserAuth";
import { UserRole } from "../../permissions/UserRole";
import { setConstantValue } from "typescript";

const UI = ContentManager.getUI();

const { Content } = Layout;
const { confirm } = Modal;

function NewTourneyHome({ tourney, user, setUser, setLoginAttention }) {
  const [content, setContent] = useState({ homepage: [] });
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [tourneyFlags, setTourneyFlags] = useState([]);
  const [settingsData, setSettingsData] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  const infoRef = React.createRef();
  const rulesRef = React.createRef();

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

      const data = await get("/api/tournament", { tourney });
      setRegistrationOpen(data.registrationOpen || false);
      setTourneyFlags(data.flags || []);
      setSettingsData({
        registrationOpen: data.registrationOpen || false,
        teams: data.teams || false,
        stages: (data.stages || []).map((s) => s.name),
        rankMin: data.rankMin || -1,
        rankMax: data.rankMax || -1,
        countries: data.countries || [],
        flags: data.flags || [],
        lobbyMaxSignups: data.lobbyMaxSignups || 8,
      });
    })();
  }, []);

  const handleScroll = () => {
    const scrollThreshold = 200;
    setShowScroll(window.scrollY > scrollThreshold);
  };
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleRegHover = () => {
    if (!user._id) {
      setLoginAttention(!user._id);
      setTimeout(() => setLoginAttention(false), 2000);
    }
  };

  const isAdmin = new UserAuth(user).forTourney(tourney).hasRole(UserRole.Admin);
  const register = () => {
    const tourneyDisplay = prettifyTourney(tourney);
    const success = {
      message: `Success`,
      description: `You are now registered for ${tourneyDisplay}`,
      duration: 3,
    };

    confirm({
      title: `Register as ${user.username}`,
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to register for ${tourneyDisplay}?`,
      onOk: async () => {
        try {
          const user = await post("/api/register", { tourney });
          notification.open(success);
          setUser(user);
        } catch (e) {
          const fail = {
            message: `Failed`,
            description: `Registration failed: ${e.error}`,
            duration: 6,
          };
          notification.open(fail);
        }
      },
    });
  };

  const scrollToTop = () =>
    window.scrollTo({
      left: 0,
      top: 0,
      behavior: "smooth",
    });

  const scrollToRef = (ref) =>
    window.scrollTo({
      left: 0,
      top: ref.current.offsetTop,
      behavior: "smooth",
    });

  const handleSettingsChange = (changed, allData) => {
    setSettingsData(allData);
  };

  const handleSettingsOk = async () => {
    console.log(settingsData);
    const res = await post("/api/tournament", {
      ...settingsData,
      tourney,
    });
    setShowSettings(false);
    setRegistrationOpen(res.registrationOpen);
    message.success("Updated tournament settings");
  };

  const isRegistered = () => user.tournies && user.tournies.includes(tourney);

  let regMessage = UI.register;
  if (!user._id) regMessage = "Login to Register";
  else if (isRegistered()) regMessage = "Registered";
  else if (!registrationOpen) regMessage = "Registration Closed";

  return (
    <Content className="NewTourneyHome-content">
      <div
        className="NewTourneyHome-bg"
        style={{
          backgroundImage: `linear-gradient(#dcdcdc33, #0c0c0c), url("/public/backgrounds/${tourney}.png")`,
        }}
      >
        {isAdmin && settingsData && (
          <Button
            type="primary"
            shape="circle"
            icon={<EditOutlined />}
            size="large"
            className="NewTourneyHome-edit"
            onClick={() => setShowSettings(true)}
          />
        )}
        <div className="NewTourneyHome-header">
          <div className="NewTourneyHome-header-flex">
            <div className="NewTourneyHome-header-inner">
              <h1 className="NewTourneyHome-title u-xbold">{content.name}</h1>
              <div className="NewTourneyHome-description">{content.description}</div>
              <div className="NewTourneyHome-button-box">
                <div>
                  <Button block size="large" onClick={() => scrollToRef(infoRef)}>
                    {UI.information}
                  </Button>
                </div>
                <div>
                  <Button block size="large" onClick={() => scrollToRef(rulesRef)}>
                    {UI.rules}
                  </Button>
                </div>
                <div>
                  <Button block size="large" href={content.discord}>
                    {UI.discord}
                  </Button>
                </div>
                <div onMouseEnter={() => handleRegHover()}>
                  <Button
                    block
                    type="primary"
                    size="large"
                    onClick={register}
                    disabled={regMessage !== UI.register}
                  >
                    {regMessage}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="NewTourneyHome-container">
        {/*<div className="NewTourneyHome-sidebar">
          <div className="NewTourneyHome-sidebar-content">
            <span className="NewTourneyHome-sidebar-header">CONTENTS</span>
            <span>a</span>
          </div>
        </div>*/}
        <div className="NewTourneyHome-information" ref={infoRef}>
          {content.homepage.map((section) => {
            return (
              <div className="NewTourneyHome-section" key={section.title}>
                <h1 className="NewTourneyHome-section-title">{section.title}</h1>
                <ReactMarkdown source={section.body} />
              </div>
            );
          })}
          <hr />
          <div ref={rulesRef}></div>
          <div className="NewTourneyHome-section">
            <ReactMarkdown source={content.rules} />
          </div>
        </div>
      </div>
      <EditTourneyModal
        visible={showSettings}
        tourney={tourney}
        handleCancel={() => setShowSettings(false)}
        handleOk={handleSettingsOk}
        onValuesChange={handleSettingsChange}
        initialValues={settingsData}
      />
      <button
        className={`NewTourneyHome-back ${showScroll ? "" : "NewTourneyHome-back-hidden"}`}
        onClick={scrollToTop}
      >
        <svg
          className="NewTourneyHome-back-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 11l5-5m0 0l5 5m-5-5v12"
          />
        </svg>
      </button>
    </Content>
  );
}

export default NewTourneyHome;
