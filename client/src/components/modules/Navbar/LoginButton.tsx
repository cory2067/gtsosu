import React, { Component } from "react";
import { get, showAuthPopup } from "../../../utilities";
import ContentManager from "../../../ContentManager";
import "./LoginButton.css";
import { Button } from "antd";

import "./LoginButton.css";

const UI = ContentManager.getUI();

export type LoginButtonProps = {
  user: any;
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

  return (
    <Button
      type="primary"
      className={`login LoginButton-button ${attention ? "LoginButton-attention" : ""}`}
      onClick={handleSubmit}
    >
      {user.username ? UI.logout : UI.login}
    </Button>
  );
}
