
// You can write more code here

const SERVER_URL = "/api";
const TIMEOUT = 1000;

/* START OF COMPILED CODE */

import Phaser from "phaser";
import RedPlayer from "./RedPlayer";
import BluePlayer from "./BluePlayer";
import DropZonePrefab from "./DropZonePrefab";
import Rage from "./Rage";
/* START-USER-IMPORTS */
import HandCard, { CARD_HEIGHT, CARD_WIDTH } from "./HandCard";
import type * as Events from "../events/SocketEvents";
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import { io, Socket } from "socket.io-client";
import qs from "qs";
import fetchBuilder from "fetch-retry";
import { v4 as uuidv4 } from "uuid";


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
		const opponent_2 = new RedPlayer(this, 360, 50);
		this.add.existing(opponent_2);

		// team_mate_1
		const team_mate_1 = new BluePlayer(this, 90, 50);
		this.add.existing(team_mate_1);

		// team_mate_2
		const team_mate_2 = new BluePlayer(this, 630, 50);
		this.add.existing(team_mate_2);

		// opponent_1
		const opponent_1 = new RedPlayer(this, 90, 592);
		this.add.existing(opponent_1);

		// opponent_3
		const opponent_3 = new RedPlayer(this, 630, 592);
		this.add.existing(opponent_3);

		// dropZone
		const dropZone = new DropZonePrefab(this, 360, 320);
		this.add.existing(dropZone);

		// theirScore
		const theirScore = this.add.text(710, 853, "", {});
		theirScore.setOrigin(1, 0);
		theirScore.text = "Them: 0";
		theirScore.setStyle({ "backgroundColor": "#ff0000ff", "fontSize": "35px", "stroke": "#000000ff", "strokeThickness":4});

		// ourScore
		const ourScore = this.add.text(10, 853, "", {});
		ourScore.text = "Us: 0";
		ourScore.setStyle({ "backgroundColor": "#00ccffff", "fontSize": "35px", "stroke": "#000000ff", "strokeThickness":4});

		// myTurnStatus
		const myTurnStatus = this.add.rectangle(360, 1214, 714, 128);
		myTurnStatus.visible = false;
		myTurnStatus.isStroked = true;
		myTurnStatus.strokeColor = 589614;
		myTurnStatus.lineWidth = 6;

		// rage
		const rage = new Rage(this, 73, 976);
		this.add.existing(rage);
		rage.removeInteractive();
		rage.setInteractive(new Phaser.Geom.Rectangle(-64, -67, 128, 134), Phaser.Geom.Rectangle.Contains);
		rage.visible = false;

		this.opponent_2 = opponent_2;
		this.team_mate_1 = team_mate_1;
		this.team_mate_2 = team_mate_2;
		this.opponent_1 = opponent_1;
		this.opponent_3 = opponent_3;
		this.dropZone = dropZone;
		this.theirScore = theirScore;
		this.ourScore = ourScore;
		this.myTurnStatus = myTurnStatus;
		this.rage = rage;

		this.events.emit("scene-awake");
	}

	private opponent_2!: RedPlayer;
	private team_mate_1!: BluePlayer;
	private team_mate_2!: BluePlayer;
	private opponent_1!: RedPlayer;
	private opponent_3!: RedPlayer;
	private dropZone!: DropZonePrefab;
	private theirScore!: Phaser.GameObjects.Text;
	private ourScore!: Phaser.GameObjects.Text;
	private myTurnStatus!: Phaser.GameObjects.Rectangle;
	private rage!: Rage;

	/* START-USER-CODE */
	rexUI!: RexUIPlugin;
	private playerHand!: RexUIPlugin.GridSizer;
	private socket!: Socket<Events.ServerEvents, Events.ClientEvents>;
	private playerId!: string;
	private myOrder!: number;
	private playerName!: string;
	private myTeam!: Events.Team;
	private playersByOrder = new Map<number, OtherPlayer>();
	private ragingPlayer?: Rage;

	// game state
	private cardPile!: RexUIPlugin.GridSizer;
	private team1Score: number = 0;
	private team2Score: number = 0;
	private round: number = 1;
	private completedTurns: number = 0;
	private hasRage: boolean = false;

	init(data: {
		playerId: string,
		playerName: string,
		socket: Socket<Events.ServerEvents, Events.ClientEvents>,
		team: Events.Team,
	}) {
		console.log("init", data);
		this.playerId = data.playerId;
		this.playerName = data.playerName;
		this.socket = data.socket;
		this.myTeam = data.team;
	}

	create() {
		this.editorCreate();
		console.log("create");

		this.input.on("dragstart", this.dragStartHandler, this);
		this.input.on("drag", this.dragHandler, this);
		this.input.on("dragend", this.dragEndHandler, this);
		// set rage clickable
		this.rage.on("pointerdown", this.rageClickHandler, this);
		this.emitGetHand();
		this.newTurnListener();
		this.gameOverListener();
		this.playSoundListener();
	}

	dealPlayerHand(handVals: number[]) {
		console.log("card vals", handVals);
		handVals.sort((a, b) => b - a);
		this.cardPile = this.rexUI.add.gridSizer({
			x: Math.floor(this.dropZone.x),
			y: Math.floor(this.dropZone.y),
			column: 3,
			row: 2,
			space: {
				column: 5,
				row: 5,
			},
		})
		this.playerHand = this.rexUI.add.gridSizer({
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
            this.add.existing(card);
			this.playerHand.add(card);
		}
		this.playerHand.layout();
	}

	setPlayerNames(playerOrder: number, playerDetails: Events.PlayerDetails[]) {
		console.log("setting player names", playerDetails);
		const playerObjects: OtherPlayer[] = [this.opponent_1, this.team_mate_1, this.opponent_2, this.team_mate_2, this.opponent_3];

		this.myOrder = playerOrder;
		playerDetails.sort((a,b) => a.order - b.order);

		for (let i = 0; i < playerDetails.length - 1; i++) {
			const idx = (playerOrder + i) % playerDetails.length;
			const detail = playerDetails[idx];
			const player = playerObjects[i];
			player.addPlayerName(detail.name);
			this.playersByOrder.set(detail.order, player);
		}
	}

	performLastTurn(payload: Events.NewTurnPayload) {
		// this event only fires when a turn has been completed so cardsPlayed should never be empty
		console.log("performing last turn", payload.lastTurn);
		const currentPileSize = this.getCurrentCardPileSize();
		if (currentPileSize === payload.cardsPlayed.length) {
			console.log("last turn cards match existing cards");
			return;
		}

		if (currentPileSize > payload.cardsPlayed.length) {
			throw Error("more cards in current pile than got from server");
		}

		// clean out any player turn status
		this.playersByOrder.forEach((player) => player.setTurnStatus(false));
		this.myTurnStatus.setVisible(false);

		const lastPlayerOrder = payload.lastPlayer;
		if (!lastPlayerOrder) {
			console.log("no last player");
			return;
		}
		if (lastPlayerOrder === this.myOrder) {
			throw Error("I was the last player but my card pile didn't match");

		}
		const lastPlayer = this.playersByOrder.get(lastPlayerOrder);
		if (!lastPlayer) {
			throw Error("Coudln't find last player with player order " + lastPlayerOrder.toString());
		}
		lastPlayer.setTurnStatus(true);

		console.log("updating the card pile", payload.cardsPlayed, lastPlayer.x, lastPlayer.y);

		// check if current card pile match the previous cards played
		const doCardsMatch = true;
		const pileItems = this.cardPile.getElement('items') as HandCard[];
		for (let i = 0; i < payload.cardsPlayed.length - 1 ; i++) {
			const cardVal = payload.cardsPlayed[i];
			if (!pileItems[i] || pileItems[i].value !== cardVal) {
				console.log("card pile doesn't match", cardVal);
				break;
			}
		}

		// only update whole card pile if it doesn't match
		if (!doCardsMatch) {
			this.cardPile.clear(true);
			for (let i = 0; i < payload.cardsPlayed.length - 1; i++) {
				const cardVal = payload.cardsPlayed[i];
				console.log("adding card", cardVal);
				const cardObj = new HandCard(this, -100, -100);
				this.add.existing(cardObj);
				cardObj.assignValue(cardVal);
				this.cardPile.add(cardObj, {
					align: 'center',
					expand: false,
				});
			}
		}

		// add the last one with animation
		const cardVal = payload.cardsPlayed[payload.cardsPlayed.length - 1];
		console.log("adding last card", cardVal);
		const cardObj = new HandCard(this, lastPlayer.x, lastPlayer.y);
		this.add.existing(cardObj);
		cardObj.assignValue(cardVal);
		this.add.tween({
			targets: cardObj,
			x: this.cardPile.x,
			y: this.cardPile.y,
			duration: 150,
			onComplete: (tween, targets, param) => {
				this.cardPile.add(cardObj, {
					align: 'center',
					expand: false,
				});
				this.cardPile.layout();
				lastPlayer.setTurnStatus(false);
			},
		});
	}

	////////// socket event listener //////////
	newTurnListener() {
		console.log("new turn listener");
		this.socket.on("new-turn", (payload) => {
			let isGameStartEvent = payload.round === 1 && payload.lastTurn === 0;
			console.log("got new turn", payload, "game start?", isGameStartEvent, this.round, this.completedTurns);
			if (this.round > payload.round || 
				(this.round === payload.round && payload.lastTurn <= this.completedTurns) && !isGameStartEvent) {
					// ignore old event
					console.log("ignoring old event", payload, "round: ", this.round, "turn: ", this.completedTurns);
					return;
			}
			if (this.round < payload.round) {
				this.completeRound(payload);
			}
			this.performLastTurn(payload);
			this.completedTurns = payload.lastTurn;
			if (this.completedTurns === 1 && this.round === 1) {
				this.hasRage = true;
				this.rage.setVisible(true);
			}
			if (payload.aduio) {
				this.sound.removeAll();
				this.sound.playAudioSprite("sfx", payload.aduio);
			}
			// set turn status for current turn
			if (!payload.nextPlayer) {
				return;
			}
			if (payload.nextPlayer === this.myOrder) {
				console.log("my turn");
				this.myTurnStatus.setVisible(true);
				this.setHandCardsInteractive(true);
			} else {
				console.log("turn: player order", payload.nextPlayer);
				const nextPlayer = this.playersByOrder.get(payload.nextPlayer);
				if (nextPlayer) {
					nextPlayer.setTurnStatus(true);
				}
			}
		});

	}

	playSoundListener() {
		this.socket.on("play-sound", (payload, callback) => {
			console.log("play sound", payload);
			this.sound.removeAll();
			const sound = this.sound.addAudioSprite("sfx");

			const rageDestroyer = () => {
				console.log("end of sound event");
				if (this.ragingPlayer?.active)	{
					console.log("destroying rage after sound");
					this.ragingPlayer.destroy();
				}
				// make rage button active again
				this.rage.setInteractive();
			};
			sound.once(Phaser.Sound.Events.COMPLETE, rageDestroyer);
			sound.once(Phaser.Sound.Events.DESTROY, rageDestroyer);

			const played = sound.play(payload.audio);
			if (played && payload.playerOrder && payload.playerOrder !== this.myOrder) {
				// set rage button deactive
				this.rage.disableInteractive();
				const player = this.playersByOrder.get(payload.playerOrder);
				if (this.ragingPlayer?.active)	{
					console.log("destroying previous rage before creating new one");
					this.ragingPlayer.destroy();
				}
				this.ragingPlayer = new Rage(this, player!.x, player!.y);
				this.add.existing(this.ragingPlayer);
				this.ragingPlayer.setVisible(true);
				this.ragingPlayer.removeInteractive();
			}

			callback(true);
		});
	}

	////////// card drag event handlers //////////
	dragStartHandler(pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) {
		console.log("drag start");

		this.rage.setVisible(false);

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
		if (dropped) {
			this.setHandCardsInteractive(false);
			this.myTurnStatus.setVisible(false);
			this.completeMyTurn((obj as HandCard).value );

		}
		if (this.hasRage) {
			this.rage.setVisible(true);
		}
	}

	rageClickHandler(pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) {
		console.log("rage clicked");

		fetchRetry('/api/rage?' + qs.stringify({playerId: this.playerId})).then((res) => {
			console.log("rage response", res);
			if (!res.ok) {
				throw new Error(`HTTP error! Status: ${res.status}`);
			}
			this.rage.removeInteractive();
			this.rage.setVisible(false);
			this.hasRage = false;
		});
	}

	setHandCardsInteractive(on: boolean) {
		const hand = this.playerHand.getElement('items') as HandCard[]
		hand.forEach((card) => {
			// skip if null
			if (!card) {
				return;
			}
			if (on) {
				card.setInteractive({draggable: true});
			} else {
				card.disableInteractive();
			}
		});
	}

	// score updater
	updateScore(team1Score: number, team2Score: number) {
		console.log("update score", team1Score, team2Score);
		if (team1Score === this.team1Score && team2Score === this.team2Score) {
			return;
		}
		this.team1Score = team1Score;
		this.team2Score = team2Score;
		if (this.myTeam === "TEAM_1") {
			this.ourScore.setText(`Us: ${team1Score}`);
			this.theirScore.setText(`Them: ${team2Score}`);
		} else {
			this.ourScore.setText(`Us: ${team2Score}`);
			this.theirScore.setText(`Them: ${team1Score}`);
		}
	}

	getCurrentCardPileSize(): number {
		// iterate through the card pile elements and return count of non-null elements
		const pile = this.cardPile.getElement('items') as HandCard[];
		console.log("pile", pile);
		return pile.filter((card) => card !== null).length;
	}

	completeMyTurn(cardValue: number) {
		this.socket.emit("turn-complete", {
			idempotencyKey: uuidv4(),
			playerId: this.playerId,
			card: cardValue,
			turn: this.myOrder,
		}, (err) => {
			console.log("turn-complete emitted");
			if (err) {
				console.error(err);
			}
		});
	}

	completeRound(payload: Events.NewTurnPayload) {
		console.log("round complete", payload);
		this.round = payload.round;
		this.completedTurns = payload.lastTurn;
		this.cardPile.clear(true);
		this.playersByOrder.forEach((player) => player.setTurnStatus(false));
		this.myTurnStatus.setVisible(false);
		this.updateScore(payload.team1Score, payload.team2Score);
	}

	emitGetHand() {
		console.log("get hand emitted");
		const payload: Events.DealHandPayload = {
			playerId: this.playerId,
		};
		this.socket.emit("get-hand", payload, (res) => {
			console.log("got hand", res);
			if (!res) {
				console.error("no hand received");
				return;
			}
			this.dealPlayerHand(res.hand);
			this.setPlayerNames(res.playerOrder, res.playerDetails);
		});
	}

	gameOverListener() {
		this.socket.on("game-over", (reset, callback) => {
			console.log("game reset received", reset);
			if (reset) {
				// refresh whole page
				window.location.reload();
			}
			this.cardPile.clear(true);
			this.playerHand.clear(true);
			this.updateScore(0, 0);
			this.round = 0;
			this.completedTurns = 0;
			// clean out any player turn status
			this.playersByOrder.forEach((player) => player.setTurnStatus(false));
			this.myTurnStatus.setVisible(false);

			callback(true);
			this.emitGetHand();
		});
	}
	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
