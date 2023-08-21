import {Socket} from "socket.io";


export interface Player {
    name: string,
    hand: number[],
    id: string,
    socket?: Socket,
    ready: boolean,
}

export interface SocketError {
    error: string;
    errorType: "rejected" | "server";
}

export interface ServerSuccess<T> {
    data: T;
}

export type ServerResponse<T> = SocketError | ServerSuccess<T>;

export interface playerReadyPayload {
    playerId: string;
}


export interface ClientEvents {
    "ready": (payload: playerReadyPayload, callback: (res?: SocketError) => void) => void;
}

export interface ServerEvents {
    "start-game": (player: Player["hand"], callback: () => void) => void;
}
