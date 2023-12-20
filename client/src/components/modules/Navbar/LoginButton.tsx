import React, { Component, useContext, useEffect, useState } from "react";
import { get, post, showAuthPopup } from "../../../utilities";
import { LanguageContext, contentManager } from "../../../ContentManager";
import "./LoginButton.css";
import { Avatar, Button, Dropdown, Image, Menu, Modal, Typography, message } from "antd";
import { User } from "../../../models/user";
import { SettingsDialog, SettingsDialogProps } from "./SettingsDialog";

import "./NavbarRight.css";
import "./LoginButton.css";

type UserDisplayProps = {
  user: User;
  setUser: (any) => void;
};

type UserDropdownProps = {
  setUser: (any) => void;
  onSettingsClicked: () => void;
};

export type LoginButtonProps = UserDisplayProps & {
  attention?: boolean;
};

function UserDropdown(props: UserDropdownProps) {
  const UI = contentManager.getLocalizedUI(useContext(LanguageContext));

  return (
    <Menu theme="dark" className="NavbarRight-menuPopup" selectable={false}>
      <Menu.Item onClick={props.onSettingsClicked}>
        <Typography className={`NavbarRight-menuText`}>{UI.settings}</Typography>
      </Menu.Item>
      <Menu.Item
        onClick={async () => {
          await fetch("/auth/logout");
          props.setUser({});
          return;
        }}
      >
        <Typography className={`NavbarRight-menuText`}>{UI.logout}</Typography>
      </Menu.Item>
    </Menu>
  );
}

function UserDisplay(props: UserDisplayProps) {
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <>
      <Dropdown
        overlay={
          <UserDropdown
            setUser={props.setUser}
            onSettingsClicked={() => {
              setSettingsVisible(true);
            }}
          />
        }
        placement="bottomRight"
        overlayStyle={{ marginTop: 4 }}
      >
        <div className="UserDisplay-container">
          <Typography className="UserDisplay-username">{props.user.username}</Typography>
          <Avatar size={44} icon={<Image preview={false} src={props.user.avatar} />} />
        </div>
      </Dropdown>
      <SettingsDialog
        visible={settingsVisible}
        setVisible={setSettingsVisible}
        user={props.user}
        setUser={props.setUser}
      />
    </>
  );
}

export default function LoginButton(props: LoginButtonProps) {
  const { user, setUser, attention } = props;

  const handleSubmit = async () => {
    if (user.username) {
      await fetch("/auth/logout");
      setUser({});
      return;
    }

    const loop = showAuthPopup("/auth/login", setUser);
  };

  // Not logged in
  if (!user?.username) {
    const UI = contentManager.getLocalizedUI(useContext(LanguageContext));

    return (
      <>
        <Button
          type="primary"
          className={`login LoginButton-button ${attention ? "LoginButton-attention" : ""}`}
          onClick={handleSubmit}
        >
          {UI.login}
        </Button>
      </>
    );
  }

  return (
    <>
      <UserDisplay user={user} setUser={props.setUser} />
    </>
  );
}
