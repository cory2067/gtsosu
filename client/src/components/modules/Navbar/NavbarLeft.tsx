import React from "react";
import { Link, Router } from "@reach/router";
import GTSLogo from "../../../public/gts-osu-navbar.svg";
import { Typography } from "antd";

import "./NavbarLeft.css";
import Text from "antd/lib/typography/Text";

export type NavbarTitleProps = {
  tourney?: string;
};

export type NavbarLeftProps = NavbarTitleProps;

export function NavbarTitle(props: NavbarTitleProps) {
  return (
    <div className="NavbarLeft-title-container">
      <Typography
        className={`NavbarLeft-title ${props.tourney ? "NavbarLeft-title-inactive" : ""}`}
      >
        GLOBAL <b>TAIKO</b> SHOWDOWN
      </Typography>
      {props.tourney && (
        <>
          <Typography className="NavbarLeft-title NavbarLeft-title-inactive"> / </Typography>
          <Typography className="NavbarLeft-title">{props.tourney.toUpperCase()}</Typography>
        </>
      )}
    </div>
  );
}

export function NavbarLeft(props: NavbarLeftProps) {
  return (
    <div className="NavbarLeft-container">
      <Link to="/" className="NavbarLeft-logo-container">
        <img className="NavbarLeft-logo" src={GTSLogo} />
      </Link>
      <NavbarTitle tourney={props.tourney} />
    </div>
  );
}
