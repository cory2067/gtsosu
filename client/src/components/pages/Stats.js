import React, { useState, useEffect } from "react";
import "../../utilities.css";
import "./Stats.css";
import AddPlayerModal from "../modules/AddPlayerModal";
import { get, post, prettifyTourney, hasAccess, getStage } from "../../utilities";
import { Layout, Table, Menu, Form, Switch, message, Button, InputNumber } from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
const { Content } = Layout;
const { Column, ColumnGroup } = Table;
import StageSelector from "../modules/StageSelector";

export default function Stats({ tourney, user }) {
  const [state, setState] = useState({});

  const fetchData = async () => {
    const [tourneyModel, currentSelectedStage] = await getStage(tourney);

    const [players, teams, stageMaps, stageStats] = await Promise.all([
      get("/api/players", { tourney }),
      get("/api/teams", { tourney }),
      get("/api/maps", { tourney, stage: currentSelectedStage.name }).catch((e) => []),
      get("/api/stage-stats", { tourney, stage: currentSelectedStage.name }).catch((e) => ({})),
    ]);

    let overallPlayerStats = new Map();
    let overallTeamStats = new Map();
    const processedStats = new Map();
    // Show empty tables instead of no tables at all if there is no data
    stageMaps.map((stageMap) =>
      processedStats.set(String(stageMap.mapId), {
        mapId: stageMap.mapId,
        playerScores: [],
        teamScores: [],
      })
    );

    // process, sort, and rank the stats for each map, while tracking overall stats
    for (const mapStats of stageStats.maps || []) {
      const sortedPlayerScores = [...mapStats.playerScores].sort((a, b) => a.score < b.score);
      const sortedTeamScores = [...mapStats.teamScores].sort((a, b) => a.score < b.score);
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
        if (!overallPlayerStats.has(playerScore.userId))
          overallPlayerStats.set(playerScore.userId, { rankTotal: 0, scoreTotal: 0 });
        overallPlayerStats.get(playerScore.userId).rankTotal += currentRank;
        overallPlayerStats.get(playerScore.userId).scoreTotal += currentScore;
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
        if (!overallTeamStats.has(teamScore.teamName))
          overallTeamStats.set(teamScore.teamName, { rankTotal: 0, scoreTotal: 0 });
        overallTeamStats.get(teamScore.teamName).rankTotal += currentRank;
        overallTeamStats.get(teamScore.teamName).scoreTotal += currentScore;
      }

      processedStats.set(String(mapStats.mapId), {
        ...mapStats,
        playerScores: processedPlayerScores,
        teamScores: processedTeamScores,
      });
    }

    // sort and rank overall stats
    overallPlayerStats = Array.from(overallPlayerStats.entries())
      .map(([userId, stats]) => ({ ...stats, userId }))
      .sort((a, b) =>
        a.rankTotal === b.rankTotal ? a.scoreTotal < b.scoreTotal : a.rankTotal > b.rankTotal
      );
    const overallPlayerStatsWithRank = [];
    for (let i = 0; i < overallPlayerStats.length; i++) {
      overallPlayerStatsWithRank.push({ ...overallPlayerStats[i], rank: i + 1 });
    }
    overallTeamStats = Array.from(overallTeamStats.entries())
      .map(([teamName, stats]) => ({ ...stats, teamName }))
      .sort((a, b) =>
        a.rankTotal === b.rankTotal ? a.scoreTotal < b.scoreTotal : a.rankTotal > b.rankTotal
      );
    const overallTeamStatsWithRank = [];
    for (let i = 0; i < overallTeamStats.length; i++) {
      overallTeamStatsWithRank.push({ ...overallTeamStats[i], rank: i + 1 });
    }

    setState({
      tourneyModel,
      players: new Map(players.map((player) => [player.userid, player])),
      teams: new Map(teams.map((team) => [team.name, team])),
      stageMaps,
      stageStats,
      processedStats,
      overallPlayerStats: overallPlayerStatsWithRank,
      overallTeamStats: overallTeamStatsWithRank,
      currentSelectedMapId: "0",
      currentSelectedStage,
      inEditMode: false,
      stageStatsEdit: undefined,
    });
  };

  useEffect(() => {
    document.title = `${prettifyTourney(tourney)}: Stats`;
    fetchData();
  }, []);

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
    const updatedStats = await post("/api/stage-stats", { stats: state.stageStatsEdit });
    fetchData();
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

  return (
    <Content className="content">
      <div className="u-flex">
        <div className="u-sidebar">
          {state.currentSelectedStage && (
            <StageSelector
              selected={state.currentSelectedStage.index}
              onClick={({ key }) =>
                String(state.currentSelectedStage.index) !== key ? fetchData() : {}
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
            {state.currentSelectedMapId === "0" && (
              <div className="tables-container">
                {state.tourneyModel.teams && (
                  <Table
                    dataSource={
                      (isAdmin() || state.currentSelectedStage.statsVisible) &&
                      state.overallTeamStats
                    }
                    pagination={false}
                    className="map-stats-table"
                    bordered
                  >
                    <ColumnGroup title="Team Rankings">
                      <Column title="Rank" dataIndex="rank" key="rank" render={(rank) => rank} />
                      <Column
                        title="Team"
                        dataIndex="teamName"
                        key="teamName"
                        render={(teamName) => teamName}
                      />
                      <Column
                        title="Rank Total"
                        dataIndex="rankTotal"
                        key="rankTotal"
                        render={(rankTotal) => rankTotal}
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
                <Table
                  dataSource={
                    (isAdmin() || state.currentSelectedStage.statsVisible) &&
                    state.overallPlayerStats
                  }
                  pagination={false}
                  className="map-stats-table"
                  bordered
                >
                  <ColumnGroup title="Player Rankings">
                    <Column title="Rank" dataIndex="rank" key="rank" render={(rank) => rank} />
                    <Column
                      title="Player"
                      dataIndex="userId"
                      key="userId"
                      render={(userId) =>
                        state.players.has(String(userId))
                          ? state.players.get(String(userId)).username
                          : userId
                      }
                    />
                    <Column
                      title="Rank Total"
                      dataIndex="rankTotal"
                      key="rankTotal"
                      render={(rankTotal) => rankTotal}
                    />
                    <Column
                      title="Score Total"
                      dataIndex="scoreTotal"
                      key="scoreTotal"
                      render={(scoreTotal) => scoreTotal}
                    />
                  </ColumnGroup>
                </Table>
              </div>
            )}

            {state.processedStats && state.processedStats.has(state.currentSelectedMapId) && (
              <div className="tables-container">
                {state.tourneyModel.teams && (
                  <Table
                    dataSource={
                      (isAdmin() || state.currentSelectedStage.statsVisible) &&
                      (state.inEditMode
                        ? state.stageStatsEdit.maps.find(
                            (stageStats) => String(stageStats.mapId) === state.currentSelectedMapId
                          ).teamScores
                        : state.processedStats.get(state.currentSelectedMapId).teamScores)
                    }
                    pagination={false}
                    className="map-stats-table"
                    bordered
                  >
                    <ColumnGroup title="Team Rankings">
                      {!state.inEditMode && (
                        <Column title="Rank" dataIndex="rank" key="rank" render={(rank) => rank} />
                      )}
                      <Column
                        title="Team"
                        dataIndex="teamName"
                        key="teamName"
                        render={(teamName) => teamName}
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
                <Table
                  dataSource={
                    (isAdmin() || state.currentSelectedStage.statsVisible) &&
                    (state.inEditMode
                      ? state.stageStatsEdit.maps.find(
                          (stageStats) => String(stageStats.mapId) === state.currentSelectedMapId
                        ).playerScores
                      : state.processedStats.get(state.currentSelectedMapId).playerScores)
                  }
                  pagination={false}
                  className="map-stats-table"
                  bordered
                >
                  <ColumnGroup title="Player Rankings">
                    {!state.inEditMode && (
                      <Column title="Rank" dataIndex="rank" key="rank" render={(rank) => rank} />
                    )}
                    <Column
                      title="Player"
                      dataIndex="userId"
                      key="userId"
                      render={(userId) =>
                        state.players.has(String(userId))
                          ? state.players.get(String(userId)).username
                          : userId
                      }
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
