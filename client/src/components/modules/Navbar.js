import React, { useState, useEffect } from "react";
import { Link, Router } from "@reach/router";

import { Layout, Menu, message } from "antd";
import LoginButton from "./LoginButton";
import UserModal from "./UserModal";
import "./Navbar.css";
import { get, post, tokenizeTourney } from "../../utilities";
import ContentManager from "../../ContentManager";
import GTSLogo from "../../public/gts-osu.svg";
import YearConfig from "../../content/year-config";
import { GlobalOutlined } from "@ant-design/icons";

const { Header } = Layout;
const { SubMenu } = Menu;

const UI = ContentManager.getUI();

const MERCH_LINK = "https://teespring.com/stores/gtsosu-store";
const MOUSEPAD_LINK = "https://merch.streamelements.com/gtsosu";

function RightNavbar(props) {
  const { openSettings, user, handleClick, languages } = props;
  const getLangName = (lang) => {
    const canonicalLang = Intl.getCanonicalLocales(lang.replace("_", "-"))[0];
    return new Intl.DisplayNames(canonicalLang, { type: "language" }).of(canonicalLang);
  };

  return (
    <div id="Navbar-RightNavbar">
      <Menu theme="dark" mode="horizontal" selectable={false} onClick={handleClick}>
        {languages && (
          <SubMenu
            title={
              <span>
                <GlobalOutlined className="Navbar-lang-icon" />
                {getLangName(ContentManager.getLanguage())}
              </span>
            }
            key="lang"
          >
            {languages.map((lang) => (
              <Menu.Item key={`lang-${lang}`}>{getLangName(lang)}</Menu.Item>
            ))}
          </SubMenu>
        )}
        {user.username ? (
          <SubMenu
            title={<img src={user.avatar} onClick={openSettings} />}
            className="Navbar-avatar"
            key="A"
          >
            <Menu.Item key="a0" onClick={openSettings}>
              Settings
            </Menu.Item>
            <Menu.Item key="a1">
              <LoginButton {...props} />
            </Menu.Item>
          </SubMenu>
        ) : (
          <Menu.Item key="4">
            <LoginButton {...props} />
          </Menu.Item>
        )}
      </Menu>
    </div>
  );
}

function RootNavbar(props) {
  return (
    <Header className="Navbar-wrapper">
      <div id="Navbar-LeftNavbar">
        <Link to="/">
          <img className="Navbar-Logo" src={GTSLogo} />
        </Link>
        <Menu theme="dark" mode="horizontal" selectable={false}>
          <Menu.Item key="1">
            <Link to="/">{UI.home}</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to="/archives">{UI.archives}</Link>
          </Menu.Item>
          <SubMenu title={UI.merch.title}>
            <Menu.Item key="3.0">
              <a href={MERCH_LINK}>{UI.merch.mainStore}</a>
            </Menu.Item>
            <Menu.Item key="3.1">
              <a href={MOUSEPAD_LINK}>{UI.merch.mousepads}</a>
            </Menu.Item>
          </SubMenu>
        </Menu>
      </div>
      <RightNavbar {...props} />
    </Header>
  );
}

const getTourneyInfo = (prefix) => {
  // TODO (#65): refactor navbar routing to avoid manual string processing like this
  const parts = prefix.split("/");
  const { code, division } = tokenizeTourney(parts[parts.length - 1]);
  const year = parts.length == 3 ? parseInt(parts[1]) : YearConfig[code];
  return { code, division, year };
};

function TourneyNavbar(props) {
  const { user, handleClick, openSettings } = props;
  const [languages, setLanguages] = useState(["en"]);

  const prefix = window.location.pathname.split("/").slice(0, -1).join("/");
  const { code, year } = getTourneyInfo(prefix);

  useEffect(() => {
    get("/api/languages", { tourney: `${code}_${year}` }).then(({ languages }) => {
      setLanguages(languages);
    });
  }, [code, year]);

  return (
    <Header className="Navbar-wrapper">
      <div id="Navbar-LeftNavbar">
        <Link to="/">
          <img className="Navbar-Logo" src={GTSLogo} />
        </Link>
        <Menu theme="dark" mode="horizontal" selectable={false} onClick={handleClick}>
          <Menu.Item key="1">
            <Link to={`${prefix}/home`}>{UI.home}</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to={`${prefix}/rules`}>{UI.rules}</Link>
          </Menu.Item>
          <Menu.Item key="3">
            <Link to={`${prefix}/pools`}>{UI.mappools}</Link>
          </Menu.Item>
          <Menu.Item key="4">
            <Link to={`${prefix}/schedule`}>{UI.schedule}</Link>
          </Menu.Item>
          <Menu.Item key="5">
            <Link to={`${prefix}/players`}>{UI.players}</Link>
          </Menu.Item>
          <Menu.Item key="6">
            <Link to={`${prefix}/staff`}>{UI.staff}</Link>
          </Menu.Item>
          <Menu.Item key="8">
            <Link to={`${prefix}/stats`}>{UI.stats}</Link>
          </Menu.Item>
        </Menu>
      </div>
      <RightNavbar {...props} languages={languages} />
    </Header>
  );
}

// Navbar + login stuff
function Navbar(props) {
  const { user, setUser } = props;
  const [formData, setFormData] = useState({});
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const isIncomplete = () => user._id && (!user.discord || user.timezone === undefined);

  useEffect(() => {
    setVisible(isIncomplete());
    setFormData(user);
  }, [user]);

  const handleOk = async () => {
    if (!formData.discord || formData.timezone === undefined) {
      return message.error("You must fill out these fields");
    }

    setLoading(true);
    await post("/api/settings", formData);
    setUser({ ...user, ...formData });
    setLoading(false);
    setVisible(false);
  };

  const handleCancel = () => {
    if (isIncomplete()) {
      return message.error("You must fill out these fields");
    }
    setVisible(false);
  };

  const handleFormChange = (changed, allData) => {
    setFormData(allData);
  };

  const openSettings = () => {
    setVisible(true);
  };

  const handleClick = (e) => {
    if (e.key.startsWith("lang-")) {
      const lang = e.key.split("lang-")[1];
      ContentManager.setLanguage(lang);
    }
  };

  return (
    <>
      {user._id && (
        <UserModal
          visible={visible}
          loading={loading}
          user={user}
          handleOk={handleOk}
          handleCancel={handleCancel}
          onValuesChange={handleFormChange}
        />
      )}
      <Router>
        <RootNavbar {...props} openSettings={openSettings} path="/" />
        <RootNavbar {...props} openSettings={openSettings} path="/archives" />
        <RootNavbar {...props} openSettings={openSettings} path="/staff" />
        <RootNavbar {...props} openSettings={openSettings} path="/pool-helper" />
        <RootNavbar {...props} openSettings={openSettings} path="/404" />
        <TourneyNavbar
          {...props}
          openSettings={openSettings}
          handleClick={handleClick}
          path="/:tourney/*"
        />
      </Router>
    </>
  );
}

export default Navbar;
