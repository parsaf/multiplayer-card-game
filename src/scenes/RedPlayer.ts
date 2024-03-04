
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RedPlayer extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? -8, y ?? 0);

		// text_1
		const text_1 = scene.add.text(0, 70, "", {});
		text_1.setOrigin(0.5, 0.5);
		text_1.text = "opponent";
		text_1.setStyle({ "backgroundColor": "#ff0000ff", "fontSize": "35px", "stroke": "#000000ff", "strokeThickness":4});
		this.add(text_1);

		// turnStatus
		const turnStatus = scene.add.rectangle(0, 20, 170, 140);
		turnStatus.visible = false;
		turnStatus.isStroked = true;
		turnStatus.strokeColor = 589614;
		turnStatus.lineWidth = 6;
		this.add(turnStatus);

		// container_1
		const container_1 = scene.add.container(0, 0);
		this.add(container_1);

		// back_Red_1_png
		const back_Red_1_png = scene.add.image(19.501117889528405, 0.6581203455829897, "sprite", "Back Red 1.png");
		container_1.add(back_Red_1_png);

		// back_Red_1_png_2
		const back_Red_1_png_2 = scene.add.image(-0.49888211047159414, -0.3418796544170104, "sprite", "Back Red 1.png");
		container_1.add(back_Red_1_png_2);

		// back_Red_1_png_1
		const back_Red_1_png_1 = scene.add.image(-16.498882110471595, -0.3418796544170104, "sprite", "Back Red 1.png");
		container_1.add(back_Red_1_png_1);

		this.text_1 = text_1;
		this.turnStatus = turnStatus;

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	private text_1: Phaser.GameObjects.Text;
	private turnStatus: Phaser.GameObjects.Rectangle;

	/* START-USER-CODE */

	addPlayerName(name: string) {
		this.text_1.setText(name);
	}

	setTurnStatus(status: boolean) {
		this.turnStatus.setVisible(status);
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
