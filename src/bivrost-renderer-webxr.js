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
	
	// /**
	//  * Temporary handle for cleanup in destroy()
	//  */
	// Bivrost.Renderer.WebXR.prototype._displayPresentChange;
	
	
	Bivrost.Renderer.WebXR.prototype.xrSession = null;
	Bivrost.Renderer.WebXR.prototype.xrRefSpace = null;


	Bivrost.Renderer.WebXR.prototype.init = function(player) {
		Bivrost.Renderer.prototype.init.call(this, player);

		var thisRef = this;
		navigator.xr.requestSession('immersive-vr').then(function(session)
		{
			thisRef.xrSession = session;
			
			// Called either when the user has explicitly ended the session by calling
			// session.end() or when the UA has ended the session for any reason.
			// At this point the session object is no longer usable and should be
			// discarded.
			function onSessionEnded(event) {
				thisRef.xrSession = null;
				thisRef.player.vrExit();
			}

			// Listen for the sessions 'end' event so we can respond if the user
			// or UA ends the session for any reason.
			session.addEventListener('end', onSessionEnded);
			
			// Create a WebGL context to render with, initialized to be compatible
			// with the XRDisplay we're presenting to.
			var canvas = document.createElement('canvas');
			var gl = canvas.getContext('webgl', { xrCompatible: true });
			thisRef.vrRenderer=new THREE.WebGLRenderer({ canvas:canvas, context:gl });
			
			// Use the new WebGL context to create a XRWebGLLayer and set it as the
			// sessions baseLayer. This allows any content rendered to the layer to
			// be displayed on the XRDevice.
			session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
			
			thisRef.webvrRenderDelegate = function(time, frame) {
				thisRef.renderWebXR(player.webglRenderer, player.view, frame, time);
			};
			// Get a reference space, which is required for querying poses. In this
			// case an 'local' reference space means that all poses will be relative
			// to the location where the XRDevice was first detected.
			thisRef.xrSession.requestReferenceSpace('local').then(function(refSpace) {
				thisRef.xrRefSpace = refSpace;
				
				// Inform the session that we're ready to begin drawing.
				session.requestAnimationFrame(thisRef.webvrRenderDelegate);
			});

			log("Started WebXR");

		});

		this._position=new THREE.Vector3(0,0,0);
	};

	
	Bivrost.Renderer.WebXR.prototype.destroy = function(player) {
		Bivrost.Renderer.prototype.destroy.call(this, player);
		
		if(this.xrSession)
			this.xrSession.end();

		// cancel frames from now on
		this.webvrRenderDelegate = null;

		this.vrRenderer.dispose();
	};
		
	/**
	 * MONO renderer on the main display
	 * @param {THREE.WebGLRenderer} webglRenderer
	 * @param {Bivrost.View} view
	 * @returns {undefined}
	 */
	Bivrost.Renderer.WebXR.prototype.render = function(webglRenderer, view) {
		var vrDisplay=this.player.input.vrDisplay;
		
		// scene data not yet copied from normal renderer
		if(!this.vrLeftScene) {
			this.vrLeftScene=view.leftScene.clone();
			this.vrRightScene=view.rightScene.clone();
			this.vrLeftCamera=view.leftCamera.clone();
			this.vrRightCamera=view.rightCamera.clone();
		}
		
		// classical renderer only if WebXR has a separate screen
		// TODO: check for hasExternalDisplay WebVR equivalent
		if(this.vrLeftCamera) {
			view.leftCamera.rotation.copy(this.vrLeftCamera.rotation);
			view.leftCamera.position.copy(this.vrLeftCamera.position);
		}

		webglRenderer.clear();
		webglRenderer.render(view.leftScene, view.leftCamera);	
	};
	
	
	Bivrost.Renderer.WebXR.prototype.vrLeftCamera=null;
	Bivrost.Renderer.WebXR.prototype.vrRightCamera=null;
	Bivrost.Renderer.WebXR.prototype.vrLeftScene=null;
	Bivrost.Renderer.WebXR.prototype.vrRightScene=null;

	
	/**
	 * @type {THREE.Vector3}
	 * @private
	 */
	Bivrost.Renderer.WebXR.prototype._position=null;
		
	/**
	 * Stereo renreder on the WebXR surface, on a second rendering queue
	 * @param {THREE.WebGLRenderer} webglRenderer
	 * @param {Bivrost.View} view
	 * @param {?} frame
	 * @param {?} time
	 * @returns {undefined}
	 */
	Bivrost.Renderer.WebXR.prototype.renderWebXR = function(webglRenderer, view, frame, time) {
		var vrRenderer=this.vrRenderer;

		var thisRef = this;
		if(this.webvrRenderDelegate)
			this.xrSession.requestAnimationFrame(this.webvrRenderDelegate);

		// Get the XRDevice pose relative to the Reference Space we created
		// earlier. The pose may not be available for a variety of reasons, so
		// we'll exit the callback early if it comes back as null.
		let pose = frame.getViewerPose(this.xrRefSpace);
		if (!pose) {
			console.warn("No pose?");
			return;
		}

		// TODO: move these and use view params, decide on camera using eye enumeration

		// var orientation=view.transform.orientation;
		// var q=new THREE.Quaternion(orientation[0], orientation[1], orientation[2], orientation[3]);
		// this.q=q;
		// this.vrLeftCamera.rotation.setFromQuaternion(q);
		// this.vrRightCamera.rotation.setFromQuaternion(q);

		// this.vrLeftCamera.setCameraTransform(view.transform.position, view.transform.orientation);
		// this.vrRightCamera.setCameraTransform(view.transform.position, view.transform.orientation);


		// Ensure we're rendering to the layer's backbuffer.
		var layer = frame.session.renderState.baseLayer;
		// gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);

		vrRenderer.setScissorTest(true);
		vrRenderer.clear();

		// console.log("----");
		// Loop through each of the views reported by the viewer pose.
		for (let view of pose.views) {
			// console.log(view);

			var viewport = layer.getViewport(view);
			vrRenderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
			vrRenderer.setScissor(viewport.x, viewport.y, viewport.width, viewport.height);
			this.vrLeftCamera.projectionMatrix.elements = view.projectionMatrix;

			// var pos = view.transform.position;
			// this.vrLeftCamera.position.set(pos.x, pos.y, pos.z);

			vrRenderer.render(this.vrLeftScene, this.vrLeftCamera);
		}

		// if(this.player.view.enablePositionalCamera && frameData.pose && frameData.pose.position) {
		// 	this._position.x = frameData.pose.position[0];
		// 	this._position.y = frameData.pose.position[1];
		// 	this._position.z = frameData.pose.position[2];
		// }


		// var euler = new THREE.Euler("yxz");
		// euler.setFromQuaternion(q);
		// this.onRenderMainView.publish({
		// 	euler: euler, 
		// 	fov: this.vrRightCamera.getEffectiveFOV(),
		// 	platform: Bivrost.Renderer.WebXR.PLATFORM_NAME
		// });

		// TODO: does not present?
	};
	
	
	Bivrost.Renderer.WebXR.shouldWork = function(player) { return !!player.input.xrAvailable; };
	
	
	Bivrost.Renderer.WebXR.prototype.fullscreenChanged=function(isFullscreen) {
		// if this is a reused renderer and fullscreen was turned off
		if(this.vrRenderer === this.player.webglRenderer && !isFullscreen) {
			this.player.vrExit();
		}
	};
	
})();