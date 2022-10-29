import React from "react";
import { Menu } from "antd";
import "./StageSelector.css";

export default function StageSelector({ onClick, selected, stages }) {
  return (
    <Menu className="stage-selector" selectedKeys={[`${selected}`]} onClick={onClick}>
      {stages.map((stage, idx) => (
        <Menu.Item className="stage-name" key={idx}>
          <a href={`#${idx}`}>{stage.name}</a>
        </Menu.Item>
      ))}
    </Menu>
  );
}
