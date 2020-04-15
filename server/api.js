const express = require("express");
const logger = require("pino")();
const osu = require("node-osu");
const osuApi = new osu.Api(process.env.OSU_API_KEY);

const User = require("./models/user");
const Map = require("./models/map");

const { addAsync } = require("@awaitjs/express");
const router = addAsync(express.Router());

const round = (num) => Math.round(num * 100) / 100;
const formatTime = (time) =>
  Math.floor(time / 60) + ":" + (time % 60 < 10 ? "0" : "") + Math.floor(time % 60);
const scaleTime = (time, mod) => (mod === "DT" ? (time * 2) / 3 : time);
const scaleBPM = (bpm, mod) => (mod === "DT" ? bpm * 1.5 : bpm);
const scaleDiff = (diff, mod) => (mod === "HR" ? round(diff * 1.4) : diff);

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
router.postAsync("/map", async (req, res) => {
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
router.deleteAsync("/map", async (req, res) => {
  await Map.deleteOne({ tourney: req.body.tourney, stage: req.body.stage, mapId: req.body.id });
  res.send({});
});

router.all("*", (req, res) => {
  logger.warn(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
