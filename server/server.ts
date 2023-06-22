require("dotenv").config();

import express from "express";
import path from "path";
import pino from "pino";
import passport from "passport";
import sslRedirect from "heroku-ssl-redirect";
import session from "express-session";
import MongoStore from "connect-mongo";
import { Client, Events, GatewayIntentBits } from 'discord.js';

import api from "./api";
import auth from "./auth";
import db from "./db";
import { Request } from "./types";
import { getMockUser } from "./tests/test-util";

const app = express();
const logger = pino();
const clientPromise = db.init();

app.set("trust proxy", true);
app.use(sslRedirect());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    store: MongoStore.create({ clientPromise }),
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

if (process.env.NODE_ENV === "test") {
  app.use((req: Request<{}, {}>, res, next) => {
    req.user = getMockUser();
    next();
  });
}

// Redirect to non-www url
app.get("*", (req, res, next) => {
  if (req.headers.host!.slice(0, 4) === "www.") {
    const newHost = req.headers.host!.slice(4);
    return res.redirect(301, req.protocol + "://" + newHost + req.originalUrl);
  }
  next();
});

app.use("/api", api);
app.use("/auth", auth);

// serve static resources (e.g. flags)
const publicPath = path.resolve(__dirname, "..", "client", "src", "public");
app.use("/public", express.static(publicPath));

// load the compiled react files, which will serve /index.html and /bundle.js
const reactPath = path.resolve(__dirname, "..", "client", "dist");
app.use(express.static(reactPath));

// for all other routes, render index.html and let react router handle it
app.get("*", (req, res) => {
  res.sendFile(path.join(reactPath, "index.html"));
});

// any server errors cause this function to run
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) {
    logger.error("The server errored when processing a request!");
    logger.error(err);
  }

  res.status(status);
  res.send({
    status: status,
    message: err.message,
  });
});

// don't run the webserver in tests
if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    logger.info(`Server running on port: ${port}`);
  });
}

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });

discordClient.on("ready", async () => {
  logger.info(`Discord client logged in as ${discordClient?.user?.username}`);
});

if (process.env.NODE_ENV !== "test") {
  discordClient.login(process.env.DISCORD_BOT_TOKEN);
}

export { app, discordClient };
