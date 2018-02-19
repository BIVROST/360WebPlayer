/* global Bivrost */
"use strict";


(function(){

	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.Analytics", arguments); };


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
			var r = (Math.random() * 16) | 0;
			var v = (c == 'x') ? (r) : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}


	/**
	 * @constructor
	 * @param {Bivrost.Player} player An instance of Bivrost.Player to be monitored
	 * @param {string|null} destinationURI The URI that the session will be sent to, optional
	 * @param {number} frequency A positive integral number, the frequency at which the movement is sampled. Should not be too high, 10 is a good value.
	 */
	Bivrost.Analytics = function(player, destinationURI, frequency) {
		player.analytics = this;

		if(!(frequency > 0) || ~~frequency !== frequency)
			throw "Frequency must be a positive integral number";

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
	 * An instance of Bivrost.Player to be monitored
	 * @type {Bivrost.Player}
	 */
	Bivrost.Analytics.prototype.player = null;


	/**
	 * A positive integral number, the frequency at which the movement is sampled. Should not be too high, 10 is a good value.
	 * @type {number}
	 */
	Bivrost.Analytics.prototype.frequency = null;


	/**
	 * The URI that the session will be sent to, optional
	 * @type {string|null}
	 */
	Bivrost.Analytics.prototype.destinationURI = null;


	/**
	 * Optional installation ID.
	 * Can be used to match a user to the session data.
	 * @type {string}
	 */
	Bivrost.Analytics.prototype.installationId = null;


	/**
	 * Optional canonical media identification.
	 * Please see the session format documentation for media id types that can be used.
	 * If not provided, the current location.href will be used.
	 * @type {string}
	 */
	Bivrost.Analytics.prototype.mediaID = null;


	/**
	 * Current session data,
	 * the keys are look providers, the values are the associated data
	 * @type {Object<string, Object>}
	 */
	Bivrost.Analytics.prototype.sessions = null;


	/**
	 * Timeout of XHR sending of sessions, in milliseconds
	 * @type {number}
	 */
	Bivrost.Analytics.prototype.sendTimeout = 10000; //< ms

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
						thisRef.send();
					}

					// cleanup on new 
					if(st) {
						log("Media source enabled");
						thisRef.sessions = {};
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
			var mediaId = this.mediaID || "url:"+location.href;
			var uri = this.player.media.video.currentSrc;
			var lookprovider = "bivrost:360WebPlayer:" + platform;

			this.sessions[platform] = {
				"version": BIVROST_VIDEOANALYTICS_VERSION,
				"guid": guid(),
				"uri": uri,
				"sample_rate": this.frequency,
				"installation_id": this.installationId,
				"time_start": new Date(),	//< replaced by ISO date string in serialized form on send
				"time_end": null, //< set on send and replaced by an ISO date string in serialized form
				"lookprovider": lookprovider,
				// "history": historySerialized,	//< serialized in serialized form on send, replacing the history array
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

		this.sessions[platform].history[frame] = [~~(64 * yaw), ~~(64 * pitch), fov];
		// log(frame, time, this.frequency);
		// log(yaw + "," + pitch +" "+fov);
	}


	/**
	 * @private
	 * @type {boolean}
	 */
	Bivrost.Analytics.prototype.enabled = false;


	/**
	 * @param {Bivrost.Renderer} renderer
	 */
	Bivrost.Analytics.prototype.setRenderer = function(renderer) {
		renderer.onRenderMainView = this.update.bind(this);
	};


	Bivrost.Analytics.prototype.serialize = function(session) {
		var lastFov;
		var history = session.history;		
		var historySerialized = "";

		for(var i = 0; i < history.length; i++) {
			var frame = history[i];

			if(!frame) {
				historySerialized += "--";
				continue;
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

		session.time_end = new Date();

		return JSON.stringify({
			"version": session.version,
			"guid": session.guid,
			"uri": session.uri,
			"sample_rate": session.sample_rate,
			"installation_id": session.installationId,
			"time_start": session.time_start.toISOString(),
			"time_end": session.time_end.toISOString(),
			"lookprovider": session.lookprovider,
			"history": historySerialized,
			"media_id": session.media_id
		});
	};


	/**
	 * Send the sessions to `this.destinationURI` (if set), `this.sendHandler` (if registered) or the provided handler.
	 * If the handler argument is provided, then destinationURI and sendHandler are not used.
	 * @param {?function(Object, string)} handler the handler, will be called with two arguments: the session in raw object form and session in serialized json form.
	 */
	Bivrost.Analytics.prototype.send = function(handler) {
		for(var i in this.sessions) {
			if(this.sessions.hasOwnProperty(i)) {
				var session = this.sessions[i];
				var serialized = this.serialize(session);
				log("will send session "+i, serialized);

				if(handler) {
					handler(session, serialized);
					continue;
				}

				if(this.destinationURI) {
					var xhr = new XMLHttpRequest();
					xhr.open("POST", this.destinationURI, true);
					xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
					xhr.timeout = this.sendTimeout;
					var thisRef = this;

					xhr.onreadystatechange = function() {
						if(xhr.readyState != 4)
							return;

						if(xhr.status != 200) {
							thisRef.sendError(["non-200 return code", xhr.status, xhr.statusText].join(", "), session);
						}
						else {
							log("Session " + session.guid + "(" + session.lookprovider + ") sent successfully");
						}
					};

					xhr.ontimeout = this.sendError.bind(this, "timed out");

					xhr.send("session=" + encodeURIComponent(serialized));
				}

				if(this.sendHandler) {
					this.sendHandler(session, serialized);
				}
			}
		}
	}


	/**
	 * Called when a session send XHR error occurs.
	 * @type {function(this:Bivrost.Analytics, object)}
	 */
	Bivrost.Analytics.prototype.sendError = function(err, session) {
		log("Error occurred while sending session to " + this.destinationURI, err, session);
	}


	/**
	 * Provide handler to call on each sending of analytics.
	 * @type {function(this:Bivrost.Analytics, object, string)} the handler, will be called with two arguments: the session in raw object form and session in serialized json form.
	 */
	Bivrost.Analytics.prototype.sendHandler = null;

})();
