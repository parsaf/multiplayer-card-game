import { RequestHandler } from "express";
import { Socket, Server } from "socket.io";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import * as events from "../src/events/SocketEvents";


export interface Player {
    name: string;
    hand: number[];
    id: string;
    ready: boolean;
    order: number;
    team: events.Team;
}

export interface Card {
    value: number;
    faceValue: number;
    suit: Suit;
}

export interface CardPlayed {
    card: Card;
    player: Player;
};

export enum Suit {
    DIAMOND = 'diamond',
    SPADE = 'spade',
    HEART = 'heart',
    CLUB = 'club',
    JOKER = 'joker',
};


// constants
const MAX_PLAYER_COUNT = 6;
const MIN_PLAYER_COUNT = 2;
const EMIT_TIMEOUT = 3000;
const ROUNDS_PER_GAME = 9;
const SUIT_ORDERING = [Suit.DIAMOND, Suit.SPADE, Suit.HEART, Suit.CLUB]

export class GameHandlers {
    playerById: Map<string, Player>;
    players: Player[];
    gameStarted;
    round: number; // which round is in play rn
    completedTurns: number;
    // cardsPlayed is an array of cards played and the player who played them
    cardsPlayed: CardPlayed[];
    nextPlayer?: Player;
    team1Score: number;
    team2Score: number;
    idempotencyKeys: Set<string>;
    trumpSuit?: Suit;
    lastEmittedTurn?: events.NewTurnPayload;
    playerCount: number;

    // class constructor
    constructor() {
        this.playerById = new Map<string, Player>();
        this.players = [];
        this.gameStarted = false;
        this.round = 0;
        this.completedTurns = 0;
        this.cardsPlayed = [];
        this.team1Score = 0;
        this.team2Score = 0;
        this.idempotencyKeys = new Set<string>();
        this.playerCount = MAX_PLAYER_COUNT;

        this.getHandHandler = this.getHandHandler.bind(this);
        this.playerReadyHandler = this.playerReadyHandler.bind(this);
        this.turnCompleteHandler = this.turnCompleteHandler.bind(this);
        this.switchTeamHandler = this.switchTeamHandler.bind(this);
        this.getPlayerJoinHandler = this.getPlayerJoinHandler.bind(this);
        this.getStartTurnsHandler = this.getStartTurnsHandler.bind(this);
        this.startGame = this.startGame.bind(this);
        this.completeTurn = this.completeTurn.bind(this);
        this.newTurn = this.newTurn.bind(this);
        this.emitWithRetry = this.emitWithRetry.bind(this);
        this.emitNewTurn = this.emitNewTurn.bind(this);
        this.emitTeamSelection = this.emitTeamSelection.bind(this);
        this.emitGameStart = this.emitGameStart.bind(this);
        this.findWinningCard = this.findWinningCard.bind(this);
        this.gameOverHandler = this.gameOverHandler.bind(this);
    }

    ////////////////// REST handler //////////////////
    getPlayerJoinHandler(io: Server<events.ClientEvents, events.ServerEvents>): RequestHandler {
        console.log('getPlayerJoinHandler');
        return (request: Request, response: Response) => {
            console.log('join started', request.query);
            const { name } = request.query;
            if (this.playerById.size < this.playerCount) {
                const playerId = randomUUID();
                const playerOrder = this.players.length + 1;
                const player: Player = {
                    name: name as string,
                    hand: [],
                    id: playerId,
                    ready: false,
                    order: playerOrder,
                    team: playerOrder % 2 === 1 ? 'TEAM_1' : 'TEAM_2',
                };
                this.playerById.set(playerId, player);
                this.players.push(player);
                response.status(200).json({ playerId: playerId, team: player.team });
                this.emitTeamSelection(io);
            }
            else {
                response.status(503).json({ error: "Server at capacity!" });
            }
        }
    }

    getStartTurnsHandler(io: Server<events.ClientEvents, events.ServerEvents>): RequestHandler {
        return (request: Request, response: Response) => {
            console.log('start turns Handler', request.query);
            const { starterPlayerId, trump } = request.query;
            // check if trump is in the Suite enum
            if (trump && Object.values(Suit).includes(trump as Suit)) {
                this.trumpSuit = trump as Suit;
            }
            if (starterPlayerId && this.playerById.has(starterPlayerId.toString()) && this.trumpSuit) {
                // redirect client to admin page
                response.redirect('/admin');
                // start turn 1
                this.round = 1;
                this.nextPlayer = this.playerById.get(starterPlayerId.toString())!;
                this.gameStarted = true;
                this.newTurn(io);
            } else {
                response.status(400).json({ error: "Invalid request" });
            }
        };
    }



    gameOverHandler(io: Server<events.ClientEvents, events.ServerEvents>): RequestHandler {
        return (request: Request, response: Response) => {
            // parse reset flag in query
            const reset = request.query.reset === "true";

            if (request.query.playerCount && reset) {
                this.playerCount = Math.max(Math.min(parseInt(request.query.playerCount as string), MAX_PLAYER_COUNT), MIN_PLAYER_COUNT);
            }

            console.log("game-over handler",);

            this.gameStarted = false;
            this.round = 0;
            this.completedTurns = 0;
            this.cardsPlayed = [];
            this.nextPlayer = undefined;
            this.team1Score = 0;
            this.team2Score = 0;
            this.trumpSuit = undefined;
            this.lastEmittedTurn = undefined;

            if (reset) {
                this.playerById = new Map<string, Player>();
                this.players = [];
                this.idempotencyKeys = new Set<string>();

            }
            
            this.shuffleAndDealCards();

            // emit game over event
            io.timeout(EMIT_TIMEOUT).emit("game-over", reset, (err, over) => {
                if (err) {
                    console.log("game-over some clients didn't acknowledge");
                }
                console.log("game-over event acknowledged");
            });

            // redirect client to admin page
            response.redirect('/admin');
        };
    }

    pushHandler(io: Server<events.ClientEvents, events.ServerEvents>): RequestHandler {
        return (request: Request, response: Response) => {
            console.log("push handler");
            console.log("(re)connection handler");
            if (this.gameStarted && this.lastEmittedTurn) {
                // emit last turn
                io.timeout(EMIT_TIMEOUT).emit("new-turn", this.lastEmittedTurn, (err, received) => {
                    if (err) {
                        console.log("new-turn reconnected client didn't acknowledge");
                    }
                    console.log("new-turn event acknowledged");
                });
            }
            response.redirect('/admin');
        }
    }

    ////////////////// event handlers //////////////////
    playerReadyHandler(
        payload: events.PlayerReadyPayload,
        callback: (res?: events.PlayerReadyState) => void,
        io: Server<events.ClientEvents, events.ServerEvents>,
        socket: Socket<events.ClientEvents, events.ServerEvents>,
    ) {
        console.log("ready-state event handler", payload);
        const { playerId, idempotencyKey } = payload;

        const player = this.playerById.get(playerId);
        if (player) {

            // check if idempotency key has been used
            if (this.idempotencyKeys.has(idempotencyKey)) {
                console.log("idempotency key already used");
                callback({
                    ready: player.ready,
                    idempotencyKey: idempotencyKey,
                });
                return;
            }
            this.idempotencyKeys.add(idempotencyKey);

            if (this.gameStarted) {
                console.log("game already started");
                callback();
                return;
            }
            player.ready = !player.ready;
            console.log("player set ready", player);
            console.log("start conditions", this.players.length === this.playerCount, this.players.every((player) => player.ready), this.players.filter((player) => player.team === "TEAM_1").length === Math.floor(this.playerCount / 2));
            if (this.players.length === this.playerCount && this.players.every((player) => player.ready) && this.players.filter((player) => player.team === "TEAM_1").length === Math.floor(this.playerCount / 2)) {
                console.log("ready to start game");
                this.startGame(io);
            }
        callback({
                ready: player.ready,
                idempotencyKey: idempotencyKey,
            });
            // TODO: add broadcast to tell players of join.
        } else {
            callback();
        }
    }

    turnCompleteHandler(
        payload: events.TurnCompletePayload,
        callback: (res?: events.SocketError) => void,
        io: Server<events.ClientEvents, events.ServerEvents>,
        socket: Socket<events.ClientEvents, events.ServerEvents>,
    ) {
        console.log("turn-complete event handler", payload);
        const { playerId, card, idempotencyKey: idepotencyKey } = payload;
        if (this.idempotencyKeys.has(idepotencyKey)) {
            console.log("idempotency key already used");
            callback();
            return;
        }
        this.idempotencyKeys.add(idepotencyKey);
        const player = this.playerById.get(playerId);
        if (player != undefined) {
            if (player !== this.nextPlayer) {
                console.log("not your turn");
                callback({
                    error: "not your turn",
                    errorType: "rejected",
                });
                return;
            }
            if (this.cardsPlayed.find(cardsPlayed => cardsPlayed.card.value === card)) {
                console.log("card already played");
                callback({
                    error: "card already played",
                    errorType: "rejected",
                });
                return;
            }
            callback();
            this.completeTurn(player, card, io);

        } else {
            callback({
                error: "invalid player ID",
                errorType: "rejected",
            });
        }
    }

    switchTeamHandler(
        payload: events.TeamSwitchPayload,
        callback: (res?: events.SocketError) => void,
        io: Server<events.ClientEvents, events.ServerEvents>,
        socket: Socket<events.ClientEvents, events.ServerEvents>,
    ) {
        console.log("switch-team event handler", payload);
        const { playerId, idempotencyKey } = payload;

        // check if idempotency key has been used
        if (this.idempotencyKeys.has(idempotencyKey)) {
            console.log("idempotency key already used");
            callback();
            return;
        }
        this.idempotencyKeys.add(idempotencyKey);

        const player = this.playerById.get(playerId);
        if (player) {
            player.team = player.team === "TEAM_1" ? "TEAM_2" : "TEAM_1";
            // set player not ready
            player.ready = false;
            callback();
            // emit team selection event
            this.emitTeamSelection(io);
            return;
        }
        callback({
            error: "invalid player ID",
            errorType: "rejected",
        });
    }

    getHandHandler(
        payload: events.DealHandPayload,
        callback: (res?: events.DealHandResponse) => void,
    ) {
        console.log("get-hand event handler", payload, this.playerById.size);
        const player = this.playerById.get(payload.playerId);
        if (!player || !player.hand) {
            console.log("player not found or hand not dealt yet", payload.playerId);
            callback();
            return;
        }

        const playerDetails = this.players.map<events.PlayerDetails>((player) => {
            return {
                name: player.name,
                team: player.team,
                order: player.order,
                playerId: player.id,
            };
        });

        const response: events.DealHandResponse = {
            hand: player.hand,
            playerDetails: playerDetails,
            playerOrder: player.order,
        };
        console.log("get-hand response ", response);
        callback(response);
    }

    ////////////////// event emitters //////////////////
    emitWithRetry(socket: Socket<events.ClientEvents, events.ServerEvents>, event: keyof events.ServerEvents, payload: any, retries = 3) {
        socket.timeout(EMIT_TIMEOUT).emit(event, payload, (err: Error) => {
            if (err && retries > 0) {
                this.emitWithRetry(socket, event, payload, retries - 1);
            }
        });
    }

    emitNewTurn(io: Server<events.ClientEvents, events.ServerEvents>, payload: events.NewTurnPayload ) {
        console.log("emit next-turn event", payload);
        console.log('cards played: ', this.cardsPlayed);
        this.lastEmittedTurn = payload;
        io.timeout(EMIT_TIMEOUT).emit("new-turn", payload, (err, received) => {
            if (err) {
                console.log("new-turn some clients didn't acknowledge");
            }
            console.log("new-turn event acknowledged");
        });
    }

    emitTeamSelection(io: Server<events.ClientEvents, events.ServerEvents>) {
        const team1 = this.players.filter((player) => player.team === "TEAM_1").map((player) => {
            return {
                name: player.name,
                team: player.team,
                order: player.order,
                playerId: player.id,
            };
        });
        
        const team2 = this.players.filter((player) => player.team === "TEAM_2").map((player) => {
            return {
                name: player.name,
                team: player.team,
                order: player.order,
                playerId: player.id,
            };
        });

        // sort team members alphabetically
        team1.sort((a, b) => a.name.localeCompare(b.name));
        team2.sort((a, b) => a.name.localeCompare(b.name));

        const payload: events.TeamSelectionPayload = {
            team1: team1,
            team2: team2,
        };
        console.log("emit team-selection event", payload);
        io.timeout(EMIT_TIMEOUT).emit("team-selection", payload);
    }

    emitGameStart(io: Server<events.ClientEvents, events.ServerEvents>) {
        console.log("emit game-start event");
        io.timeout(EMIT_TIMEOUT).emit("game-start", true, (err, start) => {
            if (err) {
                console.log("game-start some clients didn't acknowledge");
            }
            console.log("game-start event acknowledged");
        });
    }

    ////////////////// game logic //////////////////
    startGame(io: Server<events.ClientEvents, events.ServerEvents>) {

        console.log("startGame");

        let team1Counter = 0;
        let team2Counter = 0;
        for (let i = 0; i < this.players.length; i++) {
            // assign player orders so that team 1 has odd orders and team 2 has even orders
            if (this.players[i].team === "TEAM_1") {
                this.players[i].order = team1Counter * 2 + 1;
                team1Counter += 1;
            } else {
                this.players[i].order = team2Counter * 2 + 2;
                team2Counter += 1;
            }
        }

        this.shuffleAndDealCards();

        this.emitGameStart(io);
    }

    completeTurn(currentPlayer: Player, card: number, io: Server<events.ClientEvents, events.ServerEvents>) {
        this.cardsPlayed.push(NewCardPlayed(card, currentPlayer));
        this.completedTurns += 1;
        this.nextPlayer = this.players.find((player) => player.order === (this.nextPlayer!.order % this.playerCount) + 1)!;
        this.newTurn(io, currentPlayer, card);
    }

    newTurn(
        io: Server<events.ClientEvents, events.ServerEvents>,
        lastPlayer?: Player,
        lastCard?: number,
    ) {
        console.log('start new turn and broadcast last cards played: ', this.cardsPlayed);
        const payload: events.NewTurnPayload = {
            nextPlayer: this.completedTurns === this.playerCount ? undefined : this.nextPlayer?.order,
            lastTurn: this.completedTurns,
            lastPlayer: lastPlayer?.order,
            round: this.round,
            team1Score: this.team1Score,
            team2Score: this.team2Score,
            cardsPlayed: this.cardsPlayed.map((cardPlayed) => cardPlayed.card.value),
            gameOver: this.round === ROUNDS_PER_GAME ? true : false,
        };
        this.emitNewTurn(io, payload);
        if (this.completedTurns === this.playerCount) {
            this.completedTurns = 0;
            this.round += 1;

            // calculate scores and decide next player
            const winningCard = this.findWinningCard();
            if (winningCard.player.team === "TEAM_1") {
                this.team1Score += 1;
            } else {
               this.team2Score += 1;
            }
            this.cardsPlayed = [];
            this.nextPlayer = winningCard.player;

            const payload: events.NewTurnPayload = {
                nextPlayer: this.nextPlayer.order,
                lastTurn: this.completedTurns,
                lastPlayer: lastPlayer?.order,
                round: this.round,
                team1Score: this.team1Score,
                team2Score: this.team2Score,
                cardsPlayed: [],
                gameOver: this.round === ROUNDS_PER_GAME ? true : false,
            };
            // start new round after 3 second delay
            setTimeout(() => {
                this.emitNewTurn(io, payload);
            }, 3000);

        }
    }

    findWinningCard(): CardPlayed {
        console.log('finding winning card in cards played: ', this.cardsPlayed.map((cardPlayed) => [cardPlayed.card.faceValue, cardPlayed.card.suit]));
        const handSuit = this.cardsPlayed[0].card.suit;

        let winningCard = this.cardsPlayed[0];

        // if the first card is a joker, it wins
        if (handSuit === Suit.JOKER) {
            console.log('joker wins');
            return winningCard;
        }

        // for other first cards, find the highest card of the same suit or the highest card of the trump suit
        for (const cardPlayed of this.cardsPlayed) {

            console.log('comparing card: ', cardPlayed.card.faceValue, cardPlayed.card.suit);
            
            if (isCardBeaten(winningCard, cardPlayed, this.trumpSuit!)) {
                winningCard = cardPlayed;
            }

            console.log('winning card so far: ', winningCard.card.faceValue, winningCard.card.suit);
        }
        console.log('winning card for hand: ', winningCard.card.faceValue, winningCard.card.suit);
        return winningCard;
    }

    reconnectionHandler(socket: Socket<events.ClientEvents, events.ServerEvents>) {
        console.log("(re)connection handler");
        if (this.gameStarted && this.lastEmittedTurn) {
            // emit last turn
            socket.timeout(EMIT_TIMEOUT).emit("new-turn", this.lastEmittedTurn, (err, received) => {
                if (err) {
                    console.log("new-turn reconnected client didn't acknowledge");
                }
                console.log("new-turn event acknowledged");
            });
        }
    }

    shuffleAndDealCards() {
        // deck of 54 cards (with 2 jokers)
        const deck = Array.from(Array(54).keys());
        shuffle(deck);
        console.log("shuffled deck", deck);

        // deal hand
        for (const [id, player] of this.playerById) {
            player.hand = deck.slice(0, 9);
            deck.splice(0, 9);
        }
       
    }
}


// utility functions

function shuffle<T>(array: T[]) {
    let currentIndex = array.length, randIndex = 0;
    while (currentIndex !== 0) {
        randIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randIndex]] = [array[randIndex], array[currentIndex]];
    }
}

export function NewCard(card: number): Card {
        if (card > 51) {
            return {
                value: card,
                faceValue: card - 51, // black joker is 1, red joker is 2
                suit: Suit.JOKER,
            };
        }
        const suit = SUIT_ORDERING[Math.floor(card / 13)];
        const faceValue = (card % 13) + 2; // 2,...,10,J,Q,K,A
        return {
            value: card,
            faceValue: faceValue,
            suit: suit,
        };
}

export function NewCardPlayed(card: number, player: Player): CardPlayed {
    return {
        card: NewCard(card),
        player: player,
    };
}

// is card2 beating card1
function isCardBeaten(card1: CardPlayed, card2: CardPlayed, trumpSuit: Suit): boolean {
    // red joker wins
    if (card1.card.suit === Suit.JOKER && card1.card.faceValue === 2) {
        return false;
    }
    if (card2.card.suit === Suit.JOKER && card2.card.faceValue === 2) {
        return true;
    }

    // if no red joker played, black joker wins
    if (card1.card.suit === Suit.JOKER && card1.card.faceValue === 1) {
        return false;
    }
    if (card2.card.suit === Suit.JOKER && card2.card.faceValue === 1) {
        return true;
    }

    // if a trump card is played against a non-trump card, the trump card wins
    if (card1.card.suit === trumpSuit && card2.card.suit !== trumpSuit) {
        return false;
    }
    if (card2.card.suit === trumpSuit && card1.card.suit !== trumpSuit) {
        return true;
    }

    // otherwise the higher card of the same suit wins
    return card1.card.suit === card2.card.suit && card2.card.faceValue > card1.card.faceValue;
}