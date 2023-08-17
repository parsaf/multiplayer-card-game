import dotenv from "dotenv";
import express, {Request} from "express";
import Ably from "ably";
import {Player} from "./player";

dotenv.config();
const app = express();
const ABLY_API_KEY = process.env.ABLY_API_SERVER_KEY;
const realtime = new Ably.Realtime({
    key: ABLY_API_KEY,
    echoMessages: false,
});
const MAX_PLAYER_COUNT = 6;
const PORT = process.env.PORT;

// global variables
let players = new Map<string, Player>();
let hostId: string | undefined;


function uniqueId(): string {
    return "id-" + Math.random().toString(36).substring(2,16);
}

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});


app.get("/join", (request: Request, response) => {
    console.log('join started');
    const { name } = request.params;
    if (players.size < MAX_PLAYER_COUNT) {
        const playerId = uniqueId();
        const player: Player = {
            name: name,
            hand: [],
            id: playerId,
        };
        players.set(playerId, player);
        if (hostId == undefined) {
            hostId = playerId;
        }
        response.status(200).json({ playerId: playerId, isHost: hostId == playerId });
    }
    response.status(503).json({ error: "Server at capacity!" });
});

realtime.connection.once("connected", () => {
    const gameRoom = realtime.channels.get("gameRoom");

    // gameRoom.presence.subscribe("")

})


app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
