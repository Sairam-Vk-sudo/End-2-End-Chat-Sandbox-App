const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ======================
// MongoDB Setup
// ======================

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const User = mongoose.model("User", {
  username: { type: String, unique: true },
  password: String,
});

// ======================
// HTTP Server
// ======================

const server = http.createServer(app);

// ======================
// Registration Route
// ======================

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword,
    });

    res.json({ message: "User registered successfully" });
  } catch {
    res.status(400).json({ error: "User already exists" });
  }
});

// ======================
// Login Route
// ======================

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

// ======================
// Socket.IO Setup
// ======================

const io = new Server(server, {
  cors: { origin: "*" },
});

// In-memory active users
let users = {}; // { socketId: { username, publicKey } }

// 🔐 Protect WebSocket with JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("Authenticated user connected:", socket.user.username);

  // Register public key after authentication
  socket.on("register", (publicKey) => {
    users[socket.id] = {
      username: socket.user.username,
      publicKey,
    };

    io.emit("users", users);
  });

  // Encrypted message relay
  socket.on("send-message", (data) => {
  const { to, encryptedMessage, encryptedAESKey, iv } = data;

  console.log("\n--- Encrypted Message Relay ---");
  console.log("From:", socket.user.username);
  console.log("To:", users[to]?.username);
  console.log("Encrypted Message:", encryptedMessage);
  console.log("Encrypted AES Key:", encryptedAESKey);
  console.log("IV:", iv);
  console.log("--------------------------------\n");

  io.to(to).emit("receive-message", {
    from: socket.id,
    encryptedMessage,
    encryptedAESKey,
    iv,
  });
});

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("users", users);
    console.log("User disconnected:", socket.user.username);
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});