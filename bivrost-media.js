/* global Bivrost, THREE */
"use strict";


/**
 * Media will be projected on a sphere (also called equirectangular, spherical mercator)
 * @type String
 */
Bivrost.PROJECTION_EQUIRECTANGULAR="equirectangular";


// TODO:
///**
// * Media will be projected on a quad (resembling a picture frame)
// * @type String
// */
//Bivrost.PROJECTION_FRAME="frame";


/**
 * All available projections
 * @type Array
 */
Bivrost.AVAILABLE_PROJECTIONS=[
	Bivrost.PROJECTION_EQUIRECTANGULAR
//	Bivrost.PROJECTION_FRAME
];


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
 * All available sources
 * @type Array<string>
 */
Bivrost.AVAILABLE_SOURCES=[
	Bivrost.SOURCE_AUTODETECT,
	Bivrost.SOURCE_VIDEO,
	Bivrost.SOURCE_PICTURE
];


/**
 * Autodetect stereoscopy by keywords and size
 * @type Number
 */
Bivrost.STEREOSCOPY_AUTODETECT="autodetect";


/**
 * Mono, no stereoscopy, default
 * keyword: mono
 * @type Number
 */
Bivrost.STEREOSCOPY_MONO="mono";


/**
 * Top and Bottom stereoscopy
 * Left frame is top half, right is bottom
 * keyword: TaB, TB
 * @type Number
 */
Bivrost.STEREOSCOPY_TOP_AND_BOTTOM="top-and-bottom";


/**
 * Side by side stereoscopy
 * keyword: SbS, LR
 * @type Number
 */
Bivrost.STEREOSCOPY_SIDE_BY_SIDE="side-by-side";


/**
 * Top and Bottom stereoscopy, reversed
 * Right frame is top half, left is bottom
 * @type Number
 */
Bivrost.STEREOSCOPY_TOP_AND_BOTTOM_REVERSED="top-and-bottom-reversed";


/**
 * All available stereoscopy types
 * @type Array
 */
Bivrost.AVAILABLE_STEREOSCOPIES=[
	Bivrost.STEREOSCOPY_AUTODETECT,
	Bivrost.STEREOSCOPY_MONO,
	Bivrost.STEREOSCOPY_SIDE_BY_SIDE,
	Bivrost.STEREOSCOPY_TOP_AND_BOTTOM,
	Bivrost.STEREOSCOPY_TOP_AND_BOTTOM_REVERSED
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
		var that=this;
		
		if(typeof url !== "object")
			url={url:null};
		this.url=url;
		
		if(arguments.length < 2)
			throw "url and onload required";
		this.onload=onload;
		
		this.projection=projection=projection || Bivrost.PROJECTION_EQUIRECTANGULAR;
		this.stereoscopy=stereoscopy=stereoscopy || Bivrost.STEREOSCOPY_AUTODETECT;
		
		if(!source || source === Bivrost.SOURCE_AUTODETECT) {
			source=(/\.(jpe?g|png|bmp|tiff|gif)$/i.test(Object.keys(url)[0]))
				?Bivrost.SOURCE_PICTURE
				:Bivrost.SOURCE_VIDEO;
			log("detected source: "+Bivrost.reverseConstToName(source));
		}
		
		switch(source) {
			case Bivrost.SOURCE_PICTURE:
				if(Object.keys(url).length !== 1)
					throw "still supports only one url at this time";
				this.title="still:"+Object.keys(url)[0];
				log("still loading", url);
				
				var loader=new THREE.TextureLoader();
				loader.load(
					Object.keys(url)[0],
					function(texture) {
						log("still loaded", that);
						texture.name=that.title;
						that.gotTexture(texture);
					},
					function(xhr) {
						that.onprogress(xhr.loaded/xhr.total);
					},
					this.onerror
				);
				break;
				
			case Bivrost.SOURCE_VIDEO:
				this.title="video:"+Object.keys(url).join("/");
				log("video loading", url);
				
				var video=this.video=document.createElement("video");
				video.setAttribute("width", "32");	// any number will be ok
				video.setAttribute("height", "32");	// any number will be ok
				video.setAttribute("loop", JSON.stringify(!!loop));
				// video.setAttribute("autoplay", "false");	// autoplay done in Bivrost.Player.setMedia
				this._setLoop=function(value) { video.setAttribute("loop", JSON.stringify(!!value)); };

				this.play=function() { video.play(); };
				this.pause=function() { video.pause(); };
				this.pauseToggle=function() {
					if(video.paused)
						video.play();
					else
						video.pause();
				};
				this._setTime=function(val) {video.currentTime=val;};
				this._getTime=function() {return video.currentTime;};
				this._getDuration=function() {return video.duration;};

//				["loadstart", "progress", "suspend", "abort", "error", "emptied", "stalled", "loadedmetadata", "loadeddata", "canplay", 
//				"canplaythrough", "playing", "waiting", "seeking", "seeked", "ended", "durationchange", "timeupdate", "play", "pause", 
//				"ratechange", "resize", "volumechange"].forEach(function(n) {
//					video.addEventListener(n, console.log.bind(console, "event:"+n));
//				});

				video.addEventListener("error", function(e) {
					var description={
						"-1": "unknown",
						"1": "MEDIA_ERR_ABORTED - fetching process aborted by user",
						"2": "MEDIA_ERR_NETWORK - error occurred when downloading",
						"3": "MEDIA_ERR_DECODE - error occurred when decoding",
						"4": "MEDIA_ERR_SRC_NOT_SUPPORTED - audio/video not supported"
					}[(video.error || {code:-1}) && video.error.code];
					console.error("error: ", description);
					that.onerror(description);
				})
;
				video.addEventListener("loadeddata", function() {
					log("video loaded", this, arguments);
					var texture = new THREE.VideoTexture(video);
					texture.name=that.title;
					texture.minFilter = THREE.LinearFilter;
					texture.magFilter = THREE.LinearFilter;
					that.gotTexture(texture);
				});
				
				console.log("video.readyState", video.readyState);

				// last to prevent event before load
				Object.keys(url).forEach(function(e) {
					var sourceTag=document.createElement("source");
					sourceTag.setAttribute("src", e);
					if(url[e])
						sourceTag.setAttribute("type", url[e]);
					video.appendChild(sourceTag);
				});
				
				video.load();
				
				break;
				
			default:
				throw "unknown source type: "+source;
		}
		
		
		// phase one autodetect - by keywords
		if(this.stereoscopy === Bivrost.STEREOSCOPY_AUTODETECT) {
			if(/\b(SbS|LR)\b/.test(url))
				this.stereoscopy=Bivrost.STEREOSCOPY_SIDE_BY_SIDE;
			else if(/\b(TaB|TB)\b/.test(url))
				this.stereoscopy=Bivrost.STEREOSCOPY_TOP_AND_BOTTOM;
			else if(/\bmono\b/.test(url))
				this.stereoscopy=Bivrost.STEREOSCOPY_MONO;
			// else: detect in phase 2, by resolution
			log("detected stereoscopy from uri: ", Bivrost.reverseConstToName(this.stereoscopy));
		}
	};
	
	

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
			if(w === h)
				this.stereoscopy=Bivrost.STEREOSCOPY_TOP_AND_BOTTOM;
			if(w === h*4)
				this.stereoscopy=Bivrost.STEREOSCOPY_SIDE_BY_SIDE;
			else // if(w === 2*h)
				this.stereoscopy=Bivrost.STEREOSCOPY_MONO;

			// TODO: guess frame
			log("guessed stereoscopy from ratio: ", Bivrost.reverseConstToName(this.stereoscopy));
		}
		log("got texture", texture);
		this.onload(this);
	},


	Bivrost.Media.prototype.play=function() {};
	Bivrost.Media.prototype.pause=function() {};
	Bivrost.Media.prototype.pauseToggle=function() {};
	Bivrost.Media.prototype.rewind=function() { this.time=0; this.play(); };

	Bivrost.Media.prototype._getTime=function() { return -1; };
	Bivrost.Media.prototype._setTime=function() {};
	Object.defineProperty(Bivrost.Media.prototype, "time", {
		get: function() {return this._getTime();},
		set: function(value) {this._setTime(value);},
	});

	Bivrost.Media.prototype._getLoop=function() { return false; };
	Bivrost.Media.prototype._setLoop=function() {};
	Object.defineProperty(Bivrost.Media.prototype, "loop", {
		get: function() {return this._getLoop();},
		set: function(value) {this._setLoop(value);},
	});

	Bivrost.Media.prototype._getDuration=function() { return 0; },
	Object.defineProperty(Bivrost.Media.prototype, "duration", {
		get: function() { return this._getDuration(); }
	});
	
	Bivrost.Media.prototype.url=null;
	
})();