import React from "react";
import { Menu } from "antd";

export default function StageSelector({ onClick, selected, stages }) {
  return (
    <Menu theme="dark" selectedKeys={[`${selected}`]} onClick={onClick}>
      {stages.map((stage, idx) => (
        <Menu.Item key={idx}>
          <a href={`#${idx}`}>{stage.name}</a>
        </Menu.Item>
      ))}
    </Menu>
  );
}
