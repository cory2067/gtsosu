import React from "react";
import "./FlagIcon.css";

export default function FlagIcon({ size, customIcon, code }) {
  return (
    <img
      className="FlagIcon-img"
      style={size ? { height: size } : {}}
      src={customIcon || `/public/flags/${code}.png`}
    />
  );
}
