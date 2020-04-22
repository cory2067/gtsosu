import React, { Component } from "react";
import ReactMarkdown from "react-markdown";
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
        title={this.props.title}
        bordered={true}
        extra={<Link to={`/${this.props.code}/home`}>Visit Tourney</Link>}
        className="TourneyCard-card"
      >
        <ReactMarkdown source={this.props.description} />
      </Card>
    );
  }
}

export default TourneyCard;
