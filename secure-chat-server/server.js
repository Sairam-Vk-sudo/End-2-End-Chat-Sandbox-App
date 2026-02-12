const express = require("express");
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors");
const { log } = require("console");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
    },
})

let users = {}

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (publicKey) => {
        users[socket.id] = publicKey;
    })

    socket.on("send-message", (data) => {
        const { to, encryptedMessage, encryptedAESKey } = data;

        io.to(to).emit("receive-message", {
            from: socket.id,
            encryptedMessage,
            encryptedAESKey,
        })
    })

    socket.on("disconnect", ()=>{
        delete users[socket.id];
        
    })
})

server.listen(5000, () => {
    console.log("Server running 5000");
    
})