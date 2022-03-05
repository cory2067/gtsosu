import React, { Component } from "react";
import {
  DeleteOutlined,
  StarTwoTone,
  ClockCircleTwoTone,
  DashboardTwoTone,
  DownloadOutlined,
} from "@ant-design/icons";
import { Link } from "@reach/router";
import CustomMapBadge from "../../public/custom-map-badge.svg";
import CustomSongBadge from "../../public/custom-song-badge.svg";

import { Card, Popconfirm, Tooltip } from "antd";
import "./MapCard.css";
import DefaultBG from "../../public/default-bg.png";

class MapCard extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <Card
        title={
          <div className="MapCard-title">
            <div className={`MapCard-icon mod-${this.props.mod}`}></div>
            {`${this.props.mod}${this.props.index}`}
            <div style={{ marginRight: 12 }} />
            {this.props.customMap && (
              <Tooltip title="GTS custom map">
                <img className="MapCard-overlay-icon" src={CustomMapBadge} />
              </Tooltip>
            )}
            {this.props.customSong && (
              <Tooltip title="GTS custom song">
                <img className="MapCard-overlay-icon" src={CustomSongBadge} />
              </Tooltip>
            )}
          </div>
        }
        bordered={true}
        cover={
          <a target="_blank" href={`https://osu.ppy.sh/b/${this.props.mapId}`} style={{ position: "relative" }}>
            <img src={this.props.image} onError={(e) => (e.target.src = DefaultBG)} />
          </a>
        }
        extra={
          this.props.isPooler() ? (
            <Popconfirm
              title={`Are you sure you want to remove ${this.props.mod}${this.props.index}?`}
              onConfirm={() => this.props.handleDelete(this.props._id)}
              okText="Yes"
              cancelText="No"
            >
              <DeleteOutlined />
            </Popconfirm>
          ) : (
            <a href={`osu://b/${this.props.mapId}`}>
              <DownloadOutlined style={{ fontSize: "18px" }} />
            </a>
          )
        }
        className="MapCard-card"
      >
        <div className="MapCard-row MapCard-primary">{`${this.props.title} [${this.props.diff}]`}</div>
        <div className="MapCard-row">{this.props.artist}</div>
        <div className="MapCard-row MapCard-small">{`Mapset by ${this.props.creator}`}</div>
        <div className="MapCard-row MapCard-small">{`Picked by ${this.props.pooler}`}</div>

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
