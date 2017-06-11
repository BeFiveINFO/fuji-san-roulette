//  The Google WebFont Loader will look for this object, so create it before loading the script.
WebFontConfig = {
	//  'active' means all requested fonts have finished loading
	//  We set a 1 second delay before calling 'createText'.
	//  For some reason if we don't the browser cannot render the text the first time it's created.
	active: function() {
		if(Rom.boot.fatalError === true){
			return false;
		}
		Game.add.text(0,28,"WAIT ...",{ font: "bold 28px Arial", fill: "#FFFFFF"});
		// Game.load.onFileError.add(function() {
		// 	Game.add.text(0,56,"RESULT: NG - WEBFONT CONFIG LOAD ERROR",{ font: "bold 28px Arial", fill: "#FFFFFF"});
		// }, this);
		// the delay timer is necessary to make sure that the webfont works
		Game.time.events.add(Phaser.Timer.SECOND, function () {
			Game.add.text(0,56,"TITLE: TIME SQUARE",{ font: "28px Anton", fill: "#ea134b"});
			Game.add.text(0,84,"VERSION: 1.0",{ font: "28px Anton", fill: "#ea134b"});
			Game.add.text(0,112,"INITIALIZE OK",{ font: "28px Anton", fill: "#FFFFFF"});
			Game.add.text(0,140,"START ASSET LOAD SEQUENCE",{ font: "28px Anton", fill: "#FFFFFF"});
			setTimeout(function(){
				// game system start
				Game.state.start('Game');
			}, 1000);
		}, this);
	},
	fontinactive: function () {
		var _click = (window.ontouchstart === undefined)? 'click' : 'touchstart';
		Game.add.text(0,28,"RESULT: NG - INTERNET CONNECTION TIMEOUT",{ font: "bold 28px Arial", fill: "#FFFFFF"});
		if(_click === 'touchstart') {
			Game.add.text(0,56,"TOUCH SCREEN TO REBOOT",{ font: "bold 28px Arial", fill: "#FFFFFF"});
		} else {
			Game.add.text(0,56,"CLICK SCREEN TO REBOOT",{ font: "bold 28px Arial", fill: "#FFFFFF"});
		}
		Game.canvas.addEventListener(_click, function () {
			document.location.href = document.location.href;
		});
	},
	//  The Google Fonts we want to load (specify as many as you like in the array)
	google: {
	  families: ['Anton','Neuton:800']
	},
};