
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import RedPlayer from "./RedPlayer";
import BluePlayer from "./BluePlayer";
/* START-USER-IMPORTS */
import HandCard from "./HandCard";
/* END-USER-IMPORTS */

export default class Level extends Phaser.Scene {

	constructor() {
		super("Level");

		/* START-USER-CTR-CODE */
		this.playerHand = [];
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// carpet
		const carpet = this.add.image(360, 640, "carpet");
		carpet.scaleX = 0.8682609620551739;
		carpet.scaleY = 1.1531963897024449;

		// opponent_2
		const opponent_2 = new RedPlayer(this, 305, 10);
		this.add.existing(opponent_2);

		// team_mate_1
		const team_mate_1 = new BluePlayer(this, 10, 10);
		this.add.existing(team_mate_1);

		// team_mate_2
		const team_mate_2 = new BluePlayer(this, 600, 10);
		this.add.existing(team_mate_2);

		// opponent_1
		const opponent_1 = new RedPlayer(this, 10, 592);
		this.add.existing(opponent_1);

		// opponent_3
		const opponent_3 = new RedPlayer(this, 600, 592);
		this.add.existing(opponent_3);

		this.events.emit("scene-awake");
	}

	/* START-USER-CODE */
	playerHand: HandCard[];

	// Write your code here

	create() {

		this.editorCreate();

		const cardWidth = 71;
		const cardHeight = 94;
        const padding = 5;
        const totalWidth = 9 * cardWidth + (9 - 1) * padding;
        let x = (this.game.config.width as number - totalWidth) / 2 + cardWidth / 2;
		const y = this.game.config.height as number - 10 - (cardHeight / 2);

		var nums = Phaser.Utils.Array.NumberArray(0, 53) as number[];
        Phaser.Utils.Array.Shuffle(nums);
		for (let i = 0; i < 9; i++) {
			let card = new HandCard(this, x, y);
			card.assignValue(nums[i]);
			this.playerHand.push(card);
            this.add.existing(card); // Add the card to the scene
			x += cardWidth + padding;
		}
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
