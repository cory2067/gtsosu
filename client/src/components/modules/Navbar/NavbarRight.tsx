import { Link } from "@reach/router";
import { ConfigProvider, Menu, Typography } from "antd";
import React from "react";
import ContentManager from "../../../ContentManager";

import "./NavbarRight.css";
import LoginButton, { LoginButtonProps } from "./LoginButton";

const UI = ContentManager.getUI();

const MERCH_LINK = "https://teespring.com/stores/gtsosu-store";
const MOUSEPAD_LINK = "https://merch.streamelements.com/gtsosu";

// These has to be done inline as antd menu elements seems to have a ton of
// specifity
const menuItemStyle: React.CSSProperties = {};

type RouteMenuItemProps = {
  text: string;
  to: string;
  currentPath: string;
};

function isAtRoute(navButtonProps: RouteMenuItemProps) {
  const currentPathTokens = navButtonProps.currentPath.split("/");
  const toTokens = navButtonProps.to.split("/");
  return currentPathTokens[currentPathTokens.length - 1] === toTokens[toTokens.length - 1];
}

function RouteMenuItem(props: RouteMenuItemProps) {
  return (
    <Link to={props.to}>
      <Menu.Item style={menuItemStyle} className="NavbarRight-menuItem">
        <Typography className={`NavbarRight-menuText ${isAtRoute(props) ? "active" : ""}`}>
          {props.text}
        </Typography>
      </Menu.Item>
    </Link>
  );
}

export type RightMenuProps = LoginButtonProps & {
  path: string;
  tourney?: string;
};

/**
 * Returns menu items for routes outside of tournies. This is not a functional component.
 */
function rootMenuItems(props: RightMenuProps) {
  return [
    <RouteMenuItem text={UI.home} to="/" currentPath={props.path} />,
    <RouteMenuItem text={UI.archives} to="/archives" currentPath={props.path} />,
    <Menu.SubMenu
      className="NavbarRight-menuItem"
      style={menuItemStyle}
      title={<Typography className="NavbarRight-menuText">{UI.merch.title}</Typography>}
      popupClassName="NavbarRight-menuPopup"
      // Not sure why it needs this offset to align, otherwise it's misaligned
      // with or without the menuItemStyle padding. Might want to look into
      // the root cause for this
      popupOffset={[-22, 0]}
    >
      <Menu.Item key="3.0">
        <a href={MERCH_LINK}>{UI.merch.mainStore}</a>
      </Menu.Item>
      <Menu.Item key="3.1">
        <a href={MOUSEPAD_LINK}>{UI.merch.mousepads}</a>
      </Menu.Item>
    </Menu.SubMenu>,
    <RouteMenuItem text={UI.donate} to="/donate" currentPath={props.path} />,
    <RouteMenuItem text={UI.staff} to="/staff" currentPath={props.path} />,
    <RouteMenuItem text={UI.songs} to="/songs" currentPath={props.path} />,
  ];
}

function tourneyMenuItems(props: RightMenuProps) {
  const prefix = window.location.pathname.split("/").slice(0, -1).join("/");

  return [
    <RouteMenuItem text={UI.home} to={`${prefix}/home`} currentPath={props.path} />,
    <RouteMenuItem text={UI.mappools} to={`${prefix}/pools`} currentPath={props.path} />,
    <RouteMenuItem text={UI.schedule} to={`${prefix}/schedule`} currentPath={props.path} />,
    <RouteMenuItem text={UI.players} to={`${prefix}/players`} currentPath={props.path} />,
    <RouteMenuItem text={UI.staff} to={`${prefix}/staff`} currentPath={props.path} />,
    <RouteMenuItem text={UI.stats} to={`${prefix}/stats`} currentPath={props.path} />,
  ];
}

export function RightMenu(props: RightMenuProps) {
  const prefix = window.location.pathname.split("/").slice(0, -1).join("/");

  return (
    <Menu
      theme="dark"
      mode="horizontal"
      className="NavbarRight-menu"
      selectable={false}
      onClick={(e) => {
        const key = e.key as string;
        if (key.startsWith("lang-")) {
          const lang = key.split("lang-")[1];
          ContentManager.setLanguage(lang);
        }
      }}
    >
      {props.tourney ? tourneyMenuItems(props) : rootMenuItems(props)}
    </Menu>
  );
}

export type NavbarRightProps = RightMenuProps;

export function NavbarRight(props: NavbarRightProps) {
  return (
    <div className="NavbarRight-container">
      <RightMenu
        user={props.user}
        setUser={props.setUser}
        path={props.path}
        tourney={props.tourney}
      />
      <LoginButton user={props.user} setUser={props.setUser} attention={props.attention ?? false} />
    </div>
  );
}
