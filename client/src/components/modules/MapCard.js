import React, { Component } from "react";
import { DownloadOutlined } from "@ant-design/icons";
import { Link } from "@reach/router";

import { Card } from "antd";
import "./TourneyCard.css";

class MapCard extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleDownload = () => {
    window.open(`https://osu.ppy.sh/b/${this.props.id}`);
  };

  render() {
    return (
      <Card
        title={this.props.mod.toUpperCase() + this.props.index}
        bordered={true}
        actions={[<DownloadOutlined onClick={this.handleDownload} />]}
        className="MapCard-card"
      >
        <p>{this.props.mod}</p>
      </Card>
    );
  }
}

export default MapCard;
