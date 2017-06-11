/**
 * G-Frame 10 by Shu Miyao
 * G-Frame 10 : 2017 built on Phaser JS Community Edition
 *
 * Initializes the game... check up supported technologies, show loading screen.
 */

// Make Rom if it does not exist yet (to deal with load order issue here).
if(!Rom) var Rom = {};

Register.audioInstances = {};

Rom.boot = {
	// configurations
	'manifest': {
		json: {
			'config': 'config.json',
		},
		script: {
			//  Load the Google WebFont Loader script
			'webfont': '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js'
		},
		image: {
			// images. id as key and full relative path under the images dir to the image file
			'pocket_black': 'images/pocket_black.png',
			'pocket_red': 'images/pocket_red.png',
			'backgroundArt': 'images/backgroundArt.jpg',
			'needle': 'images/needle.png',
		},
		spritesheet: {
			/**
			 * There needs to be one additional blank frame in the last. Define
			 * key : path, width, height, the number of frames
			 */
			'light_button_start': ['images/light_button_start.png',96,50,3],
			'light_button': ['images/light_button.png',96,50,3],
			'light_indicator': ['images/light_indicator.png',96,50,2],
			'button_attendant': ['images/button_attendant.png',80,80],
		},
		audio: {
			// regular audio - id as key and sound without extension as value
			'tick': 'sound/waka.wav', // wav is used because of timing issue.
			'switch': 'sound/switch02.mp3',
			'bet': 'sound/bet.mp3',
			'bulkCoinPayout': 'sound/bulkCoinPayout.mp3',
			'coinPayout': 'sound/coinPayout.mp3',
			'gameover': 'sound/gameOver.mp3',
		},
	},
	// properties
	'readErrors': [],
	'corsError': false,
	'fatalError': false,
	// methods
	init: function() {
		// it needs to set advancedTiming to true otherwise the fps is not updated
		Game.time.advancedTiming = true;
		// scaling
		Game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		Game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
		// Game screen background color
		Game.stage.backgroundColor = '#444444';
		// PCB.screen.screenScaling();
		// Game screen size init
		Game.input.maxPointers = 1;
		// set audio type. you could use modernizr to determine supported file format etc.
		// set true to read as is specified in the manifest.audio
		Register.audioType = true;
		// show message
		Game.add.text(0,0,"G-FRAME 10 : INITIALIZING ...",{ font: "bold 28px Arial", fill: "#FFFFFF"});
	},
	preload: function() {
		// set up listners
		PCB.assets.addPreloadListners(this);
		PCB.assets.enqueuePreloadAssets(this.manifest);
		// start loading now
		Game.load.start();
	},
	render: function () {
		Game.debug.text( Game.time.fps + ' FPS', 15, Game.world.height - 15, undefined, 'bold 28px' );
	},
	loadStart: function () {
	},
	fileComplete: function (progress, cacheKey, success, totalLoaded, totalFiles) {
		// @todo file loading progress
	},
	onFileError: function (fileID,status) {
		if(fileID == 'webfont') {
			Rom.boot.corsError = true; // non fatal
		}
		Rom.boot.readErrors.push(fileID);
	},
	onLoadComplete: function () {
		if(PCB.assets.postPreloadHandlings(this)){
			/**
			* Read nvarm and set registers
			*/
			// set Registers once --- these are only fallbacks. all the register values are set in the pcb-assets.js
			// and read from the config.json file.
			if(!Register.creditCount) Register.creditCount = 0;
			if(!Register.replenishmentTime) Register.replenishmentTime = 0;
			if(!Register.user_id) Register.user_id = '';
			if(!Register.initial_credits) Register.initial_credits = 100;
			if(!Register.replenishment_max) Register.replenishment_max = 200;
			// initialize, all the Register values are set there.
			Rom.nvram.init();

			// in case of errorm show messages
			if(this.corsError === true) {
				Game.add.text(0,56,"SKIP WEBFONT & SOUND SUPPORT.",{ font: "bold 28px Arial", fill: "#FFFFFF"});
				Game.add.text(0,84,"PLEASE RUN FROM WEBSERVER",{ font: "bold 28px Arial", fill: "#FF0000"});
				Game.add.text(0,112,"FOR FULL FUNCTIONALITY.",{ font: "bold 28px Arial", fill: "#FF0000"});
				setTimeout(function(){
					// game system start
					Game.state.start('Game');
				}, 4000);
			}
			// dont have to do anything if there is not any problems. Game automatically started by WebFontConfig.active().
		} else {
			Game.add.text(0,28,"ROM: ERROR",{ font: "bold 28px Arial", fill: "#FF0000"});
			Game.add.text(0,56,"PLEASE CHECK ROM.",{ font: "bold 28px Arial", fill: "#FF0000"});
			console.log(this.readErrors);
			this.fatalError = true;
		}
	},
};