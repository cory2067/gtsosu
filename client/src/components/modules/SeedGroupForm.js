import React, { Component } from "react";
import { Form, Select, Button, InputNumber } from "antd";

class SeedGroupForm extends Component {
  render() {
    return (
      <Form
        onFinish={(data) => this.props.onEdit(data, this.props.target)}
        layout="inline"
        className={this.props.className}
        initialValues={this.props.initialValues}
        name={this.props.target}
      >
        <Form.Item name="seedName" label="Seed">
          <Select placeholder="High">
            <Select.Option value="Top">Top</Select.Option>
            <Select.Option value="High">High</Select.Option>
            <Select.Option value="Mid">Mid</Select.Option>
            <Select.Option value="Low">Low</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="seedNum" label="Seed #">
          <InputNumber min={1} max={512} placeholder={1} />
        </Form.Item>
        {!this.props.hideGroups && (
          <Form.Item name="group" label="Group">
            <Select placeholder="A">
              {[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((val) => (
                <Select.Option key={val} value={val}>
                  {val}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default SeedGroupForm;
