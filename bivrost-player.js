/* global THREE, Bivrost */
"use strict";


(function(){
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.Player", arguments); };

	
	/**
	 * The player glues everything else together, it is the entry point.
	 * @constructor
	 * @class Bivrost.Player
	 * @param {HTMLElement} container
	 * @param {string|object=} [url=undefined] url to the media, may be an array. If not used, call setMedia later.
	 * @param {string=} [projection=Bivrost.PROJECTION_EQUIRECTANGULAR] shorthand to set projection in media
	 * @param {string=} [stereoscopy=Bivrost.STEREOSCOPY_MONO] shorthand to set stereoscopy in media
	 * @param {string=} [source=Bivrost.SOURCE_AUTODETECT_FROM_EXT] shorthand to set source type in media
	 * @param {boolean=} [loop=false] shorthand to set looping in media
	 * @param {boolean=} [autoplay=true] should the media play automaticly
	 */
	Bivrost.Player=function(container, url, projection, stereoscopy, source, loop, autoplay) {
		/**
		 * @type Bivrost.Player
		 */
		var thisRef=this;
		this.autoplay=autoplay;

		// container
		this.container=container;
		if(container.bivrost) {
			if(window.console && window.console.error) 
				console.error("Bivrost player already initialized in ", container);
			throw "Bivrost player already initialized in "+container;
		}
		while(container.hasChildNodes())
			container.removeChild(container.lastChild);
		container.className+=" bivrost-player";
		container.bivrost=this;
			
		
		// renderer
		this.renderer=new THREE.WebGLRenderer();		
		container.appendChild(this.renderer.domElement);
		container.setAttribute("tabindex", 1337);	// for keyboard hooks to work
		
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
			new Bivrost.Media(url, this.setMedia.bind(this), projection, stereoscopy, source, loop);
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
	Bivrost.Player.prototype.input=null;
		
		
	/**
	 * @type {HTMLElement}
	 */
	Bivrost.Player.prototype.container=null;
		
		
	/**
	 * @type {Bivrost.UI}
	 */
	Bivrost.Player.prototype.ui=null;
		
	
	/**
	 * @type {Bivrost.Media}
	 */
	Bivrost.Player.prototype.media=null;
		
		
	/**
	 * @type {Bivrost.View}
	 */
	Bivrost.Player.prototype.view=null;
		
		
	/**
	 * @type {THREE.WebGLRenderer}
	 */
	Bivrost.Player.prototype.renderer=null;

	
	/**
	 * @private
	 * @type {THREE.OculusRiftEffect}
	 */
	Bivrost.Player.prototype.riftRenderer=null;

	
	/**
	 * Should the media play automaticly
	 * @type {boolean}
	 */
	Bivrost.Player.prototype.autoplay=true;


	/**
	 * Sets the current media
	 * @param {Bivrost.Media} media
	 */
	Bivrost.Player.prototype.setMedia=function(media) {
		log("media set", media);
		this.media=media;
		this.view=new Bivrost.View(media);
		this.view.aspect=this.aspect;
		this.ui.setMedia(media);
		if(this.autoplay)
			media.play();
	},
		
		
	/**
	 * Resizes the player window
	 * @private
	 */
	Bivrost.Player.prototype.resize=function() {
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
	Bivrost.Player.prototype.aspect=4/3;

	
	/**
	 * Current VR mode, see Bivrost.VRMODE_*
	 * @private
	 * @type {number}
	 */
	Bivrost.Player.prototype._vrMode=Bivrost.VRMODE_NONE;
		
	
	/**
	 * Change VR mode
	 * @param {number} mode, see Bivrost.VRMODE_*
	 */
	Object.defineProperty(Bivrost.Player.prototype, "vrMode", {
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
	Bivrost.Player.prototype._sizeBeforeFullscreen=null;
	
	/**
	 * Is fullscreen enabled?
	 * @private
	 * @type {boolean}
	 */
	Bivrost.Player.prototype._fullscreen=false;

	/**
	 * Call to enter/exit or check state of fullscreen. Changes must be called from an user event.
	 * @property {boolean}
	 * @name Bivrost.Player#fullscreen
	 */
	Object.defineProperty(Bivrost.Player.prototype, "fullscreen", {
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
	Bivrost.Player.prototype._onFullscreenChange=function() {
		this._fullscreen=(
			document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullscreenElement
		) === this.container;

		if(!this.fullscreen && this._sizeBeforeFullscreen) {
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
	Bivrost.Player.prototype._keyPress=function(e) {
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

			// -/+ - zoom
			case "+": case "=": 
				this.view.zoom/=0.95; 
				break;
			case "-": 
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
//	Bivrost.Player.prototype.dispose=function() {
//		// TODO: media.dispose
//	};
		
})();