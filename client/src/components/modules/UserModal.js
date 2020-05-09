import React, { Component } from "react";
import "../../utilities.css";

import { Form, Select, Input, Modal, InputNumber } from "antd";
import ContentManager from "../../ContentManager";

const UI = ContentManager.getUI().userSettings;

const layout = {
  labelCol: {
    span: 10,
  },
  wrapperCol: {
    span: 14,
  },
};

class UserModal extends Component {
  constructor(props) {
    super(props);

    const range = [];
    for (let i = -12; i <= 14; i += 0.5) {
      range.push(i);
    }
    this.range = range;
  }

  render() {
    return (
      <Modal
        title={`Settings for ${this.props.user.username}`}
        visible={this.props.visible}
        confirmLoading={this.props.loading}
        onOk={this.props.handleOk}
        onCancel={this.props.handleCancel}
      >
        <Form
          {...layout}
          onValuesChange={this.props.onValuesChange}
          initialValues={this.props.user}
        >
          <div style={{ marginBottom: 12 }}>{UI.note}</div>
          <Form.Item name="discord" label={UI.discord}>
            <Input />
          </Form.Item>
          <Form.Item name="timezone" label={UI.timezone}>
            <Select placeholder="UTC+0">
              {this.range.map((num) => (
                <Select.Option key={num} value={num}>
                  UTC{num >= 0 && "+"}
                  {num}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>

        <div>
          <span className="u-bold">{UI.tournies}: </span>
          {this.props.user.tournies && this.props.user.tournies.length
            ? this.props.user.tournies.join(", ")
            : "none"}
        </div>
      </Modal>
    );
  }
}

export default UserModal;
