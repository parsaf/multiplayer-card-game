import Phaser from "phaser";
import Level from "./scenes/Level";
import preloadAssetPackUrl from "../static/assets/preload-asset-pack.json";
import Preload from "./scenes/Preload";
import Lobby from "./scenes/Lobby";
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

class Boot extends Phaser.Scene {

    constructor() {
        super("Boot");
    }

    preload() {

        this.load.pack("pack", preloadAssetPackUrl);
    }

    create() {

       this.scene.start("Preload");
    }
}

window.addEventListener('load', function () {
	
	const game = new Phaser.Game({
		width: 720,
		height: 1280,
		backgroundColor: "#2f2f2f",
		type: Phaser.AUTO,
		scale: {
			mode: Phaser.Scale.ScaleModes.FIT,
			autoCenter: Phaser.Scale.Center.CENTER_BOTH,
		},
		scene: [Boot, Preload, Lobby, Level],
		parent: 'phaser-example',
		dom: {
			createContainer: true
		},
		plugins: {
			scene: [
				{
					key: 'rexUI',
					plugin: RexUIPlugin,
					mapping: 'rexUI'
				}
			]
		}
	});

	game.scene.start("Boot");
});