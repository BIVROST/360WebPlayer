/* global Bivrost */
"use strict";

(function() {
	
	Bivrost.Renderer.Mono = function() {};
	
	Bivrost.extend(Bivrost.Renderer.Mono, Bivrost.Renderer);
	
	
	/**
	 * @param {THREE.WebGLRenderer} webglRenderer
	 * @param {Bivrost.View} view
	 * @returns {undefined}
	 */
	Bivrost.Renderer.Mono.prototype.render = function(webglRenderer, view) {
		var w = webglRenderer.domElement.width;
		var h = webglRenderer.domElement.height;

		webglRenderer.setScissorTest(false);
		webglRenderer.setViewport(0,0,w,h);
		webglRenderer.setScissor(0,0,w,h);
		webglRenderer.render(view.leftScene, view.leftCamera);
	};
	
	
	Bivrost.Renderer.Mono.prototype.shouldWork = function() { return true; };
	
})();