import React, { Component } from "react";
import "../../utilities.css";

import { Layout, Card } from "antd";
const { Content } = Layout;

class Players extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    return <Content className="content">capu is the player</Content>;
  }
}

export default Players;
