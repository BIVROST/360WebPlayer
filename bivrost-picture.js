/* global Bivrost */

"use strict";

Bivrost.PROJECTION_EQUIRECTANGULAR=101;
Bivrost.PROJECTION_FRAME=102;

Bivrost.SOURCE_AUTODETECT=200;
Bivrost.SOURCE_VIDEO=201;
Bivrost.SOURCE_STILL=202;

/**
 * Autodetect stereoscopy by keywords and size
 * @type Number
 */
Bivrost.STEREOSCOPY_AUTODETECT=300;

/**
 * None, no stereoscopy, default
 * keyword: mono
 * @type Number
 */
Bivrost.STEREOSCOPY_NONE=301;

/**
 * Top and Bottom stereoscopy
 * Left frame is top half, right is bottom
 * keyword: TaB
 * @type Number
 */
Bivrost.STEREOSCOPY_TOP_AND_BOTTOM=302;

/**
 * Side by side stereoscopy
 * keyword: SbS
 * @type Number
 */
Bivrost.STEREOSCOPY_SIDE_BY_SIDE=303;

/**
 * Top and Bottom stereoscopy, reversed
 * Right frame is top half, left is bottom
 * @type Number
 */
Bivrost.STEREOSCOPY_TOP_AND_BOTTOM_REVERSED=304;


(function() {

	function log(/*vargs...*/) { if(Bivrost.verbose) console.log("[Bivrost.Picture] "+Array.prototype.join.call(arguments, " ")); };


	/**
	 * Parametrless callback when a texture is loaded
	 * @callback Picture.onloadCallback
	 */
	

	/**
	 * Loads a picture (still or video), you might want to add an onload
	 * @constructor
	 * @class
	 * @param {string|array<string>} url
	 * @param {onloadCallback} onload
	 * @param {number} [projection=Bivrost.PROJECTION_EQUIRECTANGULAR]
	 * @param {number} [stereoscopy=Bivrost.STEREOSCOPY_NONE]
	 * @param {number} [source=Bivrost.SOURCE_AUTODETECT_FROM_EXT]
	 * @returns {Bivrost.Picture}
	 */
	Bivrost.Picture=function(url, onload, projection, stereoscopy, source) {
		var that=this;
		
		if(typeof url !== "object")
			url=[url];
		
		if(arguments.length < 2)
			throw "url and onload required";
		this.onload=onload;
		
		this.projection=projection=projection || Bivrost.PROJECTION_EQUIRECTANGULAR;
		this.stereoscopy=stereoscopy=stereoscopy || Bivrost.STEREOSCOPY_AUTODETECT;
		
		if(!source || source === Bivrost.SOURCE_AUTODETECT) {
			source=(/\.(jpe?g|png|bmp|tiff|gif)$/i.test(url))
				?Bivrost.SOURCE_STILL
				:Bivrost.SOURCE_VIDEO;
			log("detected source: "+Bivrost.reverseConstToName(source));
		}
		
		switch(source) {
			case Bivrost.SOURCE_STILL:
				this.title="still:"+url;
				if(url.length !== 1)
					throw "still supports only one picture at this time";
				log("still loading", url);
				
				var loader=new THREE.TextureLoader();
				loader.load(
					url,
					function(texture) {
						log("still loaded", that);
						texture.name="still:"+url;
						that.gotTexture(texture);
					},
					function(xhr) {
						that.onprogress(xhr.loaded/xhr.total);
					},
					this.onerror
				);
				break;
				
			case Bivrost.SOURCE_VIDEO:
				this.title="video:"+url;
				log("video loading", url);
				
				var video=document.createElement("video");

				this.video=video;

				video.width=32;
				video.height=32;
				video.loop=false;	// TODO: config

				this.play=function() {video.play();};
				this.pause=function() {video.pause();};
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
				});

				video.addEventListener("loadeddata", function() {
					log("video loaded", this, arguments);
					var texture = new THREE.VideoTexture(video);
					texture.name="video:"+url;
					texture.minFilter = THREE.LinearFilter;
					texture.magFilter = THREE.LinearFilter;
					that.gotTexture(texture);
				});

				// last to prevent event before load
				url.forEach(function(e) {
					var sourceTag=document.createElement("source");
					sourceTag.src=e;
					video.appendChild(sourceTag);
				});
				
				break;
				
			default:
				throw "unknown source type: "+source;
		}	
		
		
		// phase one detect, by keywords
		if(this.stereoscopy === Bivrost.STEREOSCOPY_AUTODETECT) {
			if(/\b(SbS|LR)\b/.test(url))
				this.stereoscopy=Bivrost.STEREOSCOPY_SIDE_BY_SIDE;
			else if(/\b(TaB|TB)\b/.test(url))
				this.stereoscopy=Bivrost.STEREOSCOPY_TOP_AND_BOTTOM;
			else if(/\bmono\b/.test(url))
				this.stereoscopy=Bivrost.STEREOSCOPY_NONE;
			// else: detect in phase 2, by resolution
			log("detected stereoscopy from uri: ", Bivrost.reverseConstToName(this.stereoscopy));
		}
	};
	
	

	// TODO:
	//	Bivrost.Picture.prototype.width: 360,
	//	Bivrost.Picture.prototype.height: 180,
	//	Bivrost.Picture.prototype.hoffset: 0,
	//	Bivrost.Picture.prototype.woffset: 0,


	Bivrost.Picture.prototype.projection=Bivrost.PROJECTION_EQUIRECTANGULAR;


	Bivrost.Picture.prototype.stereoscopy=Bivrost.STEREOSCOPY_AUTODETECT;


	Bivrost.Picture.prototype.title=null;


	Bivrost.Picture.prototype.texture=null;


	/**
	 * Null if picture is a still
	 * @type {HTMLVideoElement}
	 */
	Bivrost.Picture.prototype.video=null;


	Bivrost.Picture.prototype.onload=function() {};


	Bivrost.Picture.prototype.onprogress=function(progress01) {
		log(this, "progress", ~~(100*progress01)+"%");
	};


	Bivrost.Picture.prototype.onerror=function(error) {
		throw error;
	};


	/**
	 * @param {THREE.Texture} texture
	 */
	Bivrost.Picture.prototype.gotTexture=function(texture) {
		log("got texture: ", texture);

		this.texture=texture;
		// phase two autodetect - by size
		if(this.stereoscopy === Bivrost.STEREOSCOPY_AUTODETECT) {
			var w=texture.image.videoWidth || texture.image.width;
			var h=texture.image.videoHeight || texture.image.height;
			if(w === h)
				this.stereoscopy=Bivrost.STEREOSCOPY_TOP_AND_BOTTOM;
			else // if(w === 2*h)
				this.stereoscopy=Bivrost.STEREOSCOPY_NONE;

			// TODO: guess frame
			log("guessed stereoscopy from ratio: ", Bivrost.reverseConstToName(this.stereoscopy));
		}
		log("got texture", texture);
		this.onload(this);
	},


	Bivrost.Picture.prototype.play=function() {};
	Bivrost.Picture.prototype.pause=function() {};
	Bivrost.Picture.prototype.pauseToggle=function() {};
	Bivrost.Picture.prototype.rewind=function() { this.time=0; this.play(); };

	Bivrost.Picture.prototype._getTime=function() { return -1; };
	Bivrost.Picture.prototype._setTime=function() {};
	Object.defineProperty(Bivrost.Picture.prototype, "time", {
		get: function() {return this._getTime();},
		set: function(value) {this._setTime(value);},
	});

	Bivrost.Picture.prototype._getDuration=function() { return 0; },
	Object.defineProperty(Bivrost.Picture.prototype, "duration", {
		get: function() { return this._getDuration(); }
	});
	
})();