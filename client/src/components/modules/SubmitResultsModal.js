import React, { Component } from "react";
import "../../utilities.css";

import { Form, Input, Modal, InputNumber } from "antd";

class SubmitResultsModal extends Component {
  render() {
    return (
      <Modal
        title={`Submit results for match ${this.props.match.code}`}
        visible={this.props.visible}
        confirmLoading={this.props.loading}
        onOk={this.props.handleOk}
        onCancel={this.props.handleCancel}
      >
        <Form onValuesChange={this.props.onValuesChange} initialValues={this.props.initialValues}>
          <p>Use score of -1 for a forfeit</p>
          <Form.Item name="score1" label={`${this.props.match.player1} score`}>
            <InputNumber min={-1} max={20} defaultValue={0} />
          </Form.Item>
          <Form.Item name="score2" label={`${this.props.match.player2} score`}>
            <InputNumber min={-1} max={20} defaultValue={0} />
          </Form.Item>
          <Form.Item name="link" label="MP Link">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default SubmitResultsModal;
