import React from "react";
import { Form, Modal, Input } from "antd";

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
      </Form>
    </Modal>
  );
}
