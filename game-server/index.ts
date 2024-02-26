import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { GameHandlers } from "./handlers";
import * as events from "../src/events/SocketEvents";

dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;
const io: Server<events.ClientEvents, events.ServerEvents> = new Server(server);
const handlers = new GameHandlers();


// joining the party
app.get("/api/join", handlers.getPlayerJoinHandler(io));
app.get("/api/start", handlers.getStartTurnsHandler(io));


io.on("connection", (socket) => {
    handlers.reconnectionHandler(socket);
    socket.on("ready-state", (payload, callback) => handlers.playerReadyHandler(payload, callback, io, socket));
    socket.on("turn-complete", (payload, callback) => handlers.turnCompleteHandler(payload, callback, io, socket));
    socket.on("switch-team", (payload, callback) => handlers.switchTeamHandler(payload, callback, io, socket));
    socket.on("get-hand", handlers.getHandHandler);
});

app.use('', express.static('../dist'))

server.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
