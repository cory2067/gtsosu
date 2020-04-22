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
            <Input />
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
