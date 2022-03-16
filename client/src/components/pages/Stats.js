import React, { useState, useEffect } from "react";
import "../../utilities.css";
import "./Stats.css";
import { get, post, prettifyTourney, hasAccess, getStage } from "../../utilities";
import { Layout, Table, Menu, Form, Switch, message } from "antd";
const { Content } = Layout;
const { Column, ColumnGroup } = Table;
import StageSelector from "../modules/StageSelector";

export default function Stats({ tourney, user }) {
  const [state, setState] = useState({});

  const fetchData = async () => {
    const [tourneyModel, currentSelectedStage] = await getStage(tourney);

    const [players, stageMaps, stageStats] = await Promise.all([
      get("/api/players", { tourney }),
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
      stageMaps,
      stageStats,
      processedStats,
      overallPlayerStats: overallPlayerStatsWithRank,
      overallTeamStats: overallTeamStatsWithRank,
      currentSelectedMapId: "0",
      currentSelectedStage,
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
              <Form layout="inline">
                <Form.Item label="Stats Visible" valuePropName="checked">
                  <Switch
                    checked={state.currentSelectedStage.statsVisible || false}
                    onClick={toggleStatsVisibility}
                  />
                </Form.Item>
              </Form>
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
                {state.overallTeamStats.length > 0 && (
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
                {state.processedStats.get(state.currentSelectedMapId).teamScores.length > 0 && (
                  <Table
                    dataSource={
                      (isAdmin() || state.currentSelectedStage.statsVisible) &&
                      state.processedStats.get(state.currentSelectedMapId).teamScores
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
                        title="Score"
                        dataIndex="score"
                        key="score"
                        render={(score) => score}
                      />
                    </ColumnGroup>
                  </Table>
                )}
                <Table
                  dataSource={
                    (isAdmin() || state.currentSelectedStage.statsVisible) &&
                    state.processedStats.get(state.currentSelectedMapId).playerScores
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
                    <Column title="Score" dataIndex="score" key="score" render={(score) => score} />
                  </ColumnGroup>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Content>
  );
}
