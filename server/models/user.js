const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: String,
  userid: String,
  country: String,
  avatar: String,
  permissions: [{ type: String, enum: ["admin", "pool", "ref"] }],
});

// compile model from schema
module.exports = mongoose.model("User", UserSchema);
