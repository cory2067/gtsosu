/*
|--------------------------------------------------------------------------
| server.js -- The core of your server
|--------------------------------------------------------------------------
|
| This file defines how your server starts up. Think of it as the main() of your server.
| At a high level, this file does the following things:
| - Connect to the database
| - Sets up server middleware (i.e. addons that enable things like json parsing, user login)
| - Hooks up all the backend routes specified in api.js
| - Fowards frontend routes that should be handled by the React router
| - Sets up error handling in case something goes wrong when handling a request
| - Actually starts the webserver
*/

//get environment variables configured
require('dotenv').config()

//import libraries needed for the webserver to work!
const http = require("http");
const express = require("express"); // backend framework for our node server.

// library that stores info about each connected user
const session = require("express-session")({
  secret: "my-secret",
  resave: false,
  saveUninitialized: true,
});

const path = require("path"); // provide utilities for working with file and directory paths
const { decorateApp } = require("@awaitjs/express");

const api = require("./api");


const logger = require("pino")(); // import pino logger

//connect and initialize your database!
require("./db").init();

// create a new express server
const app = express();

// allow us to process POST requests
app.use(express.json());

//register express session middleware
app.use(session);


// connect user-defined routes
app.use("/api", api);

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
    // 500 means Internal Server Error
    logger.error("The server errored when processing a request!");
    logger.error(err);
  }

  res.status(status);
  res.send({
    status: status,
    message: err.message,
  });
});

// listen to env var for port, otherwise default to 3000.
const port = process.env.PORT || 3000;
const server = http.Server(app);

server.listen(port, () => {
  logger.info(`Server running on port: ${port}`);
});
