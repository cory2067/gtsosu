import React, { Component, useImperativeHandle } from "react";
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

class RootNavbar extends Component {
  render() {
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
          <Menu.Item key="3">{UI.merch}</Menu.Item>
          <Menu.Item key="4">
            <LoginButton {...this.props} />
          </Menu.Item>
          {this.props.user.username && (
            <Menu.Item className="Navbar-avatar" key="A">
              <img src={this.props.user.avatar} onClick={this.props.openSettings}></img>
            </Menu.Item>
          )}
        </Menu>
      </Header>
    );
  }
}

class TourneyNavbar extends Component {
  render() {
    return (
      <Header>
        <Link to="/">
          <img className="Navbar-Logo" src={GTSLogo} />
        </Link>
        <Menu theme="dark" mode="horizontal" selectable={false} onClick={this.props.handleClick}>
          <Menu.Item key="1">
            <Link to={`/${this.props.tourney}/home`}>{UI.home}</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to={`/${this.props.tourney}/rules`}>{UI.rules}</Link>
          </Menu.Item>
          <Menu.Item key="3">
            <Link to={`/${this.props.tourney}/pools`}>{UI.mappools}</Link>
          </Menu.Item>
          <Menu.Item key="4">
            <Link to={`/${this.props.tourney}/schedule`}>{UI.schedule}</Link>
          </Menu.Item>
          <Menu.Item key="5">
            <Link to={`/${this.props.tourney}/players`}>{UI.players}</Link>
          </Menu.Item>
          <Menu.Item key="6">
            <Link to={`/${this.props.tourney}/staff`}>{UI.staff}</Link>
          </Menu.Item>
          {/* TODO avoid hardcoding this list */}
          <SubMenu title={UI.language} className="Navbar-language">
            <Menu.Item key="lang-en">English</Menu.Item>
            <Menu.Item key="lang-ko">한국어 (Not available for AGTS)</Menu.Item>
            <Menu.Item key="lang-ru">Русский (Not available for AGTS)</Menu.Item>
            <Menu.Item key="lang-fr">Français</Menu.Item>
            <Menu.Item key="lang-ja">日本語</Menu.Item>
            <Menu.Item key="lang-zh-cn">中文 (Simplified)</Menu.Item>
            <Menu.Item key="lang-de">Deutsch</Menu.Item>
            <Menu.Item key="lang-es">Español</Menu.Item>
            <Menu.Item key="lang-pt-br">Português (Brazil) (Not available for AGTS)</Menu.Item>
            <Menu.Item key="lang-it">Italiano</Menu.Item>
            <Menu.Item key="lang-pl">Polski (Not available for AGTS)</Menu.Item>
          </SubMenu>
          <Menu.Item key="7">
            <LoginButton {...this.props} />
          </Menu.Item>
          {this.props.user.username && (
            <Menu.Item className="Navbar-avatar" key="A">
              <img src={this.props.user.avatar} onClick={this.props.openSettings}></img>
            </Menu.Item>
          )}
        </Menu>
      </Header>
    );
  }
}

// Navbar + login stuff
class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = { formData: {} };
  }

  isIncomplete = () => {
    return (
      this.props.user._id && (!this.props.user.discord || this.props.user.timezone === undefined)
    );
  };

  componentDidMount() {
    this.setState({ visible: this.isIncomplete(), formData: this.props.user });
  }

  componentDidUpdate(prevProps) {
    if (this.props.user._id !== prevProps.user._id) {
      this.setState({ visible: this.isIncomplete(), formData: this.props.user });
    }
  }

  handleOk = async () => {
    if (!this.state.formData.discord || this.state.formData.timezone === undefined) {
      return message.error("You must fill out these fields");
    }

    this.setState({ loading: true });
    await post("/api/settings", { ...this.state.formData });
    this.props.updateUser({ ...this.props.user, ...this.state.formData });
    this.setState({ loading: false, visible: false });
  };

  handleCancel = () => {
    if (this.isIncomplete()) {
      return message.error("You must fill out these fields");
    }
    this.setState({ visible: false });
  };

  handleFormChange = (changed, allData) => {
    this.setState({ formData: allData });
  };

  openSettings = () => {
    this.setState({ visible: true });
  };

  handleClick = (e) => {
    if (e.key.startsWith("lang-")) {
      const lang = e.key.split("lang-")[1];
      ContentManager.setLanguage(lang);
    }
  };

  render() {
    return (
      <>
        {this.props.user._id && (
          <UserModal
            visible={this.state.visible}
            loading={this.state.loading}
            user={this.props.user}
            handleOk={this.handleOk}
            handleCancel={this.handleCancel}
            onValuesChange={this.handleFormChange}
          />
        )}
        <Router>
          <RootNavbar {...this.props} openSettings={this.openSettings} path="/" />
          <RootNavbar {...this.props} openSettings={this.openSettings} path="/staff" />
          <RootNavbar {...this.props} openSettings={this.openSettings} path="/404" />
          <TourneyNavbar
            {...this.props}
            openSettings={this.openSettings}
            handleClick={this.handleClick}
            path="/:tourney/*"
          />
        </Router>
      </>
    );
  }
}

export default Navbar;
