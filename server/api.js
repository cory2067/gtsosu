const express = require("express");

const logger = require("pino")();

// import models so we can interact with the database
const User = require("./models/user");

const { addAsync } = require("@awaitjs/express");
const router = addAsync(express.Router());

router.getAsync("/example", async (req, res, next) => {
  logger.info("Log Hello World");
  res.send({ hello: "world" });
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  logger.warn(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
