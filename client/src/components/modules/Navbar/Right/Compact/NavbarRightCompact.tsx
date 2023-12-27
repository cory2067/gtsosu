import React, { useContext, useState } from "react";
import { Dropdown, Menu, Typography } from "antd";
import { RightMenuProps } from "../Regular/NavbarRightRegular";
import { LanguageMenuItem } from "../../LanguageMenu";
import { rootMenuItems, tourneyMenuItems } from "../RightMenuItem";
import Icon from "@ant-design/icons/lib/components/Icon";
import { MenuOutlined } from "@ant-design/icons";

import "./NavbarRightCompact.css";
import { UserDisplayCompact } from "./UserDisplayCompact";
import { LoginMenuItem } from "./LoginMenuItem";
import { SettingsDialog } from "../../SettingsDialog";
import { LanguageContext, contentManager } from "../../../../../ContentManager";

export function NavbarRightCompact(props: RightMenuProps) {
  return (
    <div className="NavbarRight-compact-container">
      <Dropdown
        trigger={["click"]}
        className="NavbarRight-dropdown"
        placement="bottomRight"
        overlayStyle={{
          // We do not want to cover modals with the dropdown
          // Antd modals has z-index of 1000
          zIndex: 999,
        }}
        overlay={
          <RightMenu
            user={props.user}
            setUser={props.setUser}
            currentPath={props.currentPath}
            tourney={props.tourney}
          />
        }
      >
        <div className="NavbarRight-dropdown-icon-container">
          <MenuOutlined className="NavbarRight-dropdown-icon" />
        </div>
      </Dropdown>
    </div>
  );
}

function RightMenu(props: RightMenuProps) {
  const lang = useContext(LanguageContext);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const loggedIn = !!props.user?.userid;
  const popupOffset: [number, number] = [12, 0];

  return (
    <>
      <div className="NavbarRight-compact-popup-container">
        {loggedIn && <UserDisplayCompact user={props.user} />}
        <Menu
          theme="dark"
          mode="vertical-left"
          className={"NavbarRight-compact-popup"}
          selectable={false}
        >
          {!loggedIn && <LoginMenuItem user={props.user} setUser={props.setUser} />}
          {props.tourney
            ? tourneyMenuItems(props.currentPath)
            : rootMenuItems(props.currentPath, popupOffset)}
          <LanguageMenuItem tourney={props.tourney} popupOffset={popupOffset} />
          {loggedIn && (
            <>
              <Menu.Item onClick={() => setSettingsVisible(true)} className="NavbarRight-menuItem">
                <Typography className={`NavbarRight-menuText`}>
                  {contentManager.getLocalizedString(lang, "settings")}
                </Typography>
              </Menu.Item>
              <LoginMenuItem user={props.user} setUser={props.setUser} />
            </>
          )}
        </Menu>
      </div>
      <SettingsDialog
        visible={settingsVisible}
        setVisible={setSettingsVisible}
        user={props.user}
        setUser={props.setUser}
      />
    </>
  );
}
