import React, { Component } from "react";
import "../../utilities.css";

import { Layout, Card } from "antd";
const { Content } = Layout;

class Schedule extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    return <Content className="content">your match: tomorrow</Content>;
  }
}

export default Schedule;
