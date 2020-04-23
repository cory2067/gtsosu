const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: String,
  userid: String,
  country: String,
  avatar: String,
  discord: String,
  timezone: String,
  rank: Number,
  admin: Boolean,
  roles: [
    {
      tourney: String,
      role: String,
    },
  ],
  tournies: [String], // map from tourney code to list of roles
});

// compile model from schema
module.exports = mongoose.model("User", UserSchema);
