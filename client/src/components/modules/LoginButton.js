import React, { Component } from "react";
import { get } from "../../utilities";
import ContentManager from "../../ContentManager";
import "./LoginButton.css";

const UI = ContentManager.getUI();

export default function LoginButton({ user, setUser, attention }) {
  const handleSubmit = async () => {
    if (user.username) {
      await fetch("/auth/logout");
      setUser({});
      return;
    }

    const width = 600;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    const popup = window.open(
      "/auth/login/",
      "",
      `toolbar=no, location=no, directories=no, status=no, menubar=no,
      scrollbars=no, resizable=no, copyhistory=no, width=${width},
      height=${height}, top=${top}, left=${left}`
    );

    const loop = setInterval(async () => {
      if (popup.closed) {
        clearInterval(loop);
        const userData = await get("/api/whoami");
        setUser(userData);
      }
    }, 50);
    return loop;
  };

  return (
    <div
      className={`LoginButton-button ${attention ? "LoginButton-attention" : ""}`}
      onClick={handleSubmit}
    >
      <span>{user.username ? UI.logout : UI.login}</span>
    </div>
  );
}
