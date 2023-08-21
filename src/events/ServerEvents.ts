export interface ClientEvents {
	"ready": (payload: playerReadyPayload, callback: (res?: SocketError) => void) => void;
}
export interface ServerEvents {
	"start-game": (hand: number[], callback: () => void) => void;
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
