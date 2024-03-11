
// You can write more code here

const SERVER_URL = "/api";
const TIMEOUT = 1000;

/* START OF COMPILED CODE */

import Phaser from "phaser";
import PlayerReadyPrefab from "./PlayerReadyPrefab";
import EnterNamePrefab from "./EnterNamePrefab";
/* START-USER-IMPORTS */
import type * as Events from "../events/SocketEvents";
import { io, Socket } from "socket.io-client";
import qs from "qs";
import fetchBuilder from "fetch-retry";
import { v4 as uuidv4 } from "uuid";


const fetchRetry = fetchBuilder(fetch);
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
		const team_1 = this.add.text(360, 201, "", {});
		team_1.setOrigin(0.5, 0.5);
		team_1.text = "Team 1";
		team_1.setStyle({ "backgroundColor": "#ff0035ff", "fontSize": "50px" });

		// team_2
		const team_2 = this.add.text(360, 762, "", {});
		team_2.setOrigin(0.5, 0.5);
		team_2.text = "Team 2";
		team_2.setStyle({ "backgroundColor": "#ff0035ff", "fontSize": "50px" });

		// player1_1
		const player1_1 = this.add.text(359.5, 261, "", {});
		player1_1.setOrigin(0.5, 0.5);
		player1_1.visible = false;
		player1_1.text = "player 1";
		player1_1.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px" });

		// player1_2
		const player1_2 = this.add.text(359.5, 311.93994140625, "", {});
		player1_2.setOrigin(0.5, 0.5);
		player1_2.visible = false;
		player1_2.text = "player 2";
		player1_2.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px" });

		// player1_3
		const player1_3 = this.add.text(359.5, 362, "", {});
		player1_3.setOrigin(0.5, 0.5);
		player1_3.visible = false;
		player1_3.text = "player 3";
		player1_3.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px" });

		// player2_1
		const player2_1 = this.add.text(360, 822, "", {});
		player2_1.setOrigin(0.5, 0.5);
		player2_1.visible = false;
		player2_1.text = "player 1";
		player2_1.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px" });

		// player2_2
		const player2_2 = this.add.text(360, 872, "", {});
		player2_2.setOrigin(0.5, 0.5);
		player2_2.visible = false;
		player2_2.text = "player 2";
		player2_2.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px" });

		// player2_3
		const player2_3 = this.add.text(360, 923, "", {});
		player2_3.setOrigin(0.5, 0.5);
		player2_3.visible = false;
		player2_3.text = "player 3";
		player2_3.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px" });

		// team_switch
		const team_switch = this.add.image(282, 610, "up-down");
		team_switch.scaleX = 0.27;
		team_switch.scaleY = 0.26;
		team_switch.visible = false;

		// player1_4
		const player1_4 = this.add.text(359, 413, "", {});
		player1_4.setOrigin(0.5, 0.5);
		player1_4.visible = false;
		player1_4.text = "player 4";
		player1_4.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px" });

		// player1_5
		const player1_5 = this.add.text(359, 464, "", {});
		player1_5.setOrigin(0.5, 0.5);
		player1_5.visible = false;
		player1_5.text = "player 5";
		player1_5.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px" });

		// player1_6
		const player1_6 = this.add.text(359, 515, "", {});
		player1_6.setOrigin(0.5, 0.5);
		player1_6.visible = false;
		player1_6.text = "player 6";
		player1_6.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px" });

		// player2_4
		const player2_4 = this.add.text(360, 984, "", {});
		player2_4.setOrigin(0.5, 0.5);
		player2_4.visible = false;
		player2_4.text = "player 4";
		player2_4.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px" });

		// player2_5
		const player2_5 = this.add.text(360, 1034, "", {});
		player2_5.setOrigin(0.5, 0.5);
		player2_5.visible = false;
		player2_5.text = "player 5";
		player2_5.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px" });

		// player2_6
		const player2_6 = this.add.text(360, 1075, "", {});
		player2_6.setOrigin(0.5, 0.5);
		player2_6.visible = false;
		player2_6.text = "player 6";
		player2_6.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px" });

		// playerReadyState
		const playerReadyState = new PlayerReadyPrefab(this, 452, 610);
		this.add.existing(playerReadyState);

		// enterNamePrefab
		const enterNamePrefab = new EnterNamePrefab(this, 362, 639);
		this.add.existing(enterNamePrefab);

		this.player1_1 = player1_1;
		this.player1_2 = player1_2;
		this.player1_3 = player1_3;
		this.player2_1 = player2_1;
		this.player2_2 = player2_2;
		this.player2_3 = player2_3;
		this.team_switch = team_switch;
		this.player1_4 = player1_4;
		this.player1_5 = player1_5;
		this.player1_6 = player1_6;
		this.player2_4 = player2_4;
		this.player2_5 = player2_5;
		this.player2_6 = player2_6;
		this.playerReadyState = playerReadyState;
		this.enterNamePrefab = enterNamePrefab;

		this.events.emit("scene-awake");
	}

	private player1_1!: Phaser.GameObjects.Text;
	private player1_2!: Phaser.GameObjects.Text;
	private player1_3!: Phaser.GameObjects.Text;
	private player2_1!: Phaser.GameObjects.Text;
	private player2_2!: Phaser.GameObjects.Text;
	private player2_3!: Phaser.GameObjects.Text;
	private team_switch!: Phaser.GameObjects.Image;
	private player1_4!: Phaser.GameObjects.Text;
	private player1_5!: Phaser.GameObjects.Text;
	private player1_6!: Phaser.GameObjects.Text;
	private player2_4!: Phaser.GameObjects.Text;
	private player2_5!: Phaser.GameObjects.Text;
	private player2_6!: Phaser.GameObjects.Text;
	private playerReadyState!: PlayerReadyPrefab;
	private enterNamePrefab!: EnterNamePrefab;

	/* START-USER-CODE */
	private socket!: Socket<Events.ServerEvents, Events.ClientEvents>;
	private playerId!: string;
	private playerName!: string;
	private myTeam!: Events.Team;
	private team1Objects: Phaser.GameObjects.Text[] = [];
	private team2Objects: Phaser.GameObjects.Text[] = [];
	private team1Names: string[] = [];
	private team2Names: string[] = [];
	private enableReadyState: boolean = true;

	create() {

		this.editorCreate();
		this.team1Objects = [this.player1_1, this.player1_2, this.player1_3, this.player1_4, this.player1_5, this.player1_6];
		this.team2Objects = [this.player2_1, this.player2_2, this.player2_3, this.player2_4, this.player2_5, this.player2_6];
		this.socket = io('/', {
			retries: 10,
			timeout: TIMEOUT * 5,
		});
		this.teamSelectionListener();
		this.gameStartListener();
		// create a click listener for the team switch button
		this.team_switch.setInteractive();
		this.team_switch.on("pointerdown", this.handleTeamSwitchClick.bind(this));
		// create click listener for the ready state button
		this.playerReadyState.on("pointerdown", this.handleReadyStateClick.bind(this));
	}

	////////// Text edit event handler //////////
	onPlayerNameSubmit(textObject: Phaser.GameObjects.Text) {
		if (this.playerName) {
			return;
		}
		this.playerName = textObject.text;
		console.log("name entered", this.playerName);

		this.enterNamePrefab.destroy();

		fetchRetry(SERVER_URL + "/join?" + qs.stringify({name: this.playerName})).then((res) => {
			console.log("join response");
			if (!res.ok) {
				throw new Error(`HTTP error! Status: ${res.status}`);
			}
			return res.json();
		}).then((json) => {
			console.log("json parsed", json);
			this.playerId = json["playerId"];
			this.myTeam = json["team"];
			this.team_switch.setVisible(true);
			this.playerReadyState.setVisible(true);
			this.playerReadyState.setReady(false);
		})
	}

	setTeams(team1: Events.PlayerDetails[], team2: Events.PlayerDetails[]) {
		console.log("setting teams", team1, team2);
		this.team1Objects.forEach((obj, i) => {
			if (!team1[i]) {
				obj.setVisible(false);
				return;
			}
			let name = team1[i].name;
			if (team1[i].playerId === this.playerId) {
				name = '>>> ' + name + ' <<<';
				this.myTeam = team1[i].team;
			}
			obj.setText(name);
			obj.setVisible(true);
		});
		this.team2Objects.forEach((obj, i) => {
			if (!team2[i]) {
				obj.setVisible(false);
				return;
			}
			let name = team2[i].name;
			if (team2[i].playerId === this.playerId) {
				name = '>>> ' + name + ' <<<';
				this.myTeam = team2[i].team;
			}
			obj.setText(name);
			obj.setVisible(true);
		});
	}

	teamSelectionListener() {
		this.socket.on("team-selection", (payload) => {
			console.log("team selection received", payload);
			const team1 = payload.team1.map((p) => p.name);
			const team2 = payload.team2.map((p) => p.name);
			// if new team names are different from the old ones, update the display
			if (team1.join() !== this.team1Names.join() || team2.join() !== this.team2Names.join()) {
				console.log("updating teams", team1, team2);
				this.team1Names = team1;
				this.team2Names = team2;
				this.setTeams(payload.team1, payload.team2);
			}
		});
	}

	handleTeamSwitchClick() {
		const payload: Events.TeamSwitchPayload = {
			// generate a uuid for the idempotency key
			idempotencyKey: uuidv4(),
			playerId: this.playerId,
		};
		this.socket.emit("switch-team", payload, (err) => {
			if (err) {
				console.error(err);
				throw Error(err.error);
			}
			// set state to not ready
			this.playerReadyState.setReady(false);
		});
	}

	handleReadyStateClick() {
		if (this.playerReadyState.visible && this.enableReadyState) {
			const payload: Events.PlayerReadyPayload = {
				idempotencyKey: uuidv4(),
				playerId: this.playerId,
			};
			this.enableReadyState = false;
			console.log("ready-state emitted", payload);
			this.socket.emit("ready-state", payload, (res) => {
				console.log("ready-state response", res);
				if (res && res.idempotencyKey === payload.idempotencyKey) {
					console.log("ready-state not empty");
					this.playerReadyState.setReady(res.ready);
					this.enableReadyState = true;
				}
			});
		}
	}

	gameStartListener() {
		this.socket.on("game-start", (start, callback) => {
			console.log("game start received", start);
			if (start) {
				this.scene.start("Level", { 
					socket: this.socket,
					playerId: this.playerId,
					team: this.myTeam,
					playerName: this.playerName,
				});
				callback(true);
			}
		});
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
