import React, { Component } from "react";
import "../../utilities.css";
import "./Players.css";
import { get } from "../../utilities";

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

  render() {
    return (
      <Content className="content">
        <div className="Players-container">
          {this.state.players.map((player) => (
            <UserCard key={player.userid} user={player} />
          ))}
        </div>
      </Content>
    );
  }
}

export default Players;
