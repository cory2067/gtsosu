import { MinusOutlined } from "@ant-design/icons";
import { Button, Form, InputNumber, Layout, Menu, Popover, Radio, Spin, Switch, Table, message } from "antd";
import React, { useEffect, useState } from "react";
import { get, getStageWithVisibleStats, hasAccess, post, prettifyTourney } from "../../utilities";
import AddPlayerModal from "../modules/AddPlayerModal";
import FlagIcon from "../modules/FlagIcon";
import StageSelector from "../modules/StageSelector";
import TeamCard from "../modules/TeamCard";
import UserCard from "../modules/UserCard";
import "./Stats.css";
const { Content } = Layout;
const { Column, ColumnGroup } = Table;

export default function Stats({ tourney, user }) {
  const [state, setState] = useState({
    tourneyModel: undefined,
    isQualifiers: false,
    players: new Map(),
    teams: new Map(),
    matches: [],
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
    refetchScoresInProgress: false,
    assignSeedsInProgress: false,
    freemodFilter: "none",
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
      const mod = state.stageMaps.find((stageMap) => stageMap.mapId === mapStats.mapId)?.mod;
      const sortedPlayerScores = [...mapStats.playerScores].sort((a, b) => b.score - a.score);
      const sortedTeamScores = [...mapStats.teamScores].sort((a, b) => b.score - a.score);
      const processedPlayerScores = [];
      const processedTeamScores = [];

      let currentRank = 1;
      let currentScore;
      let currentFilteredRank = 0;
      let ties = 0;
      let currentFilteredScore;
      for (let i = 0; i < sortedPlayerScores.length; i++) {
        const playerScore = sortedPlayerScores[i];
        const filterActive = (mod === "FM" || mod === "TB") && state.freemodFilter !== "none";
        const matchesFreemodFilter = state.freemodFilter === playerScore.mod;
        if (!currentScore || playerScore.score < currentScore) {
          currentRank = i + 1;
          currentScore = playerScore.score;
        }
        if (filterActive && matchesFreemodFilter) {
          if (!currentFilteredScore || playerScore.score < currentFilteredScore) {
            currentFilteredRank += ties + 1;
            currentFilteredScore = playerScore.score;
            ties = 0;
          } else {
            ties += 1;
          }
          processedPlayerScores.push({ ...playerScore, rank: currentFilteredRank });
        } else if (!filterActive) {
          processedPlayerScores.push({ ...playerScore, rank: currentRank });
        }

        if (!overallPlayerStats.has(playerScore.userId)) {
          overallPlayerStats.set(playerScore.userId, {
            rankTotal: 0,
            scoreTotal: 0,
            mapsPlayed: 0,
          });
        }
        overallPlayerStats.get(playerScore.userId).rankTotal += currentRank;
        overallPlayerStats.get(playerScore.userId).scoreTotal += currentScore;
        overallPlayerStats.get(playerScore.userId).mapsPlayed += 1;

        if (!playerModStats.has(mod)) {
          playerModStats.set(mod, new Map());
        }
        if (!playerModStats.get(mod).has(playerScore.userId)) {
          playerModStats
            .get(mod)
            .set(playerScore.userId, { rankTotal: 0, scoreTotal: 0, mapsPlayed: 0 });
        }
        playerModStats.get(mod).get(playerScore.userId).rankTotal += currentRank;
        playerModStats.get(mod).get(playerScore.userId).scoreTotal += currentScore;
        playerModStats.get(mod).get(playerScore.userId).mapsPlayed += 1;
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
          overallTeamStats.set(teamScore.teamName, { rankTotal: 0, scoreTotal: 0, mapsPlayed: 0 });
        }
        overallTeamStats.get(teamScore.teamName).rankTotal += currentRank;
        overallTeamStats.get(teamScore.teamName).scoreTotal += currentScore;
        overallTeamStats.get(teamScore.teamName).mapsPlayed += 1;

        if (!teamModStats.has(mod)) {
          teamModStats.set(mod, new Map());
        }
        if (!teamModStats.get(mod).has(teamScore.teamName)) {
          teamModStats
            .get(mod)
            .set(teamScore.teamName, { rankTotal: 0, scoreTotal: 0, mapsPlayed: 0 });
        }
        teamModStats.get(mod).get(teamScore.teamName).rankTotal += currentRank;
        teamModStats.get(mod).get(teamScore.teamName).scoreTotal += currentScore;
        teamModStats.get(mod).get(teamScore.teamName).mapsPlayed += 1;
      }

      processedStats.set(String(mapStats.mapId), {
        ...mapStats,
        playerScores: processedPlayerScores,
        teamScores: processedTeamScores,
      });
    }

    const compareStatsFn = (a, b) =>
      a.rankAverage === b.rankAverage ? b.scoreTotal - a.scoreTotal : a.rankAverage - b.rankAverage;

    // sort and rank overall stats
    overallPlayerStats = Array.from(overallPlayerStats.entries())
      .map(([userId, stats]) => ({
        ...stats,
        userId,
        rankAverage: stats.rankTotal / stats.mapsPlayed,
      }))
      .sort(compareStatsFn);
    const overallPlayerStatsWithRank = [];
    for (let i = 0; i < overallPlayerStats.length; i++) {
      overallPlayerStatsWithRank.push({ ...overallPlayerStats[i], rank: i + 1 });
    }

    overallTeamStats = Array.from(overallTeamStats.entries())
      .map(([teamName, stats]) => ({
        ...stats,
        teamName,
        rankAverage: stats.rankTotal / stats.mapsPlayed,
      }))
      .sort(compareStatsFn);
    const overallTeamStatsWithRank = [];
    for (let i = 0; i < overallTeamStats.length; i++) {
      overallTeamStatsWithRank.push({ ...overallTeamStats[i], rank: i + 1 });
    }

    for (let mod of playerModStats.keys()) {
      const sortedModRankings = Array.from(playerModStats.get(mod).entries())
        .map(([userId, stats]) => ({
          ...stats,
          userId,
          rankAverage: stats.rankTotal / stats.mapsPlayed,
        }))
        .sort(compareStatsFn);
      playerModStats.set(mod, sortedModRankings);
    }

    for (let mod of teamModStats.keys()) {
      const sortedModRankings = Array.from(teamModStats.get(mod).entries())
        .map(([teamName, stats]) => ({
          ...stats,
          teamName,
          rankAverage: stats.rankTotal / stats.mapsPlayed,
        }))
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

    const [tourneyModel, currentSelectedStage] = await getStageWithVisibleStats(tourney);

    const [players, teams, stageMaps, stageStats, matches] = await Promise.all([
      get("/api/players", { tourney }),
      tourneyModel.teams ? get("/api/teams", { tourney }) : Promise.resolve([]),
      get("/api/maps", { tourney, stage: currentSelectedStage.name }).catch((e) => []),
      get("/api/stage-stats", { tourney, stage: currentSelectedStage.name }).catch((e) => ({})),
      get("/api/matches", { tourney, stage: currentSelectedStage.name }).catch((e) => ([])),
    ]);

    setState({
      ...state,
      tourneyModel,
      isQualifiers: currentSelectedStage.name === "Qualifiers",
      players: new Map(players.map((player) => [player.userid, player])),
      teams: new Map(teams.map((team) => [team.name, team])),
      matches,
      stageMaps,
      stageStats: stageStats || { tourney, stage: currentSelectedStage.name, maps: [] },
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

    const updated = { ...state.stageStatsEdit };
    let mapStats = updated.maps.find(
      (mapStats) => String(mapStats.mapId) === state.currentSelectedMapId
    );

    const exists = mapStats && mapStats.playerScores.find((playerScore) => String(playerScore.userId) === thePlayer.userid);
    if (exists) return message.error("Player score already exists");

    if (!mapStats) {
      mapStats = {
        mapId: Number(state.currentSelectedMapId),
        playerScores: [],
        teamScores: [],
      };
      updated.maps.push(mapStats);
    }
    mapStats.playerScores = [
      ...mapStats.playerScores,
      { userId: Number(thePlayer.userid), score: 0 },
    ];
    setState({ ...state, stageStatsEdit: updated, addPlayerModalVisible: false });
  };
  
  const editSeedSize = async (value) => {
    const updated = { ...state.stageStatsEdit };
    updated.seedSize = value;
    setState({ ...state, stageStatsEdit: updated});
  };

  const exportToJson = () => {
    const teams = [];
    const isTeamTourney = state.tourneyModel.teams;
    for (let teamStats of isTeamTourney ? state.overallTeamStats : state.overallPlayerStats) {
      const seedingResults = [];
      // assuming this is in correct mod order
      for (let stageMap of state.stageMaps) {
        const teamScore = isTeamTourney
          ? state.processedStats
              .get(String(stageMap.mapId))
              .teamScores.find((teamScore) => teamScore.teamName === teamStats.teamName)
          : state.processedStats
              .get(String(stageMap.mapId))
              .playerScores.find((playerScore) => playerScore.userId === teamStats.userId);
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
          isTeamTourney
            ? seedingResults.push({
                Mod: stageMap.mod,
                Seed:
                  state.teamModStats
                    .get(stageMap.mod)
                    .findIndex((stats) => stats.teamName === teamStats.teamName) + 1,
                Beatmaps: [beatmap],
              })
            : seedingResults.push({
                Mod: stageMap.mod,
                Seed:
                  state.playerModStats
                    .get(stageMap.mod)
                    .findIndex((stats) => stats.userId === teamStats.userId) + 1,
                Beatmaps: [beatmap],
              });
        } else {
          theSeedingResultsMod.Beatmaps.push(beatmap);
        }
      }
      const theTeam = isTeamTourney
        ? state.teams.get(teamStats.teamName)
        : state.players.get(String(teamStats.userId));
      teams.push({
        FullName: isTeamTourney ? theTeam.name : theTeam.username,
        Acronym: isTeamTourney
          ? theTeam.name.substring(0, 3)
          : theTeam.username.substring(0, 3),
        FlagName: isTeamTourney ? theTeam.players[0].country : theTeam.country,
        SeedingResults: seedingResults,
        Seed: `#${teamStats.rank}`,
        LastYearPlacing: 1,
        Players: isTeamTourney
          ? theTeam.players.map((player) => ({ id: player.userid }))
          : [{ id: teamStats.userId }],
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
      const popoverContent = (<TeamCard key={theTeam._id} {...theTeam} />);

      return (
        <div>
          <Popover content={popoverContent} placement="right">
            <FlagIcon size={16} customIcon={theTeam.icon} code={theTeam.country} /> {teamName}
          </Popover>
        </div>
      );
    } else return teamName;
  };

  const getPlayerLabel = (userId) => {
    const thePlayer = state.players.get(String(userId));

    if (thePlayer) {
      const playerTourneyStats = thePlayer.stats.find(stats => stats.tourney === tourney);
      const popoverContent = (<UserCard key={thePlayer._id} user={thePlayer} stats={playerTourneyStats} />);

      return (
        <div>
          <Popover content={popoverContent} placement="right">
            <FlagIcon size={16} code={thePlayer.country} /> {thePlayer.username}
          </Popover>
        </div>
      );
    } else return userId;
  };
  
  const getBeatmapInfo = () => {
    const mapId = Number(state.currentSelectedMapId);
    const theBeatmap = state.stageMaps.find((stageMap) => stageMap.mapId === mapId);
    const banCount = state.matches.filter((match) => match.bans1.includes(mapId) || match.bans2.includes(mapId)).length;
    return theBeatmap ? `${theBeatmap.artist} - ${theBeatmap.title} [${theBeatmap.diff}]\nTimes banned: ${banCount}\n` : "";
  };

  const isFreemod = () => {
    const mapId = Number(state.currentSelectedMapId);
    const theBeatmap = state.stageMaps.find((stageMap) => stageMap.mapId === mapId);
    return theBeatmap?.mod === "FM" || theBeatmap?.mod === "TB";
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
    if (!state.stageStats.seedSize || state.stageStats.seedSize === -1) {
      const rangeSize = Math.pow(2, Math.floor(Math.log2(state.overallTeamStats.length))) / 4;
      return Math.ceil(rank / rangeSize);
    } else {
      return Math.ceil(rank / state.stageStats.seedSize);
    }
  };

  const getPlayerSeed = (rank) => {
    if (!state.stageStats.seedSize || state.stageStats.seedSize === -1) {
      const rangeSize = Math.ceil(Math.pow(2, Math.floor(Math.log2(state.overallPlayerStats.length))) / 4);
      return Math.ceil(rank / rangeSize);
    } else {
      return Math.ceil(rank / state.stageStats.seedSize);
    }
  };

  const refetchAllScores = async () => {
    if (
      confirm(
        "This will resubmit all MP links for this stage and may overwrite edits that were made to the stats (if any)."
      )
    ) {
      setState({
        ...state,
        refetchScoresInProgress: true,
      });
      const updatedStats = await post("/api/refetch-stats", {
        tourney,
        stage: state.currentSelectedStage.name,
      });
      setState({
        ...state,
        stageStats: updatedStats,
        recalculateStats: true,
        refetchScoresInProgress: false,
      });
    }
  };

  const assignSeeds = async () => {
    const isTeamsTourney = !!state.tourneyModel?.teams;
    if (isTeamsTourney) {
      if (
        confirm(
          "Assign seeds to teams based on the stats shown here?"
        )
      ) {
        const teamSeedStats = state.overallTeamStats.map(teamScoreStats => {
          const team = state.teams.get(teamScoreStats.teamName);
          const seedName = ["Top", "High", "Mid", "Low"][getTeamSeed(teamScoreStats.rank) - 1];
          return {
            _id: team._id,
            seedName,
            seedNum: teamScoreStats.rank,
          };
        }).filter(seedStats => seedStats.seedName);

        setState({
          ...state,
          assignSeedsInProgress: true,
        });
        const updatedTeams = await post("/api/team-stats", {
          tourney,
          teamStats: teamSeedStats,
        });
        setState({
          ...state,
          assignSeedsInProgress: false,
        });
      }
    }
    else {
      if (
        confirm(
          "Assign seeds to players based on the stats shown here?"
        )
      ) {
        const playerSeedStats = state.overallPlayerStats.map(playerScoreStats => {
          const user = state.players.get(String(playerScoreStats.userId));
          const seedName = ["Top", "High", "Mid", "Low"][getPlayerSeed(playerScoreStats.rank) - 1];
          return {
            _id: user._id,
            stats: {
              seedName,
              seedNum: playerScoreStats.rank,
            },
          };
        }).filter(seedStats => seedStats.stats.seedName);

        setState({
          ...state,
          assignSeedsInProgress: true,
        });
        const updatedPlayers = await post("/api/player-stats", {
          tourney,
          playerStats: playerSeedStats,
        });
        setState({
          ...state,
          assignSeedsInProgress: false,
        });
      }
    }
  };

  const handleFreemodFilterChange = (event) => {
    const value = event.target.value;
    setState({
      ...state,
      freemodFilter: value,
      recalculateStats: true,
    });
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

        <div className="page-content">
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
                  {!state.refetchScoresInProgress && (
                    <Button className="settings-button" type="primary" onClick={refetchAllScores}>
                      Refetch all scores
                    </Button>
                  )}
                  {state.refetchScoresInProgress && <Spin />}
                  {!state.assignSeedsInProgress && state.isQualifiers && (
                    <Button className="settings-button" type="primary" onClick={assignSeeds}>
                      Assign Seeds
                    </Button>
                  )}
                  {state.assignSeedsInProgress && <Spin />}
                </Form>
              )}
              {state.inEditMode && (
                <Form layout="inline">
                  <Form.Item name="seedSize" label="Seed Size">
	            <InputNumber value={state.stageStatsEdit.seedSize} min={-1} onChange={(value) => editSeedSize(value)} />
	          </Form.Item>
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
            {state.tourneyModel?.teams && (
              <Menu
                mode="horizontal"
                onClick={(e) => setState({ ...state, currentSelectedTable: e.key })}
                selectedKeys={[state.currentSelectedTable]}
              >
                <Menu.Item key="team">Team Rankings</Menu.Item>
                <Menu.Item key="player">Player Rankings</Menu.Item>
              </Menu>
            )}

            {state.currentSelectedTable === "player" && isFreemod() && (
              <div className="mod-filter">
                <span className="mod-filter-label">Mod filter: </span>
                <Radio.Group value={state.freemodFilter} onChange={handleFreemodFilterChange}>
                  <>
                    <Radio.Button value="none">None</Radio.Button>
                    <Radio.Button value="">NM</Radio.Button>
                    <Radio.Button value="HD">HD</Radio.Button>
                    <Radio.Button value="HR">HR</Radio.Button>
                    <Radio.Button value="HDHR">HDHR</Radio.Button>
                  </>
                </Radio.Group>
              </div>
            )}
          </div>

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
                      state.isQualifiers ? `seed-${getTeamSeed(teamScore.rank)}` : ""
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
                      {!state.isQualifiers && (
                        <Column
                          title="Maps Played"
                          dataIndex="mapsPlayed"
                          key="mapsPlayed"
                          render={(mapsPlayed) => mapsPlayed}
                        />
                      )}
                      <Column
                        title="Rank Average"
                        dataIndex="rankAverage"
                        key="rankAverage"
                        render={(rankAverage) => rankAverage.toFixed(2)}
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
                      state.isQualifiers ? `seed-${getPlayerSeed(playerScore.rank)}` : ""
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
                      {!state.isQualifiers && (
                        <Column
                          title="Maps Played"
                          dataIndex="mapsPlayed"
                          key="mapsPlayed"
                          render={(mapsPlayed) => mapsPlayed}
                        />
                      )}
                      <Column
                        title="Rank Average"
                        dataIndex="rankAverage"
                        key="rankAverage"
                        render={(rankAverage) => rankAverage.toFixed(2)}
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
                      <ColumnGroup title={getBeatmapInfo() + "Average Score: " + getAverageTeamScore()} className="table-header">
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
                      <ColumnGroup title={getBeatmapInfo() + "Average Score: " + getAveragePlayerScore()} className="table-header">
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
                        {isFreemod() && (
                          <Column
                            title="Mod"
                            dataIndex="mod"
                            key="mod"
                            render={(mod) => mod}
                          />
                        )}
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
