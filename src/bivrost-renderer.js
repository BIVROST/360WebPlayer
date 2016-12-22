/* global Bivrost */
"use strict";


(function() {
	
	Bivrost.Renderer = function() {};
	
	Bivrost.Renderer.prototype.render = function(webglRenderer, view) { throw "abstract"; };
	
	Bivrost.Renderer.prototype.init = function(player) {
		this.player=player;
	};
	
	/**
	 * @type {Bivrost.Player}
	 */
	Bivrost.Renderer.prototype.player = null;
	
	Bivrost.Renderer.prototype.destroy = function(player) {};
	
	Bivrost.Renderer.prototype.updateSize = function(w, h) {}
	
	Bivrost.Renderer.prototype.fullscreenChanged = function(isFullscreen) { ; }

	/**
	 * @static
	 * @returns {Boolean}
	 */
	Bivrost.Renderer.shouldWork = function() { return false; }
	
	
})();
