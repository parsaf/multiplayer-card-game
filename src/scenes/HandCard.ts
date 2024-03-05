
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */


export const CARD_HEIGHT = 113;
export const CARD_WIDTH = 75;

export enum Suit {
    DIAMOND = 'Diamond',
    SPADES = 'Spades',
    HEARTS = 'Hearts',
    CLUBS = 'Clubs',
	JOKER_BLACK = 'Joker Black',
	JOKER_RED = 'Joker Red',
}

const suitOrdering = [Suit.DIAMOND, Suit.SPADES, Suit.HEARTS, Suit.CLUBS]
const suitFrameOffset : Record<Suit, number> = {
	[Suit.CLUBS]: 1,
	[Suit.SPADES]: 15,
	[Suit.HEARTS]: 29,
	[Suit.DIAMOND]: 43,
	[Suit.JOKER_BLACK]: 14,
	[Suit.JOKER_RED]: 28,
};


/* END-USER-IMPORTS */

export default class HandCard extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "sprite", frame ?? "Back Blue 1.png");

		/* START-USER-CTR-CODE */
		this.suit = null;
		this.faceValue = 0;
		this.value = 0;
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
	suit:  Suit | null;
	faceValue: number;
	value: number;

	assignValue(value: number) {
		let frame: number;
		if (value == 52) {
			this.suit =  Suit.JOKER_BLACK;
			this.faceValue = 0;
			frame = suitFrameOffset[this.suit];
		}
		else if (value == 53) {
			this.suit =  Suit.JOKER_RED;
			this.faceValue = 0;
			frame = suitFrameOffset[this.suit];
		}
		else if (0 <= value && value < 52) {
			this.suit = suitOrdering[Math.floor(value / 13)];
			this.faceValue = (value % 13) + 2; // 2,...,10,J,Q,K,A
			frame = suitFrameOffset[this.suit] + this.faceValue - 2;
		}
		else {
			throw new Error('Card value out of range');
		}
		this.value = value;

		console.log(`Card value: ${value}, suit: ${this.suit}, faceValue: ${this.faceValue}, frame: ${frame}`);

		this.setTexture("new-deck-sprite", frame);
	}

	static cmpr(a: HandCard, b: HandCard): number {
		return b.value - a.value;
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
