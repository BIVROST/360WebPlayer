/* global Bivrost, THREE, Hls */
"use strict";



/**
 * Guess media source from file extension (video or picture)
 * @type String
 */
Bivrost.SOURCE_AUTODETECT="autodetect";


/**
 * The source is a video
 * @type String
 */
Bivrost.SOURCE_VIDEO="video";


/**
 * The source is a picture
 * @type String
 */
Bivrost.SOURCE_PICTURE="picture";


/**
 * The source is a HLS stream
 * @type String
 */
Bivrost.SOURCE_STREAM_HLS="stream-hls";


/**
 * The source is an MPEG-DASH stream
 * @type String
 */
Bivrost.SOURCE_STREAM_DASH="stream-dash";


/**
 * The source is a HTML5 canvas element
 * @type String
 */
Bivrost.SOURCE_CANVAS="canvas"

/**
 * All available sources
 * @type Array<string>
 */
Bivrost.AVAILABLE_SOURCES=[
	Bivrost.SOURCE_AUTODETECT,
	Bivrost.SOURCE_VIDEO,
	Bivrost.SOURCE_PICTURE,
	Bivrost.SOURCE_STREAM_HLS,
	Bivrost.SOURCE_STREAM_DASH,
	Bivrost.SOURCE_CANVAS
];


(function() {

	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.Media", arguments); };


	/**
	 * Parametrless callback when a texture is loaded
	 * @callback Media.onloadCallback
	 */
	

	/**
	 * Loads a media (still or video), you might want to add an onload
	 * @constructor
	 * @class
	 * @param {string|object} url - url to the media, may be an 
	 *		object with the key being the url and the value being the
	 *		type or null.
	 * @param {onloadCallback} onload
	 * @param {string=} [projection=Bivrost.PROJECTION_EQUIRECTANGULAR]
	 * @param {string=} [stereoscopy=Bivrost.STEREOSCOPY_MONO]
	 * @param {string=} [source=Bivrost.SOURCE_AUTODETECT_FROM_EXT]
	 * @param {boolean} [loop=false]
	 */
	Bivrost.Media=function(url, onload, projection, stereoscopy, source, loop) {
		var thisRef=this;
		
		if(typeof url !== "object")
			url={url:null};
		this.url=url;
		
		if(arguments.length < 2)
			throw "url and onload required";
		this.onload=onload;
		
		this.projection=projection=projection || Bivrost.PROJECTION_EQUIRECTANGULAR;
		this.stereoscopy=stereoscopy=stereoscopy || Bivrost.STEREOSCOPY_AUTODETECT;
		
		// phase one autodetect - by keywords
		if(this.stereoscopy === Bivrost.STEREOSCOPY_AUTODETECT) {
			var fn = Object.keys(url)[0];
			this.stereoscopy = Bivrost.Stereoscopy.detectByFilename(fn);
			log("detected stereoscopy from uri: ", Bivrost.reverseConstToName(thisRef.stereoscopy));
		}
	}

	// TODO:
	//	Bivrost.Media.prototype.width: 360,
	//	Bivrost.Media.prototype.height: 180,
	//	Bivrost.Media.prototype.hoffset: 0,
	//	Bivrost.Media.prototype.woffset: 0,


	Bivrost.Media.prototype.projection=Bivrost.PROJECTION_EQUIRECTANGULAR;


	Bivrost.Media.prototype.stereoscopy=Bivrost.STEREOSCOPY_AUTODETECT;


	Bivrost.Media.prototype.title=null;


	Bivrost.Media.prototype.texture=null;


	/**
	 * Null if this Media is a still
	 * @type {HTMLVideoElement}
	 */
	Bivrost.Media.prototype.video=null;


	Bivrost.Media.prototype.onload=function() {};


	Bivrost.Media.prototype.onprogress=function(progress01) {
		log(this, "progress", ~~(100*progress01)+"%");
	};


	Bivrost.Media.prototype.onerror=function(error) {
		throw error;
	};


	/**
	 * @param {THREE.Texture} texture
	 */
	Bivrost.Media.prototype.gotTexture=function(texture) {
		log("got texture: ", texture);

		this.texture=texture;
		// phase two autodetect - by size
		if(this.stereoscopy === Bivrost.STEREOSCOPY_AUTODETECT) {
			var w=texture.image.videoWidth || texture.image.width;
			var h=texture.image.videoHeight || texture.image.height;
			this.stereoscopy = Bivrost.Stereoscopy.detectByProperties(this, w, h);
			log("guessed stereoscopy from ratio: ", Bivrost.reverseConstToName(this.stereoscopy));
		}
		log("got texture", texture);
		this.onload(this);
		this.playbackStatusChange(true);
	};


	Bivrost.Media.prototype.play=function() { };
	Bivrost.Media.prototype.pause=function() { };
	Bivrost.Media.prototype.pauseToggle=function() { this.paused=!this.paused; };
	Object.defineProperty(Bivrost.Media.prototype, "paused", {
		get: function() { return this._getPaused(); },
		set: function(value) {
			if(this.paused === value)
				return;
			if(value)
				this.pause();
			else 
				this.play(); 
		}
	});
	Bivrost.Media.prototype._getPaused=function() { return true; };
	Bivrost.Media.prototype.rewind=function() { this.time=0; this.play(); };

	Bivrost.Media.prototype._getTime=function() { return -1; };
	Bivrost.Media.prototype._setTime=function() {};
	Object.defineProperty(Bivrost.Media.prototype, "time", {
		get: function() {return this._getTime();},
		set: function(value) {this._setTime(value);}
	});

	Bivrost.Media.prototype._getLoop=function() { return false; };
	Bivrost.Media.prototype._setLoop=function() {};
	Object.defineProperty(Bivrost.Media.prototype, "loop", {
		get: function() {return this._getLoop();},
		set: function(value) {this._setLoop(value);}
	});

	/**
	 * Called when media is loaded/started (true) or ended(false) or will loop (first false, then true)
	 * @type {?function(BIVROST.Media media, bool playing)}
	 */
	Bivrost.Media.prototype.onPlaybackStatusChange = null;

	/**
	 * @private
	 */
	Bivrost.Media.prototype.playbackStatus = false;

	/**
	 * @protected
	 */
	Bivrost.Media.prototype.playbackStatusChange = function(playing) {
		if(this.playbackStatus === playing) {
			return;
		}
		this.playbackStatus = playing;
		if(this.onPlaybackStatusChange) {
			this.onPlaybackStatusChange(this, playing);
		}
	}

	/**
	 * Called when media has ended 
	 * @type {?function(BIVROST.Media media)}
	 */
	Bivrost.Media.prototype.onMediaEnd = null;


	Bivrost.Media.prototype._getDuration=function() { return 0; },
	Object.defineProperty(Bivrost.Media.prototype, "duration", {
		get: function() { return this._getDuration(); }
	});
	
	Bivrost.Media.prototype.url=null;
	
	
	
	Bivrost.Media.prototype.getBivrostProtocolURI=function() {
		var urls=[];
		for(var url in this.url) {
			if(this.url.hasOwnProperty(url)) {
				var img = document.createElement('img');
				img.src = url;
				url = img.src;
				img.src = null;
				urls.push(url);
			}
		}

		var protocol="bivrost:"+encodeURIComponent(urls.pop(url));
		var args="";
		var arg=function(name, value) { 
			args+=(args === "") ? "?" : "&";
			args+=encodeURIComponent(name)+"="+encodeURIComponent(value);
		};
		urls.forEach(function(e,i) { arg("alt"+(i || ""), e); });
		arg("version", Bivrost.version);
		arg("stereoscopy", this.stereoscopy);
		arg("projection", this.projection);
//		arg("autoplay", this.player.autoplay);
		arg("loop", this.loop);
		return "http://tools.bivrost360.com/open-in-native/" + "#" + encodeURI(protocol+args);
	};
	
	

	
	/**
	 * @static
	 */
	Bivrost.Media.store = new Bivrost.Store("media source");
	
	
	/**
	 * @param {string} filename
	 * @static
	 * @returns {function}
	 */
	Bivrost.Media.mediaConstructorFromFilename=function(filename) {
		var ext=(/\.([a-zA-Z0-9]+)$/.exec(filename) || ["", ""])[1].toLowerCase();
		var mediaConstructor = Bivrost.Media.store.find( function(o) {
			return o.extensions.indexOf(ext) >= 0;
		});
		if(!mediaConstructor) {
			log("unknown extension during autodetect: "+ext+", hoping it's video...");
			mediaConstructor = Bivrost.Media.store.get(Bivrost.SOURCE_VIDEO);
		}
		return mediaConstructor;
	};

})();