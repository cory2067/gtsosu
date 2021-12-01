import React, { useState } from "react";
import "../../utilities.css";

import { Form, Input, Modal, Select, Button } from "antd";

const NUM_PLAYERS = 6;
const range = (i) => [...Array(i).keys()];

const teamToFormData = (team) => ({
  ...team,
  ...Object.fromEntries(team.players.map((p, i) => [`player${i}`, p.username])),
});

const formDataToTeam = (formData) => ({
  ...formData,
  players: range(NUM_PLAYERS)
    .map((i) => formData[`player${i}`])
    .filter((p) => !!p),
});

// Team modal can be opened at registration time (shouldEdit=false)
// or by an admin to edit the team (shouldEdit=true)
function CreateTeamModal({
  user,
  handleSubmit,
  handleCancel,
  visible,
  loading,
  initialTeam,
  shouldEdit,
}) {
  const initialFormData = initialTeam ? teamToFormData(initialTeam) : { player0: user.username };
  const [formData, setFormData] = useState(initialFormData);

  const onValuesChange = (newData) => {
    setFormData({ ...formData, ...newData });
  };

  const handleOk = () => {
    handleSubmit(formDataToTeam(formData));
  };

  return (
    <Modal
      title={shouldEdit ? "Edit team" : "Register as team"}
      visible={visible}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form name="basic" onValuesChange={onValuesChange} initialValues={initialFormData}>
        {range(NUM_PLAYERS).map((i) => (
          <Form.Item key={i} label={`Player ${i + 1}`} name={`player${i}`}>
            {<Input disabled={i === 0 && !shouldEdit} />}
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

export default CreateTeamModal;
