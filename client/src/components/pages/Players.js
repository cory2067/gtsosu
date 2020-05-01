import React, { Component } from "react";
import "../../utilities.css";
import "./Players.css";
import { get, hasAccess, delet, post } from "../../utilities";

import { Layout, Menu, Collapse, Input, Form, Button } from "antd";
import UserCard from "../modules/UserCard";
import TeamCard from "../modules/TeamCard";
const { Content } = Layout;
const { Panel } = Collapse;

class Players extends Component {
  constructor(props) {
    super(props);
    this.state = {
      players: [],
      teams: [],
      hasTeams: false,
      mode: "players",
    };
  }

  async componentDidMount() {
    document.title = `${this.props.tourney.toUpperCase()}: Players`;
    const [players, tourney] = await Promise.all([
      get("/api/players", { tourney: this.props.tourney }),
      get("/api/tournament", { tourney: this.props.tourney }),
    ]);

    this.setState({
      players,
      hasTeams: tourney.teams,
    });

    if (tourney.teams) {
      const teams = await get("/api/teams", { tourney: this.props.tourney });
      this.setState({ teams });
    }
  }

  handleDelete = async (username) => {
    await delet("/api/player", { tourney: this.props.tourney, username });
    this.setState((state) => ({
      players: state.players.filter((p) => p.username !== username),
    }));
  };

  handleTeamDelete = async (_id) => {
    await delet("/api/team", { tourney: this.props.tourney, _id });
    this.setState((state) => ({
      teams: state.teams.filter((p) => p._id !== _id),
    }));
  };

  handleModeChange = (e) => {
    this.setState({
      mode: e.key,
    });
  };

  onFinish = async (formData) => {
    const players = formData.players.split(",").map((s) => s.trim());

    const team = await post("/api/team", {
      players: players,
      name: formData.name,
      tourney: this.props.tourney,
    });

    this.setState((state) => ({
      teams: [...state.teams, team],
    }));
  };

  handleTeamEdit = async (formData, _id) => {
    const newTeam = await post("/api/team-stats", { ...formData, _id });
    this.setState((state) => ({
      teams: state.teams.map((t) => {
        if (t._id === _id) return newTeam;
        return t;
      }),
    }));
  };

  handlePlayerEdit = async (formData, _id) => {
    const newPlayer = await post("/api/player-stats", {
      ...formData,
      _id,
      tourney: this.props.tourney,
    });
    this.setState((state) => ({
      players: state.players.map((t) => {
        if (t._id === _id) return newPlayer;
        return t;
      }),
    }));
  };

  isAdmin = () => hasAccess(this.props.user, this.props.tourney, ["Host", "Developer"]);

  render() {
    return (
      <Content className="content">
        {this.state.hasTeams && (
          <div className="u-flex-justifyCenter">
            <Menu
              mode="horizontal"
              className="Players-mode-select"
              onClick={this.handleModeChange}
              selectedKeys={[this.state.mode]}
            >
              <Menu.Item key="players">Players</Menu.Item>
              <Menu.Item key="teams">Teams</Menu.Item>
            </Menu>
          </div>
        )}

        {this.state.mode === "teams" && (
          <Collapse>
            <Panel header={`Add new team`} key="1">
              Type all player names separated by commas, with the captain's name first.
              <Form name="basic" onFinish={this.onFinish}>
                <Form.Item label="Players" name="players">
                  <Input />
                </Form.Item>
                <Form.Item label="Team Name" name="name">
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

        <div className="Players-container">
          {this.state.mode === "players"
            ? this.state.players.map((player) => {
                const stats = player.stats.filter((t) => t.tourney == this.props.tourney)[0];
                return (
                  <UserCard
                    canDelete={this.isAdmin()}
                    onDelete={this.handleDelete}
                    key={player.userid}
                    user={player}
                    canEdit={this.isAdmin() && !this.state.hasTeams}
                    onEdit={this.handlePlayerEdit}
                    stats={stats}
                    extra={stats && `${stats.seedName} Seed (#${stats.seedNum})`}
                  />
                );
              })
            : this.state.teams.map((team) => (
                <TeamCard
                  key={team._id}
                  isAdmin={this.isAdmin()}
                  onDelete={this.handleTeamDelete}
                  onEdit={this.handleTeamEdit}
                  {...team}
                />
              ))}
        </div>
      </Content>
    );
  }
}

export default Players;
