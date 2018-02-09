/* global Bivrost, THREE */
"use strict";

(function() {
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.Renderer.WebVR", arguments); };
	
	
	Bivrost.Renderer.WebVR = function(player) { ; };
	Bivrost.extend(Bivrost.Renderer.WebVR, Bivrost.Renderer);
	
	
	/**
	 * Temporary handle for cleanup in destroy()
	 */
	Bivrost.Renderer.WebVR.prototype._displayPresentChange;
	
	
	Bivrost.Renderer.WebVR.prototype.init = function(player) {
		Bivrost.Renderer.prototype.init.call(this, player);

		var vrDisplay=player.input.vrDisplay;
		var vrRenderer;

//				[
//					'vrdisplayconnect',
//					'vrdisplaydisconnect',
//					'vrdisplayactivate',
//					'vrdisplaydeactivate',
//					'vrdisplayblur',
//					'vrdisplaypresentchange'
//				].forEach(function(evName) { vrDisplay.addEventListener(evName, function(ev) { console.log("### vrDisplay VREVENT: " + evName, ev); }); });

		
		// GearVR Samsung Internet Beta and Chromium and Firefox Nightly
		if(vrDisplay.capabilities.canPresent)
		{
			// presenting WebVR implementation requires a second rendeder
			vrRenderer=new THREE.WebGLRenderer();
			vrRenderer.setSize(player.input.vrDisplaySize.x, player.input.vrDisplaySize.y);

			// SIM won't render if the element isn't in the DOM
			document.body.appendChild(vrRenderer.domElement);
			
			this._displayPresentChange=function(ev) {
				if(!vrDisplay.isPresenting)
					player.vrExit();	
			};
			addEventListener("vrdisplaypresentchange", this._displayPresentChange);
			
			// Samsung Internet Mobile doesn't like fullscreen a lot
			if(player.input.isGearVR) {
				player.fullscreen=false;
			}

			// Samsung Internet Mobile hack (harmless to other platforms):
			vrRenderer.domElement.style.width = "100%";
			vrRenderer.domElement.style.height = "100%";

			// Hide in desktop browsers
			vrRenderer.domElement.style.display = "none";

			vrDisplay.requestPresent([{ source: vrRenderer.domElement }]).then(
				function() { log("webvr presence accepted"); },
				function(err) {console.error(err); }
			);
	
			log("new vr renderer: "+player.input.vrDisplaySize.x+"x"+player.input.vrDisplaySize.y);		
			
			this.player.ui=new Bivrost.UI.Stereo(player, vrRenderer.domElement, true);
		}
		// Chrome Android cardboard WebVR mode
		else	
		{
			// reuse renderer
			vrRenderer=player.webglRenderer;
			//var ratio = window.devicePixelRatio || 1;
			//vrRenderer.setSize(screen.width * ratio, screen.height * ratio);    <-- this is the same value from eye area
			vrRenderer.domElement.style.width = "100%";
			vrRenderer.domElement.style.height = "100%";
			player.fullscreen=true;
			log("reused renderer as vr renderer: "+player.input.vrDisplaySize.x+"x"+player.input.vrDisplaySize.y);		
		
			this.player.ui=new Bivrost.UI.Stereo(player, vrRenderer.domElement);
		}
		
		this.vrRenderer=vrRenderer;
		this.frameData=new VRFrameData();
		this._position=new THREE.Vector3(0,0,0);
	};

	
	Bivrost.Renderer.WebVR.prototype.destroy = function(player) {
		Bivrost.Renderer.prototype.destroy.call(this, player);
		
		if(this._displayPresentChange)
			removeEventListener("vrdisplaypresentchange", this._displayPresentChange);
		
		// cancel frames from now on
		this._renderWebVRdelegate=function() { ; };

		if(this.vrRenderer !== this.player.webglRenderer) {
			log("destroying vr renderer");
			
			// undoing Samsung Internet Mobile hack
			if(this.vrRenderer.domElement.parentNode)
				this.vrRenderer.domElement.parentNode.removeChild(this.vrRenderer.domElement);	
		
			this.vrRenderer.dispose();
		}
		else {
			log("resetting reused renderer");
			
			var w = this.vrRenderer.domElement.width;
			var h = this.vrRenderer.domElement.height;

			this.vrRenderer.setScissorTest(false);
			this.vrRenderer.setViewport(0,0,w,h);
			this.vrRenderer.setScissor(0,0,w,h);
		}
		
		if (player.input.vrDisplay.isPresenting)
			player.input.vrDisplay.exitPresent().then(
				function () { ; }, 
				function (err) { console.error(err); }
			);
	};
		
	/**
	 * MONO renderer on the main display
	 * @param {THREE.WebGLRenderer} webglRenderer
	 * @param {Bivrost.View} view
	 * @returns {undefined}
	 */
	Bivrost.Renderer.WebVR.prototype.render = function(webglRenderer, view) {
		var vrDisplay=this.player.input.vrDisplay;
		
		// scene data not yet copied from normal renderer
		if(!this.vrLeftScene) {
			this.vrLeftScene=view.leftScene.clone();
			this.vrRightScene=view.rightScene.clone();
			this.vrLeftCamera=view.leftCamera.clone();
			this.vrRightCamera=view.rightCamera.clone();
		}
		
		// init separate webVR render queue if presenting
		if(vrDisplay.capabilities.canPresent && !this._renderWebVRdelegate) {
			var thisRef=this;
			this._renderWebVRdelegate=function() {
				vrDisplay.requestAnimationFrame(thisRef._renderWebVRdelegate);
				thisRef.renderWebVR(webglRenderer, view);
			};

			vrDisplay.requestAnimationFrame(this._renderWebVRdelegate);

			log("initiated webvr renderer");		
		}

		// cardboard or other non-presenting implementation renders in main queue
		if(!vrDisplay.capabilities.canPresent) {
			this.renderWebVR(webglRenderer, view);
		}
		// classical renderer only if webvr has a separate screen
		else if(vrDisplay.capabilities.hasExternalDisplay) {
			if(this.vrLeftCamera) {
				view.leftCamera.rotation.copy(this.vrLeftCamera.rotation);
				view.leftCamera.position.copy(this.vrLeftCamera.position);
			}
			webglRenderer.clear();
			webglRenderer.render(view.leftScene, view.leftCamera);	
		}
	};
	
	
	Bivrost.Renderer.WebVR.prototype.vrLeftCamera=null;
	Bivrost.Renderer.WebVR.prototype.vrRightCamera=null;
	Bivrost.Renderer.WebVR.prototype.vrLeftScene=null;
	Bivrost.Renderer.WebVR.prototype.vrRightScene=null;

	
	Bivrost.Renderer.WebVR.prototype._renderWebVRdelegate=null;
		

	/**
	 * @type {THREE.Vector3}
	 * @private
	 */
	Bivrost.Renderer.WebVR.prototype._position=null;
		
	/**
	 * Stereo renreder on the WebVR surface, on a second rendering queue
	 * @param {THREE.WebGLRenderer} webglRenderer
	 * @param {Bivrost.View} view
	 * @returns {undefined}
	 */
	Bivrost.Renderer.WebVR.prototype.renderWebVR = function(webglRenderer, view) {
		var vrDisplay=this.player.input.vrDisplay;
		var vrRenderer=this.vrRenderer;
		var frameData=this.frameData;
		
		vrDisplay.getFrameData(frameData);

		if(!frameData.pose) {
			log("No frameData.pose (yet?)");
		}
		

		var w = vrRenderer.domElement.width;
		var h = vrRenderer.domElement.height;
		var horizontal = screen.width > screen.height;
		var viewportLeft=horizontal ? [0,0,w/2,h] : [0,0,w,h/2];
		var viewportRight=horizontal ? [w/2,0,w/2,h] : [0,h/2,w,h/2];

		if(this.player.view.enablePositionalCamera && frameData.pose && frameData.pose.position) {
			this._position.x = frameData.pose.position[0];
			this._position.y = frameData.pose.position[1];
			this._position.z = frameData.pose.position[2];
		}

		var orientation=(frameData.pose && frameData.pose.orientation) || [0,0,0,1];
		var q=new THREE.Quaternion(orientation[0], orientation[1], orientation[2], orientation[3]);
		this.q=q;
		this.vrLeftCamera.rotation.setFromQuaternion(q);
		this.vrRightCamera.rotation.setFromQuaternion(q);

		vrRenderer.setScissorTest(true);
		vrRenderer.clear();


		// left eye
		vrRenderer.setViewport.apply(vrRenderer, viewportLeft);
		vrRenderer.setScissor.apply(vrRenderer, viewportLeft);
		this.vrLeftCamera.projectionMatrix.elements = frameData.leftProjectionMatrix;

		var offsetLeft = vrDisplay.getEyeParameters("left").offset;
		var posLeft = new THREE.Vector3(offsetLeft[0], offsetLeft[1], offsetLeft[2]);
		posLeft.applyQuaternion(q);
		posLeft.add(this._position);
		this.vrLeftCamera.position.set(posLeft.x, posLeft.y, posLeft.z);

		vrRenderer.render(this.vrLeftScene, this.vrLeftCamera);
		
		
		// right eye
		vrRenderer.setViewport.apply(vrRenderer, viewportRight);
		vrRenderer.setScissor.apply(vrRenderer, viewportRight);
		this.vrRightCamera.projectionMatrix.elements = frameData.rightProjectionMatrix;

		var offsetRight = vrDisplay.getEyeParameters("right").offset;
		var posRight = new THREE.Vector3(offsetRight[0], offsetRight[1], offsetRight[2]);
		posRight.applyQuaternion(q);
		posRight.add(this._position);
		this.vrRightCamera.position.set(posRight.x, posRight.y, posRight.z);

		vrRenderer.render(this.vrRightScene, this.vrRightCamera);


		// rendered viewport submission
		vrDisplay.submitFrame();

		if(this.onRenderMainView) {
			var euler = new THREE.Euler();
			euler.setFromQuaternion(q);
			var fov = this.vrRightCamera.getEffectiveFOV();
			this.onRenderMainView(euler, fov);
		}
	};
	
	
	Bivrost.Renderer.WebVR.shouldWork = function(player) { return !!player.input.vrDisplay; };
	
	
	Bivrost.Renderer.WebVR.prototype.fullscreenChanged=function(isFullscreen) {
		// if this is a reused renderer and fullscreen was turned off
		if(this.vrRenderer === this.player.webglRenderer && !isFullscreen) {
			this.player.vrExit();
		}
	};
	
})();