/* global Bivrost, THREE */
"use strict";

(function() {
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.VideoMedia", arguments); };


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
	 * @param {boolean} [loop=false]
	 */
	Bivrost.VideoMedia = function(url, onload, projection, stereoscopy, loop) {
		Bivrost.Media.call(this, url, onload, projection, stereoscopy, Bivrost.SOURCE_VIDEO, loop);
		
		var thisRef = this;
		

		this.title="video:"+Object.keys(url).join("/");
		log("video loading", Object.keys(url));

		var video=document.createElement("video");
		this.video=video;

		video.setAttribute("width", "32");	// any number will be ok
		video.setAttribute("height", "32");	// any number will be ok
		video.setAttribute("crossOrigin", "anonymous");
		video.setAttribute("webkit-playsinline", "");
		video.setAttribute("playsinline", "");
		video.setAttribute("preload", "auto");
		// video.setAttribute("autoplay", "false");	// autoplay done in Bivrost.Player.setMedia
		this.loop = loop;

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

		video.addEventListener("ended", function(e) {
			thisRef.playbackStatusChange(false);
			if(thisRef._loopAfterEnd) {
				log("looping video");
				thisRef.play();	// will set playbackStatusChange to true
			}
			else {
				log("video ended");
			}
		});


		var videoLoadedDone=false;
		var videoLoaded=function(ev) {
			if(videoLoadedDone)
				return;
			videoLoadedDone=true;

			log("video loaded by event", ev.type);
			var texture = new THREE.VideoTexture(video);
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
	};

	Bivrost.extend(Bivrost.VideoMedia, Bivrost.Media);
	
	Bivrost.VideoMedia.extensions = ["mp4", "webm", "avi", "ogv", "ogg", "wmv"];
	
	Bivrost.Media.store.register(Bivrost.SOURCE_VIDEO, Bivrost.VideoMedia);

	
	Bivrost.VideoMedia.prototype._loopAfterEnd = false;
	Bivrost.VideoMedia.prototype._setLoop = function(value) {
		this._loopAfterEnd = value;
	};

	Bivrost.VideoMedia.prototype.play=function() { this.video.play(); this.playbackStatusChange(true); };
	Bivrost.VideoMedia.prototype.pause=function() { this.video.pause(); };
	Bivrost.VideoMedia.prototype._getPaused=function() { return this.video.paused; };
	
	Bivrost.VideoMedia.prototype._setTime=function(val) { this.video.currentTime=val; };
	Bivrost.VideoMedia.prototype._getTime=function() { return this.video.currentTime; };
	Bivrost.VideoMedia.prototype._getDuration=function() { return this.video.duration; };

})();