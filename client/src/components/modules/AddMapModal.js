import React, { Component } from "react";
import { PlusOutlined } from "@ant-design/icons";
import "../../utilities.css";

import { Form, Select, Input, Modal, InputNumber } from "antd";

class AddMapModal extends Component {
  render() {
    return (
      <Modal
        title="Add a map"
        visible={this.props.visible}
        onOk={this.props.handleOk}
        onCancel={this.props.handleCancel}
      >
        <Form onValuesChange={this.props.onValuesChange}>
          <Form.Item name="id" label="Map ID">
            <Input />
          </Form.Item>
          <Form.Item name="mod" label="Mod">
            <Select placeholder="Select a mod">
              <Select.Option value="nm">Nomod</Select.Option>
              <Select.Option value="hd">Hidden</Select.Option>
              <Select.Option value="hr">Hard Rock</Select.Option>
              <Select.Option value="dt">Double Time</Select.Option>
              <Select.Option value="fm">Freemod</Select.Option>
              <Select.Option value="tb">Tiebreaker</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="index" label="Index">
            <InputNumber min={1} max={8} />
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default AddMapModal;
