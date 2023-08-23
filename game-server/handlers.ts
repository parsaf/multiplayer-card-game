import { Socket } from "socket.io";
import { Request, Response } from "express";
import * as types from "./player";
import { randomUUID } from "crypto";
import * as events from "../src/events/SocketEvents";


// constants
const MAX_PLAYER_COUNT = 2; // TODO: change this to 6
const EMIT_TIMEOUT = 1000;

// global variables
let playerById = new Map<string, types.Player>();
let socketById = new Map<string, Socket>();
let players: types.Player[] = [];
let gameStarted = false;


////////////////// REST handler //////////////////
export function playerJoinHandler(request: Request, response: Response) {
    console.log('join started', request.query);
    const { name } = request.query;
    if (playerById.size < MAX_PLAYER_COUNT) {
        const playerId = randomUUID();
        const player: types.Player = {
            name: name as string,
            hand: [],
            id: playerId,
            ready: false,
            order: players.length,
        };
        playerById.set(playerId, player);
        players.push(player);
        response.status(200).json({ playerId: playerId, order: player.order });
    }
    else {
        response.status(503).json({ error: "Server at capacity!" });
    }
}


////////////////// event handlers //////////////////
export const playerReadyHandler: events.ClientEvents["ready"] = function(payload, callback) {
    // @ts-ignore
    const socket: Socket<ClientEvents> = this;
    console.log("ready event handler", payload);
    const { playerId } = payload;
    const player = playerById.get(playerId);
    if (player != undefined) {
        if (player.ready) {
            console.log("player already read");
            callback();
            return;
        } else if (gameStarted) {
            console.log("game already started");
            callback({
                error: "game already started",
                errorType: "rejected",
            });
            return;
        }
        player.ready = true;
        socketById.set(playerId, socket);
        console.log("player set ready", socketById.size);

        if (players.length === MAX_PLAYER_COUNT && players.every((player) => player.ready)) {
            console.log("ready to start game");
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
function emitWithRetry(socket: Socket<events.ClientEvents, events.ServerEvents>, event: keyof events.ServerEvents, payload: any, retries = 3) {
    socket.timeout(EMIT_TIMEOUT).emit(event, payload, (err) => {
        if (err && retries > 0) {
            emitWithRetry(socket, event, payload, retries - 1);
        }
    });
}

function emitGameStart(socket: Socket<events.ClientEvents, events.ServerEvents>, player: types.Player) {    
    const payload: events.DealHandPayload = {
        hand: player.hand,
        playerNames: players.map<string>((player) => player.name),
        playerOrder: player.order,
    };
    console.log("start-game event ", payload);
    emitWithRetry(socket, "deal-hand", payload);
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
    for (const [id, player] of playerById) {
        const socket = socketById.get(id);
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