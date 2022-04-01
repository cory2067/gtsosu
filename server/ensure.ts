// Ensure a user has a certain permission before allowing access
import pino from "pino";
import { UserAuth } from "./permissions/UserAuth";
import { UserRole } from "./permissions/UserRole";
const logger = pino();

function loggedIn(req, res, next) {
  if (!req.user || !req.user.username) {
    return res.status(401).send({ error: "Not logged in, refusing access." });
  }

  next();
}

/**
 * @deprecated Use UserAuth directly instead
 *
 * ensure the user is an admin, or otherwise has one of the roles specified in userRoles
 * @param userRoles
 * @param title
 * @returns
 */
function ensure(userRoles: UserRole[], title: string) {
  return (req, res, next) => {
    if (!req.user || !req.user.username) {
      return res.status(401).send({ error: "Not logged in, refusing access." });
    }

    const tourney = req.body.tourney || req.query.tourney;

    if (tourney) {
      const auth = new UserAuth(req.user).forTourney(tourney);
      if (auth.hasAnyRole(userRoles)) {
        return next();
      }
    }

    logger.warn(`${req.user.username} attempted to gain ${title} access!`);
    return res.status(403).send({ error: "You do not have permission to access this." });
  };
}

// Do we wanna define sets of user roles (like pooler) as constants UserRoles instead?
export default {
  /** @deprecated */
  isAdmin: ensure([], "admin"),
  /** @deprecated */
  isPooler: ensure(
    [UserRole.Mapsetter, UserRole.AllStarMapSetter, UserRole.HeadPooler, UserRole.Mapper],
    "pooler"
  ),
  /** @deprecated */
  isRef: ensure([UserRole.Referee], "ref"),
  /** @deprecated */
  isStreamer: ensure([UserRole.Streamer], "streamer"),
  /** @deprecated */
  isCommentator: ensure([UserRole.Commentator], "commentator"),
  loggedIn,
};
