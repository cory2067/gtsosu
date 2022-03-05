import React, { Component } from "react";
import "../../utilities.css";

import { Form, Input, Modal, Select } from "antd";

class AddPlayerModal extends Component {
  render() {
    return (
      <Modal
        title={this.props.title}
        visible={this.props.visible}
        confirmLoading={this.props.loading}
        onOk={this.props.handleOk}
        onCancel={this.props.handleCancel}
      >
        <Form onValuesChange={this.props.onValuesChange}>
          <Form.Item name="username" label={this.props.label ?? "Player Name"}>
            {!this.props.options ? (<Input />) :
              (<Select showSearch>
                {Object.keys(this.props.options ?? []).map((name) => (
                  <Select.Option key={name} value={name}>
                    {name}
                  </Select.Option>
                ))}
              </Select>
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default AddPlayerModal;
