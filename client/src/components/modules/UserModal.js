import React from "react";
import "../../utilities.css";

import { Form, Select, Input, Modal } from "antd";
import ContentManager from "../../ContentManager";

const UI = ContentManager.getUI().userSettings;

const layout = {
  labelCol: {
    span: 10,
  },
  wrapperCol: {
    span: 14,
  },
};

const timezones = [];
for (let i = -12; i <= 14; i += 0.5) {
  timezones.push(i);
}

function UserModal({ user, visible, loading, handleOk, handleCancel, onValuesChange }) {
  return (
    <Modal
      title={`Settings for ${user.username}`}
      visible={visible}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form {...layout} onValuesChange={onValuesChange} initialValues={user}>
        <div style={{ marginBottom: 12 }}>{UI.note}</div>
        <Form.Item name="discord" label={UI.discord}>
          <Input />
        </Form.Item>
        <Form.Item name="timezone" label={UI.timezone}>
          <Select placeholder="UTC+0">
            {timezones.map((num) => (
              <Select.Option key={num} value={num}>
                {`UTC${num >= 0 ? "+" : ""}${num}`}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>

      <div>
        <span className="u-bold">{UI.tournies}: </span>
        {user.tournies && user.tournies.length ? user.tournies.join(", ") : "none"}
      </div>
    </Modal>
  );
}

export default UserModal;
