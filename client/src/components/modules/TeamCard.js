import React, { Component } from "react";
import FlagIcon from "./FlagIcon";
import UserCard from "./UserCard";
import { Popconfirm, Form, Input, Select, Button, InputNumber } from "antd";
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
              <Form
                onFinish={(data) => this.props.onEdit(data, this.props._id)}
                layout="inline"
                initialValues={defaults}
              >
                <Form.Item name="seedName" label="Seed">
                  <Select placeholder="High">
                    <Select.Option value="Top">Top</Select.Option>
                    <Select.Option value="High">High</Select.Option>
                    <Select.Option value="Mid">Mid</Select.Option>
                    <Select.Option value="Low">Low</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="seedNum" label="Seed #">
                  <InputNumber min={1} max={512} placeholder={1} />
                </Form.Item>
                <Form.Item name="group" label="Group">
                  <Select placeholder="A">
                    {[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((val) => (
                      <Select.Option key={val} value={val}>
                        {val}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Save
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default TeamCard;
