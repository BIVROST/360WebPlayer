/* global Bivrost, THREE */
"use strict";

(function() {
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.Renderer.WebVR", arguments); };
	
	
	Bivrost.Renderer.WebVR = function(player) { this.player = player; };
	
	Bivrost.extend(Bivrost.Renderer.WebVR, Bivrost.Renderer);
	
	Bivrost.Renderer.WebVR.prototype.init = function(player) {
		Bivrost.Renderer.prototype.init.call(this, player);
		
		this.player.ui=null;
		
		var vrDisplay=player.input.vrDisplay;
		var vrRenderer=new THREE.WebGLRenderer();
		vrRenderer.setSize(player.input.vrDisplaySize.x, player.input.vrDisplaySize.y);
		document.body.appendChild(vrRenderer.domElement);
		
		
//			document.body.appendChild(document.createTextNode(JSON.stringify({
//				"screen.width": screen.width,
//				"screen.height": screen.height,
//				"window.devicePixelRatio": window.devicePixelRatio,
//				"left": [eyeLeft.renderWidth, eyeLeft.renderHeight],
//				"right": [eyeRight.renderWidth, eyeRight.renderHeight],
//				"vrRenderer.domElement.width": vrRenderer.domElement.width,
//				"vrRenderer.domElement.height": vrRenderer.domElement.height
//			})));

		if(vrDisplay.capabilities.canPresent)
		{
			// gearvr samsung internet beta webvr:
			vrRenderer.domElement.style.width = "100%";
			vrRenderer.domElement.style.height = "100%";

			vrDisplay.requestPresent([{ source: vrRenderer.domElement }]).then(function () {
			  // Nothing to do because we're handling things in onVRPresentChange.
			}, function(err) {console.error(err); });
		}
		else 
		{
//			var ratio = window.devicePixelRatio || 1;
//			vrRenderer.setSize(screen.width * ratio, screen.height * ratio);     // <-- this is the same value from eye area
			vrRenderer.domElement.style.width = "100%";
			vrRenderer.domElement.style.height = "100%";
			vrRenderer.domElement.webkitRequestFullscreen();
		}
		
		this.vrRenderer=vrRenderer;
		this.frameData=new VRFrameData();
		
//		addEventListener('vrdisplayactivate', webvr_enter_vr, false);
//		addEventListener('vrdisplaydeactivate', webvr_exit_vr, false);

	};

	
	Bivrost.Renderer.WebVR.prototype.destroy = function(player) {
		Bivrost.Renderer.prototype.destroy.call(this, player);
		
		this._renderWebVRdelegate=function() { ; };

		if(!player.input.vrDisplay)
			{ debugger; return; }
		
		if (!player.input.vrDisplay.isPresenting)
			return;
		
		player.input.vrDisplay.exitPresent().then(
			function () { log("exit present success"); }, 
			function (err) { console.error(err); debugger; }
		);
	};
		
	/**
	 * MONO renderer on the main display
	 * @param {THREE.WebGLRenderer} webglRenderer
	 * @param {Bivrost.View} view
	 * @returns {undefined}
	 */
	Bivrost.Renderer.WebVR.prototype.render = function(webglRenderer, view) {
		
		// init webVR - in it's own render queue
		if(!this._renderWebVRdelegate) {
			var thisRef=this;
			var vrDisplay=this.player.input.vrDisplay;
			
			thisRef.vrLeftScene=view.leftScene.clone();
			thisRef.vrRightScene=view.rightScene.clone();
			thisRef.vrLeftCamera=view.leftCamera.clone();
			thisRef.vrRightCamera=view.rightCamera.clone();

			this._renderWebVRdelegate=function() {
				vrDisplay.requestAnimationFrame(thisRef._renderWebVRdelegate);
				thisRef.renderWebVR(webglRenderer, view);
			};
			
			vrDisplay.requestAnimationFrame(this._renderWebVRdelegate);
			
			log("initiated webvr renderer");
		}
		
		// classical renderer only if webvr can present on a separate 
		if(this.input.vrDisplay.capabilities.canPresent) {
			var w = webglRenderer.domElement.width;
			var h = webglRenderer.domElement.height;

			webglRenderer.setScissorTest(false);
			webglRenderer.setViewport(0,0,w,h);
			webglRenderer.setScissor(0,0,w,h);
			webglRenderer.render(view.leftScene, view.leftCamera);	
		}
	};
		
		
	Bivrost.Renderer.WebVR.prototype._renderWebVRdelegate;
		
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
		
		if(!vrDisplay.isPresenting) {
			log("!isPresenting");
			//return;
			vrRenderer=webglRenderer;
		}
		else log("rendering");


		var w = vrRenderer.domElement.width;
		var h = vrRenderer.domElement.height;

		vrDisplay.getFrameData(frameData);
		vrRenderer.setScissorTest(true);

		var pos=frameData.pose.position || [0,0,0];
		var posV=new THREE.Vector3(pos[0], pos[1], pos[2]);
		posV=new THREE.Vector3(0,0,0);
		var orientation=frameData.pose.orientation || [0,0,0,1];
		var q=new THREE.Quaternion(orientation[0], orientation[1], orientation[2], orientation[3]);
		this.vrLeftCamera.rotation.setFromQuaternion(q);
		this.vrRightCamera.rotation.setFromQuaternion(q);
	//	camera2.position.set(pos[0], pos[1], pos[2]);

		// left eye
		vrRenderer.setViewport(0,0,w/2,h);
		vrRenderer.setScissor(0,0,w/2,h);
		this.vrLeftCamera.projectionMatrix.elements = frameData.leftProjectionMatrix;

		var offsetLeft = vrDisplay.getEyeParameters("left").offset;
		var posLeft = new THREE.Vector3(offsetLeft[0], offsetLeft[1], offsetLeft[2]);
		posLeft.applyQuaternion(q);
		posLeft.add(posV);
		this.vrLeftCamera.position.set(posLeft.x, posLeft.y, posLeft.z);

		vrRenderer.render(this.vrLeftScene, this.vrLeftCamera);

		// right eye
		vrRenderer.setViewport(w/2,0,w/2,h);
		vrRenderer.setScissor(w/2,0,w/2,h);
		this.vrRightCamera.projectionMatrix.elements = frameData.rightProjectionMatrix;

		var offsetRight = vrDisplay.getEyeParameters("right").offset;
		var posRight = new THREE.Vector3(offsetRight[0], offsetRight[1], offsetRight[2]);
		posRight.applyQuaternion(q);
		posRight.add(posV);
		this.vrRightCamera.position.set(posRight.x, posRight.y, posRight.z);

		vrRenderer.render(this.vrRightScene, this.vrRightCamera);

		vrRenderer.setScissorTest(false);
		vrRenderer.setViewport(0,0,w,h);
		vrRenderer.setScissor(0,0,w,h);

		vrDisplay.submitFrame();
	};
	
	
	Bivrost.Renderer.WebVR.prototype.shouldWork = function() { return !!this.input.vrDisplay; };
	
	

	
})();