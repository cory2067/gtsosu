import React, { Component } from "react";
import { Menu } from "antd";

class StageSelector extends Component {
  render() {
    return (
      <Menu theme="dark" selectedKeys={[`${this.props.selected}`]} onClick={this.props.onClick}>
        {this.props.stages.map((s, i) => (
          <Menu.Item key={i}>
            <a href={`#${i}`}>{s.name}</a>
          </Menu.Item>
        ))}
      </Menu>
    );
  }
}

export default StageSelector;
