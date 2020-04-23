import React, { Component } from "react";
import "../../utilities.css";
import "./Players.css";

import { Layout } from "antd";
import UserCard from "../modules/UserCard";
const { Content } = Layout;

class Players extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    return (
      <Content className="content">
        <div className="Players-container">
          <UserCard {...this.props} extra={"Team: Cychlo's epic team"} />
          <UserCard {...this.props} hideRank={true} />
          <UserCard {...this.props} />
          <UserCard {...this.props} />
        </div>
      </Content>
    );
  }
}

export default Players;
