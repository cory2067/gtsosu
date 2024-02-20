import React, { useContext, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./TourneyHome.css";

import { EditOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { navigate } from "@reach/router";
import { Button, Dropdown, Layout, Menu, Modal, message, notification } from "antd";
import ContentManager, { LanguageContext, contentManager } from "../../ContentManager";
import EditTourneyModal from "../modules/EditTourneyModal";
import { UserAuth } from "../../permissions/UserAuth";
import { UserRole } from "../../permissions/UserRole";
import { get, post, prettifyTourney, tokenizeTourney } from "../../utilities";
import CreateTeamModal from "../modules/CreateTeamModal";

import ChallongeLogo from "../../public/challonge-logo.svg";
import DiscordLogo from "../../public/discord-logo.svg";
import PickemsLogo from "../../public/pickems-logo.png";

const { Content } = Layout;
const { confirm } = Modal;

function TourneyHome({ tourney, user, setUser, setLoginAttention }) {
  const [content, setContent] = useState({ homepage: [] });
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [tourneyFlags, setTourneyFlags] = useState([]);
  const [settingsData, setSettingsData] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [showRegisterAsTeam, setShowRegisterAsTeam] = useState(false);
  const [teamModalLoading, setTeamModalLoading] = useState(false);
  const lang = useContext(LanguageContext);
  const UI = contentManager.getLocalizedUI(lang);

  const infoRef = React.createRef();
  const rulesRef = React.createRef();

  useEffect(() => {
    (async () => {
      document.title = `${prettifyTourney(tourney)}: Home`;
      const content = await contentManager.getLocalizedTourney(tourney, lang);

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
        minTeamSize: data.minTeamSize || 1,
        maxTeamSize: data.maxTeamSize || 1,
        stages: (data.stages || []).map((s) => s.name),
        rankMin: data.rankMin || -1,
        rankMax: data.rankMax || -1,
        countries: data.countries || [],
        flags: data.flags || [],
        lobbyMaxSignups: data.lobbyMaxSignups || 8,
        blacklist: (data.blacklist || []).toString(),
        requiredCountries: data.requiredCountries || [],
        discordServerId: data.discordServerId || "",
        mode: data.mode || "taiko",
      });
    })();
  }, [lang]);

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
    if (tourneyFlags.includes("registerAsTeam")) {
      setShowRegisterAsTeam(true);
      return;
    }

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

  const submitTeamRegistration = (formData) => {
    setTeamModalLoading(true);
    post("/api/register-team", { ...formData, tourney })
      .then(() => {
        setShowRegisterAsTeam(false);
        setTeamModalLoading(false);
        const prettyTourney = prettifyTourney(tourney);
        const success = {
          message: `Success`,
          description: `Your team is now registered for ${prettyTourney}`,
          duration: 3,
        };
        notification.open(success);
        setUser({ ...user, tournies: [...(user.tournies || []), tourney] });
      })
      .catch((e) => {
        setTeamModalLoading(false);
        const fail = {
          message: `Failed`,
          description: `Registration failed: ${e.error ?? e}`,
          duration: 6,
        };
        notification.open(fail);
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
      blacklist: settingsData.blacklist
        .split(",")
        .map((x) => Number.parseInt(x))
        .filter((x) => x),
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

  const getMenuIcon = (label) => {
    if (label.includes("Discord")) {
      return <img className="TourneyHome-link-icon" src={DiscordLogo} />;
    }
    if (label.includes("Challonge")) {
      return <img className="TourneyHome-link-icon" src={ChallongeLogo} />;
    }
    if (label.includes("Pick'ems")) {
      return <img className="TourneyHome-link-icon" src={PickemsLogo} />;
    }
    return <span class="TourneyHome-link-icon"></span>;
  };

  return (
    <Content className="TourneyHome-content">
      <div
        className="TourneyHome-bg"
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
            className="TourneyHome-edit"
            onClick={() => setShowSettings(true)}
          />
        )}
        <div className="TourneyHome-header">
          <div className="TourneyHome-header-flex">
            <div className="TourneyHome-header-inner">
              <h1 className="TourneyHome-title u-xbold">{content.name}</h1>
              <div className="TourneyHome-description">{content.description}</div>
              <div className="TourneyHome-button-box">
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
                {content.links && (
                  <div>
                    <Dropdown
                      overlay={
                        <Menu>
                          {content.links.map((entry) => (
                            // Adding a key here to avoid warnings
                            <Menu.Item key={entry.link}>
                              <a target="_blank" href={entry.link}>
                                <div class="TourneyHome-menu-item">
                                  {getMenuIcon(entry.label)}
                                  {entry.label}
                                </div>
                              </a>
                            </Menu.Item>
                          ))}
                        </Menu>
                      }
                    >
                      <Button block size="large">
                        {UI.links}
                      </Button>
                    </Dropdown>
                  </div>
                )}
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
                {content.submissions && (
                  <div>
                    <Button block size="large" target="_blank" href={content.submissions}>
                      {UI.submissions}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="TourneyHome-container">
        {/*<div className="TourneyHome-sidebar">
          <div className="TourneyHome-sidebar-content">
            <span className="TourneyHome-sidebar-header">CONTENTS</span>
            <span>a</span>
          </div>
        </div>*/}
        <div className="TourneyHome-information" ref={infoRef}>
          {content.homepage.map((section) => {
            return (
              <div className="TourneyHome-section" key={section.title}>
                <h1 className="TourneyHome-section-title">{section.title}</h1>
                <ReactMarkdown source={section.body} />
              </div>
            );
          })}
          <hr />
          <div ref={rulesRef}></div>
          <div className="TourneyHome-section">
            <ReactMarkdown source={content.rules} />
          </div>
        </div>
      </div>
      {user._id && (
        <CreateTeamModal
          user={user}
          visible={showRegisterAsTeam}
          loading={teamModalLoading}
          handleSubmit={submitTeamRegistration}
          handleCancel={() => setShowRegisterAsTeam(false)}
          maxTeamSize={settingsData.maxTeamSize}
        />
      )}
      <EditTourneyModal
        visible={showSettings}
        tourney={tourney}
        handleCancel={() => setShowSettings(false)}
        handleOk={handleSettingsOk}
        onValuesChange={handleSettingsChange}
        initialValues={settingsData}
      />
      <button
        className={`TourneyHome-back ${showScroll ? "" : "TourneyHome-back-hidden"}`}
        onClick={scrollToTop}
      >
        <svg
          className="TourneyHome-back-icon"
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

export default TourneyHome;
