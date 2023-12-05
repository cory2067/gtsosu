import React from "react";
import { Link, Router } from "@reach/router";
import GTSLogo from "../../../public/gts-osu.svg";
import { Typography } from "antd";

import "./NavbarLeft.css";

export function NavbarLeft() {
  return (
    <div className="NavbarLeft-container">
      <Link to="/">
        <img
          style={{
            margin: 0,
          }}
          className="Navbar-Logo"
          src={GTSLogo}
        />
      </Link>
      <Typography className="NavbarLeft-title">
        GLOBAL <b>TAIKO</b> SHOWDOWN
      </Typography>
    </div>
  );
}
