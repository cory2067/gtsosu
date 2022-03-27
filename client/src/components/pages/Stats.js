import React, { useState, useEffect } from "react";
import "../../utilities.css";
import "./Stats.css";
import { get, post, prettifyTourney, hasAccess, getStage } from "../../utilities";
import { Layout, Table, Menu, Form, Switch, message, Button, InputNumber } from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
const { Content } = Layout;
const { Column, ColumnGroup } = Table;
import AddPlayerModal from "../modules/AddPlayerModal";
import FlagIcon from "../modules/FlagIcon";
import StageSelector from "../modules/StageSelector";

export default function Stats({ tourney, user }) {
  const [state, setState] = useState({
    tourneyModel: undefined,
    players: new Map(),
    teams: new Map(),
    stageMaps: [],
    stageStats: undefined,
    processedStats: new Map(),
    overallPlayerStats: [],
    overallTeamStats: [],
    playerModStats: [],
    teamModStats: [],
    currentSelectedMapId: "0",
    currentSelectedStage: undefined,
    currentSelectedTable: "player",
    inEditMode: false,
    stageStatsEdit: undefined,
    refetchData: false,
    recalculateStats: false,
    refetchDataInProgress: false,
  });

  const calculateStats = () => {
    if (!state.stageMaps || !state.stageStats) return;

    let overallPlayerStats = new Map();
    let overallTeamStats = new Map();
    let playerModStats = new Map();
    let teamModStats = new Map();
    const processedStats = new Map();
    // Show empty tables instead of no tables at all if there is no data
    state.stageMaps.map((stageMap) =>
      processedStats.set(String(stageMap.mapId), {
        mapId: stageMap.mapId,
        playerScores: [],
        teamScores: [],
      })
    );

    // process, sort, and rank the stats for each map, while tracking overall stats
    for (const mapStats of state.stageStats.maps || []) {
      const mod = state.stageMaps.find((stageMap) => stageMap.mapId === mapStats.mapId).mod;
      const sortedPlayerScores = [...mapStats.playerScores].sort((a, b) => b.score - a.score);
      const sortedTeamScores = [...mapStats.teamScores].sort((a, b) => b.score - a.score);
      const processedPlayerScores = [];
      const processedTeamScores = [];

      let currentRank = 1;
      let currentScore;
      for (let i = 0; i < sortedPlayerScores.length; i++) {
        const playerScore = sortedPlayerScores[i];
        if (!currentScore || playerScore.score < currentScore) {
          currentRank = i + 1;
          currentScore = playerScore.score;
        }
        processedPlayerScores.push({ ...playerScore, rank: currentRank });

        if (!overallPlayerStats.has(playerScore.userId)) {
          overallPlayerStats.set(playerScore.userId, { rankTotal: 0, scoreTotal: 0 });
        }
        overallPlayerStats.get(playerScore.userId).rankTotal += currentRank;
        overallPlayerStats.get(playerScore.userId).scoreTotal += currentScore;

        if (!playerModStats.has(mod)) {
          playerModStats.set(mod, new Map());
        }
        if (!playerModStats.get(mod).has(playerScore.userId)) {
          playerModStats.get(mod).set(playerScore.userId, { rankTotal: 0, scoreTotal: 0 });
        }
        playerModStats.get(mod).get(playerScore.userId).rankTotal += currentRank;
        playerModStats.get(mod).get(playerScore.userId).scoreTotal += currentScore;
      }

      currentRank = 1;
      currentScore = undefined;
      for (let i = 0; i < sortedTeamScores.length; i++) {
        const teamScore = sortedTeamScores[i];
        if (!currentScore || teamScore.score < currentScore) {
          currentRank = i + 1;
          currentScore = teamScore.score;
        }
        processedTeamScores.push({ ...teamScore, rank: currentRank });

        if (!overallTeamStats.has(teamScore.teamName)) {
          overallTeamStats.set(teamScore.teamName, { rankTotal: 0, scoreTotal: 0 });
        }
        overallTeamStats.get(teamScore.teamName).rankTotal += currentRank;
        overallTeamStats.get(teamScore.teamName).scoreTotal += currentScore;

        if (!teamModStats.has(mod)) {
          teamModStats.set(mod, new Map());
        }
        if (!teamModStats.get(mod).has(teamScore.teamName)) {
          teamModStats.get(mod).set(teamScore.teamName, { rankTotal: 0, scoreTotal: 0 });
        }
        teamModStats.get(mod).get(teamScore.teamName).rankTotal += currentRank;
        teamModStats.get(mod).get(teamScore.teamName).scoreTotal += currentScore;
      }

      processedStats.set(String(mapStats.mapId), {
        ...mapStats,
        playerScores: processedPlayerScores,
        teamScores: processedTeamScores,
      });
    }

    const compareStatsFn = (a, b) =>
      a.rankTotal === b.rankTotal ? b.scoreTotal - a.scoreTotal : a.rankTotal - b.rankTotal;

    // sort and rank overall stats
    overallPlayerStats = Array.from(overallPlayerStats.entries())
      .map(([userId, stats]) => ({ ...stats, userId }))
      .sort(compareStatsFn);
    const overallPlayerStatsWithRank = [];
    for (let i = 0; i < overallPlayerStats.length; i++) {
      overallPlayerStatsWithRank.push({ ...overallPlayerStats[i], rank: i + 1 });
    }

    overallTeamStats = Array.from(overallTeamStats.entries())
      .map(([teamName, stats]) => ({ ...stats, teamName }))
      .sort(compareStatsFn);
    const overallTeamStatsWithRank = [];
    for (let i = 0; i < overallTeamStats.length; i++) {
      overallTeamStatsWithRank.push({ ...overallTeamStats[i], rank: i + 1 });
    }

    for (let mod of playerModStats.keys()) {
      const sortedModRankings = Array.from(playerModStats.get(mod).entries())
        .map(([userId, stats]) => ({ ...stats, userId }))
        .sort(compareStatsFn);
      playerModStats.set(mod, sortedModRankings);
    }

    for (let mod of teamModStats.keys()) {
      const sortedModRankings = Array.from(teamModStats.get(mod).entries())
        .map(([teamName, stats]) => ({ ...stats, teamName }))
        .sort(compareStatsFn);
      teamModStats.set(mod, sortedModRankings);
    }

    setState({
      ...state,
      processedStats,
      overallPlayerStats: overallPlayerStatsWithRank,
      overallTeamStats: overallTeamStatsWithRank,
      playerModStats,
      teamModStats,
      recalculateStats: false,
    });
  };

  const fetchData = async () => {
    if (state.refetchDataInProgress) return;
    setState({ ...state, refetchDataInProgress: true });

    const [tourneyModel, currentSelectedStage] = await getStage(tourney);

    const [players, teams, stageMaps, stageStats] = await Promise.all([
      get("/api/players", { tourney }),
      tourneyModel.teams ? get("/api/teams", { tourney }) : Promise.resolve([]),
      get("/api/maps", { tourney, stage: currentSelectedStage.name }).catch((e) => []),
      get("/api/stage-stats", { tourney, stage: currentSelectedStage.name }).catch((e) => ({})),
    ]);

    setState({
      ...state,
      tourneyModel,
      players: new Map(players.map((player) => [player.userid, player])),
      teams: new Map(teams.map((team) => [team.name, team])),
      stageMaps,
      stageStats: stageStats || {},
      currentSelectedStage,
      currentSelectedTable: tourneyModel.teams ? "team" : "player",
      refetchData: false,
      recalculateStats: true,
      refetchDataInProgress: false,
    });
  };

  useEffect(() => {
    document.title = `${prettifyTourney(tourney)}: Stats`;
    if (!state.tourneyModel || state.refetchData) {
      fetchData();
    }
    if (state.recalculateStats) {
      calculateStats();
    }
  }, [state]);

  const isAdmin = () => hasAccess(user, tourney, []);

  const toggleStatsVisibility = async (visible) => {
    const index = state.currentSelectedStage.index;
    const tourneyModel = await post("/api/stage", {
      tourney,
      stage: { ...state.currentSelectedStage, statsVisible: visible },
      index,
    });
    setState({
      ...state,
      tourneyModel,
      currentSelectedStage: { ...tourneyModel.stages[index], index },
    });
    message.success("Updated stats visibility");
  };

  const toggleEditMode = async () => {
    const stageStatsCopy = JSON.parse(JSON.stringify(state.stageStats));
    setState({ ...state, inEditMode: !state.inEditMode, stageStatsEdit: stageStatsCopy });
  };

  const submitEditedStageStats = async () => {
    const updatedStats = await post("/api/stage-stats", { tourney, stats: state.stageStatsEdit });
    setState({
      ...state,
      stageStats: updatedStats,
      inEditMode: false,
      stageStatsEdit: undefined,
      recalculateStats: true,
    });
  };

  const editTeamScore = async (teamName, newScore) => {
    const updated = { ...state.stageStatsEdit };
    updated.maps
      .find((mapStats) => String(mapStats.mapId) === state.currentSelectedMapId)
      .teamScores.find((teamScore) => teamScore.teamName === teamName).score = newScore;
    setState({ ...state, stageStatsEdit: updated });
  };

  const removeTeamScore = async (teamName) => {
    const updated = { ...state.stageStatsEdit };
    const mapStats = updated.maps.find(
      (mapStats) => String(mapStats.mapId) === state.currentSelectedMapId
    );
    mapStats.teamScores = mapStats.teamScores.filter(
      (teamScore) => teamScore.teamName !== teamName
    );
    setState({ ...state, stageStatsEdit: updated });
  };

  const addTeamScore = async () => {
    const theTeam = Array.from(state.teams.values()).find(
      (team) => team.name === state.addPlayerData
    );
    if (!theTeam) return message.error("Team not found");

    const exists = state.stageStatsEdit.maps
      .find((mapStats) => String(mapStats.mapId) === state.currentSelectedMapId)
      .teamScores.find((teamScore) => teamScore.teamName === theTeam.name);
    if (exists) return message.error("Team score already exists");

    const updated = { ...state.stageStatsEdit };
    const mapStats = updated.maps.find(
      (mapStats) => String(mapStats.mapId) === state.currentSelectedMapId
    );
    mapStats.teamScores = [...mapStats.teamScores, { teamName: theTeam.name, score: 0 }];
    setState({ ...state, stageStatsEdit: updated, addPlayerModalVisible: false });
  };

  const editPlayerScore = async (userId, newScore) => {
    const updated = { ...state.stageStatsEdit };
    updated.maps
      .find((mapStats) => String(mapStats.mapId) === state.currentSelectedMapId)
      .playerScores.find((playerScore) => playerScore.userId === userId).score = newScore;
    setState({ ...state, stageStatsEdit: updated });
  };

  const removePlayerScore = async (userId) => {
    const updated = { ...state.stageStatsEdit };
    const mapStats = updated.maps.find(
      (mapStats) => String(mapStats.mapId) === state.currentSelectedMapId
    );
    mapStats.playerScores = mapStats.playerScores.filter(
      (playerScore) => playerScore.userId !== userId
    );
    setState({ ...state, stageStatsEdit: updated });
  };

  const addPlayerScore = async () => {
    const thePlayer = Array.from(state.players.values()).find(
      (player) => player.username === state.addPlayerData
    );
    if (!thePlayer) return message.error("Player not found or not registered");

    const exists = state.stageStatsEdit.maps
      .find((mapStats) => String(mapStats.mapId) === state.currentSelectedMapId)
      .playerScores.find((playerScore) => String(playerScore.userId) === thePlayer.userid);
    if (exists) return message.error("Player score already exists");

    const updated = { ...state.stageStatsEdit };
    const mapStats = updated.maps.find(
      (mapStats) => String(mapStats.mapId) === state.currentSelectedMapId
    );
    mapStats.playerScores = [
      ...mapStats.playerScores,
      { userId: Number(thePlayer.userid), score: 0 },
    ];
    setState({ ...state, stageStatsEdit: updated, addPlayerModalVisible: false });
  };

  const exportToJson = () => {
    const teams = [];
    for (let teamStats of state.tourneyModel.teams
      ? state.overallTeamStats
      : state.overallPlayerStats) {
      const seedingResults = [];
      // assuming this is in correct mod order
      for (let stageMap of state.stageMaps) {
        const teamScore = state.processedStats
          .get(String(stageMap.mapId))
          .teamScores.find((teamScore) => teamScore.teamName === teamStats.teamName);
        if (!teamScore) continue;
        const beatmap = {
          ID: stageMap.mapId,
          BeatmapInfo: {
            Metadata: {
              Title: stageMap.title,
              Artist: stageMap.artist,
            },
          },
          Score: teamScore.score,
          Seed: teamScore.rank,
        };
        const theSeedingResultsMod = seedingResults.find(
          (seedingResultsMod) => seedingResultsMod.Mod === stageMap.mod
        );
        if (!theSeedingResultsMod) {
          seedingResults.push({
            Mod: stageMap.mod,
            Seed:
              state.teamModStats
                .get(stageMap.mod)
                .findIndex((stats) => stats.teamName === teamStats.teamName) + 1,
            Beatmaps: [beatmap],
          });
        } else {
          theSeedingResultsMod.Beatmaps.push(beatmap);
        }
      }
      const theTeam = state.teams.get(teamStats.teamName);
      teams.push({
        FullName: teamStats.teamName,
        Acronym: teamStats.teamName.substring(0, 3),
        FlagName: theTeam.players[0].country,
        SeedingResults: seedingResults,
        Seed: `#${teamStats.rank}`,
        LastYearPlacing: 1,
        Players: theTeam.players.map((player) => ({ id: player.userid })),
      });
    }

    const dl = document.createElement("a");
    dl.href =
      "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify({ Teams: teams }));
    dl.target = "_blank";
    dl.download = `bracket-${tourney}.json`;
    dl.click();
  };

  const getMapStats = (stageStats) => {
    return state.inEditMode
      ? state.stageStatsEdit.maps.find(
          (stageStats) => String(stageStats.mapId) === state.currentSelectedMapId
        )
      : state.processedStats.get(state.currentSelectedMapId);
  };

  const getTeamLabel = (teamName) => {
    const theTeam = state.teams.get(teamName);
    if (theTeam) {
      return (
        <div>
          <FlagIcon size={16} customIcon={theTeam.icon} code={theTeam.country} /> {teamName}
        </div>
      );
    } else return teamName;
  };

  const getPlayerLabel = (userId) => {
    const thePlayer = state.players.get(String(userId));
    if (thePlayer) {
      return (
        <div>
          <FlagIcon size={16} code={thePlayer.country} /> {thePlayer.username}
        </div>
      );
    } else return userId;
  };

  const getAverageTeamScore = () => {
    let teamScores = [];
    if (state.currentSelectedMapId === "0") {
      teamScores = state.overallTeamStats.map((teamScore) => teamScore.scoreTotal);
    } else {
      teamScores = (state.processedStats.get(state.currentSelectedMapId)?.teamScores || []).map(
        (teamScore) => teamScore.score
      );
    }
    return Math.round(teamScores.reduce((a, b) => a + b, 0) / teamScores.length) || 0;
  };

  const getAveragePlayerScore = () => {
    let playerScores = [];
    if (state.currentSelectedMapId === "0") {
      playerScores = state.overallPlayerStats.map((playerScore) => playerScore.scoreTotal);
    } else {
      playerScores = (state.processedStats.get(state.currentSelectedMapId)?.playerScores || []).map(
        (playerScore) => playerScore.score
      );
    }
    return Math.round(playerScores.reduce((a, b) => a + b, 0) / playerScores.length) || 0;
  };

  const getTeamSeed = (rank) => {
    const rangeSize = Math.pow(2, Math.floor(Math.log2(state.overallTeamStats.length))) / 4;
    return Math.ceil(rank / rangeSize);
  };

  const getPlayerSeed = (rank) => {
    const rangeSize = Math.pow(2, Math.floor(Math.log2(state.overallPlayerStats.length))) / 4;
    return Math.ceil(rank / rangeSize);
  };

  return (
    <Content className="content">
      <div className="u-flex">
        <div className="u-sidebar">
          {state.currentSelectedStage && (
            <StageSelector
              selected={state.currentSelectedStage.index}
              onClick={({ key }) =>
                String(state.currentSelectedStage.index) !== key
                  ? setState({ ...state, refetchData: true })
                  : {}
              }
              stages={state.tourneyModel.stages}
            />
          )}
        </div>

        <div>
          {state.currentSelectedStage && isAdmin() && (
            <div className="stats-settings">
              {!state.inEditMode && (
                <Form layout="inline">
                  <Form.Item label="Stats Visible" valuePropName="checked">
                    <Switch
                      checked={state.currentSelectedStage.statsVisible || false}
                      onClick={toggleStatsVisibility}
                    />
                  </Form.Item>
                  <Button className="settings-button" type="primary" onClick={toggleEditMode}>
                    Edit
                  </Button>
                  <Button className="settings-button" type="primary" onClick={exportToJson}>
                    Export to JSON
                  </Button>
                </Form>
              )}
              {state.inEditMode && (
                <Form layout="inline">
                  <Button
                    className="settings-button"
                    type="primary"
                    onClick={submitEditedStageStats}
                  >
                    Save
                  </Button>
                  <Button
                    className="settings-button"
                    type="primary"
                    onClick={() => setState({ ...state, inEditMode: !state.inEditMode })}
                  >
                    Cancel
                  </Button>
                  {state.tourneyModel.teams && state.currentSelectedMapId !== "0" && (
                    <Button
                      className="settings-button"
                      type="primary"
                      onClick={() =>
                        setState({ ...state, addTeamScore: true, addPlayerModalVisible: true })
                      }
                    >
                      Add team score
                    </Button>
                  )}
                  {state.currentSelectedMapId !== "0" && (
                    <Button
                      className="settings-button"
                      type="primary"
                      onClick={() =>
                        setState({ ...state, addTeamScore: false, addPlayerModalVisible: true })
                      }
                    >
                      Add player score
                    </Button>
                  )}
                </Form>
              )}
            </div>
          )}

          {state.tourneyModel?.teams && (
            <div className="topbar">
              <Menu
                mode="horizontal"
                onClick={(e) => setState({ ...state, currentSelectedTable: e.key })}
                selectedKeys={[state.currentSelectedTable]}
              >
                <Menu.Item key="team">Team Rankings</Menu.Item>
                <Menu.Item key="player">Player Rankings</Menu.Item>
              </Menu>
            </div>
          )}

          <div className="topbar">
            <Menu
              mode="horizontal"
              onClick={(e) => setState({ ...state, currentSelectedMapId: e.key })}
              selectedKeys={[state.currentSelectedMapId]}
            >
              <Menu.Item key="0">Overall</Menu.Item>
              {state.stageMaps &&
                state.stageMaps.map((stageMap) => (
                  <Menu.Item key={stageMap.mapId}>{`${stageMap.mod}${stageMap.index}`}</Menu.Item>
                ))}
            </Menu>
          </div>

          <div>
            {state.currentSelectedStage && state.currentSelectedMapId === "0" && (
              <div className="tables-container">
                {state.currentSelectedTable === "team" && (
                  <Table
                    dataSource={
                      (isAdmin() || state.currentSelectedStage.statsVisible) &&
                      state.overallTeamStats
                    }
                    pagination={false}
                    className="map-stats-table"
                    bordered
                    rowClassName={(teamScore) =>
                      state.currentSelectedStage.name === "Qualifiers"
                        ? `seed-${getTeamSeed(teamScore.rank)}`
                        : ""
                    }
                  >
                    <ColumnGroup title={"Average Score Total: " + getAverageTeamScore()}>
                      <Column title="Rank" dataIndex="rank" key="rank" render={(rank) => rank} />
                      <Column
                        title="Team"
                        dataIndex="teamName"
                        key="teamName"
                        render={(teamName) => getTeamLabel(teamName)}
                      />
                      <Column
                        title="Rank Total"
                        dataIndex="rankTotal"
                        key="rankTotal"
                        render={(rankTotal) => rankTotal}
                      />
                      <Column
                        title="Rank Average"
                        dataIndex="rankTotal"
                        key="rankTotal"
                        render={(rankTotal) => (rankTotal / state.stageMaps.length).toFixed(2)}
                      />
                      <Column
                        title="Score Total"
                        dataIndex="scoreTotal"
                        key="scoreTotal"
                        render={(scoreTotal) => scoreTotal}
                      />
                    </ColumnGroup>
                  </Table>
                )}
                {state.currentSelectedTable === "player" && (
                  <Table
                    dataSource={
                      (isAdmin() || state.currentSelectedStage.statsVisible) &&
                      state.overallPlayerStats
                    }
                    pagination={false}
                    className="map-stats-table"
                    bordered
                    rowClassName={(playerScore) =>
                      state.currentSelectedStage.name === "Qualifiers"
                        ? `seed-${getPlayerSeed(playerScore.rank)}`
                        : ""
                    }
                  >
                    <ColumnGroup title={"Average Score Total: " + getAveragePlayerScore()}>
                      <Column title="Rank" dataIndex="rank" key="rank" render={(rank) => rank} />
                      <Column
                        title="Player"
                        dataIndex="userId"
                        key="userId"
                        render={(userId) => getPlayerLabel(userId)}
                      />
                      <Column
                        title="Rank Total"
                        dataIndex="rankTotal"
                        key="rankTotal"
                        render={(rankTotal) => rankTotal}
                      />
                      <Column
                        title="Rank Average"
                        dataIndex="rankTotal"
                        key="rankTotal"
                        render={(rankTotal) => (rankTotal / state.stageMaps.length).toFixed(2)}
                      />
                      <Column
                        title="Score Total"
                        dataIndex="scoreTotal"
                        key="scoreTotal"
                        render={(scoreTotal) => scoreTotal}
                      />
                    </ColumnGroup>
                  </Table>
                )}
              </div>
            )}

            {state.currentSelectedStage &&
              state.processedStats &&
              state.processedStats.has(state.currentSelectedMapId) && (
                <div className="tables-container">
                  {state.currentSelectedTable === "team" && (
                    <Table
                      dataSource={
                        (isAdmin() || state.currentSelectedStage.statsVisible) &&
                        (getMapStats()?.teamScores || [])
                      }
                      pagination={false}
                      className="map-stats-table"
                      bordered
                    >
                      <ColumnGroup title={"Average Score: " + getAverageTeamScore()}>
                        {!state.inEditMode && (
                          <Column
                            title="Rank"
                            dataIndex="rank"
                            key="rank"
                            render={(rank) => rank}
                          />
                        )}
                        <Column
                          title="Team"
                          dataIndex="teamName"
                          key="teamName"
                          render={(teamName) => getTeamLabel(teamName)}
                        />
                        <Column
                          title="Score"
                          dataIndex="score"
                          key="score"
                          render={(score, teamScore) =>
                            state.inEditMode ? (
                              <InputNumber
                                value={score}
                                onChange={(value) => editTeamScore(teamScore.teamName, value)}
                              />
                            ) : (
                              score
                            )
                          }
                        />
                        {state.inEditMode && (
                          <Column
                            title="Remove"
                            render={(score, teamScore) => (
                              <Button
                                type="primary"
                                shape="circle"
                                icon={<MinusOutlined />}
                                size="middle"
                                onClick={() => removeTeamScore(teamScore.teamName)}
                              />
                            )}
                          />
                        )}
                      </ColumnGroup>
                    </Table>
                  )}
                  {state.currentSelectedTable === "player" && (
                    <Table
                      dataSource={
                        (isAdmin() || state.currentSelectedStage.statsVisible) &&
                        (getMapStats()?.playerScores || [])
                      }
                      pagination={false}
                      className="map-stats-table"
                      bordered
                    >
                      <ColumnGroup title={"Average Score: " + getAveragePlayerScore()}>
                        {!state.inEditMode && (
                          <Column
                            title="Rank"
                            dataIndex="rank"
                            key="rank"
                            render={(rank) => rank}
                          />
                        )}
                        <Column
                          title="Player"
                          dataIndex="userId"
                          key="userId"
                          render={(userId) => getPlayerLabel(userId)}
                        />
                        <Column
                          title="Score"
                          dataIndex="score"
                          key="score"
                          render={(score, playerScore) =>
                            state.inEditMode && playerScore.userId ? (
                              <InputNumber
                                value={score}
                                onChange={(value) => editPlayerScore(playerScore.userId, value)}
                              />
                            ) : (
                              score
                            )
                          }
                        />
                        {state.inEditMode && (
                          <Column
                            title="Remove"
                            render={(score, playerScore) => (
                              <Button
                                type="primary"
                                shape="circle"
                                icon={<MinusOutlined />}
                                size="middle"
                                onClick={() => removePlayerScore(playerScore.userId)}
                              />
                            )}
                          />
                        )}
                      </ColumnGroup>
                    </Table>
                  )}
                </div>
              )}
          </div>

          <AddPlayerModal
            title={state.addTeamScore ? "Add a team" : "Add a player"}
            label={state.addTeamScore ? "Team Name" : "Player Name"}
            visible={state.addPlayerModalVisible}
            handleOk={state.addTeamScore ? addTeamScore : addPlayerScore}
            handleCancel={() => setState({ ...state, addPlayerModalVisible: false })}
            onValuesChange={(changed, data) => setState({ ...state, addPlayerData: data.username })}
            options={
              state.addTeamScore
                ? Object.fromEntries(
                    Array.from(state.teams.values()).map((team) => [team.name, team.name])
                  )
                : undefined
            }
          />
        </div>
      </div>
    </Content>
  );
}
