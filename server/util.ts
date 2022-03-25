import osu from "node-osu";

import { IUser } from "./models/user";
import { UserAuth } from "./permissions/UserAuth";
import { UserRole } from "./permissions/UserRole";
import { Request, UserDocument } from "./types";
import assert from "assert";

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
