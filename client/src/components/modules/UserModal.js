import React, { useState } from "react";
import { get, showAuthPopup } from "../../utilities";
import { Form, Select, Input, Modal, Button } from "antd";
import ContentManager from "../../ContentManager";
import UserCard from "./UserCard";

const UI = ContentManager.getUI().userSettings;

const cardImages = [
  "eis.png",
  "hana.png",
  "kamelie1.png",
  "kamelie2.png",
  "keios.png",
  "kyou.png",
  "lucia.png",
  "nothing.png",
  "naru-agts.png",
  "naru-bgts.png",
  "naru-egts1.png",
  "naru-grem.png",
  "naru-gtms.png",
  "naru-igts.png",
  "reese.png",
  "sachnus1.png",
  "sachnus2.png",
  "scarlett.png",
  "shida.png",
  "warren.png",
];

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

function UserModal({
  user,
  setUser,
  formData,
  visible,
  loading,
  handleOk,
  handleCancel,
  onValuesChange,
}) {
  const discordLoginFlow = () => showAuthPopup("/auth/login-discord", setUser);

  return (
    <Modal
      title={`Settings for ${user.username}`}
      visible={visible}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div className="u-flex-justifyCenter" style={{ marginTop: -12, marginBottom: 12 }}>
        <UserCard user={{ ...user, ...formData }} />
      </div>

      <Form {...layout} onValuesChange={onValuesChange} initialValues={user}>
        <Form.Item label={UI.discord}>
          {user.discordId ? (
            <div>
              <span style={{ paddingRight: 8 }}>{user.discord}</span>
              <Button type="primary" onClick={discordLoginFlow}>
                {UI.discordUpdate}
              </Button>
            </div>
          ) : (
            <Button type="primary" onClick={discordLoginFlow}>
              {UI.discordLink}
            </Button>
          )}
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
        {(user.donations >= 10 ||
          user.roles.some((role) => ["Designer", "Artist"].includes(role.role))) && (
          <Form.Item name="cardImage" label="Custom BG">
            <Select placeholder="No image">
              <Select.Option key="none" value={""}>
                No image
              </Select.Option>
              {cardImages.map((image) => (
                <Select.Option key={image} value={image}>
                  {image.split(".")[0]}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}
      </Form>

      <div>
        <span className="u-bold">{UI.tournies}: </span>
        {user.tournies && user.tournies.length ? user.tournies.join(", ") : "none"}
      </div>
    </Modal>
  );
}

export default UserModal;
