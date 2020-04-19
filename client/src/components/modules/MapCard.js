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
          <div className="MapCard-title">
            <div className={`MapCard-icon mod-${this.props.mod}`}></div>
            {`${this.props.mod}${this.props.index}`}
          </div>
        }
        bordered={true}
        cover={<img src={this.props.image} onClick={this.handleDownload} />}
        extra={<DeleteOutlined onClick={() => this.props.handleDelete(this.props.mapId)} />}
        className="MapCard-card"
      >
        <div className="MapCard-row MapCard-primary">{`${this.props.title} [${this.props.diff}]`}</div>
        <div className="MapCard-row">{this.props.artist}</div>
        <div className="MapCard-row">{`Mapset by ${this.props.creator}`}</div>

        <div className="MapCard-divider"></div>

        <div className="MapCard-attr-row">
          <div className="MapCard-attr">
            <StarTwoTone /> {this.props.sr}
          </div>
          <div className="MapCard-attr">
            <ClockCircleTwoTone /> {this.props.length}
          </div>
          <div className="MapCard-attr">
            <DashboardTwoTone /> {this.props.bpm}bpm
          </div>
        </div>

        <div className="MapCard-attr-row">
          <div className="MapCard-attr">
            <span className="u-bold">OD:</span> {this.props.od}
          </div>
          <div className="MapCard-attr">
            <span className="u-bold">HP:</span> {this.props.hp}
          </div>
        </div>
      </Card>
    );
  }
}

export default MapCard;
