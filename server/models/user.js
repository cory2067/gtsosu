const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: String,
  userid: String,
  country: String,
  avatar: String,
  discord: String,
  timezone: String,
  permissions: [{ type: String, enum: ["admin", "pool", "ref"] }],
  tournies: [String],
});

// compile model from schema
module.exports = mongoose.model("User", UserSchema);
