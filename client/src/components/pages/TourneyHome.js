import React, { Component } from "react";
import "../../utilities.css";

import { Layout, Card } from "antd";
const { Content } = Layout;

class TourneyHome extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    return (
      <Content className="content">
        <h1>this is {this.props.tourney}</h1>
        todo put the info stuff, links, description here
        <Card title="Restrictions" bordered={true}>
          u gotta be GOOD to play this tourny
        </Card>
        <Card title="Dates" bordered={true}>
          tomorrow is grand finals
        </Card>
        <Card title="Registration" bordered={true}>
          u cant
        </Card>
        <Card title="Prizes" bordered={true}>
          nothing
        </Card>
      </Content>
    );
  }
}

export default TourneyHome;
