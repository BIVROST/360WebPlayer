"use strict";

var Bivrost={
	
	
	version: "1",
	
	
	version_build: "development",
	
	
	/**
	 * When on, there is some debug information on the console.log
	 * @type Boolean
	 */
	verbose: true,
	
	
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
		fullscreenButtonLabel: "fullscreen"
	}
	
};

Bivrost.VRMODE_NONE=501;
//Bivrost.VRMODE_OCULUS_RIFT_DK1=502;
Bivrost.VRMODE_OCULUS_RIFT_DK2=503;
//Bivrost.VRMODE_CARDBOARD=503;
Bivrost.AVAILABLE_VRMODES=[
	Bivrost.VRMODE_OCULUS_RIFT_DK2,
	Bivrost.VRMODE_NONE
];