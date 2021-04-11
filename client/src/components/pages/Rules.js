import React, { Component } from "react";
import ReactMarkdown from "react-markdown";
import { navigate } from "@reach/router";
import "../../utilities.css";
import { prettifyTourney } from "../../utilities";

import { Layout, Card } from "antd";
const { Content } = Layout;
import ContentManager from "../../ContentManager";

class Rules extends Component {
  constructor(props) {
    super(props);
    this.state = { data: {} };
  }

  async componentDidMount() {
    document.title = `${prettifyTourney(this.props.tourney)}: Rules`;
    const data = await ContentManager.get(this.props.tourney);
    if (!data) return navigate("/404");
    this.setState({ data });
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
