import React, { Component, useState, useEffect } from "react";
import { Link, Router } from "@reach/router";

import { Layout, Menu, message } from "antd";
import LoginButton from "./LoginButton";
import UserModal from "./UserModal";
import "./Navbar.css";
import { post } from "../../utilities";
import ContentManager from "../../ContentManager";
import GTSLogo from "../../public/gts-osu.svg";

const { Header } = Layout;
const { SubMenu } = Menu;

const UI = ContentManager.getUI();

const MERCH_LINK = "https://teespring.com/stores/gtsosu-store";
const MOUSEPAD_LINK = "https://merch.streamelements.com/gtsosu";

function RootNavbar(props) {
  const { user, setUser, openSettings } = props;
  return (
    <Header>
      <Link to="/">
        <img className="Navbar-Logo" src={GTSLogo} />
      </Link>
      <Menu theme="dark" mode="horizontal" selectable={false}>
        <Menu.Item key="1">
          <Link to="/">{UI.home}</Link>
        </Menu.Item>
        {/*<Menu.Item key="2">
            <Link to="/staff">{UI.staff}</Link>*
    </Menu.Item>*/}
        <Menu.Item key="2">
          <Link to="/archives">{UI.archives}</Link>
        </Menu.Item>
        <SubMenu title={UI.merch.title} className="Navbar-language">
          <Menu.Item key="3.0">
            <a href={MERCH_LINK}>{UI.merch.mainStore}</a>
          </Menu.Item>
          <Menu.Item key="3.1">
            <a href={MOUSEPAD_LINK}>{UI.merch.mousepads}</a>
          </Menu.Item>
        </SubMenu>
        <Menu.Item key="4">
          <LoginButton {...props} />
        </Menu.Item>
        {user.username && (
          <Menu.Item className="Navbar-avatar" key="A">
            <img src={user.avatar} onClick={openSettings}></img>
          </Menu.Item>
        )}
      </Menu>
    </Header>
  );
}

function TourneyNavbar(props) {
  const { user, handleClick, openSettings } = props;
  const prefix = window.location.pathname.split("/").slice(0, -1).join("/");
  return (
    <Header>
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
        {/* TODO avoid hardcoding this list */}
        <SubMenu title={UI.language} className="Navbar-language">
          <Menu.Item key="lang-en">English</Menu.Item>
          <Menu.Item key="lang-fr">Français (Not available for SGTS)</Menu.Item>
          <Menu.Item key="lang-zh_cn">中文 (Simplified)</Menu.Item>
          <Menu.Item key="lang-de">Deutsch</Menu.Item>
          <Menu.Item key="lang-es_cl">Español (Chile) (Not available for SGTS)</Menu.Item>
          <Menu.Item key="lang-it">Italiano (Not available for SGTS)</Menu.Item>
          <Menu.Item key="lang-nl">Nederlands (Not available for SGTS)</Menu.Item>
          <Menu.Item key="lang-ko">한국어 (Not available for SGTS)</Menu.Item>
          <Menu.Item key="lang-ru">Русский (Not available for SGTS)</Menu.Item>
          <Menu.Item key="lang-ja">日本語 (Not available for SGTS)</Menu.Item>
          <Menu.Item key="lang-es">Español (Not available for SGTS)</Menu.Item>
          <Menu.Item key="lang-pt">Português</Menu.Item>
          <Menu.Item key="lang-pl">Polski (Not available for SGTS)</Menu.Item>
        </SubMenu>
        <Menu.Item key="7">
          <LoginButton {...props} />
        </Menu.Item>
        {user.username && (
          <Menu.Item className="Navbar-avatar" key="A">
            <img src={user.avatar} onClick={openSettings}></img>
          </Menu.Item>
        )}
      </Menu>
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
