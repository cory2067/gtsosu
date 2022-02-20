import React, { useState } from "react";
import "../../utilities.css";

import { Form, Input, Modal, Select, Button } from "antd";

const NUM_PLAYERS = 6;
const range = (i) => [...Array(i).keys()];

const teamToFormData = (team) => ({
  ...team,
  ...Object.fromEntries(team.players.map((p, i) => [`player${i}`, p])),
});

function EditTeamModal({ team }) {
  const [formData, setFormData] = useState(teamToFormData(team));

  const onValuesChange = (newData) => {
    setFormData({ ...formData, ...newData });
  };

  const handleOk = () => {
    const players = range(NUM_PLAYERS)
      .map((i) => formData[`player${i}`])
      .filter((p) => !!p);

    props.handleSubmit({ ...formData, players });
  };

  return (
    <Modal
      title="Edit Team"
      visible={props.visible}
      confirmLoading={props.loading}
      onOk={handleOk}
      onCancel={props.handleCancel}
    >
      <Form
        name="basic"
        onValuesChange={onValuesChange}
        initialValues={{ player0: props.user.username }}
      >
        {range(NUM_PLAYERS).map((i) => (
          <Form.Item key={i} label={`Player ${i + 1}`} name={`player${i}`}>
            {<Input disabled={i === 0} />}
          </Form.Item>
        ))}
        <Form.Item label="Team Name" name="name">
          <Input />
        </Form.Item>
        Link to a team flag (the dimensions should be 70x47)
        <Form.Item label="Team flag" name="icon">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default RegisterAsTeamModal;
