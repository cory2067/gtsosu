import React, { Component } from "react";
import ReactMarkdown from "react-markdown";
import "../../utilities.css";
import "./TourneyHome.css";

import { Layout, Card, Button, Modal, notification, message } from "antd";
import { ExclamationCircleOutlined, EditOutlined } from "@ant-design/icons";
import { get, post, hasAccess, prettifyTourney, tokenizeTourney } from "../../utilities";
import { navigate } from "@reach/router";
import ContentManager from "../../ContentManager";
import EditTourneyModal from "../../components/modules/EditTourneyModal";
import CreateTeamModal from "../modules/CreateTeamModal";

const UI = ContentManager.getUI();

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
    document.title = `${prettifyTourney(this.props.tourney)}: Home`;
    const data = await ContentManager.get(this.props.tourney);
    if (!data) return navigate("/404");

    if (data.divisions) {
      const { division } = tokenizeTourney(this.props.tourney);
      if (!data.divisions.includes(division)) return navigate("/404");
    }

    this.setState({ data });

    const tourney = await get("/api/tournament", { tourney: this.props.tourney });
    this.setState({
      registrationOpen: tourney.registrationOpen || false,
      tourneyFlags: tourney.flags || [],
      formData: {
        registrationOpen: tourney.registrationOpen || false,
        teams: tourney.teams || false,
        stages: (tourney.stages || []).map((s) => s.name),
        rankMin: tourney.rankMin || -1,
        rankMax: tourney.rankMax || -1,
        countries: tourney.countries || [],
        flags: tourney.flags || [],
      },
    });
  }

  isAdmin = () => hasAccess(this.props.user, this.props.tourney, []);

  isRegistered = () => {
    return this.props.user.tournies && this.props.user.tournies.includes(this.props.tourney);
  };

  submitTeamRegistration = async (formData) => {
    this.setState({ loading: true });
    try {
      await post("/api/register-team", { ...formData, tourney: this.props.tourney });
      this.setState({ showRegisterAsTeam: false, loading: false });
      const tourney = prettifyTourney(this.props.tourney);
      const success = {
        message: `Success`,
        description: `Your team is now registered for ${tourney}`,
        duration: 3,
      };
      notification.open(success);
    } catch (e) {
      this.setState({ loading: false });
      const fail = {
        message: `Failed`,
        description: `Registration failed: ${e.error}`,
        duration: 6,
      };
      notification.open(fail);
    }
  };

  register = () => {
    if (this.state.tourneyFlags.includes("registerAsTeam")) {
      this.setState({ showRegisterAsTeam: true });
      return;
    }

    const tourney = prettifyTourney(this.props.tourney);
    const success = {
      message: `Success`,
      description: `You are now registered for ${tourney}`,
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
          this.props.setUser(user);
        } catch (e) {
          const fail = {
            message: `Failed`,
            description: `Registration failed: ${e.error}`,
            duration: 6,
          };
          notification.open(fail);
        }
      },
    });
  };

  handleValuesChange = (changed, allData) => {
    this.setState({ formData: allData });
  };

  handleOk = async () => {
    console.log(this.state.formData);
    const tourney = await post("/api/tournament", {
      ...this.state.formData,
      tourney: this.props.tourney,
    });
    this.setState({ showSettings: false, registrationOpen: tourney.registrationOpen });
    message.success("Updated tournament settings");
  };

  handleRegHover = () => {
    if (!this.props.user._id) {
      this.props.setLoginAttention(!this.props.user._id);
      setTimeout(() => this.props.setLoginAttention(false), 2000);
    }
  };

  render() {
    let regMessage = UI.register;
    if (!this.props.user._id) regMessage = "Login to Register";
    else if (this.isRegistered()) regMessage = "Registered";
    else if (!this.state.registrationOpen) regMessage = "Registration Closed";

    return (
      <Content className="content">
        <div className="TourneyHome-title-container">
          <div>{this.state.data.name}</div>
          {this.isAdmin() && this.state.formData && (
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
              <div onMouseEnter={() => this.handleRegHover()}>
                <Button
                  type="primary"
                  size="large"
                  disabled={regMessage !== UI.register}
                  onClick={this.register}
                >
                  {regMessage}
                </Button>
              </div>
              <Button type="primary" size="large" href={this.state.data.discord}>
                {UI.discord}
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
        {this.props.user._id && (
          <CreateTeamModal
            user={this.props.user}
            visible={this.state.showRegisterAsTeam}
            loading={this.state.loading}
            handleSubmit={this.submitTeamRegistration}
            handleCancel={() => this.setState({ showRegisterAsTeam: false })}
          />
        )}
      </Content>
    );
  }
}

export default TourneyHome;
