import React, { Component } from "react";
import { Form, Select, Button, InputNumber } from "antd";

const seedNames = {
  default: ["Top", "High", "Mid", "Low"],
  suiji: ["A", "B", "C", "D"],
};

export default function SeedGroupForm({
  className,
  flags,
  hideGroups,
  initialValues,
  isTeam,
  onEdit,
  target,
}) {
  const getSeedNames = () => {
    if (!isTeam && flags && flags.has("suiji")) {
      return seedNames.suiji;
    }
    return seedNames.default;
  };

  return (
    <Form
      onFinish={(data) => onEdit(data, target)}
      layout="inline"
      className={className}
      initialValues={initialValues}
      name={target}
    >
      <Form.Item name="seedName" label="Seed">
        <Select placeholder={getSeedNames()[0]}>
          {getSeedNames().map((seed) => (
            <Select.Option key={seed} value={seed}>
              {seed}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="seedNum" label="Seed #">
        <InputNumber min={1} max={512} placeholder={1} />
      </Form.Item>
      {!hideGroups && (
        <Form.Item name="group" label="Group">
          <Select placeholder="A">
            {[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((val) => (
              <Select.Option key={val} value={val}>
                {val}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </Form.Item>
    </Form>
  );
}
