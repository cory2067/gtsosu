import React, { useContext } from "react";

import "./NavbarRight.css";
import { LayoutTypeContext } from "../../../App";
import { RightMenuProps, NavbarRightRegular } from "./Regular/NavbarRightRegular";
import { NavbarRightCompact } from "./Compact/NavbarRightCompact";

export type NavbarRightProps = RightMenuProps;

export function NavbarRight(props: NavbarRightProps) {
  const layoutType = useContext(LayoutTypeContext);

  if (layoutType == "wide") return <NavbarRightRegular {...props} />;
  else return <NavbarRightCompact {...props} />;
}
