import React from "react";
import "../../utilities.css";

import { Form, Input, Modal, InputNumber } from "antd";

export default function SubmitResultsModal({
  handleCancel,
  handleOk,
  initialValues,
  loading,
  match,
  onValuesChange,
  visible,
}) {
  return (
    <Modal
      title={`Submit results for match ${match.code}`}
      visible={visible}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form onValuesChange={onValuesChange} initialValues={initialValues}>
        <p>Use score of -1 for a forfeit</p>
        <Form.Item name="score1" label={`${match.player1} score`}>
          <InputNumber min={-1} max={20} defaultValue={0} />
        </Form.Item>
        <Form.Item name="score2" label={`${match.player2} score`}>
          <InputNumber min={-1} max={20} defaultValue={0} />
        </Form.Item>
        <Form.Item name="link" label="MP Link">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
