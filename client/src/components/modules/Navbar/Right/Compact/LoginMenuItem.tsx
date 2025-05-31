import React, { useContext } from "react";
import { LanguageContext, contentManager } from "../../../../../ContentManager";
import { login, logout } from "../../../../../auth";
import { UserProps } from "../Regular/LoginButton";
import MenuItem, { MenuItemProps } from "antd/lib/menu/MenuItem";
import { Menu, MenuProps, Typography } from "antd";

export function LoginMenuItem(props: UserProps & MenuItemProps) {
  const data = props.user?.userid
    ? {
        onClick: () => logout(props.setUser),
        label: contentManager.getLocalizedString(useContext(LanguageContext), "logout"),
      }
    : {
        onClick: () => login(props.setUser),
        label: contentManager.getLocalizedString(useContext(LanguageContext), "login"),
      };

  return (
    <a>
      <Menu.Item
        onItemHover={props.onItemHover}
        onClick={data.onClick}
        className="NavbarRight-menuItem"
      >
        <Typography className="NavbarRight-menuText">{data.label}</Typography>
      </Menu.Item>
    </a>
  );
}
