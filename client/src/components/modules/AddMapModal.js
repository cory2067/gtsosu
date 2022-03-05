import React from "react";
import "../../utilities.css";

import { Form, Select, Input, Modal, InputNumber, Switch } from "antd";

const layout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 14,
  },
};

export default function AddMapModal({ handleCancel, handleOk, loading, onValuesChange, visible }) {
  return (
    <Modal
      title="Add a map"
      visible={visible}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form {...layout} onValuesChange={onValuesChange}>
        <Form.Item name="id" label="Map ID">
          <Input />
        </Form.Item>
        <Form.Item name="mod" label="Mod">
          <Select placeholder="Select a mod">
            <Select.Option value="NM">Nomod</Select.Option>
            <Select.Option value="HD">Hidden</Select.Option>
            <Select.Option value="HR">Hard Rock</Select.Option>
            <Select.Option value="DT">Double Time</Select.Option>
            <Select.Option value="FM">Freemod</Select.Option>
            <Select.Option value="HDHR">Hidden + Hard Rock</Select.Option>
            <Select.Option value="HT">Half Time</Select.Option>
            <Select.Option value="EZ">Easy</Select.Option>
            <Select.Option value="CV">Convert</Select.Option>
            <Select.Option value="EX">Ex</Select.Option>
            <Select.Option value="TB">Tiebreaker</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="index" label="Index">
          <InputNumber min={1} max={64} />
        </Form.Item>
        <Form.Item name="customMap" label="Custom map" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="customSong" label="Custom song" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
