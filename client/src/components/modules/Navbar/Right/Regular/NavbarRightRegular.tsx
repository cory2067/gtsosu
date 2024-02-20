import React, { useContext } from "react";
import { LayoutTypeContext } from "../../../../App";
import { Menu, MenuItemProps } from "antd";
import { LanguageMenuItem } from "../../LanguageMenu";
import { rootMenuItems, tourneyMenuItems } from "../RightMenuItem";
import DropdownButton from "antd/lib/dropdown/dropdown-button";
import { LoginButton, LoginButtonProps } from "./LoginButton";

import "./NavbarRightRegular.css";

export type RightMenuProps = LoginButtonProps &
  MenuItemProps & {
    tourney?: string;
    currentPath: string;
  };

export function NavbarRightRegular(props: RightMenuProps) {
  return (
    <div className="NavbarRight-container">
      <RightMenu
        user={props.user}
        setUser={props.setUser}
        currentPath={props.currentPath}
        tourney={props.tourney}
      />
      <div className="NavbarRight-separator" />
      <LoginButton user={props.user} setUser={props.setUser} />
    </div>
  );
}

function RightMenu(props: RightMenuProps) {
  return (
    <Menu
      theme="dark"
      mode={"horizontal"}
      className={"NavbarRight-menu-regular"}
      selectable={false}
    >
      {props.tourney ? tourneyMenuItems(props.currentPath) : rootMenuItems(props.currentPath)}
      <LanguageMenuItem tourney={props.tourney} />
    </Menu>
  );
}
