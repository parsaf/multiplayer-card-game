export interface ClientEvents {
	"ready": (payload: playerReadyPayload, callback: (res?: SocketError) => void) => void;
	"turn-complete": (payload: TurnCompletePayload, callback: (res?: SocketError) => void) => void;
}

export interface ServerEvents {
	"deal-hand": (payload: DealHandPayload, callback: () => void) => void;
	"new-turn": (payload: NewTurnPayload) => void;
	// "new-round": (payload: NewRoundPayload, callback: () => void) => void;
}

export interface SocketError {
	error: string;
	errorType: "rejected" | "server";
}

interface ServerSuccess {
	data: Object;
}

type ServerResponse<T> = SocketError | ServerSuccess;

export interface playerReadyPayload {
	playerId: string;
}


export type Team = "TEAM_1" | "TEAM_2";

export interface PlayerDetails {
	name: string;
	order: number; // 1 through 6
	team: Team;
}

export interface DealHandPayload {
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