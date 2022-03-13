import React from "react";
import "../../utilities.css";

import { Form, Input, Modal } from "antd";

export default function SubmitLobbyModal({
  handleCancel,
  handleOk,
  initialValues,
  loading,
  onValuesChange,
  visible,
}) {
  return (
    <Modal
      title={`Submit mp link for lobby`}
      visible={visible}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form onValuesChange={onValuesChange} initialValues={initialValues}>
        <Form.Item name="link" label="MP Link">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
