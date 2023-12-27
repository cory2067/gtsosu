import React, { useContext } from "react";
import { LanguageContext, contentManager } from "../../../../../ContentManager";
import { UserProps, login, logout } from "../Regular/LoginButton";
import MenuItem, { MenuItemProps } from "antd/lib/menu/MenuItem";
import { Menu, MenuProps, Typography } from "antd";

export function LoginMenuItem(props: UserProps & MenuItemProps) {
  const UI = contentManager.getLocalizedUI(useContext(LanguageContext));

  const data = props.user?.userid
    ? {
        onClick: () => {
          console.log("logout");
          logout(props);
        },
        label: UI.logout,
      }
    : {
        onClick: () => {
          console.log("login");
          login(props);
        },
        label: UI.login,
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
