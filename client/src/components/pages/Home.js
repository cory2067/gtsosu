import React, { Component } from "react";
import "../../utilities.css";
import "./Home.css";

import { Layout, Card } from "antd";
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
        <h1>Global Taiko Showdown</h1>
        <div class="Home-about-container">
          <div class="Home-about">
            GTS is a thing tihntr gsf giujg liuhw gliuhf veriluc erilfher liufhlewriluf .
          </div>
        </div>

        <div className="Home-container">
          <Card title="EGTS" bordered={true} className="Home-card">
            <p>
              The Expert Global Taiko Showdown, which is our 1v1 tournament targeted towards top
              players, even though it has no rank limit. The top 128 of it after qualifiers will
              face-off in a heated double-elimination bracket. t
            </p>
          </Card>
          <Card title="IGTS" bordered={true} className="Home-card">
            <p>
              The Intermediate Global Taiko Showdown, the founding tournament of this series. It's
              our 2v2 tournament for intermediate-level players, being restricted for ranks #3,500
              to #10,000. There are no qualifiers planned for this, the top 32 teams by the average
              rank of the top 2 players will face off in a Group Stage, where 16 teams will go
              through, and play in a double-elimination bracket.
            </p>
          </Card>
          <Card title="AGTS" bordered={true} className="Home-card">
            <p>
              The Advanced Global Taiko Showdown, our 2v2 tournament for advanced-level players,
              being restricted for ranks #500 to #3,500. The top 16 teams after qualifiers will then
              face off in a Group Stage, where 8 teams will go through, and play in a
              double-elimination bracket.
            </p>
          </Card>
          <Card title="BGTS" bordered={true} className="Home-card">
            <p>
              The Beginners Global Taiko Showdown, our 2v2 tournament for beginners players, being
              restricted for ranks #10,000 to no bottom rank limit. The top 16 teams after
              qualifiers will then face off in a Group Stage, where 8 teams will go through, and
              play in a double-elimination bracket.
            </p>
          </Card>
        </div>
      </Content>
    );
  }
}

export default Home;
