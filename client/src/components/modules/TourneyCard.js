import React, { Component } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "@reach/router";

import { Card, List } from "antd";
import "./TourneyCard.css";

class TourneyCard extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const hasDivisions = !!this.props.divisions;

    return (
      <Card
        title={this.props.title}
        bordered={true}
        extra={!hasDivisions && <Link to={`/${this.props.code}/home`}>Visit Tourney</Link>}
        className="TourneyCard-card"
      >
        <ReactMarkdown source={this.props.description} />

        {hasDivisions && (
          <List
            size="small"
            header={<div>Divisions</div>}
            bordered
            dataSource={this.props.divisions}
            renderItem={({ title, code }) => (
              <List.Item>
                <Link to={`/${this.props.code}-${code}/home`}>{title}</Link>
              </List.Item>
            )}
          />
        )}
      </Card>
    );
  }
}

export default TourneyCard;
