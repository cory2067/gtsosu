import React, { Component } from "react";
import FlagIcon from "./FlagIcon";
import UserCard from "./UserCard";
import SeedGroupForm from "./SeedGroupForm";
import { Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

import "./TeamCard.css";

class TeamCard extends Component {
  render() {
    const defaults = {};
    if (this.props.seedNum) defaults.seedNum = this.props.seedNum;
    if (this.props.seedName) defaults.seedName = this.props.seedName;
    if (this.props.group) defaults.group = this.props.group;

    return (
      <div className="TeamCard-container">
        {this.props.seedName && (
          <div className={`TeamCard-seed TeamCard-seed-${this.props.seedName}`}></div>
        )}
        <div>
          <div className="TeamCard-head-wrapper">
            <div className="TeamCard-header">
              <FlagIcon size={32} code={this.props.country} className="TeamCard-flag" />
              <span className="TeamCard-name">{this.props.name}</span>
              {this.props.isAdmin && (
                <Popconfirm
                  title={`Are you sure you want to remove ${this.props.name}?`}
                  onConfirm={() => this.props.onDelete(this.props._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <DeleteOutlined className="TeamCard-delete" />
                </Popconfirm>
              )}
            </div>
            {this.props.group && <div className="TeamCard-group">Group {this.props.group}</div>}
          </div>
          {this.props.players
            .map((p, i) => ({ ...p, isCaptain: i === 0, country: null }))
            .sort((x, y) => x.rank - y.rank)
            .map((player) => (
              <UserCard key={player.userid} user={player} />
            ))}

          {this.props.isAdmin && (
            <div className="TeamCard-form">
              <SeedGroupForm
                onEdit={this.props.onEdit}
                initialValues={defaults}
                target={this.props._id}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default TeamCard;
