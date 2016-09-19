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





(function() {
	
	Bivrost.MonoRenderer = function() {};
	
	Bivrost.extend(Bivrost.MonoRenderer, Bivrost.Renderer);
	
	
	/**
	 * @param {THREE.WebGLRenderer} webglRenderer
	 * @param {Bivrost.View} view
	 * @returns {undefined}
	 */
	Bivrost.MonoRenderer.prototype.render = function(webglRenderer, view) {
		var w = webglRenderer.domElement.width;
		var h = webglRenderer.domElement.height;

		webglRenderer.setScissorTest(false);
		webglRenderer.setViewport(0,0,w,h);
		webglRenderer.setScissor(0,0,w,h);
		webglRenderer.render(view.leftScene, view.leftCamera);
	};
	
	
	Bivrost.MonoRenderer.prototype.shouldWork = function() { return true; };
	
})();





(function() {
	
	Bivrost.StereoRenderer = function() {};
	
	Bivrost.extend(Bivrost.StereoRenderer, Bivrost.Renderer);
	
	Bivrost.StereoRenderer.prototype.render = function(webglRenderer, view) {
		var w = webglRenderer.domElement.width;
		var h = webglRenderer.domElement.height;

		webglRenderer.setScissorTest(true);
		
		var lineWidth = 2;
			
		if(w > h) {
			// landscape
			webglRenderer.setViewport(0,0,w/2,h);
			webglRenderer.setScissor(0,0,w/2,h);	
			view.leftCamera.aspect = (w/2) / h;
			view.leftCamera.updateProjectionMatrix();
			webglRenderer.render(view.leftScene, view.leftCamera);

			webglRenderer.setViewport(w/2,0,w/2,h);
			webglRenderer.setScissor(w/2,0,w/2,h);			
			view.rightCamera.aspect = (w/2) / h;
			view.rightCamera.updateProjectionMatrix();
			webglRenderer.render(view.rightScene, view.rightCamera);
			
			webglRenderer.setScissor((w-lineWidth)/2,0,lineWidth,h);			
			webglRenderer.clear([0,0,0], true, true);
		}
		else {
			// portrait, assuming that the phone is rotated to horizontal
			// but the screen is locked to portrait
			// also assuming that the camera is on top of the phone
			// and almost all cardboards force it to be on the left
			webglRenderer.setViewport(0,h/2,w,h/2);
			webglRenderer.setScissor(0,h/2,w,h/2);
			view.leftCamera.aspect = w / (h/2);
			view.leftCamera.updateProjectionMatrix();
			webglRenderer.render(view.leftScene, view.leftCamera);

			webglRenderer.setViewport(0,0,w,h/2);			
			webglRenderer.setScissor(0,0,w,h/2);			
			view.rightCamera.aspect = w / (h/2);
			view.rightCamera.updateProjectionMatrix();
			webglRenderer.render(view.rightScene, view.rightCamera);
			
			webglRenderer.setScissor(0,(h-lineWidth)/2,w,lineWidth);			
			webglRenderer.clear([0,0,0], true, true);
		}


		
	};
	
	Bivrost.StereoRenderer.prototype.init = function(player) {
		player.container.classList.add("bivrost-no-ui");
		
		this.hadEnabledGyro = player.input.enableGyro;
		player.input.enableGyro = true;
	};
	
	Bivrost.StereoRenderer.prototype.destroy = function(player) {
		player.container.classList.remove("bivrost-no-ui");
		
		player.input.enableGyro = this.hadEnabledGyro;
	};
	
	Bivrost.StereoRenderer.prototype.updateSize = function(w, h) {}
	
	Bivrost.StereoRenderer.prototype.shouldWork = function() { return true; }
	
	Bivrost.StereoRenderer.prototype.hadEnabledGyro = false;
	
})();



