/* global THREE */
"use strict";

var Bivrost={ verbose: true };

Bivrost.VRMODE_NONE=501;
//Bivrost.VRMODE_OCULUS_RIFT_DK1=502;
Bivrost.VRMODE_OCULUS_RIFT_DK2=503;
//Bivrost.VRMODE_CARDBOARD=503;
Bivrost.AVAILABLE_VRMODES=[
	Bivrost.VRMODE_NONE, 
	Bivrost.VRMODE_OCULUS_RIFT_DK2
];


Bivrost.reverseConstToName=function(constValue) {
	for(var k in Bivrost)
		if(Bivrost[k] === constValue)
			return k;
	return undefined;
//	throw "const value "+k+" not found";
};


(function(){
	
	function log(/*vargs...*/) { if(Bivrost.verbose) console.log("[Bivrost.Main] "+Array.prototype.join.call(arguments, " ")); };

	
	/**
	 * @constructor
	 * @class Bivrost.Main
	 * @param {HTMLElement} container
	 * @param {string} [url=null]
	 * @param {number} [projection=Bivrost.PROJECTION_EQUIRECTANGULAR]
	 * @param {number} [stereoscopy=Bivrost.STEREOSCOPY_NONE]
	 * @param {number} [source=Bivrost.SOURCE_AUTODETECT_FROM_EXT]
	 * @returns {Bivrost.Picture}
	 */
	Bivrost.Main=function(container, url, projection, stereoscopy, source) {
		var thisRef=this;
		
		this._clock=new THREE.Clock();

		// renderer
		this.renderer=new THREE.WebGLRenderer();		
		var mainDom=this.renderer.domElement;
		container.appendChild(mainDom);
		container.setAttribute("tabindex", 1337);
		this.container=container;
		this.riftRenderer=new THREE.OculusRiftEffect(this.renderer);
		
		var uiDiv=document.createElement("div");
		uiDiv.className="ui";
		container.appendChild(uiDiv);
		this.ui=new Bivrost.UI(uiDiv, this);

		
		// input
		container.addEventListener("keypress", this._keyPress.bind(this));
		this.mouseLook=new Bivrost.MouseLook(container, 1);
		
		
		// fullscreen
		container.addEventListener("dblclick", function() { thisRef.fullscreen=!thisRef.fullscreen; });
		var onFullscreenChange=this._onFullscreenChange.bind(this);
		document.addEventListener("fullscreenchange", onFullscreenChange);
		document.addEventListener("fullscreenchange", onFullscreenChange);
		document.addEventListener("webkitfullscreenchange", onFullscreenChange);
		document.addEventListener("mozfullscreenchange", onFullscreenChange);
		document.addEventListener("MSFullscreenChange", onFullscreenChange);
		
		// main loop
		this._loopBound=this.loop.bind(this);
		this.loop();
		
		// resize handling
		// http://stackoverflow.com/a/14139497/785171
		window.addEventListener("resize", this.resize.bind(this));
		
		this.resize();

		
		// load picture if provided
		if(url) {
			new Bivrost.Picture(url, this.setPicture.bind(this), projection, stereoscopy, source);
		}
	};

	
	/**
	 * @type {Bivrost.MouseLook}
	 */
	Bivrost.Main.prototype.mouseLook=null;
		
		
	/**
	 * @type {HTMLElement}
	 */
	Bivrost.Main.prototype.container=null;
		
		
	/**
	 * @type {Bivrost.UI}
	 */
	Bivrost.Main.prototype.ui=null;
		
	
	/**
	 * @type {Bivrost.Picture}
	 */
	Bivrost.Main.prototype.picture=null;
		
		
	/**
	 * @type {Bivrost.Viewer}
	 */
	Bivrost.Main.prototype.viewer=null;
		
		
	/**
	 * @type {THREE.WebGLRenderer}
	 */
	Bivrost.Main.prototype.renderer=null;

	
	/**
	 * @type {THREE.OculusRiftEffect}
	 */
	Bivrost.Main.prototype.riftRenderer=null;


	/**
	 * Main loop, executed every frame
	 */
	Bivrost.Main.prototype.loop=function() {
		var dt=this._clock.getDelta();
		this.mouseLook.update(dt);
		var pos=0;

		// TODO: not every frame
		if(this.viewer) {
			switch(this.fullscreen?this._vrMode:Bivrost.VRMODE_NONE) {
//				case Bivrost.VRMODE_OCULUS_RIFT_DK1:	// TODO
				case Bivrost.VRMODE_OCULUS_RIFT_DK2:
					this.viewer.renderStereo(this.riftRenderer.render2.bind(this.riftRenderer), this.mouseLook, pos);
					break;
				case Bivrost.VRMODE_NONE:
					this.viewer.renderMono(this.renderer.render.bind(this.renderer), this.mouseLook, pos);
					break;
			}
		}

		requestAnimationFrame(this._loopBound);
	};


	/**
	 * Sets the current picture
	 * @param {Bivrost.Picture} picture
	 * @returns {Bivrost.Picture}
	 */
	Bivrost.Main.prototype.setPicture=function(picture) {
		log("picture set", picture);
		this.picture=picture;
		this.viewer=new Bivrost.Viewer(picture);
		this.viewer.aspect=this.aspect;
		this.ui.setPicture(picture);
		picture.play();
		return picture;
	},
		
		
	/**
	 * Resizes the render window
	 */
	Bivrost.Main.prototype.resize=function() {
		var width=this.container.offsetWidth;
		var height=this.container.offsetHeight;
		if(height === 0) {
			log("guess height from w=", width, "and aspect=", this.aspect);
			height=width/this.aspect;
			this.container.style.height=height+"px";
		}

		log("size", width, height);
		if(this.riftRenderer) {
			this.riftRenderer.HMD.hResolution=width;
			this.riftRenderer.HMD.vResolution=height;
			this.riftRenderer.setSize(width, height);
		}
		this.renderer.setSize(width, height, false);
		//this.container.style.width=width+"px";
		this.aspect=width/height;
		if(this.viewer)
			this.viewer.aspect=this.aspect;
//			this.renderer.setViewport(0, 0, width, height);
	},


	/**
	 * Default aspect ratio for render window 
	 * @type {number}
	 */
	Bivrost.Main.prototype.aspect=4/3;

	
	/**
	 * Current VR mode, see Bivrost.VRMODE_*
	 * @private
	 * @type {number}
	 */
	Bivrost.Main.prototype._vrMode=Bivrost.VRMODE_NONE;
		
	
	/**
	 * Change VR mode
	 * @param {number} mode, see Bivrost.VRMODE_*
	 */
	Bivrost.Main.prototype.setVRMode=function(mode) {
		this._vrMode=mode;
		this.resize();
	};
		

	/// REGION: fullscreen

	/**
	 * Window size before fullscreen
	 * @private
	 */
	Bivrost.Main.prototype._sizeBeforeFullscreen=null;
	
	/**
	 * Is fullscreen enabled?
	 * @private
	 * @type {boolean}
	 */
	Bivrost.Main.prototype._fullscreen=false;

	/**
	 * Call to enter/exit or check state of fullscreen. Changes must be called from an user event.
	 * @property {boolean}
	 * @name Bivrost.Main#fullscreen
	 */
	Object.defineProperty(Bivrost.Main.prototype, "fullscreen", {
		get: function() { return this._fullscreen; },
		set: function(value) {
			if(value === this.fullscreen) // ignore if no change
				return;
			if(value) {	// turn on
				var elem=this.container;

				if(!this._sizeBeforeFullscreen)
					this._sizeBeforeFullscreen=[elem.offsetWidth, elem.offsetHeight];
				log("fullscreen enter, stored size", this._sizeBeforeFullscreen);

				(
					elem.requestFullscreen 
					|| elem.msRequestFullscreen 
					|| elem.mozRequestFullScreen
					|| elem.webkitRequestFullscreen 
					|| function() {throw "fullscreen not supported";}
				).call(elem);			/// TODO: use HMD if available - , {vrDisplay: this.hmd}
			}
			else { // turn off
				(
					document.exitFullscreen
					|| document.mozCancelFullScreen 
					|| document.webkitExitFullscreen 
					|| document.msExitFullscreen 
					|| function() {throw "exiting fullscreen not supported";}
				).call(document);
			}
		}
	});
	
	
	/**
	 * Event handler for managing full screen changes
	 * @private
	 */
	Bivrost.Main.prototype._onFullscreenChange=function() {
		this._fullscreen=(
			document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullscreenElement
		) === this.container;

		if(!this.fullscreen) {
			log("fullscreen exit, resize to", this._sizeBeforeFullscreen);
			this.renderer.setSize(this._sizeBeforeFullscreen[0], this._sizeBeforeFullscreen[1], true);
		}

		setTimeout(this.resize.bind(this), 0);
	};
		
	/// } END REGION
	
	
	/**
	 * Event handler for managing keyboard events
	 * @private	
	 * @param {KeyboardEvent} e
	 */
	Bivrost.Main.prototype._keyPress=function(e) {
		var keyName=e.key || String.fromCharCode(e.which);
		switch(keyName) {
			// f - toggle fullscreen
			case "f": case "F":
				this.fullscreen=!this.fullscreen;
				break;

			// v - enable/toggle VR modes
			case "v": case "V":
				if(this.fullscreen) {	// already in fullscreen - toggle modes					
					this.setVRMode(Bivrost.AVAILABLE_VRMODES[(Bivrost.AVAILABLE_VRMODES.indexOf(this._vrMode)+1) % Bivrost.AVAILABLE_VRMODES.length]);
				}
				else {	// not in fullscreen - start with default mode
					// TODO: add default mode detection
					this.fullscreen=true;
					this.setVRMode(Bivrost.AVAILABLE_VRMODES[0]);
				}
				break;

//			case "s": case "S": break; // TODO: toggle stereoscopy mode
//
//			case "i": case "I": break; // TODO: show picture info

			// z/Z - zoom
			case "z": 
				this.viewer.zoom/=0.95; 
				break;
			case "Z": 
				this.viewer.zoom*=0.95; 
				break;

			// space - play/pause
			case " ":
				this.picture.pauseToggle();
				break;

			// r - rewind
			case "r": case "R":
				this.picture.rewind();
				break;

			// [/] - seek 5 sec
			case "[":
				this.picture.time-=5;
				break;
			case "]":
				this.picture.time+=5;
				break;

//			case "w": break // TODO: picture.width--;
//			case "W": break // TODO: picture.width++;
//			case "h": break // TODO: picture.height--;
//			case "H": break // TODO: picture.height++;
//			case "x": break // TODO: picture.woffset--;
//			case "X": break // TODO: picture.woffset++;
//			case "y": break // TODO: picture.hoffset--;
//			case "Y": break // TODO: picture.hoffset++;

			default:
				return true;
		};

		e.preventDefault();
		e.stopPropagation();
		return false;
	};
		

	// TODO: cleanup
//	Bivrost.Main.prototype.dispose=function() {
//		// TODO: picture.dispose
//	};


	
	Bivrost.Main.prototype._clock=null;
		
})();