
// You can write more code here

const SERVER_URL = "http://localhost:8000";
const USER_ID = "e2432309-9a1c-4b87-a844-91d404cd2fd1"; // TODO remove
const TIMEOUT = 1000;

/* START OF COMPILED CODE */

import Phaser from "phaser";
import RedPlayer from "./RedPlayer";
import BluePlayer from "./BluePlayer";
import DropZonePrefab from "./DropZonePrefab";
/* START-USER-IMPORTS */
import HandCard, { CARD_HEIGHT, CARD_WIDTH } from "./HandCard";
import { GridSizer } from 'phaser3-rex-plugins/templates/ui/ui-components.js';
import { io, Socket } from "socket.io-client";

interface ClientEvents {
    "ready": (payload: playerReadyPayload, callback: (res?: SocketError) => void) => void;
}

interface ServerEvents {
    "start-game": (hand: number[], callback: () => void) => void;
}

interface SocketError {
    error: string;
    errorType: "rejected" | "server";
}

interface ServerSuccess {
    data: Object;
}

type ServerResponse<T> = SocketError | ServerSuccess;

interface playerReadyPayload {
    playerId: string;
}

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
		carpet.scaleX = 0.8682609620551739;
		carpet.scaleY = 1.1531963897024449;

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

		this.dropZone = dropZone;

		this.events.emit("scene-awake");
	}

	private dropZone!: DropZonePrefab;

	/* START-USER-CODE */
	private playerHand!: GridSizer;
	private cardPile!: GridSizer;
	private socket!: Socket<ServerEvents, ClientEvents>;
	private cardVals!: number[];
	private handDealt: boolean = false;

	create() {
		this.editorCreate();
		console.log("create");

		this.socket = io(SERVER_URL, {
			retries: 10,
			// forceNew: true,
			timeout: TIMEOUT * 5,
            // transports: ["websocket"],
		});
		
		// tell server player is ready
		this.socket.emit("ready", { playerId: USER_ID }, (err) => {
			console.log("ready emitted");
			if (err) {
				console.error(err);
				throw Error(err.error);
			}
		});
		// TODO get game state
		// this.socket.on("connect", () => {
		// });
		this.input.on("dragstart", this.dragStartHandler, this);
		this.input.on("drag", this.dragHandler, this);
		this.input.on("dragend", this.dragEndHandler, this);

		this.startGameHandler();

	}

	update(time: number, delta: number): void {
		if (this.cardVals && !this.handDealt) {
			console.log("createPlayerHand ready");
			this.dealPlayerHand(this.cardVals);
		}
	}

	// async emitWithRetryAsync<T>(event: keyof ClientEvents, arg: any, retry=3) {
	// 	let hasErr = false;
	// 	try {
	// 		const response = await this.socket.timeout(TIMEOUT).emitWithAck(event, arg);
	// 		hasErr = "error" in response;
	// 	} catch (err) {
	// 		hasErr = true;
	// 	}
	// 	if (hasErr && retry > 0) {

	// 	}
	// }

	// emitWithRetry<T>(event: keyof ClientEvents, arg: any, retry=3) {
	// 	this.socket.timeout(TIMEOUT).emit(event, arg, (err, res: ServerResponse<T>) => {
	// 		if ((err || "error" in res) && retry > 0) {
	// 			console.log("retries left ", retry, res, err);
	// 			this.emitWithRetry(event, arg, retry - 1);
	// 		}
	// 	});
	// }

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
		this.handDealt = true;
	}

	////////// socket event handlers //////////
	startGameHandler() {
		console.log("start game handler");
		this.socket.on("start-game", (hand, callback) => {
			this.cardVals = hand;
			console.log("got hand");
			callback();
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
