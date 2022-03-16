const mongoose = require("mongoose");

const StageStatsSchema = new mongoose.Schema({
  tourney: String,
  stage: String,
  maps: [
    {
      mapId: Number,
      playerScores: [{ userId: Number, score: Number }],
      teamScores: [{ teamName: String, score: Number }],
    },
  ],
});

module.exports = mongoose.model("StageStats", StageStatsSchema);
