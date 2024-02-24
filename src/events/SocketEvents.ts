export interface ClientEvents {
	"ready-state": (payload: PlayerReadyPayload, callback: (ready?: PlayerReadyState) => void) => void;
	"turn-complete": (payload: TurnCompletePayload, callback: (res?: SocketError) => void) => void;
	"switch-team": (payload: TeamSwitchPayload, callback: (res?: SocketError) => void) => void;
	"deal-hand": (payload: DealHandPayload, callback: (res?: DealHandResponse) => void) => void;
}

export interface ServerEvents {
	"new-turn": (payload: NewTurnPayload) => void;
	"team-selection": (payload: TeamSelectionPayload) => void;
	"game-start": (gameStart: boolean, callback: (start: boolean) => void) => void;
	// "new-round": (payload: NewRoundPayload, callback: () => void) => void;
}

export interface SocketError {
	error: string;
	errorType: "rejected" | "server";
}

export interface PlayerReadyState {
	idempotencyKey: string;
	ready: boolean;
}

export interface PlayerReadyPayload {
	idempotencyKey: string;
	playerId: string;
}


export type Team = "TEAM_1" | "TEAM_2";

export interface PlayerDetails {
	name: string;
	order: number; // 1 through 6
	team: Team;
	playerId: string;
}

export interface TeamSelectionPayload {
	team1: PlayerDetails[];
	team2: PlayerDetails[];
}

export interface TeamSwitchPayload {
	idempotencyKey: string;
	playerId: string;
}

export interface DealHandPayload {
	playerId: string;
}

export interface DealHandResponse {
	hand: number[];
	playerDetails: PlayerDetails[];
	playerOrder: number;
}

export interface NewTurnPayload {
	nextPlayer?: number; // who's turn is it now. 1 through 6. repeats each round
	lastTurn: number; // 1 through 6
	cardsPlayed: number[]; // cards played in previous turns of the same round
	round: number; // 1 through 9
	lastCard?: number; // card played by the last player
	lastPlayer?: number; // order of the last player
	team1Score: number;
	team2Score: number;
	gameOver: boolean;
}

export interface TurnCompletePayload {
	idempotencyKey: string;
	playerId: string;
	card: number;
	turn: number; // 1 through 6
}

// export interface NewRoundPayload {
// 	round: number; // 1 through 9
// 	lastWinnerDetails?: PlayerDetails; // winning player's order
// 	team1Score: number;
// 	team2Score: number;
// }