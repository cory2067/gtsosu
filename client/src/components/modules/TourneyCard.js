import React, { Component } from "react";
import { Link } from "@reach/router";

import { Card } from "antd";
import "./TourneyCard.css";

class TourneyCard extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <Card
        title={this.props.name}
        bordered={true}
        extra={<Link to={`/${this.props.name.toLowerCase()}/home`}>Visit Tourney</Link>}
        className="TourneyCard-card"
      >
        {this.props.children}
      </Card>
    );
  }
}

export default TourneyCard;
