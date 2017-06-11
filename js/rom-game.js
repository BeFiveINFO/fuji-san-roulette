/*
rom: boot

Initializes the game... check up supported technologies, show loading screen
*/

// Make Rom if it does not exist yet (to deal with load order issue here).
if(!Rom) var Rom = {};

Rom.game = {
	// configuration
	'playCost': 2,
	'pocketBetStrip':['2', '6', '2', '4', '10', '2', '4', '6', '0', '4', '8', '2', '6', '2', '4', '2', '10', '2', '6', '4', '2', '6', '2', '8', '2', '4', '0', '30', '2', '8', '4', '2', '10', '2', '4', '8'],
	'LABEL_STYLE': {
		font: "30px Anton",
		fill: "#fff",
		boundsAlignH: "center",
		boundsAlignV: "middle"
	},
	// instances
	'betBoardUnit': {},
	'startButton': {},
	'attendantButton': {},
	'currentPocketDisplay': null,
	'userCreditsDisplay': null,
	'replenishmentMessageDisplay': null,
	'attendantMenuModal':null,
	// timers
	'pocketBlinkTimer': null,
	'pocketBlinkTimer_relayRegister': false,
	'gameObserver': null,
	// properties
	'playerCanStart': false,
	'betBook': [0,0,0,0,0,0],
	// methods
	init: function() {
		Game.stage.setBackgroundColor('#0bbdc9');
		// Set Registers
		if(Register.playCost) this.playCost = Register.playCost;
		if(Register.pocketBetStrip) this.pocketBetStrip = Register.pocketBetStrip;
	},
	create: function () {
		/**
		* Events
		*/
		PCB.event.add('rouletteInitialized',function() {
		});
		PCB.event.add('reelSpinStarted',function() {
			Rom.game._updateStateOfStartButton(false);
			PCB.audio.play('tick','',0.5,true);
		});
		PCB.event.add('reelCountDownStarted',function() {
			PCB.audio.stop('tick');
		});
		PCB.event.add('currentPocketChanged',function() {

		});
		PCB.event.add('currentPocketChangedAfterCountDown',function() {
			PCB.audio.play('tick','',0.5,false,true);
		});
		PCB.event.add('currentPocketChangedBeforeCountDown',function() {
		});
		PCB.event.add('pocketChangedAtLastMoment',function() {
			PCB.audio.play('tick','',0.5,false,true);
		});
		PCB.event.add('onCompleteSpinReel',function() {
			Rom.game.evaluateGameResult();
			Rom.game.initializeGameState();
		});

		/**
		 * Observer Event.
		 *
		 * Mainly used to keep track of replenishment
		 */
		this.gameObserver = window.setInterval(function(){
			var _message = '';
			var _unixTime = Rom.game.___unixTime();
			var _replenishmentTime = Register.replenishmentTime;
			var _replenishment_max = Number(Register.replenishment_max);

			if ( _unixTime > _replenishmentTime ) {
				Rom.nvram.updateReplenishment();
				Rom.game.updateReplenishmentMessageDisplay('');
				Rom.game.updateUserCreditsDisplay();
			}

			if (Rom.nvram.specialReplenishmentMessageCounter > 0) {
				var _specialReplenishmentMessage = Rom.nvram.specialReplenishmentMessage;
				_message = _specialReplenishmentMessage;
				Rom.nvram.specialReplenishmentMessageCounter -= 1;
				Rom.game.updateReplenishmentMessageDisplay(_message);
			} else if (Register.creditCount < _replenishment_max) {
				var _excessTime = Math.abs(_unixTime - _replenishmentTime);
				_message = 'Service Credits in ' + Rom.game.___convertUnixTimeToHMS(_excessTime);
				Rom.game.updateReplenishmentMessageDisplay(_message);
			} else {
				Rom.game.updateReplenishmentMessageDisplay(_message);
			}
		}, 1000);

		/**
		* Init roulette
		*/
		rouletteModule.init('main',this.pocketBetStrip,this.LABEL_STYLE);

		/**
		* Set up Screen
		*/
		this.setUpGameStage();

		// init the game system
		this.initializeGameState();

		/**
		* Key Events
		*/
		var _keyStart = Game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		_keyStart.onDown.add(function() { Rom.game._startButtonPressed();} , this);

		var _key1 = Game.input.keyboard.addKey(Phaser.Keyboard.ONE);
		_key1.onDown.add(function() { Rom.game._betButtonPressed(Rom.game.betBoardUnit.buttons[0].children[0]);} , this);

		var _key2 = Game.input.keyboard.addKey(Phaser.Keyboard.TWO);
		_key2.onDown.add(function() { Rom.game._betButtonPressed(Rom.game.betBoardUnit.buttons[1].children[0]);} , this);

		var _key3 = Game.input.keyboard.addKey(Phaser.Keyboard.THREE);
		_key3.onDown.add(function() { Rom.game._betButtonPressed(Rom.game.betBoardUnit.buttons[2].children[0]);} , this);

		var _key4 = Game.input.keyboard.addKey(Phaser.Keyboard.FOUR);
		_key4.onDown.add(function() { Rom.game._betButtonPressed(Rom.game.betBoardUnit.buttons[3].children[0]);} , this);

		var _key5 = Game.input.keyboard.addKey(Phaser.Keyboard.FIVE);
		_key5.onDown.add(function() { Rom.game._betButtonPressed(Rom.game.betBoardUnit.buttons[4].children[0]);} , this);

		var _key6 = Game.input.keyboard.addKey(Phaser.Keyboard.SIX);
		_key6.onDown.add(function() { Rom.game._betButtonPressed(Rom.game.betBoardUnit.buttons[5].children[0]);} , this);

		var _fullScreen = Game.input.keyboard.addKey(Phaser.Keyboard.F);
		_fullScreen.onDown.add(function() { Rom.game.toggleFullScreen();} , this);

		// this was used to find a right anchor point
		// Game.add.tween(this.startButton.group).to( { angle: 360 }, 1000, Phaser.Easing.Linear.None, true).loop(true);
		// Game.add.tween(this.betBoardUnit.buttons[3]).to( { angle: 360 }, 1000, Phaser.Easing.Linear.None, true).loop(true);
	},
	/**
	 * Controller
	 */
	initializeGameState: function () {
		this.playerCanStart = false;
		this.betBook = [0,0,0,0,0,0];
		this._clearStateOfBetButtons();
		this._updateStateOfStartButton(false);
		this.updateUserCreditsDisplay();
	},
	evaluateGameResult: function () {
		var $_targetUnit = rouletteModule.rouletteUnits.main;
		var _pocketIndex = $_targetUnit.currentStop;
		var _gameResult = $_targetUnit.pocketBetStrip[_pocketIndex];
		// clear once
		this._clearStateOfIndicators();

		// reject
		if(_gameResult == 0) {
			window.setTimeout(function() {PCB.audio.play('gameover','',0.7,false,true);} , 500);
			return;
		}
		// try / maybe
		var _self = this;
		var _betBookLookupIndex = -1;
		var _soundType;
		var _playIteration = 0;
		_betBookLookupIndex = (_gameResult > 10) ? 5 : _gameResult / 2 - 1;
		if(this.betBook[_betBookLookupIndex] > 0 ){
			// win
			var _winAmount = _gameResult*this.betBook[_betBookLookupIndex];
			// lit the bet indicator
			var _translatedIndicatorIndex = (4 - this.betBook[_betBookLookupIndex] )* 6 + _betBookLookupIndex;
			// console.log(this.betBook[_betBookLookupIndex], _betBookLookupIndex, _translatedIndicatorIndex);
			var $_targetIndicator = this.betBoardUnit.indicators[_translatedIndicatorIndex].children[0];
			$_targetIndicator.frame = 0;
			// determine sound to play
			if(_winAmount < 31) {
				_soundType = 'coinPayout';
				_playIteration = _winAmount;
			} else {
				_soundType = 'bulkCoinPayout';
				_playIteration = Math.floor(_winAmount/8);
			}
			// award the player here now.
			this.increaseCredits(_winAmount);
			// console.log(_gameResult,_betBookLookupIndex,this.betBook[_betBookLookupIndex],_winAmount);
			var _payoutCount = window.setInterval(function(){
				PCB.audio.play(_soundType,'',0.5,false,true);
				_playIteration--;
				if(_playIteration < 1) {
					window.clearInterval(_payoutCount);
				}
			}, 500);

			// set interval timer for the pocket blinker
			_gameResult = _gameResult + ''; // convert type to string
			this.pocketBlinkTimer = window.setInterval(function(){
				if(_self.pocketBlinkTimer_relayRegister === false) {
					// off
					_self.lightWinningPokets(false);
					_self.pocketBlinkTimer_relayRegister = true;
				} else {
					// on
					_self.lightWinningPokets(_gameResult);
					_self.pocketBlinkTimer_relayRegister = false;
				}
			}, 500);
		}
	},
	/**
	 * Manages info sent from respective buttons. Update the bet boards.
	 *
	 * @param      {number}  buttonID   The button id. 0 ~ 5 for the bet buttons. -1 for start.
	 */
	_updateUserGameBetState: function (buttonID) {
		// reject
		if(typeof buttonID === 'undefined') return;

		// accept
		if(buttonID < 0) {
			// start button - game start
			window.setTimeout(function() {rouletteModule.spinRoulette('main');} , 150);
		} else {
			// bet button. bet entered only in the enterBet() method
			// where playerCanStart is set to true and the button is lit.
			this.__enterBet(buttonID);
		}
	},
	__enterBet: function (buttonID) {
		// reject
		if( Register.creditCount < this.playCost ) {
			// no credits
			// maybe show messag @todo
			return;
		}
		// do not accept any more than 4 bets on each column
		if(this.betBook[buttonID] > 3) return;

		// accept
		// deduct credit
		this.deductCredits(this.playCost);
		// update the display
		this.updateUserCreditsDisplay();
		// play bet sound
		PCB.audio.play('bet','',0.1,false,true);

		// record to the book
		this.betBook[buttonID] ++;
		// update the button state
		var $_buttonGroup = this.betBoardUnit.buttons[buttonID];
		var $_button = $_buttonGroup.children[0];
		this._updateStateOfBetButton(true,$_button);
		// make it startable
		if(this.playerCanStart === false) {
			// the first bet
			this._clearStateOfIndicators();
			// clear timer
			window.clearInterval(this.pocketBlinkTimer);
			// reset the blinks
			this.lightWinningPokets(false);
			// reset timer relay register
			this.pocketBlinkTimer_relayRegister = false;
		}
		this.playerCanStart = true;
		this._updateStateOfStartButton(true);
		// update the bet board
		this._updateStateOfBetIndicatorBoard();
	},
	/**
	 * Input Events
	 */
	_startButtonPressed: function () {
		var $_currentRouletteUnit = rouletteModule.rouletteUnits.main;
		PCB.audio.play('switch','',0.3,false,true);
		this.__doPressedTweenAction(this.startButton);
		if( this.playerCanStart === false || $_currentRouletteUnit.isSpinning === true ) return;
		// otherwise Game maybe able to be started
		this._updateUserGameBetState(-1);
	},
	_attendantButtonPressed: function () {
		this.toggleDisplayAttendantModal(true);
	},
	_updateStateOfStartButton: function (enabled) {
		var $_startButton = this.startButton;
		var _frameNumber;

		if(enabled === true) {
			$_startButton.setFrame(0,0,0,0);
			_frameNumber = 0;
			$_startButton.frame = 0;
		} else {
			$_startButton.setFrame(2,2,2,2);
			$_startButton.frame = 2;
		}
		$_startButton._onOverFrame = _frameNumber;
		$_startButton._onDownFrame = _frameNumber;
		$_startButton._onOutFrame = _frameNumber;
		$_startButton._onUpFrame = _frameNumber;
	},
	_betButtonPressed: function ($betButtonInstance) {
		var $_currentRouletteUnit = rouletteModule.rouletteUnits.main;
		var _buttonID = $betButtonInstance.buttonID;
		var $_buttonGroup = this.betBoardUnit.buttons[_buttonID];
		PCB.audio.play('switch','',0.3,false,true);
		this.__doPressedTweenAction($_buttonGroup);
		if($_currentRouletteUnit.isSpinning === true) return;
		// otherwise Entry accepted.
		this._updateUserGameBetState(_buttonID);

	},
	_clearStateOfBetButtons: function () {
		var $_betBoardUnitButtons = this.betBoardUnit.buttons;
		var _i = 0;
		while(_i < 6) {
			var $_buttonGroup = $_betBoardUnitButtons[_i];
			var $_button = $_buttonGroup.children[0];
			this._updateStateOfBetButton(false,$_button);
			// needed for loop.
			_i=(_i+1)|0;
		}

	},
	_clearStateOfIndicators: function () {
		var $_betBoardUnitIndicators = this.betBoardUnit.indicators;
		var _i = 0;
		while(_i < 24) {
			var $_targetIndicator = $_betBoardUnitIndicators[_i].children[0];
			$_targetIndicator.frame = 1;
			// needed for loop.
			_i=(_i+1)|0;
		}
	},
	 _updateStateOfBetButton: function (enabled,$buttonInstance) {
		var _frameNumber;
		// set frame
		if(enabled === true) {
			$buttonInstance.setFrame(0,0,0,0);
			_frameNumber = 0;
			$buttonInstance.frame = 0;
		} else {
			$buttonInstance.setFrame(2,2,2,2);
			$buttonInstance.frame = 2;
		}
		$buttonInstance._onOverFrame = _frameNumber;
		$buttonInstance._onDownFrame = _frameNumber;
		$buttonInstance._onOutFrame = _frameNumber;
		$buttonInstance._onUpFrame = _frameNumber;
	},
	_updateStateOfBetIndicatorBoard: function () {
		var $_currentIndicator;
		this.betBook;
		// this.betBook
		for(var _i = 0; _i < 6; _i++) {
			var _betLevel = this.betBook[_i];
			for(var _k = 0; _k < _betLevel; _k++) {
				var _translatedIndicatorIndex = (3-_k)*6+_i;
				var $_targetIndicator = this.betBoardUnit.indicators[_translatedIndicatorIndex].children[0];
				$_targetIndicator.frame = 0;
			}
		}
	},
	__doPressedTweenAction: function ($target) {
		$target.scale.set(0.96);
		Game.add.tween($target.scale).to( { x:1,y:1 }, 100, Phaser.Easing.Linear.None, true);
	},
	/**
	 * Displays
	 */
	updateUserCreditsDisplay: function () {
		this.userCreditsDisplay.setText('Credits: ' + Register.creditCount);
	},
	updateReplenishmentMessageDisplay: function (testString) {
		this.replenishmentMessageDisplay.setText(testString);
	},
	/**
	 * Light or clear pocket number tint. False to set all to normal.
	 *
	 * @param      {number}  targetNumber  The target number
	 */
	lightWinningPokets: function (targetNumber) {
		var $_roulette = rouletteModule.rouletteUnits.main.disc.children;
		for(var _i = 36; _i < 72; _i++) {
			var _currentLabelText = $_roulette[_i]._text;
			/** warining: there can be 0 in the text. Comparing strictly */
			if(_currentLabelText === targetNumber) {
				$_roulette[_i].addColor("#f8f8ba", 0);
				$_roulette[_i].setShadow(0, 0, 'rgba(255,245,195,0.9)', 15);
			} else {
				$_roulette[_i].addColor("#ffffff", 0);
				$_roulette[_i].setShadow(0, 0, 'rgba(0,0,0,0)', 0);
			}
		}
	},
	/**
	 * UI Visual init
	 */
	setUpGameStage: function () {
		var $_rouletteUnit = rouletteModule.rouletteUnits.main.unit;
		Game.add.sprite(0,0,'backgroundArt');
		$_rouletteUnit.x = 294;
		$_rouletteUnit.y = 364;
		/**
		 * bet board
		 */
		this._initBetBoardUnit();
		this._initStartButton();
		this._initAttendantButton();
		this._initUserCreditsDisplay();
		/**
		 * Bring the roulette in the foreground
		 */
		 Game.world.bringToTop(rouletteModule.rouletteUnits.main.unit);
		 /**
		  * Modal always stays on the top of any other layers.
		  * initialized here.
		  */
		 this._initAttendantMenu();
	},
	_initBetBoardUnit: function() {
		// group init
		this.betBoardUnit.group = Game.add.group();
		this.betBoardUnit.indicators = [];
		this.betBoardUnit.buttons = [];
		// configs
		var _eachRowHas = 6; // tiles
		var _totalColumn = 5;
		var _totalCells = _eachRowHas * _totalColumn;
		var _betNumberMaxMultiplier = 8;
		var _i = 0;
		while(_i < _totalCells) {
			var _columnNum = _i % _eachRowHas;
			var _rowNum = Math.floor(_i/_eachRowHas);
			var _betNumber = (_columnNum >= 5) ? _betNumberMaxMultiplier*15 : _betNumberMaxMultiplier*(_columnNum+1);
			var _roundedCornersRadius;
			var _strokeColor;
			var _fillColor;
			var _labelTextColor = '';
			if(_rowNum > 3) {
				_labelTextColor = (this.___isNumberEven(_columnNum) === true ) ? '#00c5ff' : '#FF0000';
			} else if(this.___isNumberEven(_rowNum) === true) {
				_labelTextColor = (this.___isNumberEven(_columnNum) === true ) ? '#FF0000' : '#00c5ff';
			} else {
				_labelTextColor = (this.___isNumberEven(_columnNum) === true ) ? '#00c5ff' : '#FF0000';
			}
			if(_i < 24) {
				// are indicators
				_roundedCornersRadius = 100;
				var _indicatorGroup = Game.add.group();
				var $_betIndicator = Game.add.sprite(0,0,'light_indicator');
				// unlit
				$_betIndicator.frame = 1;
				_indicatorGroup.add($_betIndicator);

				// Add text
				_indicatorGroup.add(this.__placeTextLabel(_betNumber,_labelTextColor));
				_indicatorGroup.x = 100 * _columnNum;
				_indicatorGroup.y = 55 * _rowNum;
				this.betBoardUnit.indicators.push(_indicatorGroup);
				this.betBoardUnit.group.add(_indicatorGroup);
			} else {
				// are buttons. indice are from 24 to 29. but reindexed after this loop.
				_strokeColor = 0xaaaaaa;
				_roundedCornersRadius = 5;
				var _buttonGroup = Game.add.group();
				var $_betButton = Game.add.button(-48,-25, 'light_button', Rom.game._betButtonPressed,this,2,2,2,2);
				_buttonGroup.add($_betButton);
				_buttonGroup.add(this.__placeTextLabel(_betNumber,_labelTextColor,-48,-25));
				_buttonGroup.x = 100 * _columnNum + 48;
				_buttonGroup.y = 55 * _rowNum + 25;
				$_betButton.buttonID = _i - 24;
				$_betButton.betNumber = _betNumber;
				/* add to group for the easier management */
				this.betBoardUnit.buttons.push(_buttonGroup);
				this.betBoardUnit.group.add(_buttonGroup);
			}

			if(_columnNum >= 5 && _betNumberMaxMultiplier > 2) {
				_betNumberMaxMultiplier = _betNumberMaxMultiplier - 2;
			}
			// needed for loop.
			_i=(_i+1)|0;
		}
		// adjust position of the board
		this.betBoardUnit.group.x = 2;
		this.betBoardUnit.group.y = 628;
		// clear the bet button once
		this._clearStateOfBetButtons();
		// clear once
		this._clearStateOfBetButtons();
	},
	_initStartButton: function () {
		this.startButton = Game.add.button(530, 585, 'light_button_start', Rom.game._startButtonPressed,this,2,2,2,2);
		this.startButton.anchor.setTo(0.5);
		/**
		* Note: _onOverFrame needs to be specified to suppress a hover frame change (bug?).
		*/
		this.startButton._onOverFrame = 2;
	},
	_initAttendantButton: function () {
		// over, out, down
		this.attendantButton = Game.add.button(51, 580, 'button_attendant', Rom.game._attendantButtonPressed,this,2, 1, 0);
		this.attendantButton.anchor.setTo(0.5);
		this.attendantButton.scale.setTo(0.8);
		this.attendantButton.inputEnabled = true;
		this.attendantButton.frame = 1;
	},
	__drawRoundRectangle: function (roundedCornersRadius,fillColor,strokeColor,strokeWeight,x,y,width,height) {
		// default
		x = (x === undefined) ? 0: x;
		y = (y === undefined) ? 0: y;
		width = (width === undefined) ? 96 : width;
		height = (height === undefined) ? 50 : height;
		strokeWeight = (strokeWeight === undefined) ? 3 : strokeWeight;
		roundedCornersRadius = (roundedCornersRadius === undefined) ? 130 : roundedCornersRadius;
		fillColor = (fillColor === undefined) ? 0xdedede : fillColor;
		// draw
		var _rectangle = Game.add.graphics(x,y);
		_rectangle.beginFill(fillColor);
		if(strokeColor) _rectangle.lineStyle(strokeWeight,strokeColor, 1);
		_rectangle.drawRoundedRect(0,0,width,height,roundedCornersRadius);
		_rectangle.endFill();
		return _rectangle;
	},
	__placeTextLabel: function (textString,fontColor,x,y) {
		x = (x === undefined) ? 0: x;
		y = (y === undefined) ? 0: y;
		textString = (textString === undefined) ? 0: textString;
		fontColor = (fontColor === undefined) ? "#000": fontColor;
		var _textLabel = Game.add.text(x,y, textString, {font:"36px Neuton",fill: fontColor,stroke: '#222222', strokeThickness: 4,boundsAlignH: "center",boundsAlignV: "middle"});
		_textLabel.setTextBounds(0, 0, 96, 53);
		_textLabel.alpha = 0.9;
		return _textLabel;
	},
	_initUserCreditsDisplay: function () {
		// the credit part
		this.userCreditsDisplay = Game.add.text(0, 0, '0', {font:"45px Anton",fill: "#FF0000",stroke: '#272a2b', strokeThickness: 6,boundsAlignH: "center",boundsAlignV: "middle"});
		this.userCreditsDisplay.setTextBounds(0, 300, 595, 330);
		// replenishmentMessageDisplay
		this.replenishmentMessageDisplay = Game.add.text(0, 0, '', {font:"18px Anton",fill: "#FF0000",stroke: '#FFF', strokeThickness: 2,boundsAlignH: "center",boundsAlignV: "middle"});
		this.replenishmentMessageDisplay.setTextBounds(0, 335, 595, 353);
	},
	/**
	 * Modal
	 */
	_initAttendantMenu: function () {
		var _self = this;
		var _statusLabel_mute = (Game.sound.mute === true) ? 'Play Sound' : 'Mute Sound';
		var _statusLabel_screen = (Game.scale.isFullScreen === true) ? 'Small Screen' : 'Full Screen';
		// create modal
		this.attendantMenuModal = new gameModal(Game);
		this.attendantMenuModal.createModal({
			type: "settings",
			includeBackground: true,
			modalCloseOnInput: true,
			itemsArr: [{
				type: "text",
				content: "Game Settings",
				fontFamily: "Neuton",
				color: "0xea134b",
				stroke: "0xffffff",
				strokeThickness: 5,
				fontSize: 52,
				offsetY: -110,
				contentScale: 0.6
			}, {
				type: "text",
				content: _statusLabel_screen,
				fontFamily: "Neuton",
				color: "0x92cd00",
				stroke: "0xffffff",
				strokeThickness: 5,
				fontSize: 52,
				offsetY: 100,
				offsetX: 0,
				contentScale: 0.6,
				callback: function () {
					_self.toggleFullScreen();
				}
			}, {
				type: "text",
				content: _statusLabel_mute,
				fontFamily: "Neuton",
				color: "0xff0000",
				stroke: "0xffffff",
				strokeThickness: 5,
				fontSize: 52,
				offsetY: 180,
				offsetX: 0,
				contentScale: 0.6,
				callback: function () {
					_self.toggleMuteState();
				}
			}]
		});
	},
	toggleDisplayAttendantModal: function (show) {
		if(show == true) {
			this.attendantMenuModal.showModal("settings");
		} else {
			this.attendantMenuModal.hideModal("settings");
		}
	},
	/**
	 * Book Keeper
	 */
	increaseCredits: function (creditAmountToIncrease) {
		Register.creditCount += creditAmountToIncrease;
		// update the nvram
		Rom.nvram.updateCredit(Register.creditCount);
		// update the display
		this.updateUserCreditsDisplay();
	},
	deductCredits: function (creditAmountToDeduct) {
		Register.creditCount -= creditAmountToDeduct;
		// update the nvram
		Rom.nvram.updateCredit(Register.creditCount);
		// update the display
		this.updateUserCreditsDisplay();
	},
	/**
	 * Utils
	 */
	toggleFullScreen: function (_switch) {
		if(typeof _switch === 'undefined') {
			_switch = (Game.scale.isFullScreen === true) ? false : true;
		}
		if (_switch === true) {
			Game.scale.startFullScreen(false);
			_statusLabel = 'Small Screen';
		} else {
			Game.scale.stopFullScreen();
			_statusLabel = 'Full Screen';
		}
		this.attendantMenuModal.updateModalValue(_statusLabel,'settings',3);
		return Game.scale.isFullScreen;
	},
	toggleMuteState: function() {
		var _statusLabel = '';
		// invert state
		if (Game.sound.mute === true) {
			PCB.audio.mute(false);
			_statusLabel = 'Mute Sound';
			PCB.audio.play('tick',undefined, 0.8);
		} else {
			PCB.audio.mute(true);
			_statusLabel = 'Play Sound';
		}
		//
		Rom.nvram.updateMuteState(Game.sound.mute);
		this.attendantMenuModal.updateModalValue(_statusLabel,'settings',4);
	},
	/**
	 * Debug (not used)
	 */
	outputCurrentStop: function (){
		var $_targetUnit = rouletteModule.rouletteUnits.main;
		var _pocketIndex = $_targetUnit.currentStop;
		// this.currentPocketDisplay.setText($_targetUnit.pocketBetStrip[_pocketIndex]);
		// console.log($_targetUnit.pocketBetStrip[_pocketIndex]);
	},
	/**
	 * Determines if number even.
	 *
	 * @param      {number}  n       { parameter_description }
	 * @return     {bool}  True if number even, Odd otherwise.
	 */
	___isNumberEven: function (n) {
		return (n % 2 == 0);
	},
	/**
	 * Returns unixtime
	 *
	 * @return     number  the current unixtime
	 */
	___unixTime: function () {
		return Math.round(+new Date()/1000);
	},
	/**
	 * Converts unix time into 0:00:00 format
	 *
	 * @param      number|string seconds The seconds
	 * @return     string Formatted time in string
	 */
	___convertUnixTimeToHMS: function (seconds) {
		var sec_num = parseInt(seconds, 10);
		var hours   = Math.floor(sec_num / 3600);
		var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
		var seconds = sec_num - (hours * 3600) - (minutes * 60);

		if (hours   < 10) {hours   = "0"+hours;}
		if (minutes < 10) {minutes = "0"+minutes;}
		if (seconds < 10) {seconds = "0"+seconds;}
		return minutes+':'+seconds;
	},
};
