import React, { Component } from "react";
import "../../utilities.css";
import "./TourneyHome.css";

import { Layout, Card, Button } from "antd";
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
        <h1>{this.props.tourney.toUpperCase()}</h1>
        <div className="u-flex-justifyCenter">
          <div className="TourneyHome-info">
            <div className="TourneyHome-description">
              The Expert Global Taiko Showdown, which is our 1v1 tournament targeted towards top
              players, even though it has no rank limit. The top 128 of it after qualifiers will
              face-off in a heated double-elimination bracket.
            </div>
            <div className="TourneyHome-button-box">
              <Button type="primary" size="large">
                Register
              </Button>
              <Button type="primary" size="large" href="http://google.com">
                Discord
              </Button>
            </div>
          </div>
        </div>
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
