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
  popupOffset?: [number, number];
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

function getLangName(lang) {
  const canonicalLang = Intl.getCanonicalLocales(lang.replace("_", "-"))[0];
  return new Intl.DisplayNames(canonicalLang, { type: "language" }).of(canonicalLang);
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
      className={`NavbarRight-menuItem ${props.className}`}
      popupClassName="NavbarRight-menuPopup"
      popupOffset={props.popupOffset ?? [-22, 0]}
      title={
        <div className="LanguageMenu-container">
          <GlobalOutlined className="NavbarRight-menuText" />
          <Typography className="NavbarRight-menuText LanguageMenu-menuText">
            {currentLanguage}
          </Typography>
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
            {getLangName(item)}
          </Menu.Item>
        );
      })}
    </Menu.SubMenu>
  );
}
