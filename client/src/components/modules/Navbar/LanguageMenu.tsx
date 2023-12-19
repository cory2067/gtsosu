import React, { useContext } from "react";
import { GlobalOutlined } from "@ant-design/icons";
import { Menu, MenuItemProps, Typography } from "antd";
import { contentManager } from "../../../ContentManager";
import { get } from "../../../utilities";
import Localizations from "../../../content/ui";

import "./LanguageMenu.css";
import { useEffect, useState } from "react";
import { LanguageContext } from "../../../ContentManager";

export type LanguageMenuProps = MenuItemProps & {
  tourney?: string;
};

async function getAvailableLanguages(tourney?: string): Promise<string[]> {
  if (!tourney) {
    return Object.keys(Localizations);
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
  const currentLanguage = useContext(LanguageContext);
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
          <Typography className="LanguageMenu-menuText">{currentLanguage}</Typography>
        </div>
      }
    >
      {languages.map((item) => {
        return (
          <Menu.Item
            key={item}
            className="LanguageMenu-languageText"
            onClick={() => {
              contentManager.setLanguage(item);
            }}
          >
            {item.toUpperCase()}
          </Menu.Item>
        );
      })}
    </Menu.SubMenu>
  );
}
