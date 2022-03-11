import React from "react";
import "../../utilities.css";

import { Form, Input, Modal, Select } from "antd";

export default function AddPlayerModal({
  handleCancel,
  handleOk,
  label,
  loading,
  onValuesChange,
  options,
  title,
  visible,
}) {
  return (
    <Modal
      title={title}
      visible={visible}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form onValuesChange={onValuesChange}>
        <Form.Item name="username" label={label ?? "Player Name"}>
          {!options ? (
            <Input />
          ) : (
            <Select showSearch>
              {Object.keys(options ?? []).map((name) => (
                <Select.Option key={name} value={name}>
                  {name}
                </Select.Option>
              ))}
            </Select>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
}