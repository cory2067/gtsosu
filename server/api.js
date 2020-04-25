const express = require("express");
const logger = require("pino")();
const osu = require("node-osu");
const osuApi = new osu.Api(process.env.OSU_API_KEY);

const ensure = require("./ensure");
const User = require("./models/user");
const Map = require("./models/map");
const Tournament = require("./models/tournament");
const Match = require("./models/match");

const { addAsync } = require("@awaitjs/express");
const router = addAsync(express.Router());

const round = (num) => Math.round(num * 100) / 100;
const formatTime = (time) =>
  Math.floor(time / 60) + ":" + (time % 60 < 10 ? "0" : "") + Math.floor(time % 60);
const scaleTime = (time, mod) => (mod === "DT" ? (time * 2) / 3 : time);
const scaleBPM = (bpm, mod) => (mod === "DT" ? bpm * 1.5 : bpm);
const scaleDiff = (diff, mod) => (mod === "HR" ? Math.min(10, round(diff * 1.4)) : diff);

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
  logger.info(`Getting map data for ${req.body.id}`);
  const mod = req.body.mod;
  const modId = { HR: 16, DT: 64 }[mod] || 0; // mod enum used by osu api
  const mapData = (await osuApi.getBeatmaps({ b: req.body.id, mods: modId }))[0];

  // all map metadata cached in our db, so we don't need to spam calls to the osu api
  const newMap = new Map({
    ...req.body,
    mapId: parseInt(mapData.id),
    title: mapData.title,
    artist: mapData.artist,
    creator: mapData.creator,
    diff: mapData.version,
    bpm: scaleBPM(parseFloat(mapData.bpm), mod),
    sr: round(parseFloat(mapData.difficulty.rating)),
    od: scaleDiff(parseFloat(mapData.difficulty.overall), mod),
    hp: scaleDiff(parseFloat(mapData.difficulty.drain), mod),
    length: formatTime(scaleTime(parseInt(mapData.length.total), mod)),
    image: `https://assets.ppy.sh/beatmaps/${mapData.beatmapSetId}/covers/cover.jpg`,
  });
  await newMap.save();
  res.send(newMap);
});

/**
 * GET /api/maps
 * Get all the maps for a given mappool
 * Params:
 *   - tourney: identifier for the tourney
 *   - stage: which pool, e.g. qf, sf, f, gf
 */
router.getAsync("/maps", async (req, res) => {
  const maps = await Map.find({ tourney: req.query.tourney, stage: req.query.stage });
  const mods = { NM: 0, HD: 1, HR: 2, DT: 3, FM: 4, TB: 5 };
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
 *   - id: ID of the map to delete
 *   - tourney: identifier for the tourney
 *   - stage: which pool, e.g. qf, sf, f, gf
 */
router.deleteAsync("/map", ensure.isPooler, async (req, res) => {
  logger.info(`Deleting ${req.body.id} from pool`);
  await Map.deleteOne({ tourney: req.body.tourney, stage: req.body.stage, mapId: req.body.id });
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
  logger.info(`${req.user.username} registered for ${req.body.tourney}`);
  const userData = await osuApi.getUser({ u: req.user.userid, m: 1, type: "id" });

  await User.findByIdAndUpdate(req.user._id, {
    $push: { tournies: req.body.tourney },
    $set: { rank: userData.pp.rank },
  });
  res.send({});
});

/**
 * POST /api/settings
 * Submit settings for a user
 * Params:
 *   - discord: discord username
 *   - timezone: player's timezone
 */
router.postAsync("/settings", ensure.loggedIn, async (req, res) => {
  logger.info(`${req.user.username} updated settings`);
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
  const players = await User.find({ tournies: req.query.tourney }).sort({ rank: 1 });
  res.send(players);
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
router.postAsync("/staff", async (req, res) => {
  const user = await User.findOneAndUpdate(
    { username: req.body.username },
    { $push: { roles: { tourney: req.body.tourney, role: req.body.role } } },
    { new: true }
  );

  if (!user) {
    // if this staff member has not created a GTS account yet, generate one right now
    const userData = await osuApi.getUser({ u: req.body.username, m: 1 });
    const newUser = new User({
      username: userData.name,
      userid: userData.id,
      country: userData.country,
      avatar: `https://a.ppy.sh/${userData.id}`,
      roles: [{ tourney: req.body.tourney, role: req.body.role }],
    });
    await newUser.save();
    logger.info(`Generated new staff account for ${req.body.username}`);
    return res.send(newUser);
  }

  res.send(user);
});

/**
 * DELETE /api/staff
 * Removes player from the staff list of a tourney
 * Params:
 *   - username: username of the staff member to delete
 *   - tourney: identifier for the tournament
 */
router.deleteAsync("/staff", async (req, res) => {
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
router.deleteAsync("/player", async (req, res) => {
  await User.findOneAndUpdate(
    { username: req.body.username },
    { $pull: { tournies: req.body.tourney } }
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
  res.send(tourney || {});
});

/**
 * POST /api/tournament
 * Set basic info for a tourney
 * Params:
 *   - tourney: identifier for the tournament
 *   - registrationOpen: are players allowed to register
 *   - stages: what stages this tourney consists of
 */
router.postAsync("/tournament", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} updated settings for ${req.body.tourney}`);
  const tourney = await Tournament.findOneAndUpdate(
    {
      code: req.body.tourney,
    },
    {
      $set: {
        stages: req.body.stages.map((s) => ({ name: s, poolVisible: false })),
        registrationOpen: req.body.registrationOpen,
      },
    },
    { upsert: true, new: true }
  );
  res.send(tourney);
});

router.all("*", (req, res) => {
  logger.warn(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
