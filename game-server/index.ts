import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { playerReadyHandler, getPlayerJoinHandler, turnCompleteHandler, switchTeamHandler, dealHandHandler, getStartGameHandler } from "./handlers";
import * as events from "../src/events/SocketEvents";

dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;
const io: Server<events.ClientEvents, events.ServerEvents> = new Server(server);


// joining the party
app.get("/join", getPlayerJoinHandler(io));
app.get("/start", getStartGameHandler(io));


io.on("connection", (socket) => {
    socket.on("ready-state", (payload, callback) => playerReadyHandler(payload, callback, io, socket));
    socket.on("turn-complete", (payload, callback) => turnCompleteHandler(payload, callback, io, socket));
    socket.on("switch-team", (payload, callback) => switchTeamHandler(payload, callback, io, socket));
    socket.on("deal-hand", dealHandHandler);
});

server.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
