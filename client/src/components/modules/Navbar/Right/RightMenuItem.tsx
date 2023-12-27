import React, { useContext } from "react";
import { Link } from "@reach/router";
import { Menu, MenuItemProps, Typography } from "antd";
import { LanguageContext, contentManager } from "../../../../ContentManager";

const MERCH_LINK = "https://teespring.com/stores/gtsosu-store";
const MOUSEPAD_LINK = "https://merch.streamelements.com/gtsosu";

type RightMenuItemProps = MenuItemProps & {
  text: string;
  textClassName?: string;
};

type RouteMenuItemProps = MenuItemProps &
  RightMenuItemProps & {
    to: string;
    currentPath: string;
  };

function isAtRoute(navButtonProps: RouteMenuItemProps) {
  const currentPathTokens = navButtonProps.currentPath.split("/");
  const toTokens = navButtonProps.to.split("/");
  return currentPathTokens[currentPathTokens.length - 1] === toTokens[toTokens.length - 1];
}

export function RightMenuItem(props: RightMenuItemProps) {
  return (
    // onItemHover and onClick needs to be passed to Menu.Item to avoid errors
    <Menu.Item
      onItemHover={props.onItemHover}
      onClick={props.onClick}
      className={`NavbarRight-menuItem ${props.className}`}
    >
      <Typography className={`NavbarRight-menuText ${props.textClassName}`}>
        {props.text}
      </Typography>
    </Menu.Item>
  );
}

export function RouteMenuItem(props: RouteMenuItemProps) {
  return (
    <Link to={props.to}>
      <RightMenuItem
        onItemHover={props.onItemHover}
        onClick={props.onClick}
        className={`${isAtRoute(props) ? "active" : ""} ${props.className}`}
        text={props.text}
        textClassName={isAtRoute(props) ? "active" : ""}
      />
    </Link>
  );
}

/**
 * Returns menu items for routes outside of tournies. This is not a functional component.
 */
export function rootMenuItems(currentPath: string, popupOffset: [number, number] = [-22, 0]) {
  const lang = useContext(LanguageContext);

  return [
    <RouteMenuItem
      key="1"
      text={contentManager.getLocalizedString(lang, "home")}
      to="/"
      currentPath={currentPath}
    />,
    <RouteMenuItem
      key="2"
      text={contentManager.getLocalizedString(lang, "archives")}
      to="/archives"
      currentPath={currentPath}
    />,
    <Menu.SubMenu
      key="3"
      className={"NavbarRight-menuItem"}
      title={
        <Typography className="NavbarRight-menuText">
          {contentManager.getLocalizedString(lang, "merch.title")}
        </Typography>
      }
      popupClassName="NavbarRight-menuPopup"
      // Not sure why it needs this offset to align, otherwise it's misaligned
      // with or without the menuItemStyle padding. Might want to look into
      // the root cause for this
      popupOffset={popupOffset ?? [-22, 0]}
    >
      <Menu.Item key="3.0">
        <a href={MERCH_LINK}>{contentManager.getLocalizedString(lang, "merch.mainStore")}</a>
      </Menu.Item>
      <Menu.Item key="3.1">
        <a href={MOUSEPAD_LINK}>{contentManager.getLocalizedString(lang, "merch.mousepads")}</a>
      </Menu.Item>
    </Menu.SubMenu>,
    <RouteMenuItem
      key="4"
      text={contentManager.getLocalizedString(lang, "donate")}
      to="/donate"
      currentPath={currentPath}
    />,
    <RouteMenuItem
      key="5"
      text={contentManager.getLocalizedString(lang, "staff")}
      to="/staff"
      currentPath={currentPath}
    />,
    <RouteMenuItem
      key="6"
      text={contentManager.getLocalizedString(lang, "songs")}
      to="/songs"
      currentPath={currentPath}
    />,
  ];
}

/**
 * Returns menu items for routes in tourney pages. This is not a functional component.
 */
export function tourneyMenuItems(currentPath: string) {
  const prefix = window.location.pathname.split("/").slice(0, -1).join("/");
  const lang = useContext(LanguageContext);

  return [
    <RouteMenuItem
      key="1"
      text={contentManager.getLocalizedString(lang, "home")}
      to={`${prefix}/home`}
      currentPath={currentPath}
    />,
    <RouteMenuItem
      key="2"
      text={contentManager.getLocalizedString(lang, "mappools")}
      to={`${prefix}/pools`}
      currentPath={currentPath}
    />,
    <RouteMenuItem
      key="3"
      text={contentManager.getLocalizedString(lang, "schedule")}
      to={`${prefix}/schedule`}
      currentPath={currentPath}
    />,
    <RouteMenuItem
      key="4"
      text={contentManager.getLocalizedString(lang, "players")}
      to={`${prefix}/players`}
      currentPath={currentPath}
    />,
    <RouteMenuItem
      key="5"
      text={contentManager.getLocalizedString(lang, "staff")}
      to={`${prefix}/staff`}
      currentPath={currentPath}
    />,
    <RouteMenuItem
      key="6"
      text={contentManager.getLocalizedString(lang, "stats")}
      to={`${prefix}/stats`}
      currentPath={currentPath}
    />,
  ];
}
