import React from "react";
import "./AddTag.css";
import { Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";

export default function AddTag({ onClick, text }) {
  return (
    <Tag className="u-add-tag" onClick={onClick}>
      <PlusOutlined />
      {text || "Add me"}
    </Tag>
  );
}
