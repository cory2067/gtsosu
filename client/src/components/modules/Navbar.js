import React, { Component } from "react";
import { Link, Router } from "@reach/router";

import { Layout, Menu } from "antd";
import LoginButton from "./LoginButton";
import UserModal from "./UserModal";
import "./Navbar.css";
import { post } from "../../utilities";
import ContentManager from "../../ContentManager";
import GTSLogo from "../../public/gts-osu.svg";
const { Header } = Layout;
const { SubMenu } = Menu;

class RootNavbar extends Component {
  render() {
    return (
      <Header>
        <Link to="/">
          <img className="Navbar-Logo" src={GTSLogo} />
        </Link>
        <Menu theme="dark" mode="horizontal" selectable={false}>
          <Menu.Item key="1">
            <Link to="/">Home</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to="/staff">Staff</Link>
          </Menu.Item>
          <Menu.Item key="3">Merch</Menu.Item>
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
            <Link to={`/${this.props.tourney}/home`}>Home</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to={`/${this.props.tourney}/rules`}>Rules</Link>
          </Menu.Item>
          <Menu.Item key="3">
            <Link to={`/${this.props.tourney}/pools`}>Mappools</Link>
          </Menu.Item>
          <Menu.Item key="4">
            <Link to={`/${this.props.tourney}/players`}>Players</Link>
          </Menu.Item>
          <Menu.Item key="5">
            <Link to={`/${this.props.tourney}/schedule`}>Schedule</Link>
          </Menu.Item>
          <Menu.Item key="6">
            <Link to={`/${this.props.tourney}/staff`}>Staff</Link>
          </Menu.Item>
          {/* TODO avoid hardcoding this list */}
          <SubMenu title="Language" className="Navbar-language">
            <Menu.Item key="lang-en">English</Menu.Item>
            <Menu.Item key="lang-ko">Korean</Menu.Item>
            <Menu.Item key="lang-ru">Russian</Menu.Item>
            <Menu.Item key="lang-fr">French</Menu.Item>
            <Menu.Item key="lang-jp">Japanese</Menu.Item>
            <Menu.Item key="lang-zh-sg">Chinese (Singapore)</Menu.Item>
            <Menu.Item key="lang-de">German</Menu.Item>
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
    return this.props.user._id && (!this.props.user.discord || !this.props.user.timezone);
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
    console.log(this.state.formData);
    if (!this.state.formData.discord || !this.state.formData.timezone) {
      return alert("You must fill out these fields"); // TODO use something besides alert
    }

    this.setState({ loading: true });
    await post("/api/settings", { ...this.state.formData });
    this.props.updateUser({ ...this.props.user, ...this.state.formData });
    this.setState({ loading: false, visible: false });
  };

  handleCancel = () => {
    if (this.isIncomplete()) {
      return alert("You must fill out these fields");
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
