export interface ClientEvents {
	"ready": (payload: playerReadyPayload, callback: (res?: SocketError) => void) => void;
}

export interface ServerEvents {
	"deal-hand": (payload: DealHandPayload, callback: () => void) => void;
}

interface SocketError {
	error: string;
	errorType: "rejected" | "server";
}

interface ServerSuccess {
	data: Object;
}

type ServerResponse<T> = SocketError | ServerSuccess;

interface playerReadyPayload {
	playerId: string;
}

export interface DealHandPayload {
	hand: number[];
	playerNames: string[];
	playerOrder: number;
}