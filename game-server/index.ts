import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { playerReadyHandler, playerJoinHandler } from "./handlers";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {cors: { origin: "http://localhost:8080" }});
const PORT = process.env.PORT;


// joining the party
app.get("/join", cors({origin: "http://localhost:8080"}), playerJoinHandler);


io.on("connection", (socket) => {
    socket.on("ready", playerReadyHandler);

})

server.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
