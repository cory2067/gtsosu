// Ensure a user has a certain permission before allowing access
const logger = require("pino")();

function loggedIn(req, res, next) {
  if (!req.user || !req.user.username) {
    return res.status(401).send({ error: "Not logged in, refusing access." });
  }

  next();
}

function ensure(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.username) {
      return res.status(401).send({ error: "Not logged in, refusing access." });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).send({ error: "You do not have permission to access this." });
    }

    logger.info(`${req.user.username} granted access to: ${permission}`);
    next();
  };
}

module.exports = {
  isAdmin: ensure("admin"),
  isPooler: ensure("pool"),
  isRef: ensure("ref"),
  loggedIn,
};
