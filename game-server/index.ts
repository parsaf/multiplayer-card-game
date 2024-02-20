import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { playerReadyHandler, playerJoinHandler, turnCompleteHandler } from "./handlers";
import * as events from "../src/events/SocketEvents";

dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;
const io: Server<events.ClientEvents, events.ServerEvents> = new Server(server);


// joining the party
app.get("/join", playerJoinHandler);


io.on("connection", (socket) => {
    socket.on("ready", (payload, callback) => playerReadyHandler(payload, callback, io, socket));
    socket.on("turn-complete", (payload, callback) => turnCompleteHandler(payload, callback, io, socket));
});

server.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
