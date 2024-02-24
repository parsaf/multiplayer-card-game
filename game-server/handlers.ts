import { RequestHandler } from "express";
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

interface Card {
    value: number;
    faceValue: number;
    suit: Suit;
}

interface CardPlayed {
    card: Card;
    player: Player;
};

enum Suit {
    DIAMOND = 'diamond',
    SPADE = 'spade',
    HEART = 'heart',
    CLUB = 'club',
    JOKER = 'joker',
};


// constants
const MAX_PLAYER_COUNT = 4; // TODO: change this to 6
const EMIT_TIMEOUT = 1000;
const ROUNDS_PER_GAME = 9;
const SUIT_ORDERING = [Suit.DIAMOND, Suit.SPADE, Suit.HEART, Suit.CLUB]

export class Handlers {
    // global variables
    playerById = new Map<string, Player>();
    players: Player[] = [];
    gameStarted = false;
    round = 0; // which round is in play rn
    completedTurns = 0;
    // cardsPlayed is an array of cards played and the player who played them
    cardsPlayed: CardPlayed[] = [];
    nextPlayer?: Player;
    team1Score = 0;
    team2Score = 0;
    idempotencyKeys = new Set<string>();
    trumpSuit?: Suit;

    ////////////////// REST handler //////////////////
    getPlayerJoinHandler(io: Server<events.ClientEvents, events.ServerEvents>): RequestHandler {
        console.log('getPlayerJoinHandler');
        return (request: Request, response: Response) => {
            console.log('join started', request.query);
            const { name } = request.query;
            if (this.playerById.size < MAX_PLAYER_COUNT) {
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
                playerById.set(playerId, player);
                players.push(player);
                response.status(200).json({ playerId: playerId, team: player.team });
                emitTeamSelection(io);
            }
            else {
                response.status(503).json({ error: "Server at capacity!" });
            }
        }
    }

    getStartTurnsHandler(io: Server<events.ClientEvents, events.ServerEvents>): RequestHandler {
        return function startTurnsHandler(request: Request, response: Response) {
            console.log('start turns Handler', request.query);
            const { starterPlayerId, trump } = request.query;
            // check if trump is in the Suite enum
            if (trump && Object.values(Suit).includes(trump as Suit)) {
                trumpSuit = trump as Suit;
            }
            if (starterPlayerId && playerById.has(starterPlayerId.toString()) && trumpSuit) {
                response.status(200).json({ message: "Game started" });
                // start turn 1
                round = 1;
                nextPlayer = playerById.get(starterPlayerId.toString())!;
                newTurn(io);
            } else {
                response.status(400).json({ error: "Invalid request" });
            }
        };
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

        const player = playerById.get(playerId);
        if (player) {

            // check if idempotency key has been used
            if (idempotencyKeys.has(idempotencyKey)) {
                console.log("idempotency key already used");
                callback({
                    ready: player.ready,
                    idempotencyKey: idempotencyKey,
                });
                return;
            }
            idempotencyKeys.add(idempotencyKey);

            if (gameStarted) {
                console.log("game already started");
                callback();
                return;
            }
            player.ready = !player.ready;
            player.socket = socket;
            console.log("player set ready", player);
            console.log("start conditions", players.length === MAX_PLAYER_COUNT, players.every((player) => player.ready), players.filter((player) => player.team === "TEAM_1").length === Math.floor(MAX_PLAYER_COUNT / 2));
            if (players.length === MAX_PLAYER_COUNT && players.every((player) => player.ready) && players.filter((player) => player.team === "TEAM_1").length === Math.floor(MAX_PLAYER_COUNT / 2)) {
                console.log("ready to start game");
                startGame(io);
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
        if (idempotencyKeys.has(idepotencyKey)) {
            console.log("idempotency key already used");
            callback();
            return;
        }
        idempotencyKeys.add(idepotencyKey);
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
            if (cardsPlayed.find(cardsPlayed => cardsPlayed.card.value === card)) {
                console.log("card already played");
                callback({
                    error: "card already played",
                    errorType: "rejected",
                });
                return;
            }
            callback();
            completeTurn(player, card, io);

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
        if (idempotencyKeys.has(idempotencyKey)) {
            console.log("idempotency key already used");
            callback();
            return;
        }
        idempotencyKeys.add(idempotencyKey);

        const player = playerById.get(playerId);
        if (player) {
            player.team = player.team === "TEAM_1" ? "TEAM_2" : "TEAM_1";
            // set player not ready
            player.ready = false;
            callback();
            // emit team selection event
            emitTeamSelection(io);
            return;
        }
        callback({
            error: "invalid player ID",
            errorType: "rejected",
        });
    }



    dealHandHandler(
        payload: events.DealHandPayload,
        callback: (res?: events.DealHandResponse) => void,
    ) {
        const player = playerById.get(payload.playerId);
        if (!player || !player.hand) {
            console.log("player not found or hand not dealt yet", payload.playerId);
            callback();
            return;
        }
        console.log("deal-hand event handler", player);

        const playerDetails = players.map<events.PlayerDetails>((player) => {
            return {
                name: player.name,
                team: player.team,
                order: player.order,
                playerId: player.id,
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
        const response: events.DealHandResponse = {
            hand: player.hand,
            playerDetails: playerDetails,
            playerOrder: player.order,
        };
        console.log("deal-hand response ", response);
        callback(response);
    }

    ////////////////// event emitters //////////////////
    emitWithRetry(socket: Socket<events.ClientEvents, events.ServerEvents>, event: keyof events.ServerEvents, payload: any, retries = 3) {
        socket.timeout(EMIT_TIMEOUT).emit(event, payload, (err: Error) => {
            if (err && retries > 0) {
                emitWithRetry(socket, event, payload, retries - 1);
            }
        });
    }

    emitNewTurn(io: Server<events.ClientEvents, events.ServerEvents>, payload: events.NewTurnPayload ) {
        console.log("emit next-turn event", payload);
        console.log('cards played: ', cardsPlayed);
        io.timeout(EMIT_TIMEOUT).emit("new-turn", payload);
    }

    emitTeamSelection(io: Server<events.ClientEvents, events.ServerEvents>) {
        const team1 = players.filter((player) => player.team === "TEAM_1").map((player) => {
            return {
                name: player.name,
                team: player.team,
                order: player.order,
                playerId: player.id,
            };
        });
        
        const team2 = players.filter((player) => player.team === "TEAM_2").map((player) => {
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
        for (let i = 0; i < players.length; i++) {
            // assign player orders so that team 1 has odd orders and team 2 has even orders
            if (players[i].team === "TEAM_1") {
                players[i].order = team1Counter * 2 + 1;
                team1Counter += 1;
            } else {
                players[i].order = team2Counter * 2 + 2;
                team2Counter += 1;
            }
        }

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
            // emitDealHand(player);
        }

        emitGameStart(io);
    }

    completeTurn(currentPlayer: Player, card: number, io: Server<events.ClientEvents, events.ServerEvents>) {
        cardsPlayed.push(NewCardPlayed(card, currentPlayer));
        completedTurns += 1;
        nextPlayer = players.find((player) => player.order === (nextPlayer.order % MAX_PLAYER_COUNT) + 1)!;
        newTurn(io, currentPlayer, card);
    }

    newTurn(
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
            cardsPlayed: cardsPlayed.map((cardPlayed) => cardPlayed.card.value),
            gameOver: round === ROUNDS_PER_GAME ? true : false,
        };
        emitNewTurn(io, payload);
        if (completedTurns === MAX_PLAYER_COUNT) {
            completedTurns = 0;
            round += 1;

            // calculate scores and decide next player
            const winningCard = findWinningCard();
            if (winningCard.player.team === "TEAM_1") {
                team1Score += 1;
            } else {
                team2Score += 1;
            }
            cardsPlayed = [];
            nextPlayer = winningCard.player;

            const payload: events.NewTurnPayload = {
                nextPlayer: nextPlayer.order,
                lastTurn: completedTurns,
                lastCard: lastCard,
                lastPlayer: lastPlayer?.order,
                round: round,
                team1Score: team1Score,
                team2Score: team2Score,
                cardsPlayed: [],
                gameOver: round === ROUNDS_PER_GAME ? true : false,
            };
            // start new round after 3 second delay
            setTimeout(() => {
                emitNewTurn(io, payload);
            }, 3000);

        }
    }

    ////////////////// utils //////////////////
    shuffle<T>(array: T[]) {
        let currentIndex = array.length, randIndex = 0;
        while (currentIndex !== 0) {
            randIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randIndex]] = [array[randIndex], array[currentIndex]];
        }
    }

    printConnection(socket: Socket<events.ClientEvents, events.ServerEvents>) {
        const player = players.filter((player) => player.socket === socket)[0];
        console.log('a user connected', player);
    }

    findWinningCard(): CardPlayed {
        console.log('finding winning card in cards played: ', cardsPlayed.map((cardPlayed) => [cardPlayed.card.faceValue, cardPlayed.card.suit]));
        const handSuit = cardsPlayed[0].card.suit;

        let winningCard = cardsPlayed[0];

        // if the first card is a joker, it wins
        if (handSuit === Suit.JOKER) {
            console.log('joker wins');
            return winningCard;
        }

        // for other first cards, find the highest card of the same suit or the highest card of the trump suit
        for (const cardPlayed of cardsPlayed) {

            console.log('comparing card: ', cardPlayed.card.faceValue, cardPlayed.card.suit);
            if (cardPlayed.card.suit === Suit.JOKER) {
                console.log('joker card');
                winningCard = winningCard.card.suit !== Suit.JOKER || cardPlayed.card.faceValue > winningCard.card.faceValue? cardPlayed : winningCard;
            } else if (cardPlayed.card.suit === trumpSuit) {
                console.log('trump card');
                // if the card is a trump card and the winning card is not a trump card or the card is higher than the winning card
                winningCard = winningCard.card.suit !== trumpSuit || cardPlayed.card.faceValue > winningCard.card.faceValue ? cardPlayed : winningCard;
            }
            else if (cardPlayed.card.suit === winningCard.card.suit && cardPlayed.card.faceValue > winningCard.card.faceValue) {
                console.log('higher card of same suit')
                winningCard = cardPlayed;
            }
            console.log('winning card so far: ', winningCard.card.faceValue, winningCard.card.suit);
        }
        console.log('winning card for hand: ', winningCard.card.faceValue, winningCard.card.suit);
        return winningCard;
    }

    NewCard(card: number): Card {
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

    NewCardPlayed(card: number, player: Player): CardPlayed {
        return {
            card: NewCard(card),
            player: player,
        };
    }
}