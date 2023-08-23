import {Socket} from "socket.io";


export interface Player {
    name: string,
    hand: number[],
    id: string,
    socket?: Socket,
    ready: boolean,
    order: number,
}