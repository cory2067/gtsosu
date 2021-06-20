import React, { Component } from "react";
import { Form, Select, Button, InputNumber } from "antd";

const seedNames = {
  default: ["Top", "High", "Mid", "Low"],
  suiji: ["A", "B", "C", "D"],
};

class SeedGroupForm extends Component {
  getSeedNames = () => {
    if (!this.props.isTeam && this.props.flags && this.props.flags.has("suiji")) {
      return seedNames.suiji;
    }
    return seedNames.default;
  };

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
          <Select placeholder={this.getSeedNames()[0]}>
            {this.getSeedNames().map((seed) => (
              <Select.Option key={seed} value={seed}>
                {seed}
              </Select.Option>
            ))}
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
