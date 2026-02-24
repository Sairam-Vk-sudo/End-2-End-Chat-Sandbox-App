const mongoose = require("../db");

const MessageSchema = new mongoose.Schema({
    sender: String,
    message: String,
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", MessageSchema);