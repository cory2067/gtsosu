import React, { Component } from "react";
import {
  DeleteOutlined,
  StarTwoTone,
  ClockCircleTwoTone,
  DashboardTwoTone,
} from "@ant-design/icons";
import { Link } from "@reach/router";

import { Card } from "antd";
import "./MapCard.css";

class MapCard extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleDownload = () => {
    window.open(`https://osu.ppy.sh/b/${this.props.mapId}`);
  };

  render() {
    return (
      <Card
        title={
          <div class="MapCard-title">
            <div class={`MapCard-icon mod-${this.props.mod}`}></div>
            {`${this.props.mod}${this.props.index}`}
          </div>
        }
        bordered={true}
        cover={<img src={this.props.image} onClick={this.handleDownload} />}
        extra={<DeleteOutlined onClick={() => this.props.handleDelete(this.props.mapId)} />}
        className="MapCard-card"
      >
        <div class="MapCard-row MapCard-primary">{`${this.props.title} [${this.props.diff}]`}</div>
        <div class="MapCard-row">{this.props.artist}</div>
        <div class="MapCard-row">{`Mapset by ${this.props.creator}`}</div>

        <div class="MapCard-divider"></div>

        <div class="MapCard-attr-row">
          <div class="MapCard-attr">
            <StarTwoTone /> {this.props.sr}
          </div>
          <div class="MapCard-attr">
            <ClockCircleTwoTone /> {this.props.length}
          </div>
          <div class="MapCard-attr">
            <DashboardTwoTone /> {this.props.bpm}bpm
          </div>
        </div>

        <div class="MapCard-attr-row">
          <div class="MapCard-attr">
            <span class="u-bold">OD:</span> {this.props.od}
          </div>
          <div class="MapCard-attr">
            <span class="u-bold">HP:</span> {this.props.hp}
          </div>
        </div>
      </Card>
    );
  }
}

export default MapCard;
