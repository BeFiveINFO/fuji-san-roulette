/**
 * Licensed MIT.
 *
 * Sorry about the rudimentary scribble code below.
 *
 * The code in the repo might be drastically changed in the future without any notices.
 *
 * But
 *
 * The following code at least works and demonstrates as written in the read me.
 *
 * Execution Sequence:
 *
 * script.js -> rom-boot.js WebFontConfig.js -> rom-game.js
 *
 * rom-game.js make use of roulette.js
 */

var Game = new Phaser.Game(600,900,Phaser.CANVAS,'gameContainer');

/**
 * Kickstart upon onLoad of the index.html
 * Note: the code below (DOMContentLoaded) does not work on IE8
*/
document.addEventListener("DOMContentLoaded", function(event) {
	// Set up the initial screen and variables for the game. Also least required images and fonts needed.
	Game.state.add('Boot', Rom.boot);
	Game.state.add('Game', Rom.game);
	Game.state.start('Boot');
});
