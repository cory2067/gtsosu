import React, { Component } from "react";
import ReactMarkdown from "react-markdown";
import "../../utilities.css";
import "./TourneyHome.css";

import { Layout, Card, Button, Modal, notification, message } from "antd";
import { ExclamationCircleOutlined, EditOutlined } from "@ant-design/icons";
import { get, post, hasAccess } from "../../utilities";
import { navigate } from "@reach/router";
import ContentManager from "../../ContentManager";
import EditTourneyModal from "../../components/modules/EditTourneyModal";

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
    const data = await ContentManager.get(this.props.tourney);
    if (!data) return navigate("/404");
    this.setState({ data });

    const tourney = await get("/api/tournament", { tourney: this.props.tourney });
    this.setState({
      registrationOpen: tourney.registrationOpen || false,
      formData: {
        registrationOpen: tourney.registrationOpen || false,
        stages: (tourney.stages || []).map((s) => s.name),
      },
    });
  }

  isAdmin = () => hasAccess(this.props.user, this.props.tourney, ["Host", "Developer"]);

  isRegistered = () => {
    return this.props.user.tournies && this.props.user.tournies.includes(this.props.tourney);
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
          const user = await post("/api/register", { tourney: this.props.tourney });
          notification.open(success);
          this.props.updateUser({ user });
        } catch (e) {
          console.log("Fails");
          notification.open(fail);
        }
      },
    });
  };

  handleValuesChange = (changed, allData) => {
    this.setState({ formData: allData });
  };

  handleOk = async () => {
    const tourney = await post("/api/tournament", {
      ...this.state.formData,
      tourney: this.props.tourney,
    });
    this.setState({ showSettings: false, registrationOpen: tourney.registrationOpen });
    message.success("Updated tournament settings");
  };

  render() {
    let regMessage = "Register";
    if (!this.props.user._id) regMessage = "Login to Register";
    else if (this.isRegistered()) regMessage = "Registered";
    else if (!this.state.registrationOpen) regMessage = "Registration Closed";

    return (
      <Content className="content">
        <div className="TourneyHome-title-container">
          <div>{this.state.data.name}</div>
          {this.isAdmin() && (
            <Button
              type="primary"
              shape="circle"
              icon={<EditOutlined />}
              size="large"
              className="TourneyHome-edit"
              onClick={() => this.setState({ showSettings: true })}
            />
          )}
        </div>
        <div className="u-flex-justifyCenter">
          <div className="TourneyHome-info">
            <div className="TourneyHome-description">
              <ReactMarkdown source={this.state.data.description} />
            </div>
            <div className="TourneyHome-button-box">
              <Button
                type="primary"
                size="large"
                disabled={regMessage !== "Register"}
                onClick={this.register}
              >
                {regMessage}
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
        <EditTourneyModal
          visible={this.state.showSettings}
          tourney={this.state.tourney}
          handleCancel={() => this.setState({ showSettings: false })}
          handleOk={this.handleOk}
          onValuesChange={this.handleValuesChange}
          initialValues={this.state.formData}
        />
      </Content>
    );
  }
}

export default TourneyHome;
