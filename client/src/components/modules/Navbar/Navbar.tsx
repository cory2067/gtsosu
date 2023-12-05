import { Router } from "@reach/router";
import { Layout } from "antd";
import React, { useEffect, useState } from "react";
import { NavbarLeft } from "./NavbarLeft";

import "./Navbar.css";
import { NavbarRight, RightMenuProps } from "./NavbarRight";

type NavbarProps = RightMenuProps;
export function Navbar(props: NavbarProps) {
  return (
    <Layout.Header className="Navbar-wrapper">
      <NavbarLeft />
      <NavbarRight user={props.user} setUser={props.setUser} />
    </Layout.Header>
  );
}
