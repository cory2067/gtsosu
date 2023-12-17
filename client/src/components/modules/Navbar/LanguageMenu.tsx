import React from "react";
import { GlobalOutlined } from "@ant-design/icons";
import { Menu, MenuItemProps, Typography } from "antd";
import ContentManager from "../../../ContentManager";
import { get } from "../../../utilities";
import UI from "../../../content/ui";

import "./LanguageMenu.css";
import { useEffect, useState } from "react";

export type LanguageMenuProps = MenuItemProps & {
  tourney?: string;
};

async function getAvailableLanguages(tourney?: string): Promise<string[]> {
  if (!tourney) {
    return Object.keys(UI);
  }

  const apiResult = await get("/api/languages", {
    tourney,
  });
  return apiResult.languages;
}

/**
 * Language menu for the right navbar. Not intended to be used elsewhere.
 */
export function LanguageMenuItem(props: LanguageMenuProps) {
  const [languages, setLanguages] = useState(["en"]);

  useEffect(() => {
    getAvailableLanguages(props.tourney).then((result) => {
      setLanguages(result ?? ["en"]);
    });
  }, [props.tourney]);

  return (
    <Menu.SubMenu
      {...props}
      className="NavbarRight-menuItem"
      popupClassName="NavbarRight-menuPopup"
      popupOffset={[-22, 0]}
      title={
        <div className="LanguageMenu-container">
          <GlobalOutlined />
          <Typography className="LanguageMenu-menuText">{ContentManager.getLanguage()}</Typography>
        </div>
      }
    >
      {languages.map((item) => {
        return (
          <Menu.Item
            key={item}
            className="LanguageMenu-languageText"
            onClick={() => {
              ContentManager.setLanguage(item);
            }}
          >
            {item.toUpperCase()}
          </Menu.Item>
        );
      })}
    </Menu.SubMenu>
  );
}
