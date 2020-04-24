// Ensure a user has a certain permission before allowing access
const logger = require("pino")();

function loggedIn(req, res, next) {
  if (!req.user || !req.user.username) {
    return res.status(401).send({ error: "Not logged in, refusing access." });
  }

  next();
}

function ensure(required, title) {
  return (req, res, next) => {
    if (!req.user || !req.user.username) {
      return res.status(401).send({ error: "Not logged in, refusing access." });
    }

    if (req.user.roles.some((r) => required.includes(r.role) && r.tourney === req.body.tourney)) {
      logger.info(`${req.user.username} granted ${title} access`);
      return next();
    }

    return res.status(403).send({ error: "You do not have permission to access this." });
  };
}

module.exports = {
  isAdmin: ensure(["Host", "Developer"], "admin"),
  isPooler: ensure(["Host", "Developer", "Mapsetter"], "pooler"),
  isRef: ensure(["Host", "Developer", "Referee", "Streamer", "Commentator"], "ref"),
  loggedIn,
};
