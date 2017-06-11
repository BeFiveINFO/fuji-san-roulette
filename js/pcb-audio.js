/*
	logic: audio
	routines used for audio
*/
// Make Printed circuit board if it does not exist yet (to deal with load order issue here).
if(!PCB) var PCB = {};

if(!Register) var Register = {};

Register.audioInstances = {};

// print PCB

PCB.audio = {
	/**
	 * uses Register.audioInstances for holding each instance. You need to play once to register in there.
	 * also handles audio sprites (requires marker to be set)
	 */
	play: function ( soundID, marker, soundVolume, doLoop, allowMultiple ) {
		// see if soundID is valid
		if(soundID  === undefined) return false;
		if( Register.audioInstances.hasOwnProperty(soundID) === false ) {
			// must be a new sound... here it needs a check up if the sound id is valid... in the future
			return false;
		}
		if(doLoop  === undefined) doLoop = false; // loop set to none by default

		/** volume */
		if(soundVolume  === undefined) {
			soundVolume = Register.audioInstances[soundID].volume; // volume is full by default
		}
		Register.audioInstances[soundID].volume = soundVolume;

		if (marker === undefined || marker === '') {
			Register.audioInstances[soundID].allowMultiple = true;
			Register.audioInstances[soundID].play('',0, soundVolume,doLoop,false);
		} else if(Register.audioInstances[soundID].sounds.hasOwnProperty(marker)) {
			if(allowMultiple){
				Register.audioInstances[soundID].sounds[marker].allowMultiple = true;
			}
			// audiosprite
			Register.audioInstances[soundID].play(marker, undefined,soundVolume,doLoop,false);
		} else {
			console.log(marker + ' of ' +soundID + ' does not exist.');
			return false;
		}
	},
	stop: function ( soundID ) {
		if(!soundID ) {
			// sound_id is not specified. stop all at once
			Game.sound.stopAll();
		} else {
			if(Register.audioInstances[soundID]) Register.audioInstances[soundID].stop();
		}
	},
	/*
	 * fades out works for just one sound instance. global fade out if sound id is not valid
	 * duration in millisecond, set soundVolume value between 0 and 1.
	 * fades out in 1 second if _duration, soundVolume are omitted.
	 */
	fadeTo: function ( soundID , _duration, soundVolume) {
		if(!_duration) _duration = 1000;
		if(!soundVolume) soundVolume = 0;
		// see if soundID is valid
		if(!soundID || Register.audioInstances.hasOwnProperty(soundID) === false ) {
			// fade all
			for(var _key in Register.audioInstances ) {
				// let me think if it is necessary to fade audio sprite too
				if(!Register.audioInstances[_key].hasOwnProperty('sounds')){
					Register.audioInstances[_key].fadeTo(_duration, soundVolume);
				}
			}
		} else {
			Register.audioInstances[soundID].fadeTo(_duration, soundVolume);
		}
	},
	/*
	 * Pause / resume. Played when it is not either paused or played. loop mode by default
	 * Note: Phase does not really seem to support audio sprite (looped) well.
	 */
	pause: function ( soundID , marker, _isLooped , soundVolume ) {
		// soundID is required
		if(soundID === undefined) return false;
		if(marker === undefined) marker = '';

		// see if soundID is valid
		if(Register.audioInstances.hasOwnProperty(soundID) === false) {
			return false;
		}
		var _audioInstance;
		var _currentPosition;
		/** set volue */
		if(soundVolume  === undefined) {
			soundVolume = Register.audioInstances[soundID].volume; // volume is full by default
		}
		Register.audioInstances[soundID].volume = soundVolume;

		// find audio instance. if this is an audio sprite, it requires marker
		if(
			Register.audioInstances[soundID].hasOwnProperty('sounds') &&
			Register.audioInstances[soundID].sounds.hasOwnProperty(marker)
		) {
			// this is an audio sprite
			_audioInstance = Register.audioInstances[soundID].sounds[marker];
		} else {
			// this is a regular audio
			_audioInstance = Register.audioInstances[soundID];
		}
		// exception handling
		if(_audioInstance.pausedPosition < 0) {
			_audioInstance.pausedPosition = 0;
		}
		// play if the audio is not being played now
		if(_audioInstance.isPlaying === undefined) {
			return false;
		} else if(_audioInstance.isPlaying === false ) {
			if(_audioInstance.paused === true) {
				_audioInstance.resume();
			} else {
				// if the audio is not paused, just play
				_audioInstance.play(marker, 0, soundVolume , _isLooped);
			}
		} else if(_audioInstance.isPlaying === true ) {
			// remember the last played position. there can be a bug here, the sound will not be played at all then the value of position should exceed that of duration.
			// _audioInstance.currentPosition = _audioInstance.position;
			_audioInstance.pause();
		}
		return true;
	},
	/**
	 * mute globally
	 *
	 * @params boolean _mute_sound. Toggle the current state if omitted.
	 */
	mute: function ( _mute_sound ) {
		// Set explicitly
		if(typeof _mute_sound !== 'undefined') {
			Game.sound.mute = Boolean(_mute_sound);
		// Toggle if _mute_sound is not set
		} else if (Game.sound.mute == false) {
			Game.sound.mute = true;
		} else {
			Game.sound.mute = false;
		}
	}
};