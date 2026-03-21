const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  publicKey: String,
  encryptedPrivateKey: String,
  encryptedAppKey: String,
  ivAppKey: String,
  ivPrivateKey: String,
  salt: String,
});

module.exports = mongoose.model("User", userSchema);