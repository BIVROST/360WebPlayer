/* global Bivrost */
"use strict";

(function(){

	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("█ Bivrost.Analytics", arguments); };


	/**
	 * Value of 1/PI
	 * @const
	 * @type Number
	 */
	var REV_PI = 1.0/Math.PI;
	
	
	/**
	 * Value of 1/2PI
	 * @const
	 * @type Number
	 */
	var REV_2PI = 0.5/Math.PI;


	/**
	 * Current implemented version of analytics
	 * @const
	 * @type String
	 */
	var BIVROST_VIDEOANALYTICS_VERSION = "0.20160905";


	/**
	 * BASE 64 lookup table
	 * @const
	 * @type String
	 */
	var base64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";


	function guid() {
		// https://stackoverflow.com/a/2117523/785171
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}


	/**
	 * @param {Bivrost.Player} player 
	 * @param {string} destinationURI 
	 * @param {number} frequency 
	 */
	Bivrost.Analytics = function(player, destinationURI, frequency) {
		player.analytics = this;

		var thisRef = this;
		player.onRendererChange = function(prev, next) {
			thisRef.setRenderer(next);
		}
		if(player.renderer) {
			this.setRenderer(player.renderer);
		}

		this.player = player;
		this.frequency = frequency;
		this.destinationURI = destinationURI;
		this.sessions = {};
	}


	/**
	 * @type {Bivrost.Player}
	 */
	Bivrost.Analytics.prototype.player = null;


	/**
	 * @type {number}
	 */
	Bivrost.Analytics.prototype.frequency = null;


	/**
	 * @type {string}
	 */
	Bivrost.Analytics.prototype.destinationURI = null;


	/// TODO: installationId
	Bivrost.Analytics.prototype.installationId = null;


	/// TODO: mediaID
	Bivrost.Analytics.prototype.mediaID = null;


	Bivrost.Analytics.prototype.sessions = null;


	/**
	 * @param {THREE.Euler} euler
	 * @param {number} fov
	 */
	Bivrost.Analytics.prototype.update = function(euler, fov, platform) {
		if(this.lastMedia !== this.player.media) {
			this.lastMedia = this.player.media;

				this.send();
			
			// Cleanup:
			this.sessions = {};

			if(!this.player.media || !this.player.media.video) {
				log("Analytics support only video media");
				this.enabled = false;
			}
			else if(this.player.media.duration <= 0) {
				log("Analytics support only video media with finite length (no livestreams)");
				this.enabled = false;
			}
			else {
				log("Media changed to ", this.player.media);
				this.enabled = true;
				var thisRef = this;
				this.player.media.onPlaybackStatusChange = function(media, st) {
					thisRef.enabled = st;

					if(!st) {
						log("Media source disabled");
						this.send();
					}

					// cleanup on new 
					if(st) {
						log("Media source enabled");
						this.sessions = {};
					}
				}
			}
			// TODO: unbind old video (useless until media switching functionality is implemented)
		}

		// Don't run when the media file is not compatible.
		// Compatible means it's a video with finite length.
		if(!this.enabled) {
			return;
		}

		// Don't measure when paused.
		if(this.player.media.video.paused) {
			return;
		}

		if(!this.sessions[platform]) {
			var mediaId=this.mediaID || "url:"+location.href;
			var uri=this.player.media.video.currentSrc;
			var lookprovider = "bivrost:360WebPlayer:" + platform;

			this.sessions[platform] = {
				"version": BIVROST_VIDEOANALYTICS_VERSION,
				"guid": guid(),
				"uri": uri,
				"sample_rate": this.frequency,
				"installation_id": this.installationId,
				"time_start": new Date(),
				// "time_end": (new Date()).toISOString(),
				"lookprovider": lookprovider,
				// "history": historySerialized,
				history: [],
				"media_id": mediaId
			};

			log("Created session for platform " + platform, this.sessions[platform]);
		}


		// Coordinate system starts in upper left corner of a virtual equirectangular projected texture
		// and both coordinates are to integer [0..63].
		var eulerYXZ = new THREE.Euler();
		eulerYXZ.copy(euler);
		eulerYXZ.reorder("YXZ");	//< this clears revolution information, so the modulo below is safe
		var yaw = (10.25 - eulerYXZ.y * REV_2PI) % 1;
		var pitch = (-eulerYXZ.x * REV_PI + 10.5) % 1;

		var time = this.player.media.time;
		var frame = ~~(time * this.frequency);	//< implicit Math.floor, so each frame except the last one lasts the same

		this.sessions[platform].history[frame]=[~~(64 * yaw), ~~(64 * pitch), fov];
		// log(frame, time, this.frequency);
		// log(yaw + "," + pitch +" "+fov);
	}


	Bivrost.Analytics.prototype.enabled = false;


	/**
	 * @param {Bivrost.Renderer} renderer
	 */
	Bivrost.Analytics.prototype.setRenderer = function(renderer) {
		renderer.onRenderMainView = this.update.bind(this);
	};


	Bivrost.Analytics.prototype.serialize = function(session) {
		var uri = "...";

		var lookprovider = "...";

		var historySerialized = "";
		var lastFov;

		var history;

		for(var i = 0; i < history.length; i++) {
			var frame = history[i];
			if(!frame) {
				historySerialized += "--";
				return;
			}

			var yaw = frame[0];
			var pitch = frame[1];
			var fov = ~~frame[2];

			if(lastFov != fov) {
				historySerialized += "!F" + fov + "!";
				lastFov = fov;
			}

			historySerialized += base64[yaw] + base64[pitch];
		}

		return {
			"version": session.version,
			"guid": session.guid,
			"uri": session.uri,
			"sample_rate": session.sample_rate,
			"installation_id": session.installationId,
			"time_start": session.time_start.toISOString(),
			"time_end": (new Date()).toISOString(),
			"lookprovider": session.lookprovider,
			"history": historySerialized,
			"media_id": session.media_id
		}
	};


	Bivrost.Analytics.prototype.send = function() {
		for(var i in this.sessions) {
			if(this.sessions.hasOwnProperty(i)) {
				var session = this.sessions[i];
				var serialized = this.serialize(session);
				log("session "+i, serialized);
				// TODO: send
			}
		}
	}

})();
