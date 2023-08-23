
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RedPlayer extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 0, y ?? 0);

		// back_Red_1_png
		const back_Red_1_png = scene.add.image(72.52940632697565, 46.956400497205216, "sprite", "Back Red 1.png");
		this.add(back_Red_1_png);

		// back_Red_1_png_2
		const back_Red_1_png_2 = scene.add.image(53.529406326975646, 46.956400497205216, "sprite", "Back Red 1.png");
		this.add(back_Red_1_png_2);

		// back_Red_1_png_1
		const back_Red_1_png_1 = scene.add.image(35.529406326975646, 47.956400497205216, "sprite", "Back Red 1.png");
		this.add(back_Red_1_png_1);

		// text_1
		const text_1 = scene.add.text(0, 96, "", {});
		text_1.text = "opponent";
		text_1.setStyle({ "backgroundColor": "#ff0000ff", "fontSize": "22px", "stroke": "#000000ff", "strokeThickness":4});
		this.add(text_1);

		this.text_1 = text_1;

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	private text_1: Phaser.GameObjects.Text;

	/* START-USER-CODE */

	addPlayerName(name: string) {
		this.text_1.setText(name);
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
