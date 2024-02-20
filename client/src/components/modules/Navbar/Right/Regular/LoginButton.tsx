import React, { Component, useContext, useEffect, useState } from "react";
import { get, post, showAuthPopup } from "../../../../../utilities";
import { LanguageContext, contentManager } from "../../../../../ContentManager";
import "./LoginButton.css";
import { Avatar, Button, Dropdown, Image, Menu, Modal, Typography, message } from "antd";
import { User } from "../../../../../models/user";
import { SettingsDialog, SettingsDialogProps } from "../../SettingsDialog";
import {login, logout} from "../../../../../auth"

import "../NavbarRight.css";
import "./LoginButton.css";

export type UserProps = {
  user: User;
  setUser: (user: User | undefined) => void;
};

type UserDropdownProps = {
  setUser: (user: User | undefined) => void;
  onSettingsClicked: () => void;
};

export type LoginButtonProps = UserProps & {
};

function UserDropdown(props: UserDropdownProps) {
  const lang = useContext(LanguageContext);

  return (
    <Menu theme="dark" className="NavbarRight-menuPopup" selectable={false}>
      <Menu.Item onClick={props.onSettingsClicked}>
        <Typography className={`NavbarRight-menuText`}>
          {contentManager.getLocalizedString(lang, "settings")}
        </Typography>
      </Menu.Item>
      <Menu.Item
        onClick={async () => logout(props.setUser) }
      >
        <Typography className={`NavbarRight-menuText`}>
          {contentManager.getLocalizedString(lang, "logout")}
        </Typography>
      </Menu.Item>
    </Menu>
  );
}

function UserDisplay(props: UserProps) {
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

export function LoginButton(props: LoginButtonProps) {
  const { user, setUser } = props;

  // Not logged in
  if (!user?.username) {
    const UI = contentManager.getLocalizedUI(useContext(LanguageContext));

    return (
      <Button
        type="primary"
        className={"login LoginButton-button"}
        onClick={() => login(setUser)}
      >
        {UI.login}
      </Button>
    );
  }

  return (
    <>
      <UserDisplay user={user} setUser={props.setUser} />
    </>
  );
}
