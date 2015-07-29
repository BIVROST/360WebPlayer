"use strict";

var Bivrost={
	
	
	version: 0,
	
	
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
			if(console.table)	// advanced console
				console.log.bind(console, "["+module+"]").apply(null, args);
			else	// simple console impl.
				console.log("["+module+"] "+Array.prototype.map.call(args, JSON.stringify).join(" ")); 
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