const mongoose = require("mongoose");

const LobbySchema = new mongoose.Schema({
  time: Date,
  referee: String,
  players: [String],
  teams: [String],
  link: String,
  tourney: String,
});

module.exports = mongoose.model("QualifiersLobby", LobbySchema);
