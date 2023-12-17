import { Link } from "@reach/router";
import { ConfigProvider, Menu, MenuItemProps, Typography } from "antd";
import React from "react";
import ContentManager from "../../../ContentManager";

import "./NavbarRight.css";
import LoginButton, { LoginButtonProps } from "./LoginButton";
import { LanguageMenuItem } from "./LanguageMenu";

const UI = ContentManager.getUI();

const MERCH_LINK = "https://teespring.com/stores/gtsosu-store";
const MOUSEPAD_LINK = "https://merch.streamelements.com/gtsosu";

type RouteMenuItemProps = MenuItemProps & {
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
      {/* onItemHover needs to be passed along to Menu.Item to avoid errors */}
      <Menu.Item
        onItemHover={props.onItemHover}
        onClick={props.onClick}
        className="NavbarRight-menuItem"
      >
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
    <RouteMenuItem key="1" text={UI.home} to="/" currentPath={props.path} />,
    <RouteMenuItem key="2" text={UI.archives} to="/archives" currentPath={props.path} />,
    <Menu.SubMenu
      key="3"
      className="NavbarRight-menuItem"
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
    <RouteMenuItem key="4" text={UI.donate} to="/donate" currentPath={props.path} />,
    <RouteMenuItem key="5" text={UI.staff} to="/staff" currentPath={props.path} />,
    <RouteMenuItem key="6" text={UI.songs} to="/songs" currentPath={props.path} />,
  ];
}

function tourneyMenuItems(props: RightMenuProps) {
  const prefix = window.location.pathname.split("/").slice(0, -1).join("/");

  return [
    <RouteMenuItem key="1" text={UI.home} to={`${prefix}/home`} currentPath={props.path} />,
    <RouteMenuItem key="2" text={UI.mappools} to={`${prefix}/pools`} currentPath={props.path} />,
    <RouteMenuItem key="3" text={UI.schedule} to={`${prefix}/schedule`} currentPath={props.path} />,
    <RouteMenuItem key="4" text={UI.players} to={`${prefix}/players`} currentPath={props.path} />,
    <RouteMenuItem key="5" text={UI.staff} to={`${prefix}/staff`} currentPath={props.path} />,
    <RouteMenuItem key="6" text={UI.stats} to={`${prefix}/stats`} currentPath={props.path} />,
  ];
}

export function RightMenu(props: RightMenuProps) {
  return (
    <Menu
      theme="dark"
      mode="horizontal"
      className="NavbarRight-menu"
      selectable={false}
    >
      {props.tourney ? tourneyMenuItems(props) : rootMenuItems(props)}
      <LanguageMenuItem tourney={props.tourney} />
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
      <div className="NavbarRight-separator" />
      <LoginButton user={props.user} setUser={props.setUser} attention={props.attention ?? false} />
    </div>
  );
}
