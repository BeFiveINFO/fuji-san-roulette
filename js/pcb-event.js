/*
	logic: event
	global events manager
*/
// Make Printed circuit board if it does not exist yet (to deal with load order issue here).
if(!PCB) var PCB = {};

if(!Register) var Register = {};

Register.events = {};

// print PCB
// uses Register.signalInstances
PCB.event = {
	/** methods */
	trigger: function( _eventName, _context ) {
		if(Register.events.hasOwnProperty(_eventName)) {
			Register.events[_eventName](_context);
		} else {
			return false;
		};
	},
	add: function( _eventName , _eventFunction ) {
		if(_eventFunction !== undefined && typeof _eventFunction === 'function') {
			if(Register.events.hasOwnProperty(_eventName)) {
				delete Register.events[_eventName];
			};
			Register.events[_eventName] = _eventFunction;
		} else {
			return false;
		};
	},
	remove: function( _eventName ) {
		if( Register.events.hasOwnProperty(_eventName)) {
			delete Register.events[_eventName];
		} else {
			return false;
		};
	},
	removeAll: function() {
		Register.events = {};
	},
};