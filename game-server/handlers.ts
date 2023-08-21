import { Socket } from "socket.io";
import { Request, Response } from "express";
import * as types from "./player";
import { randomUUID } from "crypto";


// constants
const MAX_PLAYER_COUNT = 2; // TODO: change this to 6
const EMIT_TIMEOUT = 1000;

// global variables
let players = new Map<string, types.Player>();
let sockets = new Map<string, Socket>();
let hostId: string | undefined;
let gameStarted = false;

////////////////// REST handler //////////////////
export function playerJoinHandler(request: Request, response: Response) {
    console.log('join started');
    const { name } = request.params;
    if (players.size < MAX_PLAYER_COUNT) {
        const playerId = randomUUID();
        const player: types.Player = {
            name: name,
            hand: [],
            id: playerId,
            ready: false,
        };
        players.set(playerId, player);
        if (hostId == undefined) {
            hostId = playerId;
        }
        response.status(200).json({ playerId: playerId, isHost: hostId == playerId });
    }
    else {
        response.status(503).json({ error: "Server at capacity!" });
    }
}

////////////////// event handlers //////////////////
export const playerReadyHandler: types.ClientEvents["ready"] = function(payload, callback) {
    // @ts-ignore
    const socket: Socket<ClientEvents> = this;
    console.log("ready event handler", payload);
    const { playerId } = payload;
    const player = players.get(playerId);
    if (player != undefined) {
        if (player.ready) {
            return;
        } else if (gameStarted) {
            callback({
                error: "game already started",
                errorType: "rejected",
            });
            return;
        }
        player.ready = true;
        sockets.set(playerId, socket);

        if (sockets.size == MAX_PLAYER_COUNT) {
            startGame();
        }
       callback();
        // TODO: add broadcast to tell players of join.
    } else {
        callback({
            error: "invalid player ID",
            errorType: "rejected",
        });
    }
}


////////////////// event emitters //////////////////
function emitGameStart(socket: Socket<types.ClientEvents, types.ServerEvents>, player: types.Player, retries = 3) {
    console.log("start-game event ", player.hand, retries)
    socket.timeout(EMIT_TIMEOUT).emit("start-game", player.hand, (err) => {
        if (err && retries > 0) {
            emitGameStart(socket, player, retries - 1);
        }
    });
}


////////////////// game logic //////////////////
function startGame() {

    console.log("startGame");

    gameStarted = true;
    // deck of 54 cards (with 2 jokers)
    const deck = Array.from(Array(53).keys());
    shuffle(deck);
    console.log("shuffled deck", deck);

    // deal hand
    for (const [id, player] of players) {
        const socket = sockets.get(id);
        if (!socket) {
            console.error("no socket found for client id: ", id);
            continue;
        }
        player.hand = deck.slice(0, 9);
        deck.splice(0, 9);
        emitGameStart(socket, player);
    }
}


////////////////// utils //////////////////
function shuffle<T>(array: T[]) {
    let currentIndex = array.length, randIndex = 0;
    while (currentIndex !== 0) {
        randIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randIndex]] = [array[randIndex], array[currentIndex]];
    }
}