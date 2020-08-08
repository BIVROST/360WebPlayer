/* global Bivrost, THREE */
"use strict";

// https://github.com/immersive-web/webxr-samples/blob/master/vr-barebones.html
// https://github.com/immersive-web/webxr/blob/master/webvr-migration.md

(function() {
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.Renderer.WebXR", arguments); };
	
	
	Bivrost.Renderer.WebXR = function(player) {
		Bivrost.Renderer.call(this);
	};
	Bivrost.extend(Bivrost.Renderer.WebXR, Bivrost.Renderer);
	
	
	/**
	 * @const
	 */
	Bivrost.Renderer.WebXR.PLATFORM_NAME = "WebXR";
	

	Bivrost.Renderer.WebXR.prototype.init = function(player) {
		Bivrost.Renderer.prototype.init.call(this, player);

		var thisRef = this;
		var sessionInit = { optionalFeatures: [ 'local-floor', 'bounded-floor' ] };

		navigator.xr.requestSession('immersive-vr', sessionInit).then(function(session)
		{
			// Called either when the user has explicitly ended the session by calling
			// session.end() or when the UA has ended the session for any reason.
			// At this point the session object is no longer usable and should be
			// discarded.
			function onSessionEnded(event) {
				session.removeEventListener("end", onSessionEnded );
				thisRef.player.vrExit();
			}

			// Listen for the sessions 'end' event so we can respond if the user
			// or UA ends the session for any reason.
			session.addEventListener('end', onSessionEnded);

			player.webglRenderer.xr.setSession( session );

			thisRef.xrSession = session;

			log("Started WebXR");

		});
	};

	
	Bivrost.Renderer.WebXR.prototype.destroy = function(player) {
		Bivrost.Renderer.prototype.destroy.call(this, player);
		
		if(this.xrSession)
			this.xrSession.end();

		this.vrScene.dispose();
		this.vrScene = null;
		this.vrCamera = null;
	};
		
	/**
	 * MONO renderer on the main display
	 * @param {THREE.WebGLRenderer} webglRenderer
	 * @param {Bivrost.View} view
	 * @returns {undefined}
	 */
	Bivrost.Renderer.WebXR.prototype.render = function(webglRenderer, view) {
		var firstFrame = false;
		// scene data not yet copied from normal renderer
		if(!this.vrScene) {
			firstFrame = true;
			this.vrScene = new THREE.Scene();
			this.vrSceneOrigin = new THREE.Group();
			this.vrScene.add(this.vrSceneOrigin);
			for(var i = 0; i < view.leftScene.children.length; i++)
			{
				if(view.leftScene.children[i] == view.leftCamera) continue;
				var mesh = view.leftScene.children[i].clone();
				mesh.layers.set(1);
				//if(!view.enablePositionalCamera) mesh.scale
				this.vrSceneOrigin.add(mesh);
			}
			for(var i = 0; i < view.rightScene.children.length; i++)
			{
				if(view.rightScene.children[i] == view.rightCamera) continue;
				var mesh = view.rightScene.children[i].clone();
				mesh.layers.set(2);
				this.vrSceneOrigin.add(mesh);
			}
			this.vrCamera = view.leftCamera.clone();
			this.vrCamera.layers.enable(1); // render left view when no stereo available
			this.vrScene.add(this.vrCamera);
			this.vrTranslation = new THREE.Vector3();
			this.vrRotation = new THREE.Quaternion();
			this.vrCameraPositionHelper = new THREE.Mesh();
			this.vrCamera.add(this.vrCameraPositionHelper);
			log("WebXR lazy init");
		}
		
		// classical renderer only if WebXR has a separate screen
		// TODO: check for hasExternalDisplay WebVR equivalent
		if(this.vrCamera) {
			view.leftCamera.rotation.copy(this.vrCamera.rotation);
			view.leftCamera.position.copy(this.vrCamera.position);
		}

		this.vrCameraPositionHelper.getWorldPosition(this.vrTranslation);
		this.vrCameraPositionHelper.getWorldQuaternion(this.vrRotation);

		if(firstFrame || !view.enablePositionalCamera)
		{
			// TODO: rotation?

			this.vrSceneOrigin.position.set(this.vrTranslation.x, this.vrTranslation.y, this.vrTranslation.z);
		}

		webglRenderer.render(this.vrScene, this.vrCamera);
	};
	
	
	Bivrost.Renderer.WebXR.prototype.vrLeftCamera=null;
	Bivrost.Renderer.WebXR.prototype.vrRightCamera=null;
	Bivrost.Renderer.WebXR.prototype.vrLeftScene=null;
	Bivrost.Renderer.WebXR.prototype.vrRightScene=null;


	Bivrost.Renderer.WebXR.shouldWork = function(player) { return !!player.input.xrAvailable; };
	
	
	Bivrost.Renderer.WebXR.prototype.fullscreenChanged=function(isFullscreen) {
		// if this is a reused renderer and fullscreen was turned off
		if(this.vrRenderer === this.player.webglRenderer && !isFullscreen) {
			this.player.vrExit();
		}
	};
	
})();