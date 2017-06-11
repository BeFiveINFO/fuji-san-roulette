/*
	logic: assets
	routines used for preload

	version 1.1 (10 June 2017)
*/
// Make Printed circuit board if it does not exist yet (to deal with load order issue here).
if(!PCB) var PCB = {};

if(!Register) var Register = {};

// print PCB
/**
 * Registers preload. Manifest is required.
 * _manifest = {
 * 		images: {id: path ... },
 *		audioFiles: {id: path ... },
 * 		}
*/
PCB.assets = {
	/**
	 * Methods
	 */
	addPreloadListners: function ( _target ) {
		if(_target.onLoadStart) Game.load.onLoadStart.add(_target.onLoadStart, _target);
		if(_target.onFileComplete) Game.load.onFileComplete.add(_target.onFileComplete, _target);
		// onFileError does not catch 404 for sound files.
		if(_target.onFileError) Game.load.onFileError.add(_target.onFileError, this);
		Game.load.onLoadComplete.add(_target.onLoadComplete, _target);
	},
	removePreloadListners: function () {
		Game.load.onLoadStart.removeAll();
		Game.load.onFileComplete.removeAll();
		Game.load.onFileError.removeAll();
		Game.load.onLoadComplete.removeAll();
	},
	enqueuePreloadAssets: function (_manifest) {
		var _audioType = Register.audioType; // m4a or ogg. registered at Rom.boot();
		// script
		if(_manifest.script) {
			for(var _key in _manifest.script) {
				Game.load.script(_key, _manifest.script[_key] );
			};
		};
		// json file for configs
		if(_manifest.json) {
			for(var _key in _manifest.json) {
				// adding random number to ensure that the browser do not cache configs.
				var _randomTime = new Date().getTime();
				Game.load.json(_key, _manifest.json[_key] + '?version='+_randomTime);
			};
		};
		// audio files. enqueue only if audio is supported.
		if (_manifest.audio && Register.audioType && Game.sound.noAudio === false) {
			var _fileExtension = (_audioType === true ) ? '' : '.'+_audioType;
			for(var _key in _manifest.audio) {
				Game.load.audio(_key, _manifest.audio[_key] + _fileExtension);
			};
			/**
			 * Sound Manager needs to be rebooted for Safari.
			 */
			Game.sound.boot();
		};
		/**
		 * audio sprite
		 * See source:  @method Phaser.Loader#audiosprite,
		 * audiosprite: function(key, urls, jsonURL, jsonData, autoDecode)
		 * Note: autoDecode is true by default.
		 * here theID: {url, jsonSpritelist}
		 */
		if (_manifest.audiosprite && Register.audioType && Game.sound.noAudio === false) {
			var _fileExtension = (_audioType === true ) ? '' : '.'+_audioType;
			for(var _key in _manifest.audiosprite) {
				Game.load.audiosprite(_key, _manifest.audiosprite[_key].path + _audioType, null, _manifest.audiosprite[_key].audioJSON);
			};
		};
		// image files
		if(_manifest.image) {
			for(var _key in _manifest.image) {
				Game.load.image(_key, _manifest.image[_key]);
			};
		};
		// spritesheet
		if(_manifest.spritesheet) {
			for(var _key in _manifest.spritesheet) {
				Game.load.spritesheet(_key, _manifest.spritesheet[_key][0],_manifest.spritesheet[_key][1],_manifest.spritesheet[_key][2]);
			};
		};
		// atlasHash
		if(_manifest.atlasHash) {
			for(var _key in _manifest.atlasHash) {
				var _atlasImagePath = _manifest.atlasHash[_key][0];
				var _atlasJsonPath = _manifest.atlasHash[_key][1];
				Game.load.atlasJSONArray(_key, _atlasImagePath+'.jpg', _atlasJsonPath+'.json');
			};
		};
	},
	postPreloadHandlings: function ( _reference ) {
		var _manifest = _reference.manifest;

		// set settings if available
		var _config_data = (Game.cache.checkJSONKey('config')) ? Game.cache.getJSON('config') : false;
		if(_config_data !== false) {
			console.log(_config_data);
			// add each in the object to Register.
			for (var _key in _config_data) {
				Register[_key] = _config_data[_key];
			};
		}
		// listners clean up
		PCB.assets.removePreloadListners();
		// reflect user settings
		if( Register.mute_sound === true ) PCB.audio.mute();
		// register audio at once
		if(Game.sound.noAudio === false) {
			if (_manifest.hasOwnProperty('audio')) {
				for(var _key in _manifest.audio) {
					Register.audioInstances[_key] = Game.add.audio(_key);
				};
			};
			// register audioSpriteInstances
			if (_manifest.hasOwnProperty('audiosprite')) {
				for(var _key in _manifest.audiosprite) {
					Register.audioInstances[_key] = Game.add.audioSprite(_key);
					// supposedly this is required for audio sprites
					Register.audioInstances[_key].allowMultiple = true;
				};
			};
		}
		return true;
	},
};

// _manifest