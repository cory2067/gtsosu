import React, { Component } from "react";
import "../../utilities.css";
import "./Players.css";
import { get, hasAccess, delet } from "../../utilities";

import { Layout } from "antd";
import UserCard from "../modules/UserCard";
const { Content } = Layout;

class Players extends Component {
  constructor(props) {
    super(props);
    this.state = { players: [] };
  }

  async componentDidMount() {
    const players = await get("/api/players", { tourney: this.props.tourney });
    console.log(players);
    this.setState({ players });
  }

  handleDelete = async (username) => {
    await delet("/api/player", { tourney: this.props.tourney, username });
    this.setState((state) => ({
      players: state.players.filter((p) => p.username !== username),
    }));
  };

  isAdmin = () => hasAccess(this.props.user, this.props.tourney, ["Host", "Developer"]);

  render() {
    return (
      <Content className="content">
        <div className="Players-container">
          {this.state.players.map((player) => (
            <UserCard
              canDelete={this.isAdmin()}
              onDelete={this.handleDelete}
              key={player.userid}
              user={player}
            />
          ))}
        </div>
      </Content>
    );
  }
}

export default Players;
