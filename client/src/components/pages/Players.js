import React, { Component } from "react";
import "../../utilities.css";
import "./Players.css";
import { get, hasAccess, delet, post, prettifyTourney } from "../../utilities";
import AddPlayerModal from "../modules/AddPlayerModal";

import { PlusOutlined, ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import { Layout, Menu, Collapse, Input, Form, Button, Radio, Progress } from "antd";
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
      hasGroups: false,
      sort: "rank",
      mode: "players",
      refreshPercent: -1,
      modalVisible: false,
      modalLoading: false,
      addPlayerData: {},
      flags: new Set(),
    };
  }

  async componentDidMount() {
    document.title = `${prettifyTourney(this.props.tourney)}: Players`;
    const [players, tourney] = await Promise.all([
      get("/api/players", { tourney: this.props.tourney }),
      get("/api/tournament", { tourney: this.props.tourney }),
    ]);

    this.setState({
      players,
      hasTeams: tourney.teams,
      hasGroups: tourney.stages.some((s) => s.name === "Group Stage"),
      rankRange: [tourney.rankMin, tourney.rankMax !== -1 ? tourney.rankMax : Infinity],
      flags: new Set(tourney.flags || []),
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
    if (regTime) return moment(regTime).unix();
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
      } else if (sort === "group") {
        players.sort((x, y) =>
          (this.getStats(x).group || "_") < (this.getStats(y).group || "_") ? -1 : 1
        );
      } else if (sort === "alpha") {
        players.sort((x, y) => (x.username.toLowerCase() < y.username.toLowerCase() ? -1 : 1));
      } else if (sort === "country") {
        players.sort((x, y) => (x.country < y.country ? -1 : 1));
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
        teams.sort((x, y) => ((x.group || "_") < (y.group || "_") ? -1 : 1));
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
    if (e.key === "players") {
      this.setState(
        {
          mode: "players",
          sort: "rank",
        },
        () => this.sortPlayers("rank")
      );
    } else {
      console.log("sort team");
      this.setState(
        {
          mode: "teams",
          sort: "alpha",
        },
        () => this.sortTeams("alpha")
      );
    }
  };

  onFinish = async (formData) => {
    const players = formData.players.split(",").map((s) => s.trim());

    const team = await post("/api/team", {
      players: players,
      name: formData.name,
      tourney: this.props.tourney,
      icon: formData.icon,
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

  handleAddPlayer = async () => {
    this.setState({ modalLoading: true });
    const player = await post("/api/force-register", {
      ...this.state.addPlayerData,
      tourney: this.props.tourney,
    });
    this.setState(
      (state) => ({
        players: [...state.players, player],
        modalLoading: false,
        modalVisible: false,
      }),
      () => this.sortPlayers(this.state.sort)
    );
  };

  isAdmin = () => hasAccess(this.props.user, this.props.tourney, []);

  refreshRanks = async () => {
    this.setState({ refreshPercent: 0 });

    let offset = 0;
    while (offset < this.state.players.length) {
      console.log(`Refreshing players at offset ${offset}`);
      const result = await post("/api/refresh", { tourney: this.props.tourney, offset });
      offset = result.offset;

      this.setState(
        (state) => ({
          players: state.players.map((p) => {
            const newPlayer = result.players.filter((r) => r._id === p._id)[0];
            return newPlayer || p;
          }),
          refreshPercent: Math.min(100, Math.round((100 * offset) / this.state.players.length)),
        }),
        () => this.sortPlayers(this.state.sort)
      );
    }
  };

  exportPlayers = () => {
    const header = "Username,User ID,Country,Rank,Discord Username,Timezone";
    const body = this.state.players
      .map((p) => `${p.username},${p.userid},${p.country},${p.rank},"${p.discord}",${p.timezone}`)
      .join("\n");
    console.log(body);

    const dl = document.createElement("a");
    dl.href = "data:text/csv;chartset=utf-8," + encodeURIComponent(`${header}\n${body}`);
    console.log(dl.href);
    dl.target = "_blank";
    dl.download = `players-${this.props.tourney}.csv`;
    dl.click();
  };

  // suiji is special, since it's has seeds by both player and by team
  hasPlayerSeeds = () => !this.state.hasTeams || this.state.flags.has("suiji");
  hasTeamSeeds = () => this.state.hasTeams || this.state.flags.has("suiji");

  assignSuijiSeeds = async () => {
    const players = [...this.state.players].sort((x, y) => x.rank - y.rank);
    const getSeedName = (rank) => {
      if (rank < 64) {
        return "A";
      }
      if (rank < 128) {
        return "B";
      }
      if (rank < 192) {
        return "C";
      }
      if (rank < 256) {
        return "D";
      }
      return undefined;
    };

    for (const [index, player] of players.entries()) {
      await this.handlePlayerEdit({ seedName: getSeedName(index), seedNum: index + 1 }, player._id);
      this.setState({
        refreshPercent: Math.min(100, Math.round((100 * (index + 1)) / this.state.players.length)),
      });
    }
  };

  render() {
    return (
      <Content className="content">
        <div className="Players-topbar">
          <Menu
            mode="horizontal"
            className="Players-mode-select"
            onClick={this.handleModeChange}
            selectedKeys={[this.state.mode]}
          >
            <Menu.Item key="players">Players ({this.state.players.length})</Menu.Item>
            {this.state.hasTeams && (
              <Menu.Item key="teams">Teams ({this.state.teams.length})</Menu.Item>
            )}
          </Menu>

          <div>
            <span className="Players-sort">Sort by:</span>
            <Radio.Group value={this.state.sort} onChange={this.handleSortChange}>
              {this.state.mode === "players" ? (
                <>
                  <Radio.Button value="rank">Rank</Radio.Button>
                  <Radio.Button value="alpha">Alphabetical</Radio.Button>
                  {!this.hasPlayerSeeds() && <Radio.Button value="seed">Seed</Radio.Button>}
                  {!this.state.hasTeams && this.state.hasGroups && (
                    <Radio.Button value="group">Group</Radio.Button>
                  )}
                  <Radio.Button value="country">Country</Radio.Button>
                  <Radio.Button value="reg">Reg Time</Radio.Button>
                </>
              ) : (
                <>
                  <Radio.Button value="alpha">Alphabetical</Radio.Button>
                  {this.hasTeamSeeds() && <Radio.Button value="seed">Seed</Radio.Button>}
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
                Optional link to a team flag (the dimensions should be 70x47)
                <Form.Item label="Custom flag" name="icon">
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

        <AddPlayerModal
          visible={this.state.modalVisible}
          loading={this.state.modalLoading}
          handleOk={this.handleAddPlayer}
          handleCancel={() => this.setState({ modalVisible: false })}
          onValuesChange={(changed, data) => this.setState({ addPlayerData: data })}
        />

        {this.isAdmin() && this.state.mode === "players" && (
          <div className="Players-admintool">
            <div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => this.setState({ modalVisible: true })}
              >
                Add Player
              </Button>
            </div>
            <div>
              <Button type="primary" icon={<DownloadOutlined />} onClick={this.exportPlayers}>
                Export to CSV
              </Button>
            </div>
            <div>
              <Button type="primary" icon={<ReloadOutlined />} onClick={this.refreshRanks}>
                Refresh Ranks
              </Button>

              {this.state.refreshPercent > -1 && (
                <div className="Players-progress">
                  <Progress percent={this.state.refreshPercent} />
                </div>
              )}
            </div>
            {this.state.flags.has("suiji") && (
              <div>
                <Button type="primary" onClick={this.assignSuijiSeeds}>
                  Assign Suiji Seeds
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="Players-container">
          {this.state.mode === "players"
            ? this.state.players.map((player) => {
                const stats = player.stats.filter((t) => t.tourney == this.props.tourney)[0];
                const extra =
                  stats && stats.seedName
                    ? `${stats.seedName} Seed (#${stats.seedNum})${
                        stats.group ? `, Group ${stats.group}` : ""
                      }`
                    : "";

                return (
                  <UserCard
                    canDelete={this.isAdmin()}
                    onDelete={this.handleDelete}
                    key={player.userid}
                    user={player}
                    canEdit={this.isAdmin() && this.hasPlayerSeeds()}
                    onEdit={this.handlePlayerEdit}
                    stats={stats}
                    rankRange={this.state.rankRange}
                    showGroups={this.state.hasGroups}
                    extra={extra}
                    flags={this.state.flags}
                  />
                );
              })
            : this.state.teams.map((team) => (
                <TeamCard
                  key={team._id}
                  isAdmin={this.isAdmin()}
                  onDelete={this.handleTeamDelete}
                  onEdit={this.handleTeamEdit}
                  showGroups={this.state.hasGroups}
                  flags={this.state.flags}
                  {...team}
                />
              ))}
        </div>
      </Content>
    );
  }
}

export default Players;
