import React, { Component } from "react";
import "../../utilities.css";
import "./Players.css";
import { get, hasAccess, delet, post } from "../../utilities";

import { Layout, Menu, Collapse, Input, Form, Button, Radio } from "antd";
import UserCard from "../modules/UserCard";
import TeamCard from "../modules/TeamCard";
import moment from "moment";

const { Content } = Layout;
const { Panel } = Collapse;

class Players extends Component {
  constructor(props) {
    super(props);
    this.state = {
      players: [],
      teams: [],
      hasTeams: false,
      sort: "rank",
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

  getStatsById = (_id) => {
    const player = this.state.players.filter((p) => p._id === _id)[0];
    if (player) return this.getStats(player);
    return {};
  };

  getStats = (player) => {
    const stats = player.stats.filter((s) => s.tourney === this.props.tourney)[0];
    return stats || {};
  };

  getRegTime = (player) => {
    const regTime = this.getStats(player).regTime;
    if (regTime) return moment(player).unix();
    return -1;
  };

  // just sort on the frontend
  sortPlayers(sort) {
    this.setState((state) => {
      const players = [...state.players];

      if (sort === "rank") {
        players.sort((x, y) => x.rank - y.rank);
      } else if (sort === "seed") {
        players.sort(
          (x, y) => (this.getStats(x).seedNum || x.rank) - (this.getStats(y).seedNum || y.rank)
        );
      } else if (sort === "alpha") {
        players.sort((x, y) => (x.username.toLowerCase() < y.username.toLowerCase() ? -1 : 1));
      } else if (sort === "reg") {
        players.sort((x, y) => this.getRegTime(x) - this.getRegTime(y));
      }

      return { players };
    });
  }

  sortTeams(sort) {
    this.setState((state) => {
      const teams = [...state.teams];

      if (sort === "alpha") {
        teams.sort((x, y) => (x.name.toLowerCase() < y.name.toLowerCase() ? -1 : 1));
      } else if (sort === "seed") {
        teams.sort((x, y) => (x.seedNum || 0) - (y.seedNum || 0));
      } else if (sort === "group") {
        teams.sort((x, y) => (x.group < y.group ? -1 : 1));
      } else if (sort === "rank") {
        teams.sort(
          (x, y) =>
            x.players.reduce((sum, p) => sum + p.rank, 0) / x.players.length -
            y.players.reduce((sum, p) => sum + p.rank, 0) / y.players.length
        );
      }

      return { teams };
    });
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
      sort: e.key === "players" ? "rank" : "alpha",
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
    const newTeam = await post("/api/team-stats", {
      ...formData,
      _id,
      tourney: this.props.tourney,
    });
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
      regTime: this.getStatsById(_id).regTime,
    });
    this.setState((state) => ({
      players: state.players.map((t) => {
        if (t._id === _id) return newPlayer;
        return t;
      }),
    }));
  };

  handleSortChange = (e) => {
    const sort = e.target.value;
    if (this.state.mode === "players") {
      this.sortPlayers(sort);
    } else {
      this.sortTeams(sort);
    }

    this.setState({ sort });
  };

  isAdmin = () => hasAccess(this.props.user, this.props.tourney, ["Host", "Developer"]);

  render() {
    return (
      <Content className="content">
        <div className="Players-topbar">
          {this.state.hasTeams && (
            <Menu
              mode="horizontal"
              className="Players-mode-select"
              onClick={this.handleModeChange}
              selectedKeys={[this.state.mode]}
            >
              <Menu.Item key="players">Players</Menu.Item>
              <Menu.Item key="teams">Teams</Menu.Item>
            </Menu>
          )}

          <div>
            <span className="Players-sort">Sort by:</span>
            <Radio.Group value={this.state.sort} onChange={this.handleSortChange}>
              {this.state.mode === "players" ? (
                <>
                  <Radio.Button value="rank">Rank</Radio.Button>
                  <Radio.Button value="alpha">Alphabetical</Radio.Button>
                  {!this.state.hasTeams && <Radio.Button value="seed">Seed</Radio.Button>}
                  <Radio.Button value="reg">Reg Time</Radio.Button>
                </>
              ) : (
                <>
                  <Radio.Button value="alpha">Alphabetical</Radio.Button>
                  <Radio.Button value="seed">Seed</Radio.Button>
                  <Radio.Button value="group">Group</Radio.Button>
                  <Radio.Button value="rank">Avg Rank</Radio.Button>
                </>
              )}
            </Radio.Group>
          </div>
        </div>

        {this.state.mode === "teams" && this.isAdmin() && (
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
                    extra={stats && stats.seedName && `${stats.seedName} Seed (#${stats.seedNum})`}
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
