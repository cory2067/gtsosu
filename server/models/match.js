const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
  players: [{ type: mongoose.ObjectId, ref: "User" }],
  // TODO support teams
  code: String,
  time: Date,
  score: [Number],
  link: String,
  referee: { type: mongoose.ObjectId, ref: "User" },
  streamers: [{ type: mongoose.ObjectId, ref: "User" }],
  commentators: [{ type: mongoose.ObjectId, ref: "User" }],
  tourney: String,
  stage: String,
});

module.exports = mongoose.model("Match", MatchSchema);
