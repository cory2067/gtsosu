import React, { Component, useContext } from "react";
import { get, showAuthPopup } from "../../../utilities";
import { LanguageContext, contentManager } from "../../../ContentManager";
import "./LoginButton.css";
import { Avatar, Button, Image, Typography } from "antd";
import { User } from "../../../models/user";

import "./LoginButton.css";

type UserDisplayProps = {
  user: User;
};

function UserDisplay(props: UserDisplayProps) {
  return (
    <div className="UserDisplay-container">
      <Typography className="UserDisplay-username">{props.user.username}</Typography>
      <Avatar size={44} icon={<Image preview={false} src={props.user.avatar} />} />
    </div>
  );
}

export type LoginButtonProps = {
  user?: User;
  setUser: (any) => void;
  attention?: boolean;
};

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
      <Button
        type="primary"
        className={`login LoginButton-button ${attention ? "LoginButton-attention" : ""}`}
        onClick={handleSubmit}
      >
        {UI.login}
      </Button>
    );
  }

  return <UserDisplay user={user} />;
}
