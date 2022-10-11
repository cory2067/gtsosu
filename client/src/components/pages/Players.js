import React, { useState, useEffect, useMemo } from "react";
import "./Players.css";
import { get, hasAccess, delet, post, prettifyTourney, exportCSVFile } from "../../utilities";
import AddPlayerModal from "../modules/AddPlayerModal";
import CreateTeamModal from "../modules/CreateTeamModal";

import { PlusOutlined, ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import {
  Layout,
  Menu,
  Collapse,
  Input,
  Form,
  Button,
  Radio,
  Progress,
  Select,
  message,
} from "antd";
import UserCard from "../modules/UserCard";
import TeamCard from "../modules/TeamCard";
import moment from "moment";

const { Content } = Layout;
const { Panel } = Collapse;
const { Option } = Select;

function potentialTeamCounter({ flags, hasTeams, players }) {
  const [minPotentialTeams, setMinPotentialTeams] = useState(0);
  const [maxPotentialTeams, setMaxPotentialTeams] = useState(0);

  let isCountryBasedTeamTourney = false;
  if (!flags.has("suiji") && !flags.has("registerAsTeam")) {
    isCountryBasedTeamTourney = hasTeams;
  }

  const countPotentialTeams = () => {
    let countryPlayerCounts = {};
    players.forEach(player => {
      if (countryPlayerCounts[player.country]) {
        countryPlayerCounts[player.country] += 1;
      }
      else {
        countryPlayerCounts[player.country] = 1;
      }
    });

    let minPotentialTeams = 0;
    let maxPotentialTeams = 0;

    Object.keys(countryPlayerCounts).forEach(k => {
      if (countryPlayerCounts[k] >= 2) {
        minPotentialTeams += 1;
        maxPotentialTeams += 1;
        if (countryPlayerCounts[k] >= 7)
          maxPotentialTeams += 1;
      }
    });

    return {
      min: minPotentialTeams,
      max: maxPotentialTeams
    }
  }

  useMemo(() => {
    const potentialTeamCount = countPotentialTeams();
    setMinPotentialTeams(potentialTeamCount.min);
    setMaxPotentialTeams(potentialTeamCount.max);
  }, [players]);

  if (!isCountryBasedTeamTourney) return <></>;

  return <div style={{ marginTop: "var(--s)" }}>
    Potential teams: {minPotentialTeams} | Potential eligible countries: {maxPotentialTeams}
  </div>
}

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
      setRankRange([
        tourneyData.rankMin,
        tourneyData.rankMax !== -1 ? tourneyData.rankMax : Infinity,
      ]);
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
  };

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

  const sortedPlayers = (sortMethod, unsortedPlayers) => {
    const getRank = (p) => p.rank || Infinity;

    const sortFunctions = {
      alpha: (x, y) => (x.username.toLowerCase() < y.username.toLowerCase() ? -1 : 1),
      country: (x, y) => (x.country < y.country ? -1 : 1),
      group: (x, y) => ((getStats(x).group || "_") < (getStats(y).group || "_") ? -1 : 1),
      rank: (x, y) => getRank(x) - getRank(y),
      reg: (x, y) => getRegTime(x) - getRegTime(y),
      seed: (x, y) => (getStats(x).seedNum || getRank(x)) - (getStats(y).seedNum || getRank(y)),
    };

    const sortFn = sortFunctions[sortMethod];
    return [...unsortedPlayers].sort(sortFn);
  };

  const sortedTeams = (sortMethod, unsortedTeams) => {
    const sortFunctions = {
      alpha: (x, y) => (x.name.toLowerCase() < y.name.toLowerCase() ? -1 : 1),
      group: (x, y) => ((x.group || "_") < (y.group || "_") ? -1 : 1),
      rank: (x, y) =>
        x.players.reduce((sum, p) => sum + p.rank, 0) / x.players.length -
        y.players.reduce((sum, p) => sum + p.rank, 0) / y.players.length,
      seed: (x, y) => (x.seedNum || 0) - (y.seedNum || 0),
    };

    const sortFn = sortFunctions[sortMethod];
    return [...unsortedTeams].sort(sortFn);
  };

  const handleDelete = async (username) => {
    try {
      await delet("/api/player", { tourney: tourney, username });

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
      setPlayers(sortedPlayers("rank", players));
    } else {
      setMode("teams");
      setSort("alpha");
      setTeams(sortedTeams("alpha", teams));
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

      setTeams(sortedTeams(sort, [...teams, teamData]));
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

      setTeams(
        teams.map((t) => {
          if (t._id === _id) return newTeam;

          return t;
        })
      );
    } catch (e) {
      message.error(`Couldn't get team stats: ${e}`);
    }
  };

  const handlePlayerEdit = async (formData, _id) => {
    try {
      const newPlayers = await post("/api/player-stats", {
        tourney: tourney,
        playerStats: [{
          _id,
          stats: {
            ...formData,
            regTime: getStatsById(_id).regTime,
          },
        }],
      });

      setPlayers(
        players.map((t) => {
          if (t._id === _id) return newPlayers[0];

          return t;
        })
      );
    } catch (e) {
      message.error(`Something went wrong: ${e}`);
    }
  };

  const handleSortChange = (e) => {
    const sort = e.target.value;
    if (mode === "players") {
      setPlayers(sortedPlayers(sort, players));
    } else {
      setTeams(sortedTeams(sort, teams));
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

      setPlayers(sortedPlayers(sort, [...players, playerData]));
      setModalLoading(false);
      setModalVisible(false);

      message.success(`${playerData.username} added!`);
    } catch {
      setModalLoading(false);
      message.error("Player not found");
    }
  };

  const isAdmin = () => hasAccess(user, tourney, []);

  const refreshRanks = async () => {
    setRefreshPercent(0);

    let offset = 0;
    while (offset < players.length) {
      console.log(`Refreshing players at offset ${offset}`);
      const result = await post("/api/refresh", { tourney: tourney, offset });
      offset = result.offset;
      setPlayers(
        sortedPlayers(
          sort,
          players.map((p) => {
            const newPlayer = result.players.filter((r) => r._id === p._id)[0];
            return newPlayer || p;
          })
        )
      );
      setRefreshPercent(Math.min(100, Math.round((100 * offset) / players.length)));
    }
  };

  const exportPlayers = () => {
    const header = "Username,User ID,Country,Rank,Discord Username,Timezone";
    const body = players
      .map((p) => `${p.username},${p.userid},${p.country},${p.rank},"${p.discord}",${p.timezone}`)
      .join("\n");

    exportCSVFile({
      header,
      body,
      fileName: `players-${tourney}.csv`,
    });
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
          {hasTeams && <Menu.Item key="teams">Teams ({teams.length})</Menu.Item>}
        </Menu>

        <div style={{ flexDirection: "column" }}>
          <div style={{ flexDirection: "row" }}>
            <span className="Players-sort">Sort by:</span>
            <Radio.Group value={sort} onChange={handleSortChange}>
              {mode === "players" ? (
                <>
                  <Radio.Button value="rank">Rank</Radio.Button>
                  <Radio.Button value="alpha">Alphabetical</Radio.Button>
                  {!hasPlayerSeeds() && <Radio.Button value="seed">Seed</Radio.Button>}
                  {!hasTeams && hasGroups && <Radio.Button value="group">Group</Radio.Button>}
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
          {potentialTeamCounter({ flags, hasTeams, players })}
        </div>
      </div>

      {mode === "teams" && isAdmin() && (
        <Collapse>
          <Panel header={`Add new team`} key="1">
            Add all player names, with the captain's name first.
            <Form name="basic" onFinish={onFinish}>
              <Form.Item label="Players" name="players">
                <Select mode="multiple" showSearch allowClear placeholder="Select players">
                  {sortedPlayers("alpha", players).map((playerItem, playerIndex) => (
                    <Select.Option value={playerItem.username} key={playerIndex}>
                      {playerItem.username}
                    </Select.Option>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
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
                ? `${stats.seedName} Seed (#${stats.seedNum})${stats.group ? `, Group ${stats.group}` : ""
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
          availablePlayers={sortedPlayers("alpha", players)}
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
