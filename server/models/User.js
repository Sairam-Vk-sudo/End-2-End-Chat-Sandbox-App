const mongoose = require("../db");

const UserSchema = new mongoose.Schema({
    username: String,
    password: String // ⚠ plaintext (intentional)
});

module.exports = mongoose.model("User", UserSchema);