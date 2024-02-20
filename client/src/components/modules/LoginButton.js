import React, { Component } from "react";
import { get, showAuthPopup } from "../../utilities";
import ContentManager from "../../ContentManager";
import "./LoginButton.css";

const UI = ContentManager.getUI();

export default function LoginButton({ user, setUser }) {
  const handleSubmit = async () => {
    if (user.username) {
      await fetch("/auth/logout");
      setUser({});
      return;
    }

    const loop = showAuthPopup("/auth/login", setUser);
  };

  return (
    <div className={"LoginButton-button"} onClick={handleSubmit}>
      <span>{user.username ? UI.logout : UI.login}</span>
    </div>
  );
}
