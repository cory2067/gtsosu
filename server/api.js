const express = require("express");
const logger = require("pino")();
const osu = require("node-osu");
const osuApi = new osu.Api(process.env.OSU_API_KEY);

const ensure = require("./ensure");
const User = require("./models/user");
const Team = require("./models/team");
const Map = require("./models/map");
const Tournament = require("./models/tournament");
const Match = require("./models/match");
const QualifiersLobby = require("./models/qualifiers-lobby");

const { addAsync } = require("@awaitjs/express");
const router = addAsync(express.Router());

const fs = require("fs");
const CONTENT_DIR = fs.readdirSync(`${__dirname}/../client/src/content`);

const round = (num) => Math.round(num * 100) / 100;
const formatTime = (time) =>
  Math.floor(time / 60) + ":" + (time % 60 < 10 ? "0" : "") + Math.floor(time % 60);
const scaleTime = (time, mod) =>
  mod === "DT" ? (time * 2) / 3 : mod === "HT" ? (time * 3) / 2 : time;
const scaleBPM = (bpm, mod) => (mod === "DT" ? (bpm * 3) / 2 : mod === "HT" ? (bpm * 2) / 3 : bpm);
const scaleDiff = (diff, mod) => {
  if (mod === "HR" || mod === "HDHR") {
    return Math.min(10, round(diff * 1.4));
  }
  if (mod == "EZ") {
    return Math.min(10, round(diff / 2));
  }
  return diff;
};

const checkPermissions = (user, tourney, roles) => {
  return (
    user &&
    user.username &&
    (user.admin ||
      user.roles.some(
        (r) => ["Host", "Developer", ...roles].includes(r.role) && r.tourney == tourney
      ))
  );
};

const isAdmin = (user, tourney) => checkPermissions(user, tourney, []);
const canViewHiddenPools = (user, tourney) =>
  checkPermissions(user, tourney, [
    "Mapsetter",
    "Showcase",
    "All-Star Mapsetter",
    "Head Pooler",
    "Mapper",
  ]);

const cantPlay = (user, tourney) =>
  checkPermissions(user, tourney, [
    "Mapsetter",
    "Referee",
    "All-Star Mapsetter",
    "Head Pooler",
    "Mapper",
  ]);

const canEditWarmup = async (user, playerNo, match) => {
  async function isCaptainOf(playerName, teamName, tourney) {
    const team = await Team.findOne({ name: teamName, tourney: tourney }).populate("players");
    if (!team || !team.players || !team.players[0]) return false;
    return team.players[0].username === playerName;
  }

  // Admin can always edit warmup
  if (isAdmin(user, match.tourney)) return true;

  // Players can't edit if the match is in less than 1 hour
  if (match.time.getTime() - Date.now() < 3600000) return false;

  const tourney = await Tournament.findOne({ code: match.tourney });

  if (
    tourney.teams &&
    (await isCaptainOf(user.username, match[`player${playerNo}`], tourney.code))
  ) {
    // User is the captain of the team
    return true;
  } else if (user.username === match[`player${playerNo}`]) {
    // User is the player
    return true;
  }

  return false;
};

const parseWarmup = async (warmup) => {
  if (!warmup) {
    throw new Error("No warmup submitted");
  }

  let warmupMapId = warmup;
  if (warmupMapId.startsWith("http")) {
    warmupMapId = warmupMapId.split("/").pop();
  }

  let mapData = null;
  try {
    mapData = (await osuApi.getBeatmaps({ b: warmupMapId, m: 1, a: 1 }))[0];
  } catch (e) {
    if (e.message == "Not found") {
      throw new Error("Beatmap not found");
    } else {
      throw new Error(e.message || "An error occured while trying to fetch beatmap data");
    }
  }

  // No idea if this would ever happen, but just in case
  if (!mapData) {
    throw new Error("No beatmap data");
  }

  // Map longer than 3 minutes
  if (mapData.length.total > 180) {
    throw new Error("Warmup map too long");
  }

  return `https://osu.ppy.sh/beatmapsets/${mapData.beatmapSetId}#taiko/${warmupMapId}`;
};

/**
 * POST /api/map
 * Registers a new map into a mappool
 * Params:
 *   - id: ID of the map
 *   - mod: mod of the map
 *   - index: e.g. 3 for NM3, HD3, HR3
 *   - tourney: identifier for the tourney
 *   - stage: which pool, e.g. qf, sf, f, gf
 * Returns the newly-created Map document
 */
router.postAsync("/map", ensure.isPooler, async (req, res) => {
  logger.info(`${req.user.username} added ${req.body.id} to ${req.body.stage} mappool`);

  const mod = req.body.mod;
  const modId = { EZ: 2, HR: 16, HDHR: 16, DT: 64, HT: 256 }[mod] || 0; // mod enum used by osu api
  const mapData = (await osuApi.getBeatmaps({ b: req.body.id, mods: modId, m: 1, a: 1 }))[0];

  // all map metadata cached in our db, so we don't need to spam calls to the osu api
  const newMap = new Map({
    ...req.body,
    mapId: parseInt(mapData.id),
    title: mapData.title,
    artist: mapData.artist,
    creator: mapData.creator,
    diff: mapData.version,
    bpm: round(scaleBPM(parseFloat(mapData.bpm), mod)),
    sr: round(parseFloat(mapData.difficulty.rating)),
    od: scaleDiff(parseFloat(mapData.difficulty.overall), mod),
    hp: scaleDiff(parseFloat(mapData.difficulty.drain), mod),
    length: formatTime(scaleTime(parseInt(mapData.length.total), mod)),
    image: `https://assets.ppy.sh/beatmaps/${mapData.beatmapSetId}/covers/cover.jpg`,
    pooler: req.user.username,
  });
  await newMap.save();
  res.send(newMap);
});

/**
 * GET /api/maps
 * Get all the maps for a given mappool (if the user has access)
 * Params:
 *   - tourney: identifier for the tourney
 *   - stage: which pool, e.g. qf, sf, f, gf
 */
router.getAsync("/maps", async (req, res) => {
  const [tourney, maps] = await Promise.all([
    Tournament.findOne({ code: req.query.tourney }),
    Map.find({ tourney: req.query.tourney, stage: req.query.stage }),
  ]);

  // if super hacker kiddo tries to view a pool before it's released
  const stageData = tourney.stages.filter((s) => s.name === req.query.stage)[0];
  if (!stageData.poolVisible && !canViewHiddenPools(req.user, req.query.tourney)) {
    return res.status(403).send({ error: "This pool hasn't been released yet!" });
  }

  const mods = { NM: 0, HD: 1, HR: 2, DT: 3, FM: 4, HT: 5, HDHR: 6, EZ: 7, CV: 8, EX: 9, TB: 10 };
  maps.sort((a, b) => {
    if (mods[a.mod] - mods[b.mod] != 0) {
      return mods[a.mod] - mods[b.mod];
    }
    return a.index - b.index;
  });
  res.send(maps);
});

/**
 * DELETE /api/maps
 * Delete a map from the pool
 * Params:
 *   - id: _id of the map to delete
 *   - tourney: identifier for the tourney
 *   - stage: which pool, e.g. qf, sf, f, gf
 */
router.deleteAsync("/map", ensure.isPooler, async (req, res) => {
  logger.info(`${req.user.username} deleted ${req.body.id} from ${req.body.stage} pool`);
  await Map.deleteOne({ tourney: req.body.tourney, stage: req.body.stage, _id: req.body.id });
  res.send({});
});

/**
 * GET /api/whoami
 * Returns the identity of the currently logged in user
 */
router.getAsync("/whoami", async (req, res) => {
  res.send(req.user || {});
});

/**
 * POST /api/register
 * Register for a given tournament. Also fetches the player's current rank
 * Params:
 *   - tourney: identifier for the tourney to register for
 */
router.postAsync("/register", ensure.loggedIn, async (req, res) => {
  if (cantPlay(req.user, req.body.tourney)) {
    logger.info(`${req.user.username} failed to register for ${req.body.tourney} (staff)`);
    return res.status(400).send({ error: "You're a staff member." });
  }

  const [userData, tourney] = await Promise.all([
    osuApi.getUser({ u: req.user.userid, m: 1, type: "id" }),
    Tournament.findOne({ code: req.body.tourney }),
  ]);

  const username = userData.name;
  const rank = userData.pp.rank;
  const country = userData.country;
  if (tourney.rankMin !== -1 && rank < tourney.rankMin) {
    logger.info(`${req.user.username} failed to register for ${req.body.tourney} (overrank)`);
    return res
      .status(400)
      .send({ error: `You are overranked for this tourney (your rank: ${rank})` });
  }

  if (tourney.rankMax !== -1 && rank > tourney.rankMax) {
    logger.info(`${req.user.username} failed to register for ${req.body.tourney} (underrank)`);
    return res
      .status(400)
      .send({ error: `You are underranked for this tourney (your rank: ${rank})` });
  }

  if (tourney.countries && tourney.countries.length && !tourney.countries.includes(country)) {
    logger.info(
      `${req.user.username} failed to register for ${req.body.tourney} (country not allowed)`
    );
    return res.status(400).send({ error: `Your country can't participate in this division` });
  }

  logger.info(`${req.user.username} registered for ${req.body.tourney}`);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $push: {
        tournies: req.body.tourney,
        stats: { regTime: new Date(), tourney: req.body.tourney },
      },
      $set: { rank, username },
    },
    { new: true }
  );
  res.send(user);
});

/**
 * POST /api/register-team
 * Register a team for a given tournament.
 * Params:
 *   - name: team name
 *   - tourney: identifier for the tourney to register for
 *   - players: list of players on the team, the first entry should equal the submitting user
 *   - icon: custom flag for the team
 */
router.postAsync("/register-team", ensure.loggedIn, async (req, res) => {
  if (req.body.players[0] !== req.user.username) {
    return res.status(400).send({ error: "Invalid team format" });
  }

  if (!req.body.name) {
    return res.status(400).send({ error: "Please add a team name" });
  }

  if (req.body.name.length > 40) {
    return res.status(400).send({ error: "Team name is too long (max 40 characters)" });
  }

  // TODO: instead of hardcoding these, add them as configurable vars for the Tournament
  const MIN_PLAYERS = 3;
  const MAX_PLAYERS = 6;
  const numPlayers = req.body.players.length;
  if (numPlayers < MIN_PLAYERS || numPlayers > MAX_PLAYERS) {
    return res
      .status(400)
      .send({ error: `A team must have ${MIN_PLAYERS} to ${MAX_PLAYERS} players` });
  }

  if (numPlayers !== new Set(req.body.players).size) {
    return res.status(400).send({ error: "Team can't have duplicate players" });
  }

  const tourney = await Tournament.findOne({ code: req.body.tourney });

  const updates = [];
  for (const username of req.body.players) {
    let userData;
    try {
      userData = await osuApi.getUser({ u: username, m: 1 });
    } catch (e) {
      logger.info(`${username} failed to register for ${req.body.tourney} (no osu user)`);
      return res.status(400).send({ error: `Couldn't find an osu! player named ${username}` });
    }

    const user = await User.findOne({ userid: userData.id });
    if (user && cantPlay(user, req.body.tourney)) {
      logger.info(`${username} failed to register for ${req.body.tourney} (staff)`);
      return res.status(400).send({ error: "Staff member on team." });
    }

    const rank = userData.pp.rank;
    if (tourney.rankMin !== -1 && rank < tourney.rankMin) {
      logger.info(`${username} failed to register for ${req.body.tourney} (overrank)`);
      return res
        .status(400)
        .send({ error: `${username} is overranked for this tourney (rank: ${rank})` });
    }

    if (tourney.rankMax !== -1 && rank > tourney.rankMax) {
      logger.info(`${username} failed to register for ${req.body.tourney} (underrank)`);
      return res
        .status(400)
        .send({ error: `${username} is underranked for this tourney (rank: ${rank})` });
    }

    updates.push([
      { userid: userData.id },
      {
        $set: {
          username: userData.name,
          country: userData.country,
          avatar: `https://a.ppy.sh/${userData.id}`,
          rank,
        },
        $push: {
          tournies: req.body.tourney,
          stats: { regTime: new Date(), tourney: req.body.tourney },
        },
      },
      { new: true, upsert: true },
    ]);
  }

  const players = await Promise.all(
    updates.map((updateArgs) => User.findOneAndUpdate(...updateArgs))
  );

  const team = new Team({
    name: req.body.name,
    players: players.map((p) => p._id),
    tourney: req.body.tourney,
    country: players[0].country,
    icon: req.body.icon,
  });

  await team.save();
  logger.info(`Registered team ${req.body.name} for ${req.body.tourney}`);
  res.send({ ...team.toObject(), players });
});

/**
 * POST /api/force-register
 * Forces registration of a player. Bypassess all checks.
 * Params:
 *   -
 *   - tourney: identifier for the tourney to register for
 */
router.postAsync("/force-register", ensure.isAdmin, async (req, res) => {
  const userData = await osuApi.getUser({ u: req.body.username, m: 1 });

  const rank = userData.pp.rank;
  const username = userData.name;
  logger.info(
    `${req.body.username} registered for ${req.body.tourney} (forced by ${req.user.username})`
  );

  const user = await User.findOneAndUpdate(
    { userid: userData.id },
    {
      $push: {
        tournies: req.body.tourney,
        stats: { regTime: new Date(), tourney: req.body.tourney },
      },
      $set: { rank, username },
    },
    { new: true }
  );
  res.send(user);
});

/**
 * POST /api/settings
 * Submit settings for a user
 * Params:
 *   - discord: discord username
 *   - timezone: player's timezone
 */
router.postAsync("/settings", ensure.loggedIn, async (req, res) => {
  logger.info(`${req.user.username} updated user settings`);
  await User.findByIdAndUpdate(req.user._id, {
    $set: { discord: req.body.discord, timezone: req.body.timezone },
  });
  res.send({});
});

/**
 * GET /api/players
 * Get player list for a tourney
 * Params:
 *   - tourney: identifier for the tournament
 */
router.getAsync("/players", async (req, res) => {
  const players = await User.find({ tournies: req.query.tourney });
  // sort like this to resolve players with rank 0 / undefined rank
  res.send(players.sort((x, y) => (x.rank || Infinity) - (y.rank || Infinity)));
});

/**
 * GET /api/tourneys
 * Get a list of all tournaments
 */
router.getAsync("/tourneys", async (req, res) => {
  const tourneys = await Tournament.find({});
  res.send(tourneys);
});

/**
 * GET /api/staff
 * Get staff list for a tourney
 * Params:
 *   - tourney: identifier for the tournament
 */
router.getAsync("/staff", async (req, res) => {
  const staff = await User.find({ "roles.tourney": req.query.tourney });
  res.send(staff);
});

/**
 * POST /api/staff
 * Add player as staff for a tourney
 * Params:
 *   - username: username of the new staff member
 *   - tourney: identifier for the tournament
 *   - role: role in the tournament
 */
router.postAsync("/staff", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} added ${req.body.username} as ${req.body.tourney} staff`);

  const userData = await osuApi.getUser({ u: req.body.username, m: 1 });
  const user = await User.findOneAndUpdate(
    { userid: userData.id },
    {
      $set: {
        username: userData.name,
        country: userData.country,
        avatar: `https://a.ppy.sh/${userData.id}`,
      },
      $push: { roles: { tourney: req.body.tourney, role: req.body.role } },
    },
    { new: true, upsert: true }
  );

  res.send(user);
});

/**
 * DELETE /api/staff
 * Removes player from the staff list of a tourney
 * Params:
 *   - username: username of the staff member to delete
 *   - tourney: identifier for the tournament
 */
router.deleteAsync("/staff", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} removed ${req.body.username} from ${req.body.tourney} staff`);
  await User.findOneAndUpdate(
    { username: req.body.username },
    { $pull: { roles: { tourney: req.body.tourney } } }
  );
  res.send({});
});

/**
 * DELETE /api/player
 * Removes player from the player list of a tourney
 * Params:
 *   - username: username of the player to delete
 *   - tourney: identifier for the tournament
 */
router.deleteAsync("/player", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} unregistered ${req.body.username} for ${req.body.tourney}`);
  await User.findOneAndUpdate(
    { username: req.body.username },
    { $pull: { tournies: req.body.tourney, stats: { tourney: req.body.tourney } } }
  );
  res.send({});
});

/**
 * GET /api/tournament
 * Get basic info for a tourney
 * Params:
 *   - tourney: identifier for the tournament
 */
router.getAsync("/tournament", async (req, res) => {
  const tourney = await Tournament.findOne({ code: req.query.tourney });
  if (!tourney) return res.send({});

  const stages = tourney.stages;
  if (stages && !canViewHiddenPools(req.user, req.query.tourney)) {
    tourney.stages = stages.filter((s) => s.poolVisible);
  }

  if (tourney.stages.length === 0 && stages.length) {
    // always show at least one stage, but don't reveal the mappack
    tourney.stages = [{ ...stages[0].toObject(), mappack: "" }];
  }

  res.send(tourney);
});

/**
 * POST /api/tournament
 * Set basic info for a tourney
 * Params:
 *   - tourney: identifier for the tournament
 *   - registrationOpen: are players allowed to register
 *   - teams: true if this tourney has teams
 *   - countries: what countries can participate in this tourney (empty if all)
 *   - rankMin / rankMax: rank restriction
 *   - stages: what stages this tourney consists of
 *   - flags: list of special options for the tourney
 */
router.postAsync("/tournament", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} updated settings for ${req.body.tourney}`);
  let tourney = await Tournament.findOne({ code: req.body.tourney });

  if (!tourney) {
    tourney = new Tournament({
      code: req.body.tourney,
    });
  }

  tourney.registrationOpen = req.body.registrationOpen;
  tourney.teams = req.body.teams;
  tourney.rankMin = req.body.rankMin;
  tourney.rankMax = req.body.rankMax;
  tourney.countries = req.body.countries;
  tourney.flags = req.body.flags;
  tourney.stages = req.body.stages.map((stage) => {
    // careful not to overwrite existing stage data
    const existing = tourney.stages.filter((s) => s.name === stage)[0];
    return existing || { name: stage, poolVisible: false, mappack: "" };
  });

  await tourney.save();

  res.send(tourney);
});

/**
 * POST /api/stage
 * Change info for a tourney stage
 * Params:
 *   - tourney: identifier for the tournament
 *   - index: index of the stage to modify
 *   - stage: the new info for this stage
 */
router.postAsync("/stage", ensure.isPooler, async (req, res) => {
  logger.info(`${req.user.username} updated stage ${req.body.index} of ${req.body.tourney}`);
  const tourney = await Tournament.findOne({ code: req.body.tourney });
  tourney.stages[req.body.index].mappack = req.body.stage.mappack;
  tourney.stages[req.body.index].poolVisible = req.body.stage.poolVisible;
  await tourney.save();
  res.send(tourney);
});

/**
 * POST /api/match
 * Create a tourney match
 * Params:
 *   - tourney: identifier for the tournament
 *   - stage: the new info for this stage
 *   - player1, player2: the player usernames
 *   - code: the match ID
 *   - time: date and time in string format (in UTC)
 */
router.postAsync("/match", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} added match ${req.body.code} to ${req.body.tourney}`);
  const match = new Match({
    player1: req.body.player1,
    player2: req.body.player2,
    tourney: req.body.tourney,
    stage: req.body.stage,
    code: req.body.code,
    time: new Date(req.body.time),
  });

  await match.save();
  res.send(match);
});

/**
 * POST /api/warmup
 * Submit a warmup
 * Params:
 *   - match: match ID
 *   - playerNo: 1 - player 1, 2 - player 2
 *   - warmup: the warmup map, could be beatmap link or ID
 */
router.postAsync("/warmup", async (req, res) => {
  const match = await Match.findOne({ _id: req.body.match });
  if (!(await canEditWarmup(req.user, req.body.playerNo, match))) {
    logger.warn(
      `${req.user.username} tried to submit player ${req.body.playerNo} warmup for ${req.body.match}`
    );
    return res.status(403).send("You don't have permission to do that");
  }
  try {
    match[`warmup${req.body.playerNo}`] = await parseWarmup(req.body.warmup);
  } catch (e) {
    res.status(400).send(e.message);
    return;
  }
  logger.info("User", req.user.username, "submitted warmup", req.body.warmup);
  await match.save();
  res.send(match);
});

/**
 * DELETE /api/warmup
 * Delete a warmup
 * Params:
 *   - match: match ID
 *   - playerNo: 1 - player 1, 2 - player 2
 */
router.deleteAsync("/warmup", async (req, res) => {
  const match = await Match.findOne({ _id: req.body.match });
  if (!(await canEditWarmup(req.user, req.body.playerNo, match))) {
    logger.warn(
      `${req.user.username} tried to delete player ${req.body.playerNo} warmup for ${req.body.match}`
    );
    return res.status(403).send("You don't have permission to do that");
  }
  match[`warmup${req.body.playerNo}`] = null;
  await match.save();
  res.send(match);
});

/**
 * DELETE /api/match
 * Delete a tourney match
 * Params:
 *  - match: the _id of the match
 *  - tourney: identifier for the tournament
 */
router.deleteAsync("/match", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} deleted match ${req.body.match} from ${req.body.tourney}`);
  await Match.deleteOne({ _id: req.body.match });
  res.send({});
});

/**
 * POST /api/reschedule
 * Reschedule a tourney match
 * Params:
 *   - match: the _id of the match
 *   - tourney: identifier for the tournament
 *   - time: the new match time (in UTC)
 */
router.postAsync("/reschedule", ensure.isAdmin, async (req, res) => {
  const newMatch = await Match.findOneAndUpdate(
    { _id: req.body.match },
    { $set: { time: new Date(req.body.time) } },
    { new: true }
  );

  logger.info(
    `${req.user.username} rescheduled ${req.body.tourney} match ${newMatch.code} to ${req.body.time}`
  );
  res.send(newMatch);
});

/**
 * GET /api/matches
 * Get all matches for a stage
 * Params:
 *   - tourney: identifier for the tournament
 *   - stage: the new info for this stage
 */
router.getAsync("/matches", async (req, res) => {
  const matches = await Match.find({ tourney: req.query.tourney, stage: req.query.stage }).sort({
    time: 1,
  });
  res.send(matches);
});

/**
 * POST /api/results
 * Submit the outcome of a match
 * Params:
 *   - tourney: identifier for the tournament
 *   - match: the _id of the match
 *   - score1, score2: scores of player1 and player2
 *   - link: mp link
 */
router.postAsync("/results", ensure.isRef, async (req, res) => {
  const newMatch = await Match.findOneAndUpdate(
    { _id: req.body.match, tourney: req.body.tourney },
    {
      $set: { score1: req.body.score1 || 0, score2: req.body.score2 || 0, link: req.body.link },
    },
    { new: true }
  );

  logger.info(`${req.user.username} submitted results for match ${newMatch.code}`);
  res.send(newMatch);
});

/**
 * POST /api/referee
 * Add referee to a match
 * Params:
 *  - match: the _id of the match
 *  - user: name of the person to add
 *  - tourney: identifier for the tournament
 */
router.postAsync("/referee", ensure.isRef, async (req, res) => {
  const match = await Match.findOne({ _id: req.body.match, tourney: req.body.tourney });
  if (match.referee) return res.status(400).send({ error: "already exists" });
  match.referee = req.body.user;
  await match.save();

  logger.info(`${req.body.user} signed up to ref ${match.code}`);
  res.send(match);
});

/**
 * DELETE /api/referee
 * Removes the current referee
 * Params:
 *  - match: the _id of the match
 *  - tourney: identifier for the tournament
 */
router.deleteAsync("/referee", ensure.isRef, async (req, res) => {
  const match = await Match.findOneAndUpdate(
    { _id: req.body.match, tourney: req.body.tourney },
    { $unset: { referee: 1 } },
    { new: true }
  );

  logger.info(`${req.user.username} deleted the ref of ${match.code}`);
  res.send(match);
});

/**
 * POST /api/streamer
 * Add streamer to a match
 * Params:
 *  - match: the _id of the match
 *  - user: name of the person to add
 *  - tourney: identifier for the tournament
 */
router.postAsync("/streamer", ensure.isStreamer, async (req, res) => {
  const match = await Match.findOne({ _id: req.body.match, tourney: req.body.tourney });
  if (match.streamer) return res.status(400).send({ error: "already exists" });
  match.streamer = req.body.user;
  await match.save();

  logger.info(`${req.body.user} signed up to stream ${match.code}`);
  res.send(match);
});

/**
 * DELETE /api/streamer
 * Removes the current streamer
 * Params:
 *  - match: the _id of the match
 *  - tourney: identifier for the tournament
 */
router.deleteAsync("/streamer", ensure.isStreamer, async (req, res) => {
  const match = await Match.findOneAndUpdate(
    { _id: req.body.match, tourney: req.body.tourney },
    { $unset: { streamer: 1 } },
    { new: true }
  );

  logger.info(`${req.user.username} deleted the streamer of ${match.code}`);
  res.send(match);
});

/**
 * POST /api/commentator
 * Add commentator to a match
 * Params:
 *  - match: the _id of the match
 *  - user: name of the person to add
 *  - tourney: identifier for the tournament
 */
router.postAsync("/commentator", ensure.isCommentator, async (req, res) => {
  const match = await Match.findOneAndUpdate(
    { _id: req.body.match, tourney: req.body.tourney },
    { $push: { commentators: req.body.user } },
    { new: true }
  );

  logger.info(`${req.body.user} signed up to commentate ${match.code}`);
  res.send(match);
});

/**
 * DELETE /api/commentator
 * Remove someone as a commentator to a match
 * Params:
 *  - match: the _id of the match
 *  - user: name of the person to remove
 *  - tourney: identifier for the tournament
 */
router.deleteAsync("/commentator", ensure.isCommentator, async (req, res) => {
  const match = await Match.findOneAndUpdate(
    { _id: req.body.match, tourney: req.body.tourney },
    { $pull: { commentators: req.body.user } },
    { new: true }
  );

  logger.info(`${req.user.username} removed ${req.body.user} from commentating ${match.code}`);
  res.send(match);
});

/**
 * GET /api/lobbies
 * Get all qual lobbies for this tournament
 * Params:
 *   - tourney: the code of the tournament
 */
router.getAsync("/lobbies", async (req, res) => {
  const lobbies = await QualifiersLobby.find({ tourney: req.query.tourney }).sort({ time: 1 });
  res.send(lobbies);
});

/**
 * POST /api/lobby
 * Create a new qualifiers lobby
 * Params:
 *   - time: the time for this lobby
 *   - tourney: the code of the tournament
 */
router.postAsync("/lobby", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} added a quals lobby to ${req.body.tourney}`);
  const lobby = new QualifiersLobby({
    time: req.body.time,
    tourney: req.body.tourney,
  });
  await lobby.save();
  res.send(lobby);
});

/**
 * DELETE /api/lobby
 * Delete a quals lobby
 * Params:
 *  - lobby: the _id of the lobby
 *  - tourney: identifier for the tournament
 */
router.deleteAsync("/lobby", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} deleted lobby ${req.body.lobby} from ${req.body.tourney}`);
  await QualifiersLobby.deleteOne({ _id: req.body.lobby });
  res.send({});
});

/**
 * POST /api/lobby-referee
 * Add a referee to a quals lobby
 * Params:
 *  - lobby: the _id of the lobby
 *  - user: name of the person to add (default: self)
 *  - tourney: identifier for the tournament
 */
router.postAsync("/lobby-referee", ensure.isRef, async (req, res) => {
  const lobby = await QualifiersLobby.findOne({ _id: req.body.lobby, tourney: req.body.tourney });
  if (lobby.referee) return res.status(400).send({ error: "already exists" });
  lobby.referee = req.body.user ?? req.user.username;
  await lobby.save();

  logger.info(
    `${req.user.username} signed ${req.body.user ?? "self"} up to ref quals lobby ${
      req.body.lobby
    } for ${req.body.tourney}`
  );
  res.send(lobby);
});

/**
 * DELETE /api/lobby-referee
 * Removes the current referee from a quals lobby
 * Params:
 *  - lobby: the _id of the lobby
 *  - tourney: identifier for the tournament
 */
router.deleteAsync("/lobby-referee", ensure.isRef, async (req, res) => {
  logger.info(`${req.user.username} removed a quals lobby ref for ${req.body.tourney}`);
  const lobby = await QualifiersLobby.findOneAndUpdate(
    { _id: req.body.lobby, tourney: req.body.tourney },
    { $unset: { referee: 1 } },
    { new: true }
  );
  res.send(lobby);
});

/**
 * POST /api/lobby-player
 * Add a player/team to a quals lobby
 * Params:
 *  - lobby: the _id of the lobby
 *  - teams: true to add team, false to add player
 *  - user: name of the person/team to add (default: self)
 *  - tourney: identifier of the tournament
 */
router.postAsync("/lobby-player", ensure.loggedIn, async (req, res) => {
  if (req.body.user && !isAdmin(req.user, req.body.tourney)) return res.status(403).send({});
  if (!req.body.user && !req.user.tournies.includes(req.body.tourney))
    return res.status(403).send({});
  logger.info(
    `${req.user.username} signed ${req.body.user ?? "self"} up for quals lobby ${
      req.body.lobby
    } in ${req.body.tourney}`
  );

  const toAdd =
    req.body.user ??
    (req.body.teams
      ? (await Team.findOne({ players: req.user._id, tourney: req.body.tourney })).name
      : req.user.username);

  const lobby = await QualifiersLobby.findOneAndUpdate(
    {
      _id: req.body.lobby,
      tourney: req.body.tourney,
    },
    { $addToSet: { players: toAdd } },
    { new: true }
  );
  res.send(lobby);
});

/**
 * DELETE /api/lobby-player
 * Removes a player/team from a quals lobby
 * Params:
 *  - lobby: the _id of the lobby
 *  - target: the name of the player/team to remove
 *  - teams: true iff name is a team
 *  - tourney: code for this tourney
 */
router.deleteAsync("/lobby-player", ensure.loggedIn, async (req, res) => {
  if (!isAdmin(req.user, req.body.tourney)) {
    // makes sure the player has permission to do this

    if (req.body.teams) {
      const team = await Team.findOne({
        name: req.body.target,
        players: req.user._id,
        tourney: req.body.tourney,
      });

      // is the player actually on this team?
      if (!team) {
        logger.warn(`${req.user.username} attempted to tamper with the quals lobby!`);
        return res.status(403).send({ error: "Cannot remove other teams" });
      }
    } else if (req.body.target !== req.user.username) {
      logger.warn(`${req.user.username} attempted to tamper with the quals lobby!`);
      return res.status(403).send({ error: "Cannot remove other players" });
    }
  }

  logger.info(
    `${req.user.username} removed ${req.body.target} from a quals lobby in ${req.body.tourney}`
  );
  const lobby = await QualifiersLobby.findOneAndUpdate(
    {
      _id: req.body.lobby,
      tourney: req.body.tourney,
    },
    { $pull: { players: req.body.target } },
    { new: true }
  );
  res.send(lobby);
});

/**
 * POST /api/team
 * Create a new team
 * Params:
 *   - name: team name
 *   - players: a list of players, where the first item is the captain
 *   - tourney: the code of the tournament
 */
router.postAsync("/team", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} created team ${req.body.name} in ${req.body.tourney}`);
  const players = await Promise.all(req.body.players.map((username) => User.findOne({ username })));

  const team = new Team({
    name: req.body.name,
    players: players.map((p) => p._id),
    tourney: req.body.tourney,
    country: players[0].country,
    icon: req.body.icon,
  });

  await team.save();
  res.send({ ...team.toObject(), players });
});

/**
 * POST /api/edit-team
 * Modify an existing team
 * Params:
 *   - _id: id of the existing team
 *   - name: team name
 *   - players: a list of players, where the first item is the captain
 *   - tourney: the code of the tournament
 */
router.postAsync("/edit-team", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} edited team ${req.body.name} in ${req.body.tourney}`);
  const players = await Promise.all(req.body.players.map((username) => User.findOne({ username })));

  const team = await Team.findOneAndUpdate(
    { _id: req.body._id },
    {
      $set: {
        name: req.body.name,
        players: players.map((p) => p._id),
        tourney: req.body.tourney,
        country: players[0].country,
        icon: req.body.icon,
      },
    },
    { new: true }
  ).populate("players");

  res.send({ ...team.toObject() });
});

/**
 * GET /api/teams
 * Get all teams in a tourney
 * Params:
 *   - tourney: the code of the tournament
 */
router.getAsync("/teams", async (req, res) => {
  const teams = await Team.find({ tourney: req.query.tourney })
    .populate("players")
    .sort({ name: 1 });
  res.send(teams);
});

/**
 * DELETE /api/team
 * Delete a specific team
 * Params:
 *   - _id: the _id of the team
 *   - tourney: identifier of the tourney
 */
router.deleteAsync("/team", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} deleted team ${req.body._id} from ${req.body.tourney}`);
  await Team.deleteOne({ _id: req.body._id });
  res.send({});
});

/**
 * POST /api/team-stats
 * Set stats/details about an existing team
 * Params:
 *   - _id: the _id of the team
 *   - seedName: i.e. Top, High, Mid, or Low
 *   - seedNum: the team's rank in the seeding
 *   - group: one character capitalized group name
 *   - tourney: identifier of the tourney
 */
router.postAsync("/team-stats", ensure.isAdmin, async (req, res) => {
  const team = await Team.findOneAndUpdate(
    { _id: req.body._id },
    {
      $set: {
        seedName: req.body.seedName,
        seedNum: req.body.seedNum,
        group: req.body.group,
      },
    },
    { new: true }
  ).populate("players");

  logger.info(`${req.user.username} set stats for ${team.name} in ${req.body.tourney}`);
  res.send(team);
});

/**
 * POST /api/player-stats
 * Set stats/details about an existing player
 * Params:
 *   - _id: the _id of the player
 *   - seedName: i.e. Top, High, Mid, or Low
 *   - seedNum: the player's rank in the seeding
 *   - group: one character capitalized group name
 *   - regTime: the date/time the player registered
 *   - tourney: the code of the tourney
 */
router.postAsync("/player-stats", ensure.isAdmin, async (req, res) => {
  await User.findOneAndUpdate(
    { _id: req.body._id },
    { $pull: { stats: { tourney: req.body.tourney } } }
  );

  const user = await User.findOneAndUpdate(
    { _id: req.body._id },
    {
      $push: {
        stats: {
          tourney: req.body.tourney,
          seedName: req.body.seedName,
          seedNum: req.body.seedNum,
          group: req.body.group,
          regTime: req.body.regTime,
        },
      },
    },
    { new: true }
  );

  logger.info(`${req.user.username} set stats for ${user.username} in ${req.body.tourney}`);
  res.send(user);
});

/**
 * POST /api/refresh
 * Refreshes the rank/username of a batch of players in this tourney
 * Params:
 *   - tourney: identifier for the tourney to refresh
 *   - offset: which index player to start on
 * Returns:
 *   - offset: the offset to send the next request
 *   - players: the updated player info
 */
router.postAsync("/refresh", ensure.isAdmin, async (req, res) => {
  const BATCH_SIZE = 8;
  if (req.body.offset === 0) {
    logger.info(`${req.user.username} initiated a refresh of ${req.body.tourney} player list`);
  }

  const players = await User.find({ tournies: req.body.tourney })
    .skip(req.body.offset)
    .limit(BATCH_SIZE);

  await Promise.all(
    players.map(async (p) => {
      try {
        const userData = await osuApi.getUser({ u: p.userid, m: 1, type: "id" });
        p.rank = userData.pp.rank;
        p.username = userData.name;
        await p.save();
      } catch (e) {
        logger.warn(`Failed to update rank for ${p.username}, skipping`);
      }
    })
  );

  res.send({
    offset: req.body.offset + BATCH_SIZE,
    players: players,
  });
});

/**
 * GET /api/map-history
 * Get the history of the map being used in GTS tourneys
 * Params:
 *   - id: id of the map
 */
router.getAsync("/map-history", async (req, res) => {
  const mapData = (await osuApi.getBeatmaps({ b: req.query.id, m: 1, a: 1 }))[0];

  const mapId = parseInt(mapData.id);
  const { title, artist, diff, creator } = mapData;
  const [sameDiff, sameSet, sameSong] = await Promise.all([
    Map.find({ mapId }),
    Map.find({ mapId: { $ne: mapId }, title, artist, creator }),
    Map.find({ creator: { $ne: creator }, title, artist }),
  ]);

  res.send({ sameDiff, sameSet, sameSong, mapData });
});

/**
 * GET /api/languages
 * Get the supported languages for a tourney
 * Params:
 *   - tourney: identifier for the tourney
 */
router.getAsync("/languages", async (req, res) => {
  const regex = new RegExp(`(${req.query.tourney}-(.*)\\.js)`);
  const languages = CONTENT_DIR.map((name) => {
    const found = name.match(regex);
    if (found) {
      return found[2]; // language code
    }
    return null;
  })
    .filter((v) => !!v)
    .sort((a, b) => {
      // sort English to the top
      if (a === "en") return -1;
      if (b === "en") return 1;
      return a.localeCompare(b);
    });

  res.send({ languages });
});

router.all("*", (req, res) => {
  logger.warn(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
