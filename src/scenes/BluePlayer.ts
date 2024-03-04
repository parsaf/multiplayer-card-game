
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class BluePlayer extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 0, y ?? 0);

		// text_1
		const text_1 = scene.add.text(0, 70, "", {});
		text_1.setOrigin(0.5, 0.5);
		text_1.text = "friend";
		text_1.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px", "stroke": "#000000ff", "strokeThickness":4});
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

		// back_Blue_1_png_4
		const back_Blue_1_png_4 = scene.add.image(17.861654318361616, -0.36426186469720534, "sprite", "Back Blue 1.png");
		container_1.add(back_Blue_1_png_4);

		// back_Blue_1_png_5
		const back_Blue_1_png_5 = scene.add.image(-0.189413033933306, -0.47845864204095534, "sprite", "Back Blue 1.png");
		container_1.add(back_Blue_1_png_5);

		// back_Blue_1_png_6
		const back_Blue_1_png_6 = scene.add.image(-19.138345681638384, 0.6357381353027947, "sprite", "Back Blue 1.png");
		container_1.add(back_Blue_1_png_6);

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
