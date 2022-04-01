// Ensure a user has a certain permission before allowing access
import { NextFunction, Response } from "express";
import pino, { P } from "pino";
import { UserAuth } from "./permissions/UserAuth";
import { UserRole } from "./permissions/UserRole";
import { Request } from "./types";
const logger = pino();

function loggedIn(req, res, next) {
  if (!req.user || !req.user.username) {
    return res.status(401).send({ error: "Not logged in, refusing access." });
  }

  next();
}

/**
 * ensure the user is an admin, or otherwise has one of the roles specified in userRoles
 * @param userRoles
 * @param title
 * @returns
 */
function ensure(userRoles: UserRole[], title?: string) {
  return (req: Request<any, any>, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.username) {
      return res.status(401).send({ error: "Not logged in, refusing access." });
    }

    const auth =
      req.auth || new UserAuth(req.user).forTourney(req.body.tourney || req.query.tourney);
    if (auth.hasAnyRole(userRoles)) {
      return next();
    }

    title = title ?? userRoles.join("|");
    logger.warn(`${req.user.username} attempted to gain ${title} access!`);
    return res.status(403).send({ error: "You do not have permission to access this." });
  };
}

// Do we wanna define sets of user roles (like pooler) as constants UserRoles instead?
export default {
  isAdmin: ensure([], "admin"),
  isPooler: ensure(
    [UserRole.Mapsetter, UserRole.AllStarMapSetter, UserRole.HeadPooler, UserRole.Mapper],
    "pooler"
  ),
  isRef: ensure([UserRole.Referee], "ref"),
  isStreamer: ensure([UserRole.Streamer], "streamer"),
  isCommentator: ensure([UserRole.Commentator], "commentator"),
  hasAnyRole: ensure,
  loggedIn,
};
