import express, { Response } from "express";
import pino from "pino";

import ensure from "../ensure";
import Tournament from "../models/tournament";
import TourneyMap, { ITourneyMap } from "../models/tourney-map";
import { IUser } from "../models/user";
import { Request, UserDocument } from "../types";
import { getOsuApi, checkPermissions, assertUser } from "../util";

import { addAsync } from "@awaitjs/express";
const mapRouter = addAsync(express.Router());

const logger = pino();
const osuApi = getOsuApi();

const round = (num: number) => Math.round(num * 100) / 100;
const formatTime = (time: number) =>
  Math.floor(time / 60) + ":" + (time % 60 < 10 ? "0" : "") + Math.floor(time % 60);
const scaleTime = (time: number, mod: string) =>
  mod === "DT" ? (time * 2) / 3 : mod === "HT" ? (time * 3) / 2 : time;
const scaleBPM = (bpm: number, mod: string) =>
  mod === "DT" ? (bpm * 3) / 2 : mod === "HT" ? (bpm * 2) / 3 : bpm;
const scaleDiff = (diff: number, mod: string) => {
  if (mod === "HR" || mod === "HDHR") {
    return Math.min(10, round(diff * 1.4));
  }
  if (mod == "EZ") {
    return Math.min(10, round(diff / 2));
  }
  return diff;
};

const canViewHiddenPools = async (user: IUser | undefined, tourney: string) =>
  checkPermissions(user, tourney, [
    "Mapsetter",
    "Showcase",
    "All-Star Mapsetter",
    "Head Pooler",
    "Mapper",
  ]);

/**
 * POST /api/map
 * Registers a new map into a mappool
 * Returns the newly-added map
 */
type GetMapBody = {
  id: string; // ID of the map
  mod: string; // mod of the map
  index: number; // e.g. 3 for NM3, HD3, HR3
  tourney: string; // identifier for the tourney
  stage: string; // which pool, e.g. qf, sf, f, gf
  pooler?: string; // who selected this map (default current user)
};
type GetMapResponse = ITourneyMap;

mapRouter.postAsync(
  "/map",
  ensure.isPooler,
  async (req: Request<{}, GetMapBody>, res: Response<GetMapResponse>) => {
    const user = assertUser(req);
    logger.info(`${user.username} added ${req.body.id} to ${req.body.stage} mappool`);

    const mod = req.body.mod;
    const modId = { EZ: 2, HR: 16, HDHR: 16, DT: 64, HT: 256 }[mod] || 0; // mod enum used by osu api
    const mapData = (await osuApi.getBeatmaps({ b: req.body.id, mods: modId, m: 1, a: 1 }))[0];

    // all map metadata cached in our db, so we don't need to spam calls to the osu api
    const newMap = new TourneyMap({
      ...req.body,
      mapId: parseInt(mapData.id),
      title: mapData.title,
      artist: mapData.artist,
      creator: mapData.creator,
      diff: mapData.version,
      bpm: round(scaleBPM(mapData.bpm, mod)),
      sr: round(mapData.difficulty.rating),
      od: scaleDiff(mapData.difficulty.overall, mod),
      hp: scaleDiff(mapData.difficulty.drain, mod),
      length: formatTime(scaleTime(mapData.length.total, mod)),
      image: `https://assets.ppy.sh/beatmaps/${mapData.beatmapSetId}/covers/cover.jpg`,
      pooler: req.body.pooler ?? user.username,
    });
    await newMap.save();
    res.send(newMap);
  }
);

/**
 * GET /api/maps
 * Get all the maps for a given mappool (if the user has access)
 */
type GetMapsQuery = {
  tourney: string; // identifier for the tourney
  stage: string; // which pool, e.g. qf, sf, f, gf
};
type GetMapsResponse = ITourneyMap[] | { error: string };

mapRouter.getAsync(
  "/maps",
  async (req: Request<GetMapsQuery, {}>, res: Response<GetMapsResponse>) => {
    const [tourney, maps] = await Promise.all([
      Tournament.findOne({ code: req.query.tourney }).orFail(),
      TourneyMap.find({ tourney: req.query.tourney, stage: req.query.stage }),
    ]);

    // if super hacker kiddo tries to view a pool before it's released
    const stageData = tourney.stages.filter((s) => s.name === req.query.stage)[0];
    if (!stageData.poolVisible && !canViewHiddenPools(req.user, req.query.tourney)) {
      res.status(403).send({ error: "This pool hasn't been released yet!" });
      return;
    }

    const mods = { NM: 0, HD: 1, HR: 2, DT: 3, FM: 4, HT: 5, HDHR: 6, EZ: 7, CV: 8, EX: 9, TB: 10 };
    maps.sort((a, b) => {
      if (mods[a.mod] - mods[b.mod] != 0) {
        return mods[a.mod] - mods[b.mod];
      }
      return a.index - b.index;
    });
    res.send(maps);
  }
);

/**
 * DELETE /api/map
 * Deletes a map from the pool
 */
type DeleteMapBody = {
  id: string; // _id of the map to delete
  tourney: string; // identifier for the tourney
  stage: string; // which pool, e.g. qf, sf, f, gf
};
type DeleteMapResponse = {};

mapRouter.deleteAsync(
  "/map",
  ensure.isPooler,
  async (req: Request<{}, DeleteMapBody>, res: Response<DeleteMapResponse>) => {
    const user = assertUser(req);
    logger.info(`${user.username} deleted ${req.body.id} from ${req.body.stage} pool`);
    await TourneyMap.deleteOne({
      tourney: req.body.tourney,
      stage: req.body.stage,
      _id: req.body.id,
    });
    res.send({});
  }
);

export default mapRouter;
