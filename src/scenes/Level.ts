
// You can write more code here

const SERVER_URL = "http://localhost:8000";
const TIMEOUT = 1000;

/* START OF COMPILED CODE */

import Phaser from "phaser";
import RedPlayer from "./RedPlayer";
import BluePlayer from "./BluePlayer";
import DropZonePrefab from "./DropZonePrefab";
import EnterNamePrefab from "./EnterNamePrefab";
/* START-USER-IMPORTS */
import HandCard, { CARD_HEIGHT, CARD_WIDTH } from "./HandCard";
import type { ServerEvents, ClientEvents } from "../events/SocketEvents";
import { GridSizer } from 'phaser3-rex-plugins/templates/ui/ui-components.js';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
// import InputText from "phaser3-rex-plugins/plugins/inputtext.js";
import { io, Socket } from "socket.io-client";
import qs from "qs";
import fetchBuilder from "fetch-retry";

const fetchRetry = fetchBuilder(fetch);
type OtherPlayer = RedPlayer | BluePlayer;
/* END-USER-IMPORTS */

export default class Level extends Phaser.Scene {

	constructor() {
		super("Level");

		/* START-USER-CTR-CODE */
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// carpet
		const carpet = this.add.image(360, 640, "carpet");
		carpet.scaleX = 0.87;
		carpet.scaleY = 1.15;

		// opponent_2
		const opponent_2 = new RedPlayer(this, 305, 10);
		this.add.existing(opponent_2);

		// team_mate_1
		const team_mate_1 = new BluePlayer(this, 10, 10);
		this.add.existing(team_mate_1);

		// team_mate_2
		const team_mate_2 = new BluePlayer(this, 600, 10);
		this.add.existing(team_mate_2);

		// opponent_1
		const opponent_1 = new RedPlayer(this, 10, 592);
		this.add.existing(opponent_1);

		// opponent_3
		const opponent_3 = new RedPlayer(this, 600, 592);
		this.add.existing(opponent_3);

		// dropZone
		const dropZone = new DropZonePrefab(this, 360, 320);
		this.add.existing(dropZone);

		// nameInputModal
		const nameInputModal = new EnterNamePrefab(this, 360, 640);
		this.add.existing(nameInputModal);

		this.opponent_2 = opponent_2;
		this.team_mate_1 = team_mate_1;
		this.team_mate_2 = team_mate_2;
		this.opponent_1 = opponent_1;
		this.opponent_3 = opponent_3;
		this.dropZone = dropZone;
		this.nameInputModal = nameInputModal;

		this.events.emit("scene-awake");
	}

	private opponent_2!: RedPlayer;
	private team_mate_1!: BluePlayer;
	private team_mate_2!: BluePlayer;
	private opponent_1!: RedPlayer;
	private opponent_3!: RedPlayer;
	private dropZone!: DropZonePrefab;
	private nameInputModal!: EnterNamePrefab;

	/* START-USER-CODE */
	rexUI!: RexUIPlugin;
	private playerHand!: GridSizer;
	private cardPile!: GridSizer;
	private socket!: Socket<ServerEvents, ClientEvents>;
	private playerId!: string;
	private playerOrder!: number;
	private playerName!: string;
	private playersByOrder = new Map<number, OtherPlayer>();

	create() {
		this.editorCreate();
		console.log("create");

		this.socket = io(SERVER_URL, {
			retries: 10,
			// forceNew: true,
			timeout: TIMEOUT * 5,
            // transports: ["websocket"],
		});

		// TODO get game state
		// this.socket.on("connect", () => {
		// });
		this.input.on("dragstart", this.dragStartHandler, this);
		this.input.on("drag", this.dragHandler, this);
		this.input.on("dragend", this.dragEndHandler, this);
		this.dealHandListener();
	}

	dealPlayerHand(handVals: number[]) {
		console.log("card vals", handVals);
		handVals.sort((a, b) => b - a);
		this.cardPile = new GridSizer(this, {
			x: Math.floor(this.dropZone.x),
			y: Math.floor(this.dropZone.y),
			column: 3,
			row: 2,
			space: {
				column: 5,
				row: 5,
			},
		})
		this.add.existing(this.cardPile);
		this.playerHand = new GridSizer(this, {
			x: Math.floor(this.game.config.width as number / 2),
			y: this.game.config.height as number - 5 - Math.floor(CARD_HEIGHT / 2),
			column: 9,
			row: 1,
			space:{column: 5},
		});
		this.add.existing(this.playerHand);
		for (const val of handVals) {
			let card = new HandCard(this);
			card.assignValue(val);
			card.setInteractive({draggable: true});
            this.add.existing(card);
			this.playerHand.add(card);
		}
		this.playerHand.layout();
	}

	setPlayerNames(playerOrder: number, playerNames: string[]) {
		console.log("setting player names", playerNames);
		const playerObjects: OtherPlayer[] = [this.opponent_1, this.team_mate_1, this.opponent_2, this.team_mate_2, this.opponent_3];

		this.playerOrder = playerOrder;

		for (let i = 0; i < playerNames.length - 1; i++) {
			const order = (playerOrder + i + 1) % playerNames.length
			const name = playerNames[order];
			const player = playerObjects[i];
			player.addPlayerName(name);
			this.playersByOrder.set(order, player);
		}
		// playerNames = ["Parsa", "Arshia", 
		// 	// "Behnood", "Pirooz", "Baba", "Maman"
		// ];
		// playerOrder = 0;
		// for (let i = 0; i < playerNames.length - 1; i++) {
		// 	const order = (playerOrder + i + 1) % playerNames.length
		// 	const name = playerNames[order];
		// 	const player = playerObjects[i];
		// 	player.addPlayerName(name);
		// 	this.playersByOrder.set(order, player);
		// }
	}

	////////// socket event listener //////////

	dealHandListener() {
		console.log("deal hand listener");
		this.socket.on("deal-hand", (payload, callback) => {
			callback();
			console.log("got hand");
			this.dealPlayerHand(payload.hand);
			this.setPlayerNames(payload.playerOrder, payload.playerNames);
		});
	}

	////////// Text edit event handler
	onPlayerNameSubmit(textObject: Phaser.GameObjects.Text) {
		if (this.playerName) {
			return;
		}
		this.playerName = textObject.text;
		console.log("name entered", this.playerName);
		
		this.nameInputModal.destroy();

		fetchRetry(SERVER_URL + "/join?" + qs.stringify({name: this.playerName})).then((res) => {
			console.log("made request");
			if (!res.ok) {
				throw new Error(`HTTP error! Status: ${res.status}`);
			}
			return res.json();
		}).then((json) => {
			console.log("json parsed", json["playerId"]);
			this.playerId = json["playerId"];
			// tell server player is ready
			this.socket.emit("ready", { playerId: this.playerId }, (err) => {
				console.log("ready emitted");
				if (err) {
					console.error(err);
					throw Error(err.error);
				}
			});
		});
	}

	////////// card drag event handlers //////////
	dragStartHandler(pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) {
		console.log("drag start");
		obj.setOrigin(0.5, 1);
		this.children.bringToTop(obj)
		this.dropZone.setVisible(true);
		this.tweens.add({
			targets: obj,
			x: pointer.x,
			y: pointer.y,
			displayWidth: CARD_WIDTH * 2,
			displayHeight: CARD_HEIGHT * 2,
			duration: 150,
		});
	}

	dragHandler(pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) {
		console.log("drag");
		obj.x = pointer.x;
		obj.y = pointer.y;
	}

	dragEndHandler(pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, dropped: boolean) {
		console.log("drag end", dropped);

		obj.setOrigin(0.5, 0.5);
		obj.setDisplaySize(CARD_WIDTH, CARD_HEIGHT);

		if (dropped) {
			obj.disableInteractive();
			this.playerHand.remove(obj);
			this.cardPile.add(obj, {
				align: 'center',
				expand: false,
			});
			this.cardPile.layout();
		}
		this.playerHand.layout();
		this.dropZone.setVisible(false);
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
