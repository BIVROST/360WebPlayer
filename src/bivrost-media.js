/* global Bivrost, THREE, Hls */
"use strict";


/**
 * Media will be projected on a sphere (also called equirectangular, spherical mercator)
 * @type String
 */
Bivrost.PROJECTION_EQUIRECTANGULAR="equirectangular";


/**
 * Cubemap, all faces in one row
 * @type String
 */
Bivrost.PROJECTION_CUBEMAP="cubemap";


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
	Bivrost.PROJECTION_EQUIRECTANGULAR,
	Bivrost.PROJECTION_CUBEMAP
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
 * All available sources
 * @type Array<string>
 */
Bivrost.AVAILABLE_SOURCES=[
	Bivrost.SOURCE_AUTODETECT,
	Bivrost.SOURCE_VIDEO,
	Bivrost.SOURCE_PICTURE,
	Bivrost.SOURCE_STREAM_HLS,
	Bivrost.SOURCE_STREAM_DASH
];


/**
 * Autodetect stereoscopy by keywords and size
 * @type string
 */
Bivrost.STEREOSCOPY_AUTODETECT="autodetect";


/**
 * Mono, no stereoscopy, default
 * keyword: mono
 * @type string
 */
Bivrost.STEREOSCOPY_MONO="mono";


/**
 * Top and Bottom stereoscopy
 * Left frame is top half, right is bottom
 * keyword: TaB, TB
 * @type string
 */
Bivrost.STEREOSCOPY_TOP_AND_BOTTOM="top-and-bottom";


/**
 * Side by side stereoscopy
 * keyword: SbS, LR
 * @type string
 */
Bivrost.STEREOSCOPY_SIDE_BY_SIDE="side-by-side";


/**
 * Side by side stereoscopy, reversed (left eye on the right, right on the left)
 * @type string
 */
Bivrost.STEREOSCOPY_SIDE_BY_SIDE_REVERSED="side-by-side-reversed";


/**
 * Top and Bottom stereoscopy, reversed
 * Right frame is top half, left is bottom
 * @type string
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
	Bivrost.STEREOSCOPY_SIDE_BY_SIDE_REVERSED,
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
		var thisRef=this;
		
		if(typeof url !== "object")
			url={url:null};
		this.url=url;
		
		if(arguments.length < 2)
			throw "url and onload required";
		this.onload=onload;
		
		this.projection=projection=projection || Bivrost.PROJECTION_EQUIRECTANGULAR;
		this.stereoscopy=stereoscopy=stereoscopy || Bivrost.STEREOSCOPY_AUTODETECT;
		
		if(!source || source === Bivrost.SOURCE_AUTODETECT) {
			var ext=(/\.([a-zA-Z0-9]+)$/.exec(Object.keys(url)[0]) || ["", ""])[1].toLowerCase();
			switch(ext) {
				case "jpeg":
				case "jpg":
				case "png":
				case "tiff":
				case "gif":
				case "bmp":
					source=Bivrost.SOURCE_PICTURE;
					break;
					
				case "mp4":
				case "webm":
				case "avi":
				case "ogv":
				case "ogg":
				case "wmv":
					source=Bivrost.SOURCE_VIDEO;
					break;
					
				case "m3u":
				case "m3u8":
					source=Bivrost.SOURCE_STREAM_HLS;
					break;
					
				case "mpd":
					source=Bivrost.SOURCE_STREAM_DASH;
					break;
					
				default:
					log("unknown extension during autodetect: "+ext+", hoping it's video...");
					source=Bivrost.SOURCE_VIDEO;
					break;
			}
			log("detected source: "+Bivrost.reverseConstToName(source));
		}
		
		switch(source) {
			case Bivrost.SOURCE_PICTURE:
				if(Object.keys(url).length !== 1)
					throw "picture supports only one url at this time";
				this.title="picture:"+Object.keys(url)[0];
				log("picture loading", url);
				
				var loader=new THREE.TextureLoader();
				loader.setCrossOrigin("anonymous");
				loader.load(
					Object.keys(url)[0],
					function(texture) {
						log("still loaded", thisRef);
						texture.name=thisRef.title;
//						texture.minFilter=THREE.LinearMipMapLinearFilter;
//						texture.magFilter=THREE.LinearMipMapLinearFilter;
						texture.anisotropy=16;
						thisRef.gotTexture(texture);
					},
					function(xhr) {
						thisRef.onprogress(xhr.loaded/xhr.total);
					},
					this.onerror
				);
				break;
				
			case Bivrost.SOURCE_VIDEO:
				this.title="video:"+Object.keys(url).join("/");
				log("video loading", Object.keys(url));
					
				var video=document.createElement("video");
				this.video=video;
				video.setAttribute("width", "32");	// any number will be ok
				video.setAttribute("height", "32");	// any number will be ok
				video.setAttribute("crossOrigin", "anonymous");
				if(loop)
					video.setAttribute("loop", "true");
				video.setAttribute("webkit-playsinline", "webkit-playsinline");
				// video.setAttribute("autoplay", "false");	// autoplay done in Bivrost.Player.setMedia
				this._setLoop=function(value) { 
					if(value)
						video.setAttribute("loop", "true");
					else
						video.removeAttribute("loop");
				};

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
					thisRef.onerror(description);
				});
				
				var videoLoadedDone=false;
				var videoLoaded=function(ev) {
					if(videoLoadedDone)
						return;
					videoLoadedDone=true;
					
					log("video loaded by event", ev.type);
					var texture = new THREE.IEVideoTexture(video);
					texture.name=thisRef.title;
					texture.minFilter = THREE.LinearFilter;
					texture.magFilter = THREE.LinearFilter;
					thisRef.gotTexture(texture);
				};

				video.addEventListener("loadeddata", videoLoaded);
				video.addEventListener("load", videoLoaded);
				video.addEventListener("canplay", videoLoaded);
				video.addEventListener("canplaythrough", videoLoaded);
				video.addEventListener("readystatechange", function(ev) {
					if(video.readyState > video.HAVE_CURRENT_DATA)
						videoLoaded(ev);
				});
				
				// last to prevent event before load
				Object.keys(url).forEach(function(e) {
					var sourceTag=document.createElement("source");
					sourceTag.setAttribute("src", e);
					if(url[e])
						sourceTag.setAttribute("type", url[e]);
					video.appendChild(sourceTag);
				});

				video.load();

				if(video.readyState > video.HAVE_CURRENT_DATA)
					videoLoaded({type:"loaded-before"});
				
				break;
				
				
			case Bivrost.SOURCE_STREAM_HLS:
				if(!window.Hls)
					throw "HLS streaming requires an external library HLS.js, please add https://github.com/dailymotion/hls.js"
				// TODO: add native HLS as an alternative?
				
				this.title="stream:"+Object.keys(url).join("/");
				var firstUrl=Object.keys(url)[0];
				log("hls stream loading", firstUrl);
					
				var video;
				video=this.video=document.createElement("video");
				video.setAttribute("width", "800");	// any number will be ok
				video.setAttribute("height", "400");	// any number will be ok
				video.setAttribute("webkit-playsinline", "webkit-playsinline");
				// video.setAttribute("autoplay", "false");	// autoplay done in Bivrost.Player.setMedia

				// document.body.appendChild(video);

				this.play=function() { video.play(); };
				this.pause=function() { video.pause(); };
				this.pauseToggle=function() {
					if(video.paused)
						video.play();
					else
						video.pause();
				};
				this._setTime=function(val) { throw "setting time in streams is not supported"; };
				this._getTime=function() { return video.currentTime; };
				this._getDuration=function() { return Infinity; };

				var hls=new Hls({debug:Bivrost.verbose?log:false});
				this.hls=hls;
				hls.attachMedia(video);
				var videoLoadedDone=false;
				hls.on(Hls.Events.MEDIA_ATTACHED, function() {
					log("HLS MEDIA_ATTACHED");
					hls.loadSource(firstUrl);
					hls.on(Hls.Events.MANIFEST_PARSED, function(e,d) {
						log("HLS MANIFEST_PARSED", d);
						
						if(videoLoadedDone)
							return;
						videoLoadedDone=true;
						log("video loaded by HLS manifest parse");
						var texture = new THREE.IEVideoTexture(video);
						texture.name=thisRef.title;
						texture.minFilter = THREE.LinearFilter;
						texture.magFilter = THREE.LinearFilter;
						thisRef.gotTexture(texture);
						video.play();
					});
				});
				
				hls.on(Hls.Events.ERROR,function(event,data) {
					log(data.fatal?"HLS fatal error":"HLS recoverable error:", data.type, "details=", data.details);
					if(data.fatal) {	// try to recover
						switch(data.type) {
							case Hls.ErrorTypes.NETWORK_ERROR:
								log("HLS trying to recover NETWORK_ERROR...");
								hls.startLoad();
								break;
							case Hls.ErrorTypes.MEDIA_ERROR:
								log("HLS trying to recover MEDIA_ERROR...");
								hls.recoverMediaError();
								break;
							default:
								log("HLS unrecoverable error, stopping HLS");
								thisRef.onerror("HLS unrecoverable error: "+data.details);
								hls.destroy();
								break;
						}
					}
				});

				break;
			
			
			case Bivrost.SOURCE_STREAM_DASH:
				throw "MPEG-DASH not yet implemented";
				
				
			default:
				throw "unknown source type: "+source;
		}
		
		
		// phase one autodetect - by keywords
		Object.keys(url).forEach(function(url) {
			if(thisRef.stereoscopy === Bivrost.STEREOSCOPY_AUTODETECT) {
				if(/\b(SbS|LR)\b/.test(url))
					thisRef.stereoscopy=Bivrost.STEREOSCOPY_SIDE_BY_SIDE;
				else if(/\b(TaB|TB)\b/.test(url))
					thisRef.stereoscopy=Bivrost.STEREOSCOPY_TOP_AND_BOTTOM;
				else if(/\bmono\b/.test(url))
					thisRef.stereoscopy=Bivrost.STEREOSCOPY_MONO;
				// else: detect in phase 2, by resolution
				log("detected stereoscopy from uri: ", Bivrost.reverseConstToName(thisRef.stereoscopy));
			}
		});
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
	};


	Bivrost.Media.prototype.play=function() {};
	Bivrost.Media.prototype.pause=function() {};
	Bivrost.Media.prototype.pauseToggle=function() {};
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

	Bivrost.Media.prototype._getDuration=function() { return 0; },
	Object.defineProperty(Bivrost.Media.prototype, "duration", {
		get: function() { return this._getDuration(); }
	});
	
	Bivrost.Media.prototype.url=null;
	
})();