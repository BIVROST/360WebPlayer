/* global THREE */
"use strict";


var Bivrost={ 
	
	/**
	 * When on, there is some debug information on the console.log
	 * @type Boolean
	 */
	verbose: true 
};

Bivrost.VRMODE_NONE=501;
//Bivrost.VRMODE_OCULUS_RIFT_DK1=502;
Bivrost.VRMODE_OCULUS_RIFT_DK2=503;
//Bivrost.VRMODE_CARDBOARD=503;
Bivrost.AVAILABLE_VRMODES=[
	Bivrost.VRMODE_OCULUS_RIFT_DK2,
	Bivrost.VRMODE_NONE
];


Bivrost.reverseConstToName=function(constValue) {
	for(var k in Bivrost)
		if(Bivrost[k] === constValue)
			return k;
	return undefined;
//	throw "const value "+k+" not found";
};


(function(){
	
	function log(/*vargs...*/) { if(Bivrost.verbose && window.console) console.log("[Bivrost.Main] "+Array.prototype.join.call(arguments, " ")); };

	
	/**
	 * @constructor
	 * @class Bivrost.Main
	 * @param {HTMLElement} container
	 * @param {string} [url=null]
	 * @param {number} [projection=Bivrost.PROJECTION_EQUIRECTANGULAR]
	 * @param {number} [stereoscopy=Bivrost.STEREOSCOPY_NONE]
	 * @param {number} [source=Bivrost.SOURCE_AUTODETECT_FROM_EXT]
	 */
	Bivrost.Main=function(container, url, projection, stereoscopy, source) {
		/**
		 * @type Bivrost.Main
		 */
		var thisRef=this;
		
		
		// renderer
		this.renderer=new THREE.WebGLRenderer();		
		var mainDom=this.renderer.domElement;
		container.appendChild(mainDom);
		container.setAttribute("tabindex", 1337);	// for keyboard hooks to work
		this.container=container;
		
		this.riftRenderer=new THREE.OculusRiftEffect(this.renderer);


		// UI
		var uiDiv=document.createElement("div");
		uiDiv.className="ui";
		container.appendChild(uiDiv);
		this.ui=new Bivrost.UI(uiDiv, this);

		
		// input
		container.addEventListener("keypress", this._keyPress.bind(this));
		this.input=new Bivrost.Input(container, 1);
		
		
		// fullscreen
		container.addEventListener("dblclick", function() { thisRef.fullscreen=!thisRef.fullscreen; });
		var onFullscreenChange=this._onFullscreenChange.bind(this);
		document.addEventListener("fullscreenchange", onFullscreenChange);
		document.addEventListener("fullscreenchange", onFullscreenChange);
		document.addEventListener("webkitfullscreenchange", onFullscreenChange);
		document.addEventListener("mozfullscreenchange", onFullscreenChange);
		document.addEventListener("MSFullscreenChange", onFullscreenChange);
		
				
		// resize handling
		// http://stackoverflow.com/a/14139497/785171
		window.addEventListener("resize", this.resize.bind(this));
		
		this.resize();
		
			
		// load media if provided
		if(url) {
			new Bivrost.Media(url, this.setMedia.bind(this), projection, stereoscopy, source);
		}
		
		
		// Main loop, executed every frame
		var clock=new THREE.Clock();
		function loop() {
			var dt=clock.getDelta();
			thisRef.input.update(dt);
			var pos=0;

			// TODO: don't do this not every frame
			if(thisRef.view) {
				// VR mode is only valid in fullscreen
				switch(thisRef.fullscreen ? thisRef.vrMode : Bivrost.VRMODE_NONE) {
					//	case Bivrost.VRMODE_OCULUS_RIFT_DK1:	// TODO
					case Bivrost.VRMODE_OCULUS_RIFT_DK2:
						thisRef.view.renderStereo(thisRef.riftRenderer.render2.bind(thisRef.riftRenderer), thisRef.input, pos);
						break;
					case Bivrost.VRMODE_NONE:
						thisRef.view.renderMono(thisRef.renderer.render.bind(thisRef.renderer), thisRef.input, pos);
						break;
				}
			}

			requestAnimationFrame(loop);
		};
		loop();
	};

	
	/**
	 * @type {Bivrost.Input}
	 */
	Bivrost.Main.prototype.input=null;
		
		
	/**
	 * @type {HTMLElement}
	 */
	Bivrost.Main.prototype.container=null;
		
		
	/**
	 * @type {Bivrost.UI}
	 */
	Bivrost.Main.prototype.ui=null;
		
	
	/**
	 * @type {Bivrost.Media}
	 */
	Bivrost.Main.prototype.media=null;
		
		
	/**
	 * @type {Bivrost.View}
	 */
	Bivrost.Main.prototype.view=null;
		
		
	/**
	 * @type {THREE.WebGLRenderer}
	 */
	Bivrost.Main.prototype.renderer=null;

	
	/**
	 * @type {THREE.OculusRiftEffect}
	 */
	Bivrost.Main.prototype.riftRenderer=null;


	/**
	 * Sets the current media
	 * @param {Bivrost.Media} media
	 */
	Bivrost.Main.prototype.setMedia=function(media) {
		log("media set", media);
		this.media=media;
		this.view=new Bivrost.View(media);
		this.view.aspect=this.aspect;
		this.ui.setMedia(media);
		media.play();
	},
		
		
	/**
	 * Resizes the player window
	 * @private
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
		if(this.view)
			this.view.aspect=this.aspect;
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
	Object.defineProperty(Bivrost.Main.prototype, "vrMode", {
		get: function() { return this._vrMode; },
		set: function(value) {
			this._vrMode=value;
			this.resize();
		}
	});
		

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
					this.vrMode=Bivrost.AVAILABLE_VRMODES[(Bivrost.AVAILABLE_VRMODES.indexOf(this.vrMode)+1) % Bivrost.AVAILABLE_VRMODES.length];
				}
				else {	// not in fullscreen - start with default mode
					// TODO: add default mode detection
					this.fullscreen=true;
					this.vrMode=Bivrost.AVAILABLE_VRMODES[0];
				}
				break;

//			case "s": case "S": break; // TODO: toggle stereoscopy mode
//
//			case "i": case "I": break; // TODO: show media info

			// z/Z - zoom
			case "z": 
				this.view.zoom/=0.95; 
				break;
			case "Z": 
				this.view.zoom*=0.95; 
				break;

			// space - play/pause
			case " ":
				this.media.pauseToggle();
				break;

			// r - rewind
			case "r": case "R":
				this.media.rewind();
				break;

			// [/] - seek 5 sec
			case "[":
				this.media.time-=5;
				break;
			case "]":
				this.media.time+=5;
				break;

//			case "w": break // TODO: media.width--;
//			case "W": break // TODO: media.width++;
//			case "h": break // TODO: media.height--;
//			case "H": break // TODO: media.height++;
//			case "x": break // TODO: media.woffset--;
//			case "X": break // TODO: media.woffset++;
//			case "y": break // TODO: media.hoffset--;
//			case "Y": break // TODO: media.hoffset++;

			default:
				return true;
		};

		e.preventDefault();
		e.stopPropagation();
		return false;
	};
		

	// TODO: cleanup
//	Bivrost.Main.prototype.dispose=function() {
//		// TODO: media.dispose
//	};
		
})();