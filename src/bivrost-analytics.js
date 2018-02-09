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


	/// TODO: startTime
	Bivrost.Analytics.prototype.startTime = null;


	Bivrost.Analytics.prototype.history = [];


	/**
	 * @param {THREE.Euler} euler
	 * @param {number} fov
	 */
	Bivrost.Analytics.prototype.update = function(euler, fov) {
		if(this.lastMedia !== this.player.media) {
			this.lastMedia = this.player.media;

			if(this.history.length)
				this.send();
			this.cleanup();

			if(!this.player.media || !this.player.media.video) {
				log("Analytics support only video media");
			}
			else if(this.player.media.duration <= 0) {
				log("Analytics support only video media with finite length (no livestreams)");
			}
			else {
				log("Media changed to ", this.player.media);
				this.enabled = true;
				var thisRef = this;
				this.player.media.onPlaybackStatusChange = function(media, st) {
					log("Status change", st);
					if(!st) {
						thisRef.cleanup();
						thisRef.enabled = false;
					}
					else {
						thisRef.startTime = new Date();
						thisRef.history = [];
						thisRef.enabled = true;
					}
				}
			}
			// TODO: unbind old video (useless until media switching functionality is implemented)
		}

		if(!this.enabled)
			return;

		if(this.player.media.video.paused)
			return;

		// coordinate system starts in upper left corner of a virtual equirectangular projected texture
		// and both coordinates are normalized to [0..1]
		var eulerYXZ = new THREE.Euler();
		eulerYXZ.copy(euler);
		eulerYXZ.reorder("YXZ");
		var yaw = (10.25 - eulerYXZ.y * REV_2PI) % 1;
		var pitch = (-eulerYXZ.x * REV_PI + 10.5) % 1;
		var time = this.player.media.time;

		var frame = ~~(time * this.frequency);	//< implicit Math.floor, so each frame except last one lasts the same
		this.history[frame]=[~~(64 * yaw), ~~(64 * pitch), fov];
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


	Bivrost.Analytics.prototype.serialize = function() {
		// https://stackoverflow.com/a/2117523/785171
		var guid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});

		var uri = "...";

		var lookprovider = "...";

		var historySerialized = "";
		var lastFov;
		for(var i = 0; i < this.history.length; i++) {
			var frame = this.history[i];
			if(!frame) {
				historySerialized += "--";
				return;
			}

			var yaw = frame[0];
			var pitch = frame[1];
			var fov = frame[2];

			if(lastFov != fov) {
				historySerialized += "!F" + ~~fov + "!";
				lastFov = fov;
			}

			historySerialized += base64[yaw] + base64[pitch];
		}

		log(this.history.length);

		var session = {
			"version": BIVROST_VIDEOANALYTICS_VERSION,
			"guid": guid,
			"uri": uri,
			"sample_rate": this.frequency,
			"installation_id": this.installationId,
			"time_start": this.startTime.toISOString(),
			"time_end": (new Date()).toISOString(),
			"lookprovider": lookprovider,
			"history": historySerialized,
			"media_id": this.mediaID || uri
		}

		return session;
	};


	Bivrost.Analytics.prototype.cleanup = function() {
		this.history = [];
		this.startTime = null;
	};


	Bivrost.Analytics.prototype.send = function() {
		log(this.serialize());
	}


})();
