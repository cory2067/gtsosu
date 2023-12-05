import { Link } from "@reach/router";
import { ConfigProvider, Menu } from "antd";
import React from "react";
import ContentManager from "../../../ContentManager";

import "./NavbarRight.css";
import LoginButton, { LoginButtonProps } from "./LoginButton";

export type RightMenuProps = LoginButtonProps;

export type NavbarRightProps = RightMenuProps;

const UI = ContentManager.getUI();

const MERCH_LINK = "https://teespring.com/stores/gtsosu-store";
const MOUSEPAD_LINK = "https://merch.streamelements.com/gtsosu";

// These has to be done inline as antd menu elements seems to have a ton of
// specifity
const menuItemStyle: React.CSSProperties = {
  fontWeight: 400,
  fontSize: 16,
  paddingLeft: 16,
  paddingRight: 16,
};

export function RightMenu(props: RightMenuProps) {
  const prefix = window.location.pathname.split("/").slice(0, -1).join("/");

  return (
    <Menu theme="dark" mode="horizontal" className="NavbarRight-menu" selectable={false}>
      <Menu.Item style={menuItemStyle} key="1">
        <Link to="/">{UI.home}</Link>
      </Menu.Item>
      <Menu.Item style={menuItemStyle} key="2">
        <Link to="/archives">{UI.archives}</Link>
      </Menu.Item>
      <Menu.SubMenu
        style={menuItemStyle}
        title={UI.merch.title}
        // Not sure why it needs this offset to align, otherwise it's misaligned
        // with or without the menuItemStyle padding. Might want to look into
        // more proper way of aligning this/setting menu item paddings
        popupOffset={[-16, 0]}
      >
        <Menu.Item key="3.0">
          <a href={MERCH_LINK}>{UI.merch.mainStore}</a>
        </Menu.Item>
        <Menu.Item key="3.1">
          <a href={MOUSEPAD_LINK}>{UI.merch.mousepads}</a>
        </Menu.Item>
      </Menu.SubMenu>
      <Menu.Item style={menuItemStyle} key="4">
        <Link to="/donate">{UI.donate}</Link>
      </Menu.Item>
      <Menu.Item style={menuItemStyle} key="5">
        <Link to="/staff">{UI.staff}</Link>
      </Menu.Item>
      <Menu.Item style={menuItemStyle} key="6">
        <Link to="/songs">{UI.songs}</Link>
      </Menu.Item>
      <Menu.Item style={menuItemStyle} key="99"></Menu.Item>
    </Menu>
  );
}

export function NavbarRight(props: NavbarRightProps) {
  return (
    <div className="NavbarRight-container">
      <RightMenu user={props.user} setUser={props.setUser} />
      <LoginButton user={props.user} setUser={props.setUser} attention={props.attention ?? false} />
    </div>
  );
}
