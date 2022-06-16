import React from "react";
import { Form, Modal, Input, Select } from "antd";

export default function SubmitWarmupModal({
  visible,
  handleOk,
  handleCancel,
  onValuesChange,
  loading,
}) {
  return (
    <Modal
      title="Submit a warmup"
      visible={visible}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form onValuesChange={onValuesChange}>
        <Form.Item name="warmup" label="Warmup">
          <Input />
        </Form.Item>
        <Form.Item name="mod" label="Mod">
          <Select placeholder="Select a mod">
            <Select.Option value="NM">Nomod</Select.Option>
            <Select.Option value="DT">Double Time</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
