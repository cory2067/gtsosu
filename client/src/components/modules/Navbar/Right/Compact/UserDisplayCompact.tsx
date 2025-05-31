import React, { useState } from "react";
import { User } from "../../../../../models/user";
import { Avatar, Image, Typography } from "antd";

import "./UserDisplayCompact.css";
import { SettingsDialog } from "../../SettingsDialog";

type UserProps = {
  user: User;
};

export function UserDisplayCompact(props: UserProps) {
  return (
    <div className="UserDisplayCompact-container">
      <div className="UserDisplayCompact-username-container">
        <Typography>Logged in as</Typography>
        <Typography className="UserDisplayCompact-username">{props.user.username}</Typography>
      </div>
      <Avatar
        className="UserDisplayCompact-avatar"
        icon={<Image preview={false} src={props.user.avatar} />}
      />
    </div>
  );
}
