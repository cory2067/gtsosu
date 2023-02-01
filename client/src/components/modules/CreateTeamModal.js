import React, { useState } from "react";

import { Form, Input, Modal, Select, Button } from "antd";

const DEFAULT_MAX_TEAM_SIZE = 6;
const range = (i) => [...Array(i).keys()];

const teamToFormData = (team) => ({
  ...team,
  ...Object.fromEntries(team.players.map((p, i) => [`player${i}`, p.username])),
});

const formDataToTeam = (formData, maxTeamSize) => ({
  ...formData,
  players: range(maxTeamSize)
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
  availablePlayers,
  maxTeamSize,
}) {
  const initialFormData = initialTeam ? teamToFormData(initialTeam) : { player0: user.username };
  const [formData, setFormData] = useState(initialFormData);

  const onValuesChange = (newData) => {
    setFormData({ ...formData, ...newData });
  };

  const handleOk = () => {
    handleSubmit(formDataToTeam(formData, maxTeamSize ?? DEFAULT_MAX_TEAM_SIZE));
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
        {range(maxTeamSize ?? DEFAULT_MAX_TEAM_SIZE).map((i) => (
          <Form.Item key={i} label={`Player ${i + 1}`} name={`player${i}`}>
            {availablePlayers ? (
              <Select
                allowClear
                showSearch
                placeholder="Select players"
                disabled={i === 0 && !shouldEdit}
              >
                {availablePlayers.map((playerItem, playerIndex) => (
                  <Select.Option value={playerItem.username} key={playerIndex}>
                    {playerItem.username}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <Input disabled={i === 0 && !shouldEdit} />
            )}
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
