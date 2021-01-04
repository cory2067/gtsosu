import React, { Component } from "react";
import "../../utilities.css";

import { Form, Input, Modal } from "antd";

class AddPlayerModal extends Component {
  render() {
    return (
      <Modal
        title="Force player registration"
        visible={this.props.visible}
        confirmLoading={this.props.loading}
        onOk={this.props.handleOk}
        onCancel={this.props.handleCancel}
      >
        <Form onValuesChange={this.props.onValuesChange}>
          <Form.Item name="username" label="Player Name">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default AddPlayerModal;
