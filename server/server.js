const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const Message = require("./models/Message");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {

    socket.on("sendMessage", async (data) => {
        const msg = new Message(data);
        await msg.save();

        io.emit("receiveMessage", data);
    });

});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});