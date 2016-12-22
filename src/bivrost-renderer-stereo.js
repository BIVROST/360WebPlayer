/* global Bivrost */
"use strict";

(function() {
	
	Bivrost.Renderer.Stereo = function(player) {
		this._hadEnabledFullscreen=player.fullscreen;
		player.fullscreen=true;		
	};
	Bivrost.extend(Bivrost.Renderer.Stereo, Bivrost.Renderer);
	
	
	Bivrost.Renderer.Stereo.prototype.init = function(player) {
		Bivrost.Renderer.prototype.init.call(this, player);
		this.player.ui=new Bivrost.UI.Stereo(player, player.webglRenderer.domElement);
		this._hadEnabledGyro = player.input._enableGyro;
		player.input._enableGyro = true;
	};
	
	
	Bivrost.Renderer.Stereo.prototype.render = function(webglRenderer, view) {
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
	
	
	Bivrost.Renderer.Stereo.prototype.destroy = function(player) {
		Bivrost.Renderer.prototype.destroy.call(this, player);
		player.input.enableGyro = this._hadEnabledGyro;
		player.fullscreen = this._hadEnabledFullscreen;
	};
	
	
	Bivrost.Renderer.Stereo.prototype.updateSize = function(w, h) {}
	
	
	Bivrost.Renderer.Stereo.shouldWork = function(player) { return true; }
	
	
	Bivrost.Renderer.Stereo.prototype._hadEnabledGyro = false;
	
	
	Bivrost.Renderer.Stereo.prototype._hadEnabledFullscreen = false;
	
})();
