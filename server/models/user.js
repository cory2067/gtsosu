const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({});

// compile model from schema
module.exports = mongoose.model("User", UserSchema);
