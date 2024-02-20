import { Socket, Server } from "socket.io";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import * as events from "../src/events/SocketEvents";


interface Player {
    name: string;
    hand: number[];
    id: string;
    socket?: Socket<events.ClientEvents, events.ServerEvents>;
    ready: boolean;
    order: number;
    team: events.Team;
}


// constants
const MAX_PLAYER_COUNT = 3; // TODO: change this to 6
const EMIT_TIMEOUT = 1000;
const ROUNDS_PER_GAME = 9;

// global variables
let playerById = new Map<string, Player>();
let players: Player[] = [];
let gameStarted = false;
let round = 0; // which round is in play rn
let completedTurns = 0;
let cardsPlayed: number[] = [];
let nextPlayer: Player;
let team1Score = 0;
let team2Score = 0;


////////////////// REST handler //////////////////
export function playerJoinHandler(request: Request, response: Response) {
    console.log('join started', request.query);
    const { name } = request.query;
    if (playerById.size < MAX_PLAYER_COUNT) {
        const playerId = randomUUID();
        const playerOrder = players.length + 1;
        const player: Player = {
            name: name as string,
            hand: [],
            id: playerId,
            ready: false,
            order: playerOrder,
            team: playerOrder % 2 === 1 ? 'TEAM_1' : 'TEAM_2',
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
export function playerReadyHandler(
    payload: events.playerReadyPayload,
    callback: (res?: events.SocketError) => void,
    io: Server<events.ClientEvents, events.ServerEvents>,
    socket: Socket<events.ClientEvents, events.ServerEvents>,
) {
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
        player.socket = socket;
        console.log("player set ready", player);

        if (players.length === MAX_PLAYER_COUNT && players.every((player) => player.ready)) {
            console.log("ready to start game");
            startGame(io);
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

export function turnCompleteHandler(
    payload: events.TurnCompletePayload,
    callback: (res?: events.SocketError) => void,
    io: Server<events.ClientEvents, events.ServerEvents>,
    socket: Socket<events.ClientEvents, events.ServerEvents>,
) {
    console.log("turn-complete event handler", payload);
    const { playerId, card, turn } = payload;
    const player = playerById.get(playerId);
    if (player != undefined) {
        if (player !== nextPlayer) {
            console.log("not your turn");
            callback({
                error: "not your turn",
                errorType: "rejected",
            });
            return;
        }
        if (cardsPlayed.includes(card)) {
            console.log("card already played");
            callback({
                error: "card already played",
                errorType: "rejected",
            });
            return;
        }
        callback();
        completeTurn(player, card, turn, io);

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

function emitDealHand(player: Player) {
    const playerDetails = players.map<events.PlayerDetails>((player) => {
        return {
            name: player.name,
            team: player.team,
            order: player.order
        };
    });
    // const playerDetails: events.PlayerDetails[] = [
    //     {
    //         name: "Parsa",
    //         team: "TEAM_1",
    //         order: 1,
    //     },
    //     {
    //         name: "Behnood",
    //         team: "TEAM_2",
    //         order: 2,
    //     },
    //     {
    //         name: "Baba",
    //         team: "TEAM_1",
    //         order: 3,
    //     },
    //     {
    //         name: "Maman",
    //         team: "TEAM_2",
    //         order: 4,
    //     },
    //     {
    //         name: "Anita",
    //         team: "TEAM_1",
    //         order: 5,
    //     },
    //     {
    //         name: "Arshia",
    //         team: "TEAM_2",
    //         order: 6,
    //     },
    // ];
    const payload: events.DealHandPayload = {
        hand: player.hand,
        playerDetails: playerDetails,
        playerOrder: player.order,
    };
    console.log("deal-hand event ", payload);
    emitWithRetry(player.socket!, "deal-hand", payload);
}

function emitNewTurn(io: Server<events.ClientEvents, events.ServerEvents>, payload: events.NewTurnPayload ) {
    console.log("emit next-turn event", payload);
    console.log('cards played: ', cardsPlayed);
    io.timeout(EMIT_TIMEOUT).emit("new-turn", payload);
}

////////////////// game logic //////////////////
function startGame(io: Server<events.ClientEvents, events.ServerEvents>) {

    console.log("startGame");

    gameStarted = true;
    // deck of 54 cards (with 2 jokers)
    const deck = Array.from(Array(53).keys());
    shuffle(deck);
    console.log("shuffled deck", deck);

    // deal hand
    for (const [id, player] of playerById) {
        if (!player.socket) {
            console.error("no socket found for client id: ", id);
            continue;
        }
        player.hand = deck.slice(0, 9);
        deck.splice(0, 9);
        emitDealHand(player);
    }

    // start turn 1
    round = 1;
    nextPlayer = players.find((player) => player.order === 1)!;
    newTurn(io);

}

function completeTurn(currentPlayer: Player, card: number, turn: number, io: Server<events.ClientEvents, events.ServerEvents>) {
    cardsPlayed.push(card);
    completedTurns += 1;
    nextPlayer = players.find((player) => player.order === (nextPlayer.order % MAX_PLAYER_COUNT) + 1)!;
    newTurn(io, currentPlayer, card);
}

function newTurn(
    io: Server<events.ClientEvents, events.ServerEvents>,
    lastPlayer?: Player,
    lastCard?: number,
) {
    console.log('start new turn and broadcast last cards played: ', cardsPlayed);
    const payload: events.NewTurnPayload = {
        nextPlayer: completedTurns === MAX_PLAYER_COUNT ? undefined : nextPlayer.order,
        lastTurn: completedTurns,
        lastCard: lastCard,
        lastPlayer: lastPlayer?.order,
        round: round,
        team1Score: team1Score,
        team2Score: team2Score,
        cardsPlayed: cardsPlayed,
        gameOver: round === ROUNDS_PER_GAME ? true : false,
    };
    emitNewTurn(io, payload);
    if (completedTurns === MAX_PLAYER_COUNT) {
        completedTurns = 0;
        round += 1;
        cardsPlayed = [];

        // todo calculate scores and decide next player

        const payload: events.NewTurnPayload = {
            nextPlayer: nextPlayer.order,
            lastTurn: completedTurns,
            lastCard: lastCard,
            lastPlayer: lastPlayer?.order,
            round: round,
            team1Score: team1Score,
            team2Score: team2Score,
            cardsPlayed: cardsPlayed,
            gameOver: round === ROUNDS_PER_GAME ? true : false,
        };
        // start new round after 3 second delay
        setTimeout(() => {
            emitNewTurn(io, payload);
        }, 3000);

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