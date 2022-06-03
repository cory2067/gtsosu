import React from "react";

import { Form, Input, Modal, InputNumber, Select } from "antd";

export default function SubmitResultsModal({
  handleCancel,
  handleOk,
  initialValues,
  loading,
  match,
  onValuesChange,
  visible,
  beatmaps,
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
        <Form.Item name="bans1" label={`${match.player1} bans`}>
          <Select mode="multiple" showSearch allowClear placeholder="Select beatmaps">
            {beatmaps.map((beatmapItem, beatmapIndex) => (
              <Select.Option value={beatmapItem.mapId} key={beatmapIndex}>
                {`${beatmapItem.mod}${beatmapItem.index}`}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="bans2" label={`${match.player2} bans`}>
          <Select mode="multiple" showSearch allowClear placeholder="Select beatmaps">
            {beatmaps.map((beatmapItem, beatmapIndex) => (
              <Select.Option value={beatmapItem.mapId} key={beatmapIndex}>
                {`${beatmapItem.mod}${beatmapItem.index}`}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="link" label="MP Link">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
