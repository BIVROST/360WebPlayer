/* global Bivrost */
"use strict";

(function() {
	
	Bivrost.WebVRRenderer = function() {};
	
	Bivrost.extend(Bivrost.WebVRRenderer, Bivrost.Renderer);
	
	Bivrost.WebVRRenderer.prototype.init = function(player) {
		player.container.classList.add("bivrost-no-ui");
		
		this.effect = new THREE.VREffect(player.webglRenderer);
//		this.effect.requestPresent();

	};
//
//		window.addEventListener( 'vrdisplaypresentchange', function ( event ) {
//
//			button.textContent = effect.isPresenting ? 'EXIT VR' : 'ENTER VR';
//
//		}, false );
//	};
	
	Bivrost.WebVRRenderer.prototype.destroy = function(player) {
		this.effect.exitPresent();
		this.effect.destroy();
		this.effect = null;
	};
		
	/**
	 * @param {THREE.WebGLRenderer} webglRenderer
	 * @param {Bivrost.View} view
	 * @returns {undefined}
	 */
	Bivrost.WebVRRenderer.prototype.render = function(webglRenderer, view) {
		this.effect.render(view.leftScene, view.leftCamera);
	};
	
	
	Bivrost.WebVRRenderer.prototype.shouldWork = function() { return true; };
	
})();