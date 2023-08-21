import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { playerReadyHandler, playerJoinHandler } from "./handlers";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {cors: { origin: "*" }});
const PORT = process.env.PORT;


// joining the party
app.get("/join", playerJoinHandler);


io.on("connection", (socket) => {
    socket.on("ready", playerReadyHandler);

})

server.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
