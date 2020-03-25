import React, { Component } from "react";
import "../../utilities.css";
import "./Home.css";

import { Layout } from "antd";
const { Content } = Layout;

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    return (
      <Content className="padded-content">
        <h2>staff: kasumii.</h2>
      </Content>
    );
  }
}

export default Home;
