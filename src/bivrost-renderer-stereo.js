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
		var hh = ~~(h/2);
		var hw = ~~(w/2);

		webglRenderer.setScissorTest(true);
		webglRenderer.clear();
		
		var lineWidth = 2;
			
		if(w > h) {
			// landscape
			webglRenderer.setViewport(0,0,hw-lineWidth,h);
			webglRenderer.setScissor(0,0,hw-lineWidth,h);	
			view.leftCamera.aspect = (w/2) / h;
			view.leftCamera.updateProjectionMatrix();
			webglRenderer.render(view.leftScene, view.leftCamera);

			webglRenderer.setViewport(hw+lineWidth,0,hw-lineWidth,h);
			webglRenderer.setScissor(hw+lineWidth,0,hw-lineWidth,h);
			view.rightCamera.aspect = (w/2) / h;
			view.rightCamera.updateProjectionMatrix();
			webglRenderer.render(view.rightScene, view.rightCamera);
		}
		else {
			// portrait, assuming that the phone is rotated to horizontal
			// but the screen is locked to portrait
			// also assuming that the camera is on top of the phone
			// and almost all cardboards force it to be on the left
			webglRenderer.setViewport(0,hh+lineWidth,w,hh-lineWidth);
			webglRenderer.setScissor(0,hh+lineWidth,w,hh-lineWidth);
			view.leftCamera.aspect = w / (h/2);
			view.leftCamera.updateProjectionMatrix();
			webglRenderer.render(view.leftScene, view.leftCamera);

			webglRenderer.setViewport(0,0,w,hh-lineWidth);			
			webglRenderer.setScissor(0,0,w,hh-lineWidth);
			view.rightCamera.aspect = w / (h/2);
			view.rightCamera.updateProjectionMatrix();
			webglRenderer.render(view.rightScene, view.rightCamera);
		}
		
		webglRenderer.setViewport(0,0,w,h);
		webglRenderer.setScissor(0,0,w,h);		
	};
	
	
	Bivrost.Renderer.Stereo.prototype.destroy = function(player) {
		Bivrost.Renderer.prototype.destroy.call(this, player);
		player.input.enableGyro = this._hadEnabledGyro;
		player.fullscreen = this._hadEnabledFullscreen;
	};
	
	
	Bivrost.Renderer.Stereo.prototype.fullscreenChanged = function(isFullscreen) {
		Bivrost.Renderer.prototype.fullscreenChanged.call(this, isFullscreen);
		
		if(!isFullscreen)
			this.player.vrExit();
	};
	
	
	Bivrost.Renderer.Stereo.prototype.updateSize = function(w, h) {};
	
	
	Bivrost.Renderer.Stereo.shouldWork = function(player) { return true; };
	
	
	Bivrost.Renderer.Stereo.prototype._hadEnabledGyro = false;
	
	
	Bivrost.Renderer.Stereo.prototype._hadEnabledFullscreen = false;
	
})();
