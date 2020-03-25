import React, { Component } from "react";
import { Link } from "@reach/router";

import { Layout, Menu } from "antd";
const { Header } = Layout;

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <Header>
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" selectable={false}>
          <Menu.Item key="1">
            <Link to="/">Home</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to="/staff">Staff</Link>
          </Menu.Item>
          <Menu.Item key="3">Merch</Menu.Item>
        </Menu>
      </Header>
    );
  }
}

export default Navbar;
