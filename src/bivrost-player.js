/* global THREE, Bivrost, DOMException, chrome */
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
	 * @param {string|object=} [url=undefined] url to the media, may be an object 
	 *			whose keys are urls, values are codecs or null. If not used, call setMedia later.
	 * @param {string=} [projection=Bivrost.PROJECTION_EQUIRECTANGULAR] shorthand to set projection in media
	 * @param {string=} [stereoscopy=Bivrost.STEREOSCOPY_MONO] shorthand to set stereoscopy in media
	 * @param {string=} [source=Bivrost.SOURCE_AUTODETECT_FROM_EXT] shorthand to set source type in media
	 * @param {boolean=} [loop=false] shorthand to set looping in media
	 * @param {boolean=} [autoplay=true] should the media play automaticly
	 */
	Bivrost.Player=function(container, url, projection, stereoscopy, source, loop, autoplay) {
		/**
		 * @type {Bivrost.Player}
		 */
		var thisRef=this;
		autoplay=typeof(autoplay) === "undefined" ? true : autoplay;
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
		container.classList.add("bivrost-player");
		container.bivrost=this;
			
		
		// input
		this.input=new Bivrost.Input(this, container, Math.PI/2);
		this.input.registerShortcut(["+", "="], function() { thisRef.view.zoom/=0.95; });
		this.input.registerShortcut("-", function() { thisRef.view.zoom*=0.95; });
		this.input.registerShortcut("[", function() { thisRef.media.time-=5; });
		this.input.registerShortcut("]", function() { thisRef.media.time+=5; });
		this.input.registerShortcut(" ", function() { thisRef.media.pauseToggle(); });
		this.input.registerShortcut(["f", "F"], function() { thisRef.fullscreen=!thisRef.fullscreen; });
		this.input.registerShortcut(["v", "V"], function() { thisRef.vrModeEnterOrCycle(); });
		// TODO: s - toggle stereoscopy mode
		// TODO: i - show media info
		// TODO: w: media.width--;
		// TODO: W: media.width++;
		// TODO: h: media.height--;
		// TODO: H: media.height++;
		// TODO: x: media.woffset--;
		// TODO: X: media.woffset++;
		// TODO: y: media.hoffset--;
		// TODO: Y: media.hoffset++;
		
		
		// fullscreen
		container.addEventListener("dblclick", function() { thisRef.fullscreen=!thisRef.fullscreen; });
		var onFullscreenChange=function() { thisRef._onFullscreenChange(); };
		document.addEventListener("fullscreenchange", onFullscreenChange);
		document.addEventListener("webkitfullscreenchange", onFullscreenChange);
		document.addEventListener("mozfullscreenchange", onFullscreenChange);
		document.addEventListener("MSFullscreenChange", onFullscreenChange);
		
				
		// renderer
		this.webglRenderer=new THREE.WebGLRenderer({ antialias: true });
		this.webglRenderer.setClearColor(0x000000, 1);	// iOS doesn't have this set up as proper default
		container.appendChild(this.webglRenderer.domElement);		

		this.renderer = new Bivrost.Renderer.Mono();

		
		
		// resize handling
		// http://stackoverflow.com/a/14139497/785171
		var resizeBound=this.resize.bind(this);
		window.addEventListener("resize", resizeBound);
		this.resize();
//		setInterval(resizeBound, 100);

		
		// load media if provided
		if(url) {
			var mediaConstructor;
			if(source !== Bivrost.SOURCE_AUTODETECT)
				mediaConstructor = Bivrost.Media.store.require(source);
			else
				mediaConstructor = Bivrost.Media.mediaConstructorFromFilename(Object.keys(url)[0]);
			this.media_loading=new mediaConstructor(url, this.setMedia.bind(this), projection, stereoscopy, loop);
		}
		

		
		// Main loop, executed every frame
		var clock=new THREE.Clock();
		function mainloopBound() {
			var dt=clock.getDelta();
			thisRef.mainLoop(dt);
			requestAnimationFrame(mainloopBound);
		};
		requestAnimationFrame(mainloopBound);
	};

	
	Bivrost.Player.prototype.mainLoop = function(dt) {
		this.input.update(dt);

		try {
			if(this.view && this.renderer) {
				this.view.updateRotation(this.input.lookQuaternion);
				this.renderer.render(this.webglRenderer, this.view);
			}
			else {
//				log("waiting for init...");
			}
		}
		catch(e) {
			if(window.DOMException && e instanceof DOMException && window.console && console.error && e.code === 18) {
				console.error("Cross origin (CORS) error, try to add the header 'Access-Control-Allow-Origin: *' on your server. See http://enable-cors.org/ for more info.");
			}
			throw e;
		}
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
	 * @private
	 */
	Bivrost.Player.prototype._ui=null;
	Object.defineProperty(Bivrost.Player.prototype, "ui", {
		get: function() { return this._ui; },
		set: function(value) {
			if(this._ui && value && value.__super__ === this.__super__) {
				log("warn: replacing UI with instance of itself");
			}
			
//			if(!value) { throw "UI required"; }
			if(this._ui)
				this._ui.dispose();
			this._ui=value;
			if(this.media && value)
				this._ui.setMedia(this.media);
		}
	});

		
	
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
	Bivrost.Player.prototype.webglRenderer=null;
	
	
	/**
	 * @type {Bivrost.Renderer}
	 */
	Bivrost.Player.prototype._renderer=null;
	
	/**
	 * Change VR mode
	 * @property {BivrostRenderer} renderer
	 * @name Bivrost.Player#renderer
	 * @member {string} renderer
	 * @memberOf Bivrost.Player
	 */
	Object.defineProperty(Bivrost.Player.prototype, "renderer", {
		get: function() { return this._renderer; },
		set: function(value) {
			if(this._renderer === value)
				return;

			log("changed renderer", value);
			if(this.onRendererChange)
				this.onRendererChange(this._renderer, value);
			
			if(this._renderer)
				this._renderer.destroy(this);
			
			this._renderer=value;
			
			this._renderer.init(this);
			
			this.resize();
		}
	});

	/**
	 * @type {function(BivrostRenderer? old, BivrostRenderer new)?}
	 */
	Bivrost.Player.prototype.onRendererChange=null;

	
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
		if(this.autoplay) {
			media.play();
		}
	};
		
		
	/**
	 * Updates the size of the player window to current fullscreen and stylesheet settings
	 * @private
	 */
	Bivrost.Player.prototype.resize=function() {
		var width=this.container.offsetWidth;
		var height=this.container.offsetHeight;
		
		log("resize", {
			"fullscreen:": this.fullscreen,
			"container size:": width+"x"+height,
			"window size:": window.innerWidth+"x"+window.innerHeight
		});

		if(this.fullscreen)
			delete this.container.style.height;

		if(height === 0) {
			log("guess height from w=", width, "and aspect=", this.aspect);
			height=width/this.aspect;
			this.container.style.height=height+"px";
		}

		// update values after css changes
		width=this.container.offsetWidth;
		height=this.container.offsetHeight;

		this.webglRenderer.setSize(width, height, true);
		this.aspect=width/height;
		if(this.view)
			this.view.aspect=this.aspect;
	};


	/**
	 * Default aspect ratio for render window 
	 * @type {number}
	 */
	Bivrost.Player.prototype.aspect=4/3;


	
	/**
	 * Turn on fullscreen+VR mode. If already in VR, switch between VR modes.
	 */
	Bivrost.Player.prototype.vrModeEnterOrCycle=function() {
		var player=this;
		var vrModes=[
			Bivrost.Renderer.WebVR,
			Bivrost.Renderer.Stereo
		].filter(function(r) { return r.shouldWork(player); });
		
		if(vrModes.length === 0)
			throw "VR mode not supported";
		
		var vrMode;
		// not in fullscreen - start with first supported mode
		if(this.renderer instanceof Bivrost.Renderer.Mono) {
			vrMode=vrModes[0];
			log("selecting default VR mode");
		}
		// already in vr mode - toggle next available mode
		else {
			var index=(vrModes.indexOf(this.renderer.__proto__) + 1) % vrModes.length;
			vrMode=vrModes[index];
			log("selecting next VR mode");
		}
		
		this.renderer=new vrMode(this);
	};

	
	/**
	 * Returns to mono mode
	 */
	Bivrost.Player.prototype.vrExit=function() {
		this.renderer=new Bivrost.Renderer.Mono(this);
	};


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
	 * @member {boolean} fullscreen
	 * @memberOf Bivrost.Player#
	 */
	Object.defineProperty(Bivrost.Player.prototype, "fullscreen", {
		get: function() { return this._fullscreen; },
		set: function(value) {
			// all logic that should happen after fullscreen 
			// goes into _onFullscreenChange handler
			
			if(value === this.fullscreen) // ignore if no change
				return;
			
			var elem=this.container;
			
			if(value) {	// turn on

				if(!this._sizeBeforeFullscreen)
					this._sizeBeforeFullscreen=[elem.offsetWidth, elem.offsetHeight];
				log("fullscreen enter, stored size", this._sizeBeforeFullscreen);
				
				var fsCallback=(
					elem.requestFullscreen 
					|| elem.msRequestFullscreen 
					|| elem.mozRequestFullScreen
					|| elem.webkitRequestFullscreen
				);
				if(fsCallback) {
					fsCallback.call(elem);
				}
				else {
					log("IOS FULLSCREEN ENTER", elem);
					elem.classList.add("bivrost-ios-fullscreen");
					this._onFullscreenChange(true);
				}
					
			}
			else { // turn off
				var fsExitCallback=(
					document.exitFullscreen
					|| document.mozCancelFullScreen 
					|| document.webkitExitFullscreen 
					|| document.msExitFullscreen 
				);
				if(fsExitCallback) {
					fsExitCallback.call(document);
				}
				else {
					log("IOS FULLSCREEN EXIT", elem);
					elem.classList.remove("bivrost-ios-fullscreen");
					this._onFullscreenChange(false);
				}
			}
		}
	});
	
	
	/**
	 * Event handler for managing full screen changes
	 * @param {?force} force fullscreen state
	 * @private
	 */
	Bivrost.Player.prototype._onFullscreenChange=function(force) {
		this._fullscreen=(
			document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullscreenElement
		) === this.container;

		if(typeof(force) !== "undefined") {
			this._fullscreen=force;
		}
		
		// log("FULLSCREEN CHANGE: ", this._fullscreen);

		if(this.fullscreen && typeof(chrome) !== "undefined" && typeof(chrome.power) !== "undefined" && typeof(chrome.power.requestKeepAwake) !== "undefined") {
			log("chrome device management active");
			chrome.power.requestKeepAwake("display");
		}
		if(!this.fullscreen && typeof(chrome) !== "undefined" && typeof(chrome.power) !== "undefined" && typeof(chrome.power.releaseKeepAwake) !== "undefined") {
			log("chrome device management inactive");
			chrome.power.release();
		}

		if(!this.fullscreen && this._sizeBeforeFullscreen) {
			log("fullscreen exit, resize to", this._sizeBeforeFullscreen);
			this.webglRenderer.setSize(this._sizeBeforeFullscreen[0], this._sizeBeforeFullscreen[1], true);
		}
		
		if(this.renderer)
			this.renderer.fullscreenChanged(this._fullscreen);

		setTimeout(this.resize.bind(this), 0);
	};
		
	/// } END REGION
	
//	Bivrost.Player.prototype.dispose=function() {
//		// TODO: media.dispose
//	};
		
})();