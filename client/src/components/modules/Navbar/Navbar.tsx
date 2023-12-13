import { Router } from "@reach/router";
import { Layout } from "antd";
import React, { useEffect, useState } from "react";
import { NavbarLeft, NavbarLeftProps } from "./NavbarLeft";

import "./Navbar.css";
import { NavbarRight, NavbarRightProps } from "./NavbarRight";

export type NavbarProps = NavbarRightProps & NavbarLeftProps;

export function Navbar(props: NavbarProps) {
  return (
    <Layout.Header className="Navbar-container">
      <NavbarLeft tourney={props.tourney} />
      <NavbarRight
        user={props.user}
        setUser={props.setUser}
        path={props.path}
        tourney={props.tourney}
      />
    </Layout.Header>
  );
}
