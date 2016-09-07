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
		
		// autodetect source type
		if(!source || source === Bivrost.SOURCE_AUTODETECT) {
			source = Bivrost.Media.detectFromFilename(Object.keys(url)[0]);
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
			this.stereoscopy = Bivrost.Stereoscopy.detectByProperties(this, w, h);
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
	
	/**
	 * @static
	 * @param {string} filename
	 * @returns {String}
	 */
	Bivrost.Media.detectFromFilename=function(filename) {
		var ext=(/\.([a-zA-Z0-9]+)$/.exec(filename) || ["", ""])[1].toLowerCase();
		switch(ext) {
			case "jpeg":
			case "jpg":
			case "png":
			case "tiff":
			case "gif":
			case "bmp":
				return Bivrost.SOURCE_PICTURE;
				break;

			case "mp4":
			case "webm":
			case "avi":
			case "ogv":
			case "ogg":
			case "wmv":
				return Bivrost.SOURCE_VIDEO;
				break;

			case "m3u":
			case "m3u8":
				return Bivrost.SOURCE_STREAM_HLS;
				break;

			case "mpd":
				return Bivrost.SOURCE_STREAM_DASH;
				break;

			default:
				log("unknown extension during autodetect: "+ext+", hoping it's video...");
				return Bivrost.SOURCE_VIDEO;
				break;
		}
	};




})();