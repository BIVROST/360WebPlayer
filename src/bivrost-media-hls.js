/* global Bivrost, THREE */
"use strict";

(function() {
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.HLSMedia", arguments); };


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
	Bivrost.HLSMedia = function(url, onload, projection, stereoscopy, loop) {
		// NOTE: This is thrown even if native HLS is available and HLS.js is not used.
		//       Better this way, than to fail in production.
		if(!window.Hls)
			throw "HLS streaming requires an external library HLS.js, please add https://github.com/dailymotion/hls.js"
			
		var thisRef = this;
		


		// TODO: add native HLS as an alternative?

		this.title="stream:"+Object.keys(url).join("/");
		var firstUrl=Object.keys(url)[0];
		log("hls stream loading", firstUrl);

		// video.setAttribute("autoplay", "false");	// autoplay done in Bivrost.Player.setMedia

		// document.body.appendChild(video);

		var nativeHLS = (function() { 
			var tempVideo = document.createElement("video");
			return Boolean(tempVideo.canPlayType('application/vnd.apple.mpegURL') || video.canPlayType('audio/mpegurl'));
		})();

		if (nativeHLS) {
			log("Using native HLS");
			Bivrost.VideoMedia.call(this, url, onload, projection, stereoscopy, Bivrost.SOURCE_VIDEO, loop);
			return;
		}

		log("Using HLS.js")
		Bivrost.Media.call(this, url, onload, projection, stereoscopy, Bivrost.SOURCE_VIDEO, loop);

		var video;
		video=document.createElement("video");
		video.setAttribute("width", "800");	// any number will be ok
		video.setAttribute("height", "400");	// any number will be ok
		video.setAttribute("webkit-playsinline", "webkit-playsinline");

		var hls=new Hls({debug:Bivrost.verbose?log:false});
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
		
		this.video=video;
		this.hls=hls;
	};

	Bivrost.extend(Bivrost.HLSMedia, Bivrost.Media);
	
	Bivrost.HLSMedia.extensions = ["m3u", "m3u8"];
	
	Bivrost.Media.store.register(Bivrost.SOURCE_STREAM_HLS, Bivrost.HLSMedia);
	
	
	/**
	 * @type {HTMLVideoElement}
	 */
	Bivrost.HLSMedia.prototype.video = null;
	
	
	/**
	 * @type {?HLS}
	 * can be null if native HLS is used
	 */
	Bivrost.HLSMedia.prototype.hls = null;
	
	Bivrost.HLSMedia.prototype._setLoop = function(value) {
		if(value)
			this.video.setAttribute("loop", "true");
		else
			this.video.removeAttribute("loop");
	};

	Bivrost.HLSMedia.prototype.play=function() { this.video.play(); };
	Bivrost.HLSMedia.prototype.pause=function() { this.video.pause(); };
	Bivrost.HLSMedia.prototype._getPaused=function() { return this.video.paused; };
	
	
	Bivrost.HLSMedia.prototype._setTime=function(val) { throw "setting time in streams is not supported"; };
	Bivrost.HLSMedia.prototype._getTime=function() { return this.video.currentTime; };
	Bivrost.HLSMedia.prototype._getDuration=function() { return 1/0; };

})();