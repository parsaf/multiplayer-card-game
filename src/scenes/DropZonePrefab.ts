
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class DropZonePrefab extends Phaser.GameObjects.Rectangle {

	constructor(scene: Phaser.Scene, x?: number, y?: number, width?: number, height?: number) {
		super(scene, x ?? 0, y ?? 0, width ?? 720, height ?? 640);

		this.visible = false;
		this.isFilled = true;
		this.fillColor = 5567525;
		this.fillAlpha = 0.25;

		/* START-USER-CTR-CODE */
		this.zone = scene.add.zone(this.x, this.y, this.width, this.height).setRectangleDropZone(this.width, this.height);
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
	zone: Phaser.GameObjects.Zone
	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
