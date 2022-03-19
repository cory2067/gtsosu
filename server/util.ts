import osu from "node-osu";

import { IUser } from "./models/user";

// Shared utilities used across the backend

export const getOsuApi = () => new osu.Api(process.env.OSU_API_KEY, { parseNumeric: true });

export const checkPermissions = (user: IUser, tourney: string, roles: string[]) => {
  return (
    user &&
    user.username &&
    (user.admin ||
      user.roles.some(
        (r) => ["Host", "Developer", ...roles].includes(r.role) && r.tourney == tourney
      ))
  );
};
