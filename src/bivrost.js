"use strict";

/**
 * The BIVROST 360WebPlayer
 * @preserve Copyright 2016 Bivrost Sp. Z O. O.
 * @license dual licensed, see http://github.com/Bivrost/360WebPlayer/ for full license
 */
var Bivrost={
	
	
	version: "1",
	
	
	version_build: "development",
	
	
	/**
	 * When on, there is some debug information on the console.log
	 * @type Boolean
	 */
	verbose: false,
	
	
	/**
	 * Logging helper, disable with Bivrost.verbose=false
	 * @param {string} module
	 * @param {array<object>} args
	 * @private
	 */
	log: function(module, args) {
		if(Bivrost.verbose && window.console) {
			var a=[].slice.call(args, 0);
			a.unshift("["+module+"]");
			console.log.apply(console, a);
		}
	},
	
	
	/**
	 * Retrieves const name in Bivrost object
	 * @private
	 * @param {object} constValue
	 * @return {string}
	 */
	reverseConstToName: function(constValue) {
		for(var k in Bivrost)
			if(Bivrost[k] === constValue)
				return k;
		// throw "const value "+k+" not found";
		return undefined;
	},
	
	
	lang: {
		bivrostButtonLabel: "powered by Bivrost",
		vrButtonLabel: "VR",
		playButtonLabel: "play",
		volumeButtonLabel: function(vol) { return Math.round(vol*100)+"%"; },
		gyroscopeButtonLabel: "gyroscope",
		fullscreenButtonLabel: "fullscreen",
		exitVRButtonLabel: "exit VR"
	},
	
	/**
	 * @see coffeescript operator class
	 */
	extend: function(child, parent) {
		for (var key in parent) {
			if (Object.prototype.hasOwnProperty.call(parent, key)) 
				child[key] = parent[key];
		}
		function ctor() {
			this.constructor = child;
		}
		ctor.prototype = parent.prototype;
		child.prototype = new ctor;
		child.__super__ = parent.prototype;
		return child;
	}
	
};
