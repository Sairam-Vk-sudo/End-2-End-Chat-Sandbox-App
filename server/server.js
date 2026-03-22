const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const PORT = process.env.PORT || 5000;
const Message = require("./models/Message");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Server is running");
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {

    // 🔹 Get user info from client
    const username = socket.handshake.query.username;
    const role = socket.handshake.query.role;

    console.log(`${username} connected as ${role}`);

    socket.on("sendMessage", async (data) => {
        const msg = new Message(data);
        await msg.save();

        // 🔴 Insecure broadcast (root cause of MITM)
        io.emit("receiveMessage", data);
    });

    socket.on("disconnect", () => {
        console.log(`${username} disconnected`);
    });

});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});