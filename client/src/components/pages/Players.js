import React, { useState, useEffect } from "react";
import "../../utilities.css";
import "./Players.css";
import { get, hasAccess, delet, post, prettifyTourney } from "../../utilities";
import AddPlayerModal from "../modules/AddPlayerModal";
import CreateTeamModal from "../modules/CreateTeamModal";

import { PlusOutlined, ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import { Layout, Menu, Collapse, Input, Form, Button, Radio, Progress, Select, message } from "antd";
import UserCard from "../modules/UserCard";
import TeamCard from "../modules/TeamCard";
import moment from "moment";

const { Content } = Layout;
const { Panel } = Collapse;
const { Option } = Select;

export default function Players({ tourney, user }) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [hasTeams, setHasTeams] = useState(false);
  const [hasGroups, setHasGroups] = useState(false);
  const [sort, setSort] = useState("rank");
  const [mode, setMode] = useState("players");
  const [refreshPercent, setRefreshPercent] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [addPlayerData, setAddPlayerData] = useState({});
  const [flags, setFlags] = useState(new Set());
  const [editingTeam, setEditingTeam] = useState(-1);
  const [rankRange, setRankRange] = useState(0);

  const fetchPlayers = async () => {
    try {
      const [playersData, tourneyData] = await Promise.all([
        get("/api/players", { tourney: tourney }),
        get("/api/tournament", { tourney: tourney }),
      ]);

      setPlayers(playersData);
      setHasTeams(tourneyData.teams);
      setHasGroups(tourneyData.stages.some((s) => s.name === "Group Stage"));
      setRankRange([tourneyData.rankMin, tourneyData.rankMax !== -1 ? tourneyData.rankMax : Infinity]);
      setFlags(new Set(tourneyData.flags || []));

      if (tourneyData.teams) {
        try {
          const teamsData = await get("/api/teams", { tourney: tourney });
          setTeams(teamsData);
        } catch {
          return message.error("Something went wrong, failed to fetch team data.");
        }
      }
    } catch {
      message.error("Something went wrong, failed to fetch data.");
    }
  }

  useEffect(() => {
    document.title = `${prettifyTourney(tourney)}: Players`;

    fetchPlayers();
  }, []);

  const getStats = (player) => {
    const stats = player.stats.filter((s) => s.tourney === tourney)[0];
    return stats || {};
  };

  const getStatsById = (_id) => {
    const player = players.filter((p) => p._id === _id)[0];
    if (player) return getStats(player);
    return {};
  };

  const getRegTime = (player) => {
    const regTime = getStats(player).regTime;
    if (regTime) return moment(regTime).unix();
    return -1;
  };

  const sortPlayers = (sortType) => {
    const playersData = [...players];

    const getRank = (p) => p.rank || Infinity;

    switch (sortType) {
      case "rank":
        setPlayers(playersData.sort((x, y) => getRank(x) - getRank(y)));
        break;
      case "seed":
        setPlayers(playersData.sort(
          (x, y) =>
            (getStats(x).seedNum || getRank(x)) - (getStats(y).seedNum || getRank(y)))
        );
        break;
      case "group":
        setPlayers(playersData.sort((x, y) =>
          (getStats(x).group || "_") < (getStats(y).group || "_") ? -1 : 1
        ));
        break;
      case "alpha":
        setPlayers(playersData.sort((x, y) => (x.username.toLowerCase() < y.username.toLowerCase() ? -1 : 1)));
        break;
      case "country":
        setPlayers(playersData.sort((x, y) => (x.country < y.country ? -1 : 1)));
        break;
      case "reg":
        setPlayers(playersData.sort((x, y) => getRegTime(x) - getRegTime(y)));
        break;
      default:
        message.error("Failed to sort players");
    }

    return { playersData };
  }

  const sortTeams = (sort) => {
    const teamsData = [...teams];

    switch(sort) {
      case "alpha":
        setTeams(teamsData.sort((x, y) => (x.name.toLowerCase() < y.name.toLowerCase() ? -1 : 1)));
        break;
      case "seed":
        setTeams(teamsData.sort((x, y) => (x.seedNum || 0) - (y.seedNum || 0)));
        break;
      case "group":
        setTeams(teamsData.sort((x, y) => ((x.group || "_") < (y.group || "_") ? -1 : 1)));
        break;
      case "rank":
        teamsData.sort(
          (x, y) =>
            x.players.reduce((sum, p) => sum + p.rank, 0) / x.players.length -
            y.players.reduce((sum, p) => sum + p.rank, 0) / y.players.length
        );
        break;
      default:
      return message.error("Failed to sort teams");
    }

    return { teamsData };
  }

  const handleDelete = async (username) => {
    try{
      await delet("/api/player", { tourney: tourney, username })

      setPlayers(players.filter((p) => p.username !== username));
      message.success("Player deleted!");
    } catch {
      message.error("Something went wrong, failed to delete player.");
    }
  };

  const handleTeamDelete = async (_id) => {
    try {
      await delet("/api/team", { tourney: tourney, _id });

      setTeams(teams.filter((p) => p._id !== _id));
    } catch {
      message.error("Something went wrong, failed to delete team.");
    }
  };

  const handleModeChange = (e) => {
    if (e.key === "players") {
      setMode("players");
      setSort("rank");
      sortPlayers("rank");
    } else {
      setMode("teams");
      setSort("alpha");
      sortTeams("alpha");
    }
  };

  const onFinish = async (formData) => {
    setLoading(true);

    try {
      const teamData = await post("/api/team", {
        players: formData.players,
        name: formData.name,
        tourney: tourney,
        icon: formData.icon,
      });

      setTeams([...teams, teamData]);
      setLoading(false);
      message.success(`Added team ${formData.name}`);
    } catch (e) {
      message.error("Couldn't create this team. Make sure all team members are spelled correctly");
    }
  };

  const handleTeamEdit = async (team) => {
    setLoading(true);
    const _id = editingTeam;

    try {
      const newTeam = await post("/api/edit-team", {
        ...team,
        _id,
        tourney: tourney,
      });

      setTeams(
        teams.map((t) => {
          if (t._id === _id) return newTeam;

          return t;
        })
      );
      message.success("Team edited succesfully!");
    } catch (e) {
      message.error(`Couldn't update team: ${e}`);
    }

    setLoading(false);
    setEditingTeam(-1);
  };

  const handleTeamEditStats = async (formData, _id) => {
    try {
      const newTeam = await post("/api/team-stats", {
        ...formData,
        _id,
        tourney: tourney,
      });

      setTeams((t) => {
        if (t._id === _id) return newTeam;

        return t;
      })
    } catch {
      message.error(`Couldn't get team stats: ${e}`);
    }
  };

  const handlePlayerEdit = async (formData, _id) => {
    try {
      const newPlayer = await post("/api/player-stats", {
        ...formData,
        _id,
        tourney: tourney,
        regTime: getStatsById(_id).regTime,
      });

      setPlayers(players.map((t) => {
        if (t._id === _id) return newPlayer;

        return t;
      }));
    } catch {
      message.error(`Something went wrong: ${e}`);
    }
  };

  const handleSortChange = (e) => {
    const sort = e.target.value;
    if (mode === "players") {
      sortPlayers(sort);
    } else {
      sortTeams(sort);
    }

    setSort(sort);
  };

  const handleAddPlayer = async () => {
    setModalLoading(true);

    try {
      const playerData = await post("/api/force-register", {
        ...addPlayerData,
        tourney: tourney,
      });

      setPlayers([...players, playerData]),
      setModalLoading(false);
      setModalVisible(false);

      message.success(`${playerData.username} added!`);
    } catch {
      setModalLoading(false);
      message.error('Player not found');
    }

    sortPlayers(sort);
  };

  const isAdmin = () => hasAccess(user, tourney, []);

  const refreshRanks = async () => {
    setRefreshPercent(0);

    let offset = 0;
    while (offset < players.length) {
      console.log(`Refreshing players at offset ${offset}`);
      const result = await post("/api/refresh", { tourney: tourney, offset });
      offset = result.offset;

      setPlayers(players.map((p) => {
        const newPlayer = result.players.filter((r) => r._id === p._id)[0];
        return newPlayer || p;
      }));
      setRefreshPercent(Math.min(100, Math.round((100 * offset) / players.length)));
      sortPlayers(sort);
    }
  };

  const exportPlayers = () => {
    const header = "Username,User ID,Country,Rank,Discord Username,Timezone";
    const body = players
      .map((p) => `${p.username},${p.userid},${p.country},${p.rank},"${p.discord}",${p.timezone}`)
      .join("\n");
    console.log(body);

    const dl = document.createElement("a");
    dl.href = "data:text/csv;chartset=utf-8," + encodeURIComponent(`${header}\n${body}`);
    console.log(dl.href);
    dl.target = "_blank";
    dl.download = `players-${tourney}.csv`;
    dl.click();
  };

  // suiji is special, since it's has seeds by both player and by team
  const hasPlayerSeeds = () => !hasTeams || flags.has("suiji");
  const hasTeamSeeds = () => hasTeams || flags.has("suiji");

  const assignSuijiSeeds = async () => {
    const players = [...players].sort((x, y) => x.rank - y.rank);
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
      await handlePlayerEdit({ seedName: getSeedName(index), seedNum: index + 1 }, player._id);

      setRefreshPercent(Math.min(100, Math.round((100 * (index + 1)) / players.length)));
    }
  };

    return (
      <Content className="content">
        <div className="Players-topbar">
          <Menu
            mode="horizontal"
            className="Players-mode-select"
            onClick={handleModeChange}
            selectedKeys={[mode]}
          >
            <Menu.Item key="players">Players ({players.length})</Menu.Item>
            {hasTeams && (
              <Menu.Item key="teams">Teams ({teams.length})</Menu.Item>
            )}
          </Menu>

          <div>
            <span className="Players-sort">Sort by:</span>
            <Radio.Group value={sort} onChange={handleSortChange}>
              {mode === "players" ? (
                <>
                  <Radio.Button value="rank">Rank</Radio.Button>
                  <Radio.Button value="alpha">Alphabetical</Radio.Button>
                  {!hasPlayerSeeds() && <Radio.Button value="seed">Seed</Radio.Button>}
                  {!hasTeams && hasGroups && (
                    <Radio.Button value="group">Group</Radio.Button>
                  )}
                  <Radio.Button value="country">Country</Radio.Button>
                  <Radio.Button value="reg">Reg Time</Radio.Button>
                </>
              ) : (
                <>
                  <Radio.Button value="alpha">Alphabetical</Radio.Button>
                  {hasTeamSeeds() && <Radio.Button value="seed">Seed</Radio.Button>}
                  <Radio.Button value="group">Group</Radio.Button>
                  <Radio.Button value="rank">Avg Rank</Radio.Button>
                </>
              )}
            </Radio.Group>
          </div>
        </div>

        {mode === "teams" && isAdmin() && (
          <Collapse>
            <Panel header={`Add new team`} key="1">
              Type all player names separated by commas, with the captain's name first.
              <Form name="basic" onFinish={onFinish}>
                <Form.Item label="Players" name="players">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Select players"
                  >
                    {players.map((playerItem, playerIndex) => (
                      <Option value={playerItem.username} key={playerIndex}>{playerItem.username}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Team Name" name="name">
                  <Input />
                </Form.Item>
                Optional link to a team flag (the dimensions should be 70x47)
                <Form.Item label="Custom flag" name="icon">
                  <Input />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Add
                  </Button>
                </Form.Item>
              </Form>
            </Panel>
          </Collapse>
        )}

        <AddPlayerModal
          title="Force player registration"
          visible={modalVisible}
          loading={modalLoading}
          handleOk={handleAddPlayer}
          handleCancel={() => setModalVisible(false)}
          onValuesChange={(changed, data) => setAddPlayerData(data)}
        />

        {isAdmin() && mode === "players" && (
          <div className="Players-admintool">
            <div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
              >
                Add Player
              </Button>
            </div>
            <div>
              <Button type="primary" icon={<DownloadOutlined />} onClick={exportPlayers}>
                Export to CSV
              </Button>
            </div>
            <div>
              <Button type="primary" icon={<ReloadOutlined />} onClick={refreshRanks}>
                Refresh Ranks
              </Button>

              {refreshPercent > -1 && (
                <div className="Players-progress">
                  <Progress percent={refreshPercent} />
                </div>
              )}
            </div>
            {flags.has("suiji") && (
              <div>
                <Button type="primary" onClick={assignSuijiSeeds}>
                  Assign Suiji Seeds
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="Players-container">
          {mode === "players"
            ? players.map((player) => {
                const stats = player.stats.filter((t) => t.tourney == tourney)[0];
                const extra =
                  stats && stats.seedName
                    ? `${stats.seedName} Seed (#${stats.seedNum})${
                        stats.group ? `, Group ${stats.group}` : ""
                      }`
                    : "";

                return (
                  <UserCard
                    canDelete={isAdmin()}
                    onDelete={handleDelete}
                    key={player.userid}
                    user={player}
                    canEdit={isAdmin() && hasPlayerSeeds()}
                    onEdit={handlePlayerEdit}
                    stats={stats}
                    rankRange={rankRange}
                    showGroups={hasGroups}
                    extra={extra}
                    flags={flags}
                  />
                );
              })
            : teams.map((team) => (
                <TeamCard
                  key={team._id}
                  isAdmin={isAdmin()}
                  onDelete={handleTeamDelete}
                  onEditStats={handleTeamEditStats}
                  onEdit={(id) => setEditingTeam(id)}
                  showGroups={hasGroups}
                  flags={flags}
                  {...team}
                />
              ))}
        </div>
        {editingTeam != -1 && (
          <CreateTeamModal
            initialTeam={teams.filter((t) => t._id == editingTeam)[0]}
            shouldEdit={true}
            visible={true}
            user={user}
            loading={loading}
            handleSubmit={handleTeamEdit}
            handleCancel={() => setEditingTeam(-1)}
          />
        )}
      </Content>
    );
}