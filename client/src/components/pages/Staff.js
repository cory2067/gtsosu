import React, { Component } from "react";
import "../../utilities.css";

import { Layout } from "antd";
const { Content } = Layout;

class Staff extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    return (
      <Content className="content">
        <h2>staff: kasumii.</h2>
      </Content>
    );
  }
}

export default Staff;
