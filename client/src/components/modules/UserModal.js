import React, { Component } from "react";
import "../../utilities.css";

import { Form, Select, Input, Modal, InputNumber } from "antd";

const layout = {
  labelCol: {
    span: 8,
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
          <Form.Item name="discord" label="Discord Username">
            <Input />
          </Form.Item>
          <Form.Item name="timezone" label="Timezone">
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
          <span className="u-bold">My Tournies: </span>
          {this.props.user.tournies && this.props.user.tournies.length
            ? this.props.user.tournies.join(", ")
            : "none"}
        </div>
        {this.props.user.permissions && this.props.user.permissions.length && (
          <div>
            <span className="u-bold">My Permissions: </span>
            {this.props.user.permissions.join(", ")}
          </div>
        )}
      </Modal>
    );
  }
}

export default UserModal;
