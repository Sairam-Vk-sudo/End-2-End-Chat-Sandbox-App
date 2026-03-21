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

const User = require("./models/User");
const Message = require("./models/Message");

// ======================
// HTTP Server
// ======================

const server = http.createServer(app);

// ======================
// Registration Route
// ======================

app.post("/register", async (req, res) => {
  const { username, password, publicKey, encryptedPrivateKey, encryptedAppKey, ivAppKey, ivPrivateKey, salt } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword,
      publicKey,
      encryptedPrivateKey,
      encryptedAppKey,
      ivAppKey,
      ivPrivateKey,
      salt
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

  res.json({
    token,
    publicKey: user.publicKey,
    encryptedPrivateKey: user.encryptedPrivateKey,
    encryptedAppKey: user.encryptedAppKey,
    ivAppKey: user.ivAppKey,
    ivPrivateKey: user.ivPrivateKey,
    salt: user.salt
  });
});

app.get("/messages/:username", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const otherUser = await User.findOne({ username: req.params.username });
    if (!otherUser) return res.status(404).json({ error: "User not found" });

    const messages = await Message.find({
      $or: [
        { sender: decoded.userId, receiver: otherUser._id },
        { sender: otherUser._id, receiver: decoded.userId }
      ]
    }).sort({ timestamp: 1 }).lean();

    const formattedMessages = messages.map(msg => ({
      ...msg,
      isMine: msg.sender.toString() === decoded.userId
    }));
    
    res.json(formattedMessages);
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
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

io.on("connection", async (socket) => {
  console.log("Authenticated user connected:", socket.user.username);

  try {
    const userDoc = await User.findById(socket.user.userId);
    if (userDoc) {
      users[socket.id] = {
        username: socket.user.username,
        publicKey: userDoc.publicKey,
      };
      io.emit("users", users);
    }
  } catch (err) {
    console.error(err);
  }

  // Encrypted message relay
  socket.on("send-message", async (data) => {
  const { to, encryptedMessage, encryptedAESKey, senderEncryptedAESKey, iv } = data;

  try {
    // lookup receiver session
    const receiverSession = users[to];
    let receiverUser;
    
    if (receiverSession) {
      receiverUser = await User.findOne({ username: receiverSession.username });
    }

    if (receiverUser) {
      const msg = new Message({
        sender: socket.user.userId,
        receiver: receiverUser._id,
        encryptedMessage: JSON.stringify(encryptedMessage),
        encryptedAESKey: JSON.stringify(encryptedAESKey),
        senderEncryptedAESKey: senderEncryptedAESKey ? JSON.stringify(senderEncryptedAESKey) : undefined,
        iv: JSON.stringify(iv)
      });
      await msg.save();
    }

    io.to(to).emit("receive-message", {
      from: socket.id,
      encryptedMessage,
      encryptedAESKey,
      senderEncryptedAESKey,
      iv,
    });
  } catch (err) {
    console.error("Message save error:", err);
  }
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