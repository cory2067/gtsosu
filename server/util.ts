import osu from "node-osu";

import { IUser } from "./models/user";
import { UserAuth } from "./permissions/UserAuth";
import { UserRole } from "./permissions/UserRole";
import { Request, UserDocument } from "./types";
import Team, { PopulatedTeam } from "./models/team";
import Tournament from "./models/tournament";
import assert from "assert";
import { IMatch } from "./models/match";

// Shared utilities used across the backend

export const getOsuApi = () => new osu.Api(process.env.OSU_API_KEY!, { parseNumeric: true });

/**
 * @deprecated Use UserAuth directly instead
 */
export const checkPermissions = (user: IUser | undefined, tourney: string, roles: string[]) => {
  // Might wanna fix the cast, or not since this is deprecated
  return new UserAuth(user).forTourney(tourney).hasAnyRole(roles as UserRole[]);
};

export const assertUser = (req: Request<any, any>): UserDocument => {
  assert(req.user);
  assert(req.user._id);
  return req.user;
};

export const getPlayerName = (match: IMatch, playerNo: 1 | 2) => match[`player${playerNo}`];

// Returns a mapping from {teamName: teamObject} if the match has teams, or undefined otherwise
export const getTeamMapForMatch = async (match: IMatch, playerNo?: 1 | 2) => {
  const tourney = await Tournament.findOne({ code: match.tourney }).orFail();
  if (!tourney.teams) {
    return undefined;
  }

  const getTeam = (name: string) =>
    Team.findOne({ name, tourney: match.tourney }).orFail().populate<PopulatedTeam>("players");

  if (playerNo) {
    const name = getPlayerName(match, playerNo);
    return { [name]: await getTeam(name) };
  }

  const teams = await Promise.all([
    getTeam(getPlayerName(match, 1)),
    getTeam(getPlayerName(match, 2)),
  ]);
  return {
    [getPlayerName(match, 1)]: teams[0],
    [getPlayerName(match, 2)]: teams[1],
  };
};
