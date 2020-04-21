import React, { Component } from "react";
import ReactMarkdown from "react-markdown";
import "../../utilities.css";

import { Layout, Card } from "antd";
const { Content } = Layout;

class Rules extends Component {
  constructor(props) {
    super(props);
    this.state = { data: {} };
  }

  async componentDidMount() {
    const dataFile = await import(`../../content/${this.props.tourney}`);
    this.setState({
      data: dataFile.default,
    });
  }

  render() {
    return (
      <Content className="content">
        <ReactMarkdown source={this.state.data.rules} />
      </Content>
    );
  }
}

export default Rules;
