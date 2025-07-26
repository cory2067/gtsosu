import React from "react";

import { Form, Input, Modal, Select } from "antd";

export default function CopyPoolModal({
  handleCancel,
  handleOk,
  loading,
  visible,
  stages,
  fromStage,
}) {
  const [toStage, setToStage] = React.useState();
  const handleValuesChange = (changed, data) => setToStage(data.stage);
  const stageOptions = stages.filter((s) => s?.name !== fromStage?.name);

  return (
    <Modal
      title={"Copy pool"}
      visible={visible}
      confirmLoading={loading}
      onOk={() => handleOk(toStage)}
      onCancel={handleCancel}
    >
      <Form onValuesChange={handleValuesChange}>
        <Form.Item name="stage" label={"Stage to copy to"}>
          <Select>
            {stageOptions.map((stage) => (
              <Select.Option key={stage.name} value={stage.name}>
                {stage.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
