const mongoose = require("mongoose");

mongoose.connect("")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

module.exports = mongoose;