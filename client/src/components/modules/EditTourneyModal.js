import React from "react";
import countries from "../../content/countries";
import "../../utilities.css";

import { Form, Modal, InputNumber, Select, Switch } from "antd";

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
  "All Stars",
];

export default function EditTourneyModal({
  handleCancel,
  handleOk,
  initialValues,
  loading,
  onValuesChange,
  visible,
}) {
  return (
    <Modal
      title="Edit Tournament Settings"
      visible={visible}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form onValuesChange={onValuesChange} initialValues={initialValues}>
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
        <Form.Item name="countries" label="Allowed country codes">
          <Select mode="multiple" placeholder="Allow all">
            {countries.map((c) => (
              <Select.Option key={c}>{c}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="flags" label="Special options">
          <Select mode="multiple">
            <Select.Option key="suiji">Suiji</Select.Option>
            <Select.Option key="registerAsTeam">Register as team</Select.Option>
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
