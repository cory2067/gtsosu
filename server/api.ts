import { Types } from "mongoose";
import express, { Response } from "express";
import pino from "pino";
import osu from "node-osu";
import fs from "fs";
import { Guild, GuildMember } from "discord.js";

import ensure from "./ensure";
import Match, { IMatch, ModLengthMultiplier, WarmupMod } from "./models/match";
import QualifiersLobby from "./models/qualifiers-lobby";
import StageStats, { IStageStats } from "./models/stage-stats";
import Team, { PopulatedTeam, ITeam } from "./models/team";
import Tournament, { ITournament, TourneyStage } from "./models/tournament";
import TourneyMap, { ITourneyMap } from "./models/tourney-map";
import User, { UserTourneyStats, IUser } from "./models/user";
import {
  getOsuApi,
  checkPermissions,
  getTeamMapForMatch,
  assertUser,
  getGamemodeId,
  getApiCompliantGamemode,
} from "./util";
import { Request, BaseRequestArgs } from "./types";
import { discordClient } from "./server";

import mapRouter from "./api/map";
import donationRouter from "./api/donation";

import { addAsync } from "@awaitjs/express";
import { UserAuth } from "./permissions/UserAuth";
import { UserRole, managementRoles } from "./permissions/UserRole";
const router = addAsync(express.Router());

const logger = pino();
const osuApi = getOsuApi();
const CONTENT_DIR = fs.readdirSync(`${__dirname}/../client/src/content`);
const mpRegex1 = new RegExp(`^https:\/\/osu\.ppy.sh\/community\/matches\/([0-9]+)$`);
const mpRegex2 = new RegExp(`^https:\/\/osu\.ppy.sh\/mp\/([0-9]+)$`);

// Populate each request with tourney-level user auth
router.use((req: Request<BaseRequestArgs, BaseRequestArgs>, res, next) => {
  const auth = new UserAuth(req.user);
  const tourney = req.body.tourney ?? req.query.tourney;
  req.auth = tourney ? auth.forTourney(tourney) : auth.forGlobal();
  next();
});

// Parts of the API are gradually being split out into separate files
// These are the sub-routers that have been migrated/refactored
router.use(mapRouter);
router.use(donationRouter);
// ----------------------

const isAdmin = (user: IUser | undefined, tourney: string) => checkPermissions(user, tourney, []);
const canViewHiddenPools = (user: IUser, tourney: string) =>
  new UserAuth(user)
    .forTourney(tourney)
    .hasAnyRole([
      UserRole.Mappooler,
      UserRole.Showcase,
      UserRole.AllStarMappooler,
      UserRole.HeadPooler,
      UserRole.Mapper,
      UserRole.Playtester,
    ]);

const cantPlay = (user: IUser, tourney: string) =>
  user.admin || new UserAuth(user).forTourney(tourney).hasAnyRole(managementRoles);

const parseMatchId = (mpLink: string | undefined) => {
  if (!mpLink) return undefined;
  const found = mpLink.match(mpRegex1) || mpLink.match(mpRegex2);
  return found ? found[1] : undefined;
};

const canEditWarmup = async (user: IUser | undefined, playerNo: 1 | 2, match: IMatch) => {
  const now = Date.now();

  // Admin can always edit warmup
  if (isAdmin(user, match.tourney)) return true;

  // Players can't edit if the match is in less than 1 hour
  if (match.time.getTime() - now < 3600000) {
    return false;
  }

  const teams = await getTeamMapForMatch(match, playerNo);
  return new UserAuth(user).forMatch({ match, playerNo, teams }).hasRole(UserRole.Captain);
};

const parseWarmup = async (warmup: string, mod: WarmupMod, tourney: string) => {
  if (!warmup) {
    throw new Error("No warmup submitted");
  }

  let warmupMapId = warmup;
  if (warmupMapId.startsWith("http")) {
    warmupMapId = warmup.split("/").pop()!;
  }
  if (isNaN(parseInt(warmupMapId))) {
    throw new Error("This isn't a link to a beatmap");
  }

  const map = await TourneyMap.findOne({
    mapId: parseInt(warmupMapId),
    tourney,
  });
  if (!!map) {
    throw new Error("This beatmap is part of the map pool");
  }

  // Fetch tourney object to get the correct game mode
  const tourneyData = await Tournament.findOne({ code: tourney }).orFail();

  // Make taiko the default mode (old tourney data doesn't seem to have mode defined)
  tourneyData.mode ??= "taiko";

  let mapData: osu.Beatmap;
  try {
    mapData = (
      await osuApi.getBeatmaps({ b: warmupMapId, m: getGamemodeId(tourneyData.mode), a: 1 })
    )[0];
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
  if (mapData.length.drain * ModLengthMultiplier[mod] > 180) {
    throw new Error("Warmup map too long (max 3 minutes)");
  }

  const apiCompliantGamemode = getApiCompliantGamemode(tourneyData.mode);
  return `https://osu.ppy.sh/beatmapsets/${mapData.beatmapSetId}#${apiCompliantGamemode}/${warmupMapId}`;
};

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

  const tourney = await Tournament.findOne({ code: req.body.tourney }).orFail();
  const mode = getGamemodeId(tourney.mode);
  const userData = await osuApi.getUser({ u: req.user.userid, m: mode, type: "id" });

  const username = userData.name;
  const userid = userData.id;
  const rank = userData.pp.rank;
  const country = userData.country;

  if (!tourney.registrationOpen) {
    logger.info(`${req.user.username} failed to register for ${req.body.tourney} (registrations closed)`);
    return res.status(400).send({ error: `Registrations are closed.` });
  }

  if ((tourney.blacklist || []).includes(userid)) {
    logger.info(`${req.user.username} failed to register for ${req.body.tourney} (blacklisted)`);
    return res.status(400).send({ error: `You are banned from participating in this tourney.` });
  }

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

  if (tourney.discordServerId) {
    if (!req.user.discordId) {
      logger.info(
        `${req.user.username} failed to register for ${req.body.tourney} (discord account not linked)`
      );
      return res.status(400).send({
        error: "Please link your Discord account in your user settings and then try again.",
      });
    }

    let theDiscordServer: Guild | undefined = undefined;
    try {
      theDiscordServer = await discordClient.guilds.fetch(tourney.discordServerId);
    } catch (e) {
      if (e.code === 10004) {
        logger.info(
          `${req.user.username} failed to register for ${req.body.tourney} (discord server not found)`
        );
        return res.status(400).send({ error: "Discord server not found - contact staff" });
      } else {
        logger.info(e);
        return res.status(400).send({ error: "Unknown error - contact staff" });
      }
    }

    let theDiscordMember: GuildMember | undefined = undefined;
    try {
      theDiscordMember = await theDiscordServer.members.fetch(req.user.discordId);
    } catch (e) {
      if (e.code === 10007) {
        logger.info(
          `${req.user.username} failed to register for ${req.body.tourney} (discord server not joined)`
        );
        return res.status(400).send({ error: "You have not joined the Discord server." });
      } else {
        logger.info(e);
        return res.status(400).send({ error: "Unknown error - contact staff" });
      }
    }

    logger.info(
      `Successfully confirmed that ${theDiscordMember.user.username} is a member of ${theDiscordServer.name}`
    );
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

  const teams = await Team.find({ tourney: req.body.tourney });
  const teamNames = teams.map((team) => team.name);
  if (teamNames.includes(req.body.name)) {
    return res.status(400).send({ error: "There is a registered team with this name already." });
  }

  const tourney = await Tournament.findOne({ code: req.body.tourney }).orFail();

  const minTeamSize = tourney.minTeamSize || 3;
  const maxTeamSize = tourney.maxTeamSize || 6;
  const numPlayers = req.body.players.length;
  if (numPlayers < minTeamSize || numPlayers > maxTeamSize) {
    return res
      .status(400)
      .send({ error: `A team must have ${minTeamSize} to ${maxTeamSize} players` });
  }

  if (numPlayers !== new Set(req.body.players).size) {
    return res.status(400).send({ error: "Team can't have duplicate players" });
  }

  const representedCountries = new Set();
  const updates: Array<Array<Object>> = [];
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

    if (user && user.tournies.includes(req.body.tourney)) {
      logger.info(`${username} failed to register for ${req.body.tourney} (already registered)`);
      return res.status(400).send({ error: `${username} is already registered for this tourney.` });
    }

    const userid = userData.id;
    if ((tourney.blacklist || []).includes(userid)) {
      logger.info(`${username} failed to register for ${req.body.tourney} (blacklisted)`);
      return res
        .status(400)
        .send({ error: `${username} is banned from participating in this tourney.` });
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
    representedCountries.add(userData.country);
  }

  for (const country of tourney.requiredCountries || []) {
    if (!representedCountries.has(country)) {
      logger.info(
        `${req.body.players} failed to register for ${req.body.tourney} (country requirement not met)`
      );
      return res
        .status(400)
        .send({ error: `Team is missing required represented country: ${country}` });
    }
  }

  const players = await Promise.all(
    updates.map((updateArgs) => User.findOneAndUpdate(...updateArgs))
  );

  for (const p of players) {
    if (!p) {
      // using findOneAndUpdate(...).orFail() behaves oddly, so manually checking
      logger.warn("Failed registration for this update:");
      logger.warn(updates);
      return res.status(500).send({ error: "Failed to register players - contact staff" });
    }
  }

  const team = new Team({
    name: req.body.name,
    players: players.map((p) => p!._id),
    tourney: req.body.tourney,
    country: players[0]!.country,
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
  logger.info(
    `${req.body.username} registered for ${req.body.tourney} (forced by ${req.user.username})`
  );

  const tourney = await Tournament.findOne({ code: req.body.tourney }).orFail();
  const mode = getGamemodeId(tourney.mode);
  const userData = await osuApi.getUser({ u: req.body.username, m: mode });
  const user = await User.findOneAndUpdate(
    { userid: userData.id },
    {
      $push: {
        tournies: req.body.tourney,
        stats: { regTime: new Date(), tourney: req.body.tourney },
      },
      $set: {
        rank: userData.pp.rank,
        username: userData.name,
        country: userData.country,
        avatar: `https://a.ppy.sh/${userData.id}`,
      },
    },
    { new: true, upsert: true }
  );
  res.send(user);
});

/**
 * POST /api/settings
 * Submit settings for a user
 * Params:
 *   - timezone: player's timezone
 *   - cardImage: custom background image for user card
 */
router.postAsync("/settings", ensure.loggedIn, async (req, res) => {
  logger.info(`${req.user.username} updated user settings`);
  await User.findByIdAndUpdate(req.user._id, {
    $set: { timezone: req.body.timezone, cardImage: req.body.cardImage },
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
 * Get staff list for a tourney, or all GTS Team members if tourney isn't specified
 * Params:
 *   - tourney: identifier for the tournament
 */
router.getAsync("/staff", async (req, res) => {
  if (req.query.tourney) {
    const staff = await User.find({ "roles.tourney": req.query.tourney });
    res.send(staff);
    return;
  }

  const allStaff = await User.find({ "roles.0": { $exists: true } });
  const allGtsTournies = (await Tournament.find({ category: { $in: ["gts", undefined] } }, "code")).map(tourney => tourney.code);
  allStaff.forEach(user => user.roles = user.roles.filter(role => allGtsTournies.includes(role.tourney)));
  const allStaffFiltered = allStaff.filter(user => user.roles.length > 0);
  res.send(allStaffFiltered);
});

/**
 * POST /api/staff
 * Add player as staff for a tourney
 * Params:
 *   - username: username of the new staff member
 *   - tourney: identifier for the tournament
 *   - role: role in the tournament
 *   - roles: array of roles in the tournament. If this is set, role is ignored
 */
router.postAsync("/staff", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} added ${req.body.username} as ${req.body.tourney} staff`);

  const roles: IUser["roles"] = [];
  if (req.body.roles) {
    req.body.roles.forEach((role) => {
      roles.push({ tourney: req.body.tourney, role });
    });
  } else {
    roles.push({ tourney: req.body.tourney, role: req.body.role });
  }

  const userData = await osuApi.getUser({ u: req.body.username, m: 1 });
  const user = await User.findOneAndUpdate(
    { userid: userData.id },
    {
      $set: {
        username: userData.name,
        country: userData.country,
        avatar: `https://a.ppy.sh/${userData.id}`,
      },
      $push: { roles },
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
    tourney.stages = [{ ...stages[0], mappack: "" }];
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
 *   - minTeamSize: minimum number of players on a team
 *   - maxTeamSize: maximum number of players on a team
 *   - countries: what countries can participate in this tourney (empty if all)
 *   - requiredCountries: which countries are required to be represented when registering as a team (empty if none)
 *   - rankMin / rankMax: rank restriction
 *   - stages: what stages this tourney consists of
 *   - flags: list of special options for the tourney
 *   - lobbyMaxSignups: number of players/teams that can sign up for a given qualifier lobby
 *   - blacklist: list of player ids that are banned from registering for this tourney
 *   - discordServerId: a Discord server ID to enforce membership of
 *   - mode: osu! gamemode (supports "taiko" or "catch")
 *   - category: category of the tourney
 */
router.postAsync("/tournament", ensure.isAdmin, async (req, res) => {
  logger.info(`${req.user.username} updated settings for ${req.body.tourney}`);

  let tourney =
    (await Tournament.findOne({ code: req.body.tourney })) ??
    new Tournament({
      code: req.body.tourney,
    });

  tourney.registrationOpen = req.body.registrationOpen;
  tourney.teams = req.body.teams;
  tourney.minTeamSize = req.body.minTeamSize;
  tourney.maxTeamSize = req.body.maxTeamSize;
  tourney.rankMin = req.body.rankMin;
  tourney.rankMax = req.body.rankMax;
  tourney.countries = req.body.countries;
  tourney.requiredCountries = req.body.requiredCountries;
  tourney.flags = req.body.flags;
  tourney.lobbyMaxSignups = req.body.lobbyMaxSignups;
  tourney.blacklist = req.body.blacklist;
  tourney.discordServerId = req.body.discordServerId;
  tourney.mode = req.body.mode;
  tourney.category = req.body.category;
  tourney.stages = req.body.stages.map((stage) => {
    // careful not to overwrite existing stage data
    const existing = tourney.stages.filter((s) => s.name === stage)[0];
    return existing || { name: stage, poolVisible: false, mappack: "", statsVisible: false };
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
  const tourney = await Tournament.findOne({ code: req.body.tourney }).orFail();
  tourney.stages[req.body.index].mappack = req.body.stage.mappack;
  tourney.stages[req.body.index].poolVisible = req.body.stage.poolVisible;

  // Only admin is allowed to toggle stats visibility (undefined is treated as false)
  // (Only make this check when statsVisible is set in the request)
  if (
    req.body.stage.statsVisible !== undefined &&
    req.body.stage.statsVisible != (tourney.stages[req.body.index].statsVisible ?? false)
  ) {
    if (!isAdmin(req.user, req.body.tourney)) {
      logger.warn(`${req.user.username} attempted to toggle stage stats visibility`);
      return res
        .status(403)
        .send({ error: "You don't have permission to toggle stage stats visibility" });
    }
    tourney.stages[req.body.index].statsVisible = req.body.stage.statsVisible;
  }

  // Only admin is allowed to change reschedule deadline
  // (Only make this check when rescheduleDeadline is set in the request)
  if (
    req.body.stage.rescheduleDeadline !== undefined &&
    new Date(req.body.stage.rescheduleDeadline).getTime() !== (tourney.stages[req.body.index].rescheduleDeadline?.getTime() || 0)
  ) {
    if (!isAdmin(req.user, req.body.tourney)) {
      logger.warn(`${req.user.username} attempted to edit stage reschedule deadline`);
      return res
        .status(403)
        .send({ error: "You don't have permission to edit stage reschedule deadline" });
    }
    tourney.stages[req.body.index].rescheduleDeadline = new Date(req.body.stage.rescheduleDeadline);
  }

  logger.info(`${req.user.username} updated stage ${req.body.index} of ${req.body.tourney}`);
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

type SubmitWarmupBody = {
  match: string; // Match ID
  playerNo: 1 | 2; // Player number in match (1 or 2)
  warmup: string; // Warmup map link or ID
  mod: WarmupMod; // Mod used for warmup (only NM or DT is supported, defaults to NM)
};
/**
 * POST /api/warmup
 * Submit a warmup
 */
router.postAsync("/warmup", ensure.loggedIn, async (req: Request<{}, SubmitWarmupBody>, res) => {
  const match = await Match.findOne({ _id: req.body.match }).orFail();
  const user = assertUser(req);
  if (!(await canEditWarmup(user, req.body.playerNo, match))) {
    logger.warn(
      `${user.username} tried to submit player ${req.body.playerNo} warmup for ${req.body.match}`
    );
    return res.status(403).send("You don't have permission to do that");
  }
  try {
    // Make sure mod is valid, if it's not default to nm
    if (req.body.mod != "DT") {
      req.body.mod = "NM";
    }
    match[`warmup${req.body.playerNo}`] = await parseWarmup(
      req.body.warmup,
      req.body.mod || "NM",
      match.tourney
    );
    match[`warmup${req.body.playerNo}Mod`] = req.body.mod;
  } catch (e) {
    res.status(400).send(e.message);
    return;
  }
  logger.info(`${user.username} submitted warmup ${req.body.warmup}`);
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
router.deleteAsync("/warmup", ensure.loggedIn, async (req, res) => {
  const match = await Match.findOne({ _id: req.body.match }).orFail();
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
 * POST /api/edit-match
 * Edit a tourney match
 * Params:
 *   - match: the _id of the match
 *   - tourney: identifier for the tournament
 *   - time: the new match time (in UTC)
 *   - code: the new match id
 *   - player1, player2: the player usernames
 */
router.postAsync("/edit-match", ensure.isAdmin, async (req, res) => {
  const newMatch = await Match.findOneAndUpdate(
    { _id: req.body.match },
    {
      $set: {
        time: req.body.time ? new Date(req.body.time) : undefined,
        code: req.body.code,
        player1: req.body.player1,
        player2: req.body.player2,
      },
    },
    { new: true, omitUndefined: true }
  ).orFail();

  logger.info(`${req.user.username} edited ${req.body.tourney} match ${newMatch.code}`);
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
 */
type SubmitResultsBody = {
  tourney: string; // identifier for the tournament
  match: string; // the _id of the match
  score1: number; // score of player1
  score2: number; //score of player2
  bans1: number[]; // map ids banned by player1
  bans2: number[]; // map ids banned by player2
  link: string; // mp link of the match
};
type SubmitResultsResponse = IMatch | { message: string };

router.postAsync(
  "/results",
  ensure.isRef,
  async (req: Request<{}, SubmitResultsBody>, res: Response<SubmitResultsResponse>) => {
    const user = assertUser(req);
    logger.info(`${user.username} submitted results for match ${req.body.match}`);

    // If ref didn't submit an mp link (e.g. forfeit), only update the scores and exit
    if (!req.body.link) {
      const newMatch = await Match.findOneAndUpdate(
        { _id: req.body.match, tourney: req.body.tourney },
        {
          $set: {
            score1: req.body.score1 || 0,
            score2: req.body.score2 || 0,
            bans1: req.body.bans1 || [],
            bans2: req.body.bans2 || [],
            link: "",
          },
        },
        { new: true }
      ).orFail();
      res.send(newMatch);
      return;
    }

    // Parse the mp link and update stats
    const matchId = parseMatchId(req.body.link);
    if (!matchId) {
      logger.info("Invalid MP link");
      res.status(400).send({ message: "Invalid MP link" });
      return;
    }

    const newMatch = await Match.findOneAndUpdate(
      { _id: req.body.match, tourney: req.body.tourney },
      {
        $set: {
          score1: req.body.score1 || 0,
          score2: req.body.score2 || 0,
          bans1: req.body.bans1 || [],
          bans2: req.body.bans2 || [],
          link: req.body.link,
        },
      },
      { new: true }
    ).orFail();

    await fetchMatchesAndUpdateStageStats(req.body.tourney, newMatch.stage, [matchId]);
    res.send(newMatch);
  }
);

/**
 * POST /api/referee
 * Add referee to a match
 * Params:
 *  - match: the _id of the match
 *  - user: name of the person to add
 *  - tourney: identifier for the tournament
 */
router.postAsync("/referee", ensure.isRef, async (req, res) => {
  const match = await Match.findOne({ _id: req.body.match, tourney: req.body.tourney }).orFail();

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
  ).orFail();

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
  const match = await Match.findOne({ _id: req.body.match, tourney: req.body.tourney }).orFail();

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
  ).orFail();

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
  ).orFail();

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
  ).orFail();

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
  const lobby = await QualifiersLobby.findOne({
    _id: req.body.lobby,
    tourney: req.body.tourney,
  }).orFail();

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
  // Prevent non-admin signing up another player
  if (req.body.user && !isAdmin(req.user, req.body.tourney)) {
    logger.warn(`${req.user.username} attempted to sign another player up`);
    return res.status(403).send({});
  }
  // Prevent non-registered player signing up self
  if (!req.body.user && !req.user.tournies.includes(req.body.tourney)) {
    logger.warn(`${req.user.username} attempted to sign up without being registered`);
    return res.status(403).send({});
  }

  const tourney = await Tournament.findOne({ code: req.body.tourney });
  const lobby = await QualifiersLobby.findOne({
    _id: req.body.lobby,
    tourney: req.body.tourney,
  });

  // Prevent non-admin signing up after the deadline
  const qualifiersStage = tourney?.stages.find(stage => stage.name === "Qualifiers")
  if (!isAdmin(req.user, req.body.tourney) && new Date() > (qualifiersStage!.rescheduleDeadline ?? new Date(0))) {
    logger.warn(`${req.user.username} attempted to reschedule after the deadline`);
    return res.status(403).send({ message: "The reschedule deadline has passed" });
  }

  // Prevent registered player signing up self for a full lobby
  if (
    tourney!.lobbyMaxSignups &&
    !req.body.user &&
    lobby!.players.length >= tourney!.lobbyMaxSignups
  ) {
    logger.warn(`${req.user.username} attempted to sign up to a full lobby`);
    return res.status(403).send({ message: "Lobby is full", updatedLobby: lobby });
  }

  logger.info(
    `${req.user.username} signed ${req.body.user ?? "self"} up for quals lobby ${
      req.body.lobby
    } in ${req.body.tourney}`
  );

  const toAdd =
    req.body.user ??
    (req.body.teams
      ? (await Team.findOne({ players: req.user._id, tourney: req.body.tourney }).orFail()).name
      : req.user.username);

  const newLobby = await QualifiersLobby.findOneAndUpdate(
    {
      _id: req.body.lobby,
      tourney: req.body.tourney,
    },
    { $addToSet: { players: toAdd } },
    { new: true }
  );
  res.send(newLobby);
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
    // Prevent non-admin signing up after the deadline
    const tourney = await Tournament.findOne({ code: req.body.tourney });
    const lobby = await QualifiersLobby.findOne({
      _id: req.body.lobby,
      tourney: req.body.tourney,
    });
    const qualifiersStage = tourney?.stages.find(stage => stage.name === "Qualifiers")
    if (new Date() > (qualifiersStage!.rescheduleDeadline ?? new Date(0))) {
      logger.warn(`${req.user.username} attempted to reschedule after the deadline`);
      return res.status(403).send({ message: "The reschedule deadline has passed" });
    }

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

const fetchMatchesAndUpdateStageStats = async (tourney, stage, mpIds) => {
  const mappool = await TourneyMap.find({ tourney, stage });
  const stageMapIds = mappool.map((map) => map.mapId);
  const useridToTeamMap = new Map();
  (await Team.find({ tourney }).populate<PopulatedTeam>("players")).forEach((team) =>
    team.players.forEach((player) => useridToTeamMap.set(player.userid, team.name))
  );
  const tourneyPlayers = new Map();
  (await User.find({ tournies: tourney })).forEach((player) =>
    tourneyPlayers.set(player.userid, player)
  );
  let stageStats = await StageStats.findOne({ tourney, stage });
  if (!stageStats) {
    stageStats = new StageStats({ tourney, stage, maps: [] });
  }

  for (const mpId of mpIds) {
    const mpData = await osuApi.getMatch({ mp: mpId });
    for (const game of mpData.games) {
      const mapId = Number(game.beatmapId);
      if (stageMapIds.includes(mapId)) {
        if (!stageStats.maps.find((map) => map.mapId === mapId)) {
          stageStats.maps.push({ mapId: mapId, playerScores: [], teamScores: [] });
        }
        const mapStats = stageStats.maps.find((map) => map.mapId === mapId)!;
        const newTeamScores = new Map();

        for (const score of game.scores) {
          // Skip tracking players that aren't registered in the tourney
          if (!tourneyPlayers.has(score.userId)) continue;

          let mod = "";
          if (Number(score.raw_mods) & 8) mod += "HD";
          if (Number(score.raw_mods) & 16) mod += "HR";

          const playerId = Number(score.userId);
          const newPlayerScore = { userId: playerId, score: Number(score.score), mod };

          // Update player high score
          const previousPlayerScore = mapStats.playerScores.find(
            (playerScore) => playerScore.userId === playerId
          );
          if (!previousPlayerScore) {
            mapStats.playerScores.push(newPlayerScore);
          } else if (previousPlayerScore.score < newPlayerScore.score) {
            mapStats.playerScores = mapStats.playerScores.map((playerScore) => {
              if (playerScore.userId === playerId) {
                return newPlayerScore;
              }
              return playerScore;
            });
          }

          // Add to player's team's score
          const playerTeamName = useridToTeamMap.get(String(playerId));
          if (playerTeamName) {
            if (!newTeamScores.has(playerTeamName)) newTeamScores.set(playerTeamName, 0);
            newTeamScores.set(
              playerTeamName,
              newTeamScores.get(playerTeamName) + newPlayerScore.score
            );
          }
        }

        // Update team high scores
        for (let [teamName, teamScore] of newTeamScores.entries()) {
          const previousTeamScore = mapStats.teamScores.find(
            (teamScore) => teamScore.teamName === teamName
          );
          const newTeamScore = { teamName, score: teamScore };
          if (!previousTeamScore) {
            mapStats.teamScores.push(newTeamScore);
          } else if (previousTeamScore.score < newTeamScore.score) {
            mapStats.teamScores = mapStats.teamScores.map((teamScore) => {
              if (teamScore.teamName === teamName) {
                return newTeamScore;
              }
              return teamScore;
            });
          }
        }
      }
    }
  }

  await stageStats.save();
  return stageStats;
};

/**
 * POST /api/lobby-results
 * Submit the mp link for a qualifiers lobby
 * Params:
 *   - tourney: identifier for the tournament
 *   - lobby: the _id of the lobby
 *   - link: mp link
 */
router.postAsync("/lobby-results", ensure.isRef, async (req, res) => {
  logger.info(
    `${req.user.username} submitted mp link ${req.body.link} for qualifiers lobby ${req.body.lobby}`
  );
  const matchId = parseMatchId(req.body.link);
  if (!matchId) {
    logger.info("Invalid MP link");
    return res.status(400).send({ message: "Invalid MP link" });
  }

  await fetchMatchesAndUpdateStageStats(req.body.tourney, "Qualifiers", [matchId]);

  const newLobby = await QualifiersLobby.findOneAndUpdate(
    { _id: req.body.lobby, tourney: req.body.tourney },
    {
      $set: { link: req.body.link },
    },
    { new: true }
  );

  res.send(newLobby);
});

/**
 * GET /api/stage-stats
 * Get stats for a tournament stage
 * Params:
 *   - tourney: identifier for the tournament
 *   - stage: identifier for the stage
 */
router.getAsync("/stage-stats", async (req, res) => {
  const tourney = await Tournament.findOne({ code: req.query.tourney });
  if (!tourney) return res.send({});
  const theStage = tourney.stages.find((stage) => stage.name === req.query.stage);
  if (!theStage) {
    res.status(404).send({ error: "Stage doesn't exist" });
    return;
  }

  if (!isAdmin(req.user, req.query.tourney) && !theStage.statsVisible)
    return res.status(403).send({ error: "This stage's stats aren't released yet!" });
  const stageStats = await StageStats.findOne({
    tourney: req.query.tourney,
    stage: req.query.stage,
  });
  res.send(stageStats);
});

/**
 * POST /api/stage-stats
 * Edit stats for a tournament stage
 * Params:
 *   - stats: updated StageStats object
 */
router.postAsync("/stage-stats", ensure.isAdmin, async (req, res) => {
  const updatedStageStats = await StageStats.findOneAndUpdate(
    { tourney: req.body.stats.tourney, stage: req.body.stats.stage },
    req.body.stats,
    { new: true, upsert: true }
  );
  res.send(updatedStageStats);
});

/**
 * POST /api/refetch-stats
 * Refretches the stats of a batch of mp links in a stage
 */
type RefetchStatsBody = {
  tourney: string; // identifier for the tourney
  stage: string; // which pool, e.g. qf, sf, f, gf
};
type RefetchStatsResponse = IStageStats;

router.postAsync(
  "/refetch-stats",
  ensure.isAdmin,
  async (req: Request<{}, RefetchStatsBody>, res: Response<RefetchStatsResponse>) => {
    const user = assertUser(req);
    logger.info(
      `${user.username} initiated a refresh of ${req.body.tourney}/${req.body.stage} stats`
    );

    const matchIdExists = (id: string | undefined): id is string => !!id;
    let matchIds: string[] = [];

    if (req.body.stage === "Qualifiers") {
      const lobbies = await QualifiersLobby.find({ tourney: req.body.tourney });
      matchIds = lobbies.map((lobby) => parseMatchId(lobby.link)).filter(matchIdExists);
    } else {
      const match = await Match.find({ tourney: req.body.tourney, stage: req.body.stage });
      matchIds = match.map((match) => parseMatchId(match.link)).filter(matchIdExists);
    }

    const updatedStageStats = await fetchMatchesAndUpdateStageStats(
      req.body.tourney,
      req.body.stage,
      matchIds
    );
    res.send(updatedStageStats);
  }
);

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
  )
    .orFail()
    .populate<PopulatedTeam>("players");

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
  // Unregister the players as well if the tourney has registerAsTeam flag enabled
  const tourney = await Tournament.findOne({ code: req.body.tourney }).orFail();
  if (tourney.flags.includes("registerAsTeam")) {
    const team = await Team.findOne({ _id: req.body._id }).orFail();
    await Promise.all(
      team.players.map((player) =>
        User.findOneAndUpdate(
          { _id: player._id },
          { $pull: { tournies: req.body.tourney, stats: { tourney: req.body.tourney } } }
        )
      )
    );
  }
  await Team.deleteOne({ _id: req.body._id });
  res.send({});
});

/**
 * POST /api/team-stats
 * Set stats/details about an existing team
 * Params:
 *   - tourney: the identifier for the tourney
 *   - teamStats: Array of:
 *     - _id: the _id of the team
 *     - seedName: i.e. Top, High, Mid, or Low
 *     - seedNum: the team's rank in the seeding
 *     - group: one character capitalized group name
 */
type TeamStatsBody = {
  tourney: string;
  teamStats: Array<{
    _id: Types.ObjectId;
    seedName: string;
    seedNum: number;
    group: string;
  }>;
};
type TeamStatsResponse = Array<ITeam>;

router.postAsync(
  "/team-stats",
  ensure.isAdmin,
  async (req: Request<{}, TeamStatsBody>, res: Response<TeamStatsResponse>) => {
    const teams = await Promise.all(
      req.body.teamStats.map((teamStats) => {
        return Team.findOneAndUpdate(
          { _id: teamStats._id },
          {
            $set: {
              seedName: teamStats.seedName,
              seedNum: teamStats.seedNum,
              group: teamStats.group,
            },
          },
          { new: true }
        )
          .orFail()
          .populate<ITeam>("players");
      })
    );

    if (req.body.teamStats.length === 1) {
      logger.info(`${req.user!.username} set stats for ${teams[0].name} in ${req.body.tourney}`);
    }
    if (req.body.teamStats.length > 1) {
      logger.info(`${req.user!.username} set stats multiple teams in ${req.body.tourney}`);
    }
    res.send(teams);
  }
);

/**
 * POST /api/player-stats
 * Set stats/details about an existing player
 * Params:
 *   - tourney: the code of the tourney
 *   - playerStats: Array of:
 *     - _id: the _id of the player
 *     - stats: object with properties:
 *       - seedName: i.e. Top, High, Mid, or Low
 *       - seedNum: the player's rank in the seeding
 *       - group: one character capitalized group name
 *       - regTime: the date/time the player registered
 */
type PlayerStatsBody = {
  tourney: string; // identifier for the tourney
  playerStats: Array<{
    _id: Types.ObjectId;
    stats: UserTourneyStats;
  }>;
};
type PlayerStatsResponse = Array<IUser>;

router.postAsync(
  "/player-stats",
  ensure.isAdmin,
  async (req: Request<{}, PlayerStatsBody>, res: Response<PlayerStatsResponse>) => {
    await Promise.all(
      req.body.playerStats.map((playerStats) => {
        return User.findOneAndUpdate(
          { _id: playerStats._id },
          { $pull: { stats: { tourney: req.body.tourney } } }
        );
      })
    );

    const users = await Promise.all(
      req.body.playerStats.map((playerStats) => {
        return User.findOneAndUpdate(
          { _id: playerStats._id },
          {
            $push: {
              stats: {
                ...playerStats.stats,
                tourney: req.body.tourney,
              },
            },
          },
          { new: true }
        ).orFail();
      })
    );

    if (req.body.playerStats.length === 1) {
      logger.info(
        `${req.user!.username} set stats for ${users[0].username} in ${req.body.tourney}`
      );
    }
    if (req.body.playerStats.length > 1) {
      logger.info(`${req.user!.username} set stats multiple players in ${req.body.tourney}`);
    }
    res.send(users);
  }
);

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

  const tourney = await Tournament.findOne({ code: req.body.tourney }).orFail();
  const mode = getGamemodeId(tourney.mode);
  console.log(mode);
  const players = await User.find({ tournies: req.body.tourney })
    .skip(req.body.offset)
    .limit(BATCH_SIZE);

  await Promise.all(
    players.map(async (p) => {
      try {
        const userData = await osuApi.getUser({ u: p.userid, m: mode, type: "id" });
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
  const { title, artist, creator } = mapData;
  const [sameDiff, sameSet, sameSong] = await Promise.all([
    TourneyMap.find({ mapId }),
    TourneyMap.find({ mapId: { $ne: mapId }, title, artist, creator }),
    TourneyMap.find({ creator: { $ne: creator }, title, artist }),
  ]);

  res.send({ sameDiff, sameSet, sameSong, mapData });
});

/**
 * GET /api/custom-songs
 * Gets all the GTS tourney maps that are marked as custom songs
 */
router.getAsync("/custom-songs", async (req, res) => {
  const maps = await TourneyMap.find({ customSong: true });
  const output: ITourneyMap[] = [];

  // To avoid repeated db calls
  const tournamentCache: { [key: string]: ITournament } = {};

  // To avoid repeated stage search
  const stageCache: { [key: string]: TourneyStage } = {};

  // Pre-fetch all tournies to avoid repeated db calls to find individual tournies
  const tourniesFromDb = await Tournament.find();
  tourniesFromDb.forEach((tourney) => {
    tournamentCache[tourney.code] = tourney;
  });

  for (const map of maps) {
    let tourney = tournamentCache[map.tourney];

    // Keeping this here in case the pre-fetch above doesn't fetch all tournies for some reason
    if (!tourney) {
      let fetchedTourney = await Tournament.findOne({ code: map.tourney });
      if (fetchedTourney) {
        tourney = fetchedTourney;
        tournamentCache[map.tourney] = tourney;
      } else {
        // If tournament is not found, skip this map
        continue;
      }
    }

    const stageKey = `${tourney.code}-${map.stage}`;
    let stage = stageCache[stageKey];
    if (!stage) {
      let foundStage = tourney.stages.find((stage) => stage.name === map.stage);
      if (!foundStage) {
        // If stage is not found, skip this map
        continue;
      }
      stage = foundStage;
      stageCache[stageKey] = stage;
    }

    // Show map only if the pool is visible
    if (stage.poolVisible) {
      output.push(map);
    }
  }

  res.send(output);
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
      return a!.localeCompare(b!);
    });

  res.send({ languages });
});

router.all("*", (req, res) => {
  logger.warn(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

export default router;
