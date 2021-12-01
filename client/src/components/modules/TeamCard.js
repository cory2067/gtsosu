import React, { Component } from "react";
import FlagIcon from "./FlagIcon";
import UserCard from "./UserCard";
import SeedGroupForm from "./SeedGroupForm";
import { Popconfirm, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

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
              <Tooltip
                title={
                  this.props.seedName
                    ? `${this.props.seedName} Seed (#${this.props.seedNum})`
                    : `Seed not yet determined`
                }
              >
                <FlagIcon
                  size={32}
                  customIcon={this.props.icon}
                  code={this.props.country}
                  className="TeamCard-flag"
                />
                <span className="TeamCard-name">{this.props.name}</span>
              </Tooltip>
              {this.props.isAdmin && (
                <>
                  {this.props.onEdit && (
                    <EditOutlined
                      onClick={() => this.props.onEdit(this.props._id)}
                      className="TeamCard-icon"
                    />
                  )}
                  <Popconfirm
                    title={`Are you sure you want to remove ${this.props.name}?`}
                    onConfirm={() => this.props.onDelete(this.props._id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <DeleteOutlined className="TeamCard-icon" />
                  </Popconfirm>
                </>
              )}
            </div>
            {this.props.group && <div className="TeamCard-group">{this.props.group}</div>}
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
                onEdit={this.props.onEditStats}
                isTeam={true}
                initialValues={defaults}
                target={this.props._id}
                hideGroups={!this.props.showGroups}
                flags={this.props.flags}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default TeamCard;
