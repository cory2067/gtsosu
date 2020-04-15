require("dotenv").config();

const express = require("express");
const path = require("path");
const logger = require("pino")();
const passport = require("passport");

const api = require("./api");
const auth = require("./auth");

require("./db").init();

const app = express();

app.use(express.json());
const session = require("express-session")({
  secret: "my-secret",
  resave: false,
  saveUninitialized: true,
});
app.use(session);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api", api);
app.use("/auth", auth);

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

app.get("/auth/example", passport.authenticate("oauth2"));

app.get(
  "/auth/example/callback",
  passport.authenticate("oauth2", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Server running on port: ${port}`);
});
