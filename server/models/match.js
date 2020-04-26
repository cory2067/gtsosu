const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
  player1: { type: mongoose.ObjectId, ref: "User" },
  player2: { type: mongoose.ObjectId, ref: "User" },
  // TODO support teams
  code: String,
  time: Date,
  score1: Number,
  score2: Number,
  link: String,
  referee: { type: mongoose.ObjectId, ref: "User" },
  streamer: { type: mongoose.ObjectId, ref: "User" },
  commentators: [{ type: mongoose.ObjectId, ref: "User" }],
  tourney: String,
  stage: String,
});

module.exports = mongoose.model("Match", MatchSchema);
