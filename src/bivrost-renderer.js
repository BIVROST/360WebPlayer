/* global Bivrost */
"use strict";


(function() {
	
	Bivrost.Renderer = function() {};
	
	Bivrost.Renderer.prototype.render = function(webglRenderer, view) {};
	
	Bivrost.Renderer.prototype.init = function(player) {};
	
	Bivrost.Renderer.prototype.destroy = function(player) {};
	
	Bivrost.Renderer.prototype.updateSize = function(w, h) {}
	
	Bivrost.Renderer.prototype.shouldWork = function() { return false; }
	
})();
