import React, { Component } from "react";
import "../../utilities.css";

import { Layout, Card } from "antd";
const { Content } = Layout;

class TourneyStaff extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    return <Content className="content">staff of {this.props.tourney}: kasumii</Content>;
  }
}

export default TourneyStaff;
