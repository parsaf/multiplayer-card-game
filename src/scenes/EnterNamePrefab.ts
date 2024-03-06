
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class EnterNamePrefab extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 0, y ?? 0);

		// rectangle
		const rectangle = scene.add.rectangle(0, 0, 720, 1280);
		rectangle.isFilled = true;
		rectangle.fillColor = 0;
		rectangle.fillAlpha = 0.4;
		this.add(rectangle);

		// text
		const text = scene.add.text(0, 0, "", {});
		text.setOrigin(0.5, 0.5);
		text.text = "Enter Your Name";
		text.setStyle({ "backgroundColor": "", "fontSize": "40px" });
		this.add(text);

		/* START-USER-CTR-CODE */
		text.setInteractive().on('pointerdown', () => {
			// @ts-ignore
			scene.rexUI.edit(
				text,
				{
					align: 'center',
					border: 2,
					borderColor: '#ffffff',
					selectAll: true,
					backgroundColor: 'transparent',
				},
				// @ts-ignore
				scene.onPlayerNameSubmit.bind(scene));
		})
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	// Write your code here.

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
