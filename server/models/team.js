const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  name: String,
  country: String,
  captain: String,
  players: [String],
  tourney: String,
});

module.exports = mongoose.model("Team", TeamSchema);
