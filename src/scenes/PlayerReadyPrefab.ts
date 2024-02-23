
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class PlayerReadyPrefab extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 0, y ?? 0);

		this.setInteractive(new Phaser.Geom.Rectangle(-57, -56, 113.8, 112.67), Phaser.Geom.Rectangle.Contains);
		this.visible = false;

		// cross
		const cross = scene.add.image(0, 0, "cancel");
		cross.scaleX = 0.25;
		cross.scaleY = 0.25;
		cross.visible = false;
		this.add(cross);

		// check
		const check = scene.add.image(0, 0, "check-mark");
		check.scaleX = 0.25;
		check.scaleY = 0.25;
		check.visible = false;
		this.add(check);

		this.cross = cross;
		this.check = check;

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	private cross: Phaser.GameObjects.Image;
	private check: Phaser.GameObjects.Image;

	/* START-USER-CODE */

	setReady(ready: boolean) {
		this.cross.visible = !ready;
		this.check.visible = ready;
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
