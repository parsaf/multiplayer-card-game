
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class BluePlayer extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 0, y ?? 0);

		// back_Blue_1_png_4
		const back_Blue_1_png_4 = scene.add.image(72.51235364355163, 47.07857127616366, "sprite", "Back Blue 1.png");
		this.add(back_Blue_1_png_4);

		// back_Blue_1_png_5
		const back_Blue_1_png_5 = scene.add.image(54.4612862912567, 46.96437449881991, "sprite", "Back Blue 1.png");
		this.add(back_Blue_1_png_5);

		// back_Blue_1_png_6
		const back_Blue_1_png_6 = scene.add.image(35.512352689877304, 48.07857127616366, "sprite", "Back Blue 1.png");
		this.add(back_Blue_1_png_6);

		// text_1
		const text_1 = scene.add.text(0, 96, "", {});
		text_1.text = "friend";
		text_1.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "22px", "stroke": "#000000ff", "strokeThickness":4});
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
