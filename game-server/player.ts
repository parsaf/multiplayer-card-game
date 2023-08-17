export interface Player {
    name: string,
    hand: Card[],
    id: string,
}

export interface Card {
    value: number,
}