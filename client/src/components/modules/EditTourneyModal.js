import React from "react";
import countries from "../../content/countries";

import { Form, Modal, InputNumber, Select, Switch, Input } from "antd";

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
  "Week 1",
  "Week 2",
  "Week 3",
  "Week 4",
  "Week 5",
  "Week 6",
  "Day 1",
  "Day 2"
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
        <Form.Item name="minTeamSize" label="Min Team Size">
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="maxTeamSize" label="Max Team Size">
          <InputNumber min={1} />
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
        <Form.Item name="requiredCountries" label="Required country codes">
          <Select mode="multiple" placeholder="No requirement">
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
        <div style={{marginBottom:"24px"}}>(Use -1 for no rank limit)</div>
        <Form.Item name="lobbyMaxSignups" label="Maximum number of lobby signups">
          <InputNumber min={0} />
        </Form.Item>
        <Form.Item name="blacklist" label="Blacklist">
          <Input />
        </Form.Item>
        <div style={{marginBottom:"24px"}}>(Specify players by IDs separated by commas)</div>
        <Form.Item name="discordServerId" label="Discord Server ID">
          <Input />
        </Form.Item>
        <div style={{marginBottom:"24px"}}>(Specify this value to enforce Discord server membership when registering)</div>
      </Form>
    </Modal>
  );
}
