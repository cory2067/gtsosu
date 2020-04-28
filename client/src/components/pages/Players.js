import React, { Component } from "react";
import "../../utilities.css";
import "./Players.css";
import { get, hasAccess, delet } from "../../utilities";

import { Layout, Menu } from "antd";
import UserCard from "../modules/UserCard";
import TeamCard from "../modules/TeamCard";
const { Content } = Layout;

class Players extends Component {
  constructor(props) {
    super(props);
    this.state = {
      players: [],
      teams: [
        {
          name: "United States A",
          country: "US",
          players: [],
          tourney: "igts",
        },
      ],
      hasTeams: false,
      mode: "players",
    };
  }

  async componentDidMount() {
    const [players, tourney] = await Promise.all([
      get("/api/players", { tourney: this.props.tourney }),
      get("/api/tournament", { tourney: this.props.tourney }),
    ]);

    this.setState({
      players,
      hasTeams: tourney.teams,
      teams: [{ ...this.state.teams[0], players: players }],
    });
  }

  handleDelete = async (username) => {
    await delet("/api/player", { tourney: this.props.tourney, username });
    this.setState((state) => ({
      players: state.players.filter((p) => p.username !== username),
    }));
  };

  handleModeChange = (e) => {
    this.setState({
      mode: e.key,
    });
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
        <div className="Players-container">
          {this.state.mode === "players"
            ? this.state.players.map((player) => (
                <UserCard
                  canDelete={this.isAdmin()}
                  onDelete={this.handleDelete}
                  key={player.userid}
                  user={player}
                />
              ))
            : this.state.teams.map((team) => <TeamCard {...team} />)}
        </div>
      </Content>
    );
  }
}

export default Players;
