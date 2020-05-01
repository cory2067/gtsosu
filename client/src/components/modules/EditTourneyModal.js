import React, { Component } from "react";
import "../../utilities.css";

import { Form, Input, Modal, InputNumber, Select, Switch } from "antd";

const stages = [
  "Qualifiers",
  "Group Stage",
  "Round of 128",
  "Round of 64",
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Finals",
  "Grand Finals",
];

class EditTourneyModal extends Component {
  render() {
    return (
      <Modal
        title="Edit Tournament Settings"
        visible={this.props.visible}
        confirmLoading={this.props.loading}
        onOk={this.props.handleOk}
        onCancel={this.props.handleCancel}
      >
        <Form onValuesChange={this.props.onValuesChange} initialValues={this.props.initialValues}>
          <Form.Item name="registrationOpen" label="Registration Open" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="teams" label="Enable Teams" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="stages" label="Stages for this tourney">
            <Select mode="multiple">
              {stages.map((k) => (
                <Select.Option key={k}>{k}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="rankMin" label="Minimum rank">
            <InputNumber min={-1} />
          </Form.Item>
          <Form.Item name="rankMax" label="Maximum rank">
            <InputNumber min={-1} />
          </Form.Item>
          <span>(Use -1 for no rank limit)</span>
        </Form>
      </Modal>
    );
  }
}

export default EditTourneyModal;
