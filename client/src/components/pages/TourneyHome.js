import React, { Component } from "react";
import ReactMarkdown from "react-markdown";
import "../../utilities.css";
import "./TourneyHome.css";

import { Layout, Card, Button, Modal, notification } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { post } from "../../utilities";
import { navigate } from "@reach/router";

const { Content } = Layout;
const { confirm } = Modal;

class TourneyHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: { homepage: [] },
    };
  }

  async componentDidMount() {
    try {
      const dataFile = await import(`../../content/${this.props.tourney}`);
      this.setState({
        data: dataFile.default,
      });
    } catch (e) {
      navigate("/404");
    }
  }

  isRegistered = () => {
    return (
      this.state.justRegistered ||
      (this.props.user.tournies && this.props.user.tournies.includes(this.props.tourney))
    );
  };

  register = () => {
    const tourney = this.props.tourney.toUpperCase();
    const success = {
      message: `Success`,
      description: `You are now registered for ${tourney}`,
      duration: 3,
    };

    const fail = {
      message: `Failed`,
      description: `Failed to register for ${tourney}. Please contact GTS Staff.`,
      duration: 3,
    };

    confirm({
      title: `Register as ${this.props.user.username}`,
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to register for ${tourney}?`,
      onOk: async () => {
        try {
          await post("/api/register", { tourney: this.props.tourney });
          notification.open(success);
          this.setState({ justRegistered: true });
        } catch (e) {
          console.log("Fails");
          notification.open(fail);
        }
      },
    });
  };

  render() {
    return (
      <Content className="content">
        <h1 className="TourneyHome-title">{this.state.data.name}</h1>
        <div className="u-flex-justifyCenter">
          <div className="TourneyHome-info">
            <div className="TourneyHome-description">
              <ReactMarkdown source={this.state.data.description} />
            </div>
            <div className="TourneyHome-button-box">
              <Button
                type="primary"
                size="large"
                disabled={!this.props.user._id || this.isRegistered()}
                onClick={this.register}
              >
                {!this.props.user._id && "Login to "}Register{this.isRegistered() && "ed"}
              </Button>
              <Button type="primary" size="large" href={this.state.data.discord}>
                Discord
              </Button>
            </div>
          </div>
        </div>
        <div className="TourneyHome-cardbox">
          {this.state.data.homepage.map((section) => {
            return (
              <Card key={section.title} title={section.title} bordered={true}>
                <ReactMarkdown source={section.body} />
              </Card>
            );
          })}
        </div>
      </Content>
    );
  }
}

export default TourneyHome;
