
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import EnterNamePrefab from "./EnterNamePrefab";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Lobby extends Phaser.Scene {

	constructor() {
		super("Lobby");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// carpet
		const carpet = this.add.image(360, 640, "carpet");
		carpet.scaleX = 0.87;
		carpet.scaleY = 1.15;

		// team_1
		const team_1 = this.add.text(360, 426, "", {});
		team_1.setOrigin(0.5, 0.5);
		team_1.visible = false;
		team_1.text = "Team 1";
		team_1.setStyle({ "backgroundColor": "#ff0035ff", "fontSize": "40px" });

		// team_2
		const team_2 = this.add.text(360, 852, "", {});
		team_2.setOrigin(0.5, 0.5);
		team_2.visible = false;
		team_2.text = "Team 2";
		team_2.setStyle({ "backgroundColor": "#ff0035ff", "fontSize": "40px" });

		// player1_1
		const player1_1 = this.add.text(360, 466, "", {});
		player1_1.setOrigin(0.5, 0.5);
		player1_1.visible = false;
		player1_1.text = "player 1";
		player1_1.setStyle({ "backgroundColor": "", "fontSize": "28px" });

		// player1_2
		const player1_2 = this.add.text(360, 507, "", {});
		player1_2.setOrigin(0.5, 0.5);
		player1_2.visible = false;
		player1_2.text = "player 2";
		player1_2.setStyle({ "backgroundColor": "", "fontSize": "28px" });

		// player1_3
		const player1_3 = this.add.text(361.8813171042931, 548.1107520663506, "", {});
		player1_3.setOrigin(0.5, 0.5);
		player1_3.visible = false;
		player1_3.text = "player 3";
		player1_3.setStyle({ "backgroundColor": "", "fontSize": "28px" });

		// player2_1
		const player2_1 = this.add.text(360, 892, "", {});
		player2_1.setOrigin(0.5, 0.5);
		player2_1.visible = false;
		player2_1.text = "player 1";
		player2_1.setStyle({ "backgroundColor": "", "fontSize": "28px" });

		// player2_2
		const player2_2 = this.add.text(360, 932, "", {});
		player2_2.setOrigin(0.5, 0.5);
		player2_2.visible = false;
		player2_2.text = "player 2";
		player2_2.setStyle({ "backgroundColor": "", "fontSize": "28px" });

		// player2_4
		const player2_4 = this.add.text(360, 972, "", {});
		player2_4.setOrigin(0.5, 0.5);
		player2_4.visible = false;
		player2_4.text = "player 3";
		player2_4.setStyle({ "backgroundColor": "", "fontSize": "28px" });

		// team_switch
		const team_switch = this.add.image(360, 680, "up-down");
		team_switch.scaleX = 0.27;
		team_switch.scaleY = 0.26;
		team_switch.visible = false;

		// enterNamePrefab
		const enterNamePrefab = new EnterNamePrefab(this, 360, 639);
		this.add.existing(enterNamePrefab);

		this.player1_1 = player1_1;
		this.player1_2 = player1_2;
		this.player1_3 = player1_3;
		this.player2_1 = player2_1;
		this.player2_2 = player2_2;
		this.player2_4 = player2_4;
		this.team_switch = team_switch;
		this.enterNamePrefab = enterNamePrefab;

		this.events.emit("scene-awake");
	}

	private player1_1!: Phaser.GameObjects.Text;
	private player1_2!: Phaser.GameObjects.Text;
	private player1_3!: Phaser.GameObjects.Text;
	private player2_1!: Phaser.GameObjects.Text;
	private player2_2!: Phaser.GameObjects.Text;
	private player2_4!: Phaser.GameObjects.Text;
	private team_switch!: Phaser.GameObjects.Image;
	private enterNamePrefab!: EnterNamePrefab;

	/* START-USER-CODE */

	// Write your code here

	create() {

		this.editorCreate();
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
