const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

let users = {}; // { socketId: publicKeyBase64 }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register user public key
  socket.on("register", (publicKey) => {
    users[socket.id] = publicKey;

    console.log("Registered:", socket.id);

    // Broadcast updated user list
    io.emit("users", users);
  });

  // 🔐 Encrypted message relay
  socket.on("send-message", (data) => {
    const { to, encryptedMessage, encryptedAESKey, iv } = data;

    console.log("Encrypted message relayed from", socket.id, "to", to);

    // Forward encrypted data ONLY (server cannot decrypt)
    io.to(to).emit("receive-message", {
      from: socket.id,
      encryptedMessage,
      encryptedAESKey,
      iv,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete users[socket.id];
    io.emit("users", users);
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
