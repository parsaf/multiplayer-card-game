
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Rage extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 0, y ?? -68);

		// rectangle_1
		const rectangle_1 = scene.add.rectangle(0, 0, 128, 128);
		rectangle_1.isFilled = true;
		rectangle_1.fillColor = 5613;
		rectangle_1.isStroked = true;
		rectangle_1.strokeColor = 16713479;
		rectangle_1.lineWidth = 5;
		this.add(rectangle_1);

		// benzeme
		const benzeme = scene.add.image(0, 0, "benzeme");
		benzeme.scaleX = 0.2;
		benzeme.scaleY = 0.2;
		this.add(benzeme);

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	// Write your code here.

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
