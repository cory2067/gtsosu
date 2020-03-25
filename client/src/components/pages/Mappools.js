import React, { Component } from "react";
import "../../utilities.css";

import { Layout, Card } from "antd";
const { Content } = Layout;

class Mappools extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    return <Content className="content">there is no pool</Content>;
  }
}

export default Mappools;
