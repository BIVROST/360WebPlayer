/* global Bivrost, THREE */
"use strict";

(function() {
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.Renderer.WebVR", arguments); };
	
	
	Bivrost.Renderer.WebVR = function(player) {
		this.player = player; 
		var vrDisplay=player.input.vrDisplay;

		this._displayPresentChange=function(ev) {
			if(!vrDisplay.isPresenting)
				player.vrExit();	
		};
		addEventListener("vrdisplaypresentchange", this._displayPresentChange);

//				[
//					'vrdisplayconnect',
//					'vrdisplaydisconnect',
//					'vrdisplayactivate',
//					'vrdisplaydeactivate',
//					'vrdisplayblur',
//					'vrdisplaypresentchange'
//				].forEach(function(evName) { vrDisplay.addEventListener(evName, function(ev) { console.log("### vrDisplay VREVENT: " + evName, ev); }); });

		
		
		var vrRenderer=new THREE.WebGLRenderer();
		
		vrRenderer.setSize(player.input.vrDisplaySize.x, player.input.vrDisplaySize.y);
		document.body.appendChild(vrRenderer.domElement);	// Samsung Internet Mobile hack

		if(vrDisplay.capabilities.canPresent)
		{
			// Samsung Internet Mobile hack:
			vrRenderer.domElement.style.width = "100%";
			vrRenderer.domElement.style.height = "100%";

			vrDisplay.requestPresent([{ source: vrRenderer.domElement }]).then(
				function() { log("webvr presence accepted"); },
				function(err) {console.error(err); }
			);
		}
		else 
		{
//			var ratio = window.devicePixelRatio || 1;
//			vrRenderer.setSize(screen.width * ratio, screen.height * ratio);    <-- this is the same value from eye area
			vrRenderer.domElement.style.width = "100%";
			vrRenderer.domElement.style.height = "100%";
			vrRenderer.domElement.webkitRequestFullscreen();
		}
		
		this.vrRenderer=vrRenderer;
		this.frameData=new VRFrameData();
	};
	Bivrost.extend(Bivrost.Renderer.WebVR, Bivrost.Renderer);
	
	
	/**
	 * Temporary handle for cleanup in destroy()
	 */
	Bivrost.Renderer.WebVR.prototype._displayPresentChange;
	
	
	Bivrost.Renderer.WebVR.prototype.init = function(player) {
		Bivrost.Renderer.prototype.init.call(this, player);
		
		log("new vr renderer: "+player.input.vrDisplaySize.x+"x"+player.input.vrDisplaySize.y);
		
		this.player.ui=new Bivrost.UI.Stereo(player, "webvr");
	};

	
	Bivrost.Renderer.WebVR.prototype.destroy = function(player) {
		Bivrost.Renderer.prototype.destroy.call(this, player);
		
		document.body.removeChild(this.vrRenderer.domElement);	// Samsung Internet Mobile hack
		
		removeEventListener("vrdisplaypresentchange", this._displayPresentChange);
		
		this._renderWebVRdelegate=function() { ; };

		this.vrRenderer.dispose();
		
		if (player.input.vrDisplay.isPresenting)
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
			this.initWebVR(webglRenderer, view);
		}
			
		// classical renderer only if webvr can present on a separate screen
		if(this.player.input.vrDisplay.capabilities.canPresent) {
			var w = webglRenderer.domElement.width;
			var h = webglRenderer.domElement.height;

			webglRenderer.setScissorTest(false);
			webglRenderer.setViewport(0,0,w,h);
			webglRenderer.setScissor(0,0,w,h);
			if(this.vrLeftCamera)
				view.leftCamera.rotation.copy(this.vrLeftCamera.rotation);
			webglRenderer.render(view.leftScene, view.leftCamera);	
		}
	};
	
	
	Bivrost.Renderer.WebVR.prototype.vrLeftCamera=null;
	Bivrost.Renderer.WebVR.prototype.vrRightCamera=null;
	Bivrost.Renderer.WebVR.prototype.vrLeftScene=null;
	Bivrost.Renderer.WebVR.prototype.vrRightScene=null;

	
	
	Bivrost.Renderer.WebVR.prototype.initWebVR=function(webglRenderer, view) {
		var vrDisplay=this.player.input.vrDisplay;

		this.vrLeftScene=view.leftScene.clone();
		this.vrRightScene=view.rightScene.clone();
		this.vrLeftCamera=view.leftCamera.clone();
		this.vrRightCamera=view.rightCamera.clone();

		var thisRef=this;
		this._renderWebVRdelegate=function() {
			vrDisplay.requestAnimationFrame(thisRef._renderWebVRdelegate);
			thisRef.renderWebVR(webglRenderer, view);
		};

		vrDisplay.requestAnimationFrame(this._renderWebVRdelegate);

		log("initiated webvr renderer");
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
		
		if(!frameData.pose) {
			log("No frameData.pose (yet?)");
		}
		
		var w = vrRenderer.domElement.width;
		var h = vrRenderer.domElement.height;
		var viewportLeft=(w > h) ? [0,0,w/2,h] : [0,0,w,h/2];
		var viewportRight=(w > h) ? [w/2,0,w/2,h] : [0,h/2,w,h/2];

		var pos=(frameData.pose && frameData.pose.position) || [0,0,0];
		var posV=new THREE.Vector3(pos[0], pos[1], pos[2]);
		posV=new THREE.Vector3(0,0,0);
		var orientation=(frameData.pose && frameData.pose.orientation) || [0,0,0,1];
		var q=new THREE.Quaternion(orientation[0], orientation[1], orientation[2], orientation[3]);
		this.q=q;
		this.vrLeftCamera.rotation.setFromQuaternion(q);
		this.vrRightCamera.rotation.setFromQuaternion(q);

		vrDisplay.getFrameData(frameData);
		vrRenderer.setScissorTest(true);


		// left eye
		vrRenderer.setViewport.apply(vrRenderer, viewportLeft);
		vrRenderer.setScissor.apply(vrRenderer, viewportLeft);
		this.vrLeftCamera.projectionMatrix.elements = frameData.leftProjectionMatrix;

		var offsetLeft = vrDisplay.getEyeParameters("left").offset;
		var posLeft = new THREE.Vector3(offsetLeft[0], offsetLeft[1], offsetLeft[2]);
		posLeft.applyQuaternion(q);
		posLeft.add(posV);
		this.vrLeftCamera.position.set(posLeft.x, posLeft.y, posLeft.z);

		vrRenderer.render(this.vrLeftScene, this.vrLeftCamera);
		
		
		// right eye
		vrRenderer.setViewport.apply(vrRenderer, viewportRight);
		vrRenderer.setScissor.apply(vrRenderer, viewportRight);
		this.vrRightCamera.projectionMatrix.elements = frameData.rightProjectionMatrix;

		var offsetRight = vrDisplay.getEyeParameters("right").offset;
		var posRight = new THREE.Vector3(offsetRight[0], offsetRight[1], offsetRight[2]);
		posRight.applyQuaternion(q);
		posRight.add(posV);
		this.vrRightCamera.position.set(posRight.x, posRight.y, posRight.z);

		vrRenderer.render(this.vrRightScene, this.vrRightCamera);


		// rendered viewport submission
		vrDisplay.submitFrame();
	};
	
	
	Bivrost.Renderer.WebVR.shouldWork = function(player) { return !!player.input.vrDisplay; };
	
	

	
})();