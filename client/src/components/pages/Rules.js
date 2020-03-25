import React, { Component } from "react";
import "../../utilities.css";

import { Layout, Card } from "antd";
const { Content } = Layout;

class Rules extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    return <Content className="content">there are no rules</Content>;
  }
}

export default Rules;
