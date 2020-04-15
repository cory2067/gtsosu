import React, { Component } from "react";
import "../../utilities.css";
import "./TourneyHome.css";

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
        <div className="TourneyHome-cardbox">
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
        </div>
      </Content>
    );
  }
}

export default TourneyHome;
