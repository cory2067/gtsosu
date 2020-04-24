import React, { Component } from "react";
import "../../utilities.css";
import { get, post, hasAccess, delet } from "../../utilities";
import "./Schedule.css";

import { Layout, Collapse, Form, Input, Select, Button } from "antd";
const { Content } = Layout;
const { Panel } = Collapse;

class Schedule extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}
  isAdmin = () => hasAccess(this.props.user, this.props.tourney, ["Host", "Developer"]);

  render() {
    return (
      <Content className="content">
        {this.isAdmin() && (
          <Collapse>
            <Panel header="Add new match" key="1">
              <Form name="basic" onFinish={this.onFinish}>
                <Form.Item label="Player 1" name="p1">
                  <Input />
                </Form.Item>
                <Form.Item label="Player 2" name="p2">
                  <Input />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Add
                  </Button>
                </Form.Item>
              </Form>
            </Panel>
          </Collapse>
        )}
      </Content>
    );
  }
}

export default Schedule;
