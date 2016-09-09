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
	
	
	Bivrost.Media.mediaConstructorFromFilename=function(filename) {
		switch(Bivrost.Media.detectFromFilename(filename)) {
			case Bivrost.SOURCE_PICTURE:
				return Bivrost.PictureMedia;
			case Bivrost.SOURCE_VIDEO:
				return Bivrost.VideoMedia;
			case Bivrost.SOURCE_STREAM_HLS:
				return Bivrost.HLSMedia;
			case Bivrost.SOURCE_STREAM_DASH:
				return Bivrost.Media;		// TODO
			default:
				throw "unknown constructor"
		}
	};




})();