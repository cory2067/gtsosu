import React from "react";
import { Layout } from "antd";
const { Content } = Layout;

export default function NotFound() {
  return (
    <Content className="content">
      <h1>404 Not Found</h1>
      <p>The page you requested couldn't be found.</p>
    </Content>
  );
}
