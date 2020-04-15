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
router.postAsync("/map", async (req, res, next) => {
  logger.info(`Getting map data for ${req.body.id}`);
  const mod = req.body.mod;
  const modId = { HR: 16, DT: 64 }[mod] || 0; // mod enum used by osu api
  const mapData = (await osuApi.getBeatmaps({ b: req.body.id, mods: modId }))[0];
  const newMap = new Map({
    mod: mod,
    id: parseInt(mapData.id),
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

router.all("*", (req, res) => {
  logger.warn(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
