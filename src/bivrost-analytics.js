/* global Bivrost */
"use strict";

(function(){

	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("█ Bivrost.Analytics", arguments); };


	/**
	 * @param {Bivrost.Player} player 
	 * @param {string} destinationURI 
	 * @param {number} frequency 
	 */
	Bivrost.Analytics = function(player, destinationURI, frequency) {
		player.analytics = this;

		var thisRef = this;
		player.onRendererChange = function(prev, next) {
			thisRef.setRenderer(next);
		}
		if(player.renderer)
			this.setRenderer(player.renderer);

		// var originalMainLoop = player.mainLoop;
		// player.mainLoop = function(dt) {
		// 	originalMainLoop.apply(player, dt);
		// 	log("hooked main loop");
		// }

		// setInterval(function() {
		// 	var look = player.input.lookEuler;
		// 	var duration = player.media.duration;
		// 	var time = player.media.time;
		// 	console.log("anal tick", look, time, duration);
		// }, 1000/frequency);
	}


	Bivrost.Analytics.prototype.setRenderer = function(renderer) {
		log("renderer", renderer);
	};

})();
