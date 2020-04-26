import React, { Component } from "react";
import "./AddTag.css";
import { Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";

class AddTag extends Component {
  render() {
    return (
      <Tag className="u-add-tag" onClick={this.props.onClick}>
        <PlusOutlined />
        Add me
      </Tag>
    );
  }
}

export default AddTag;
