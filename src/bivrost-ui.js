/* global Bivrost */
"use strict";


(function() {
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.UI", arguments); };
	
	
	function widget_loading() {
		var loading=document.createElement("div");
		loading.className="bivrost-loading";
		
		loading.appendChild(document.createElement("div"));
		
		var loading_visible=true;
		var loading_indicator_timeout_id;
		// loading indicator has a some added lag so it doesn't flash if the change is quick
		var loading_indicator=function(visible) {
			if(visible === loading_visible)
				return;
			loading_visible=visible;
			clearTimeout(loading_indicator_timeout_id);
			loading_indicator_timeout_id=setTimeout(function() {
				if(loading_visible)
					loading.classList.remove("bivrost-hidden"); 
				else
					loading.classList.add("bivrost-hidden"); 
			}, 200);
		};
		
		loading.show=loading_indicator.bind(null, true); 
		
		loading.hide=loading_indicator.bind(null, false); 
		
		loading.setVideo=function(video) {
			// clear previous media (suspicious?)
			if(loading.video)
			{ debugger; loading.clearVideo(); }
			loading.video=video;
			
			// initial visibility
			if(video.readyState >= video.HAVE_FUTURE_DATA)
				loading.hide();
			else
				loading.show();
			
			// show when video is waiting, clear when it's not
			video.addEventListener("canplay", loading.hide);
			video.addEventListener("waiting", loading.show);
			
			// show loading on trying to play (playing) or seeking and hide only when this succeeds (timeupdate)
			video.addEventListener("playing", loading.show);
			video.addEventListener("seeking", loading.show);
			video.addEventListener("seeked", loading.show);
			video.addEventListener("timeupdate", loading.hide);
		};
		
		loading.clearVideo=function() {
			var video=loading.video;
			loading.video=null;
			if(!video) { debugger; return; }
			
			loading.hide();
			
			video.removeEventListener("canplay", loading.hide);
			video.removeEventListener("waiting", loading.show);
			
			video.removeEventListener("playing", loading.show);
			video.removeEventListener("seeking", loading.show);
			video.removeEventListener("seeked", loading.show);
			video.removeEventListener("timeupdate", loading.hide);
			
		};
		
		return loading;
	}
	
	
	
	function widget_playpause(player) {
		var pauseCheck=function() {
			var video=playButton.video;
			
			if(player.media.paused || video.ended) {
				playButton.changeIcons("play");
				playButton.title="play";
				player.ui.show();
			}
			else {
				player.ui.bigPlay.hide();
				playButton.changeIcons("pause");
				playButton.title="pause";
			}
		};
		
		var playButton=Bivrost.UI.makeButton(
			"play", 
			player.media.pauseToggle.bind(player.media), 
			Bivrost.lang.playButtonLabel
		);
		
		playButton.setVideo=function(video) {
			if(this.video) { debugger; this.clearVideo(); }
			this.video=video;
			video.addEventListener("playing", pauseCheck);
			video.addEventListener("stalled", pauseCheck);
			video.addEventListener("play", pauseCheck);
			video.addEventListener("pause", pauseCheck);
		};
		
		playButton.clearVideo=function() {
			var video=this.video;
			if(!video) { debugger; return; }
			this.video=null;
			video.removeEventListener("playing", pauseCheck);
			video.removeEventListener("stalled", pauseCheck);
			video.removeEventListener("play", pauseCheck);
			video.removeEventListener("pause", pauseCheck);
		};
		
		
		return playButton;
	}
	
	
	
	function widget_bigplay(player) {
		var bigPlay=document.createElement("div");
		bigPlay.className="bivrost-bigplay";
		bigPlay.hide=function() { bigPlay.classList.add("bivrost-hidden"); };
		bigPlay.show=function() { bigPlay.classList.remove("bivrost-hidden"); };
		bigPlay.addEventListener("click", function() {
			player.media.play();
			bigPlay.hide();
			log("is touch interface", player.input.isTouchInterface);
			if(player.input.isTouchInterface)
				player.fullscreen=true; 
		});
		player.input.onMove.subscribeOnce(bigPlay.hide);
		return bigPlay;
	}
	
	
	
	function widget_status(player) {
		var status=document.createElement("span");
		status.className="bivrost-status";
		
		var currentTime=document.createElement("span");
		status.appendChild(currentTime);
		
		var duration=document.createElement("span");
		status.appendChild(duration);

		status.setVideo=function(video) {
			var currentTime_update=function() {
				currentTime.textContent=Bivrost.UI.timeFormat(video.currentTime);
			}
			video.addEventListener("timeupdate", currentTime_update);
			currentTime_update();

			var duration_update=function() {
				if(!isFinite(player.media.duration))
					duration.textContent="";
				else
					duration.textContent=" / " + Bivrost.UI.timeFormat(player.media.duration);
			};
			video.addEventListener("durationchange", duration_update);
			duration_update();
		}
		
		status.clearVideo=function() {}
		
		return status;
	}
	
	
	function widget_range(player) {
		var range=document.createElement("input");
		range.setAttribute("type", "range");
		range.setAttribute("min", 0);
		range.setAttribute("max", /*media.duration ||*/ 1);
		range.setAttribute("step", 0.025);
		range.setAttribute("value", 0);

		var rangeBackground=document.createElement("div");
		rangeBackground.className="bivrost-range-background";

		var rangeForeground=document.createElement("div");
		rangeForeground.className="bivrost-range-foreground";
		rangeBackground.appendChild(rangeForeground);
		rangeForeground.setValue01=function(value01) {
			var thumbWidth=15;
			rangeForeground.style.width=Math.round(value01 * (rangeBackground.offsetWidth-thumbWidth) + thumbWidth/2)+"px";
		};

		rangeBackground.appendChild(range);

		var rangeChange=function() {
			rangeForeground.setValue01(range.value/player.media.duration);
			player.media.time=range.value; 
		};
		
		range.addEventListener("change", rangeChange);
		range.addEventListener("input", rangeChange);		
		window.addEventListener("resize", rangeChange);

		var time_update=function() {
			range.value=player.media.time;
			rangeForeground.setValue01(player.media.time/player.media.duration);			
		};
		
		var duration_update=function() {
			range.setAttribute("max", player.media.duration || 1);
		};
		
		rangeBackground.setVideo=function(video) {
			range.style.display=isFinite(player.media.duration)
				?"block":"hidden";

			video.addEventListener("timeupdate", time_update);
			video.addEventListener("durationchange", duration_update);
			time_update();
			duration_update();
		};
		
		return rangeBackground;
	}
	
	
	function widget_volumebutton(player) {
		var volumebar=document.createElement("div");
		volumebar.addEventListener("click", function(e) { e.stopPropagation(); return false; });
		volumebar.className="bivrost-volume bivrost-hidden";
		
		var video;	
		var lastVolume=0;
		
		var ticks=[];
	
		var button_press=function () {
			if(video.volume === 0) {
				if(lastVolume < 1/8)
					lastVolume=1/8;
				video.volume=lastVolume;
			}
			else {
				lastVolume=video.volume;
				video.volume=0;
			}
		};

		var volumebutton=Bivrost.UI.makeButton("speaker", button_press, Bivrost.lang.volumeButtonLabel(0));

		var volumeActive=false;
		volumebutton.addEventListener("mouseover", function() { volumebar.classList.remove("bivrost-hidden"); volumeActive=true; });
		volumebutton.addEventListener("mouseleave", function() { volumebar.classList.add("bivrost-hidden"); inVolumeDrag=volumeActive=false; });

		// on first touch cancel click, so it doesn't mute automaticaly
		volumebutton.addEventListener("touchstart", function(ev) {
			if(!volumeActive) {
				ev.stopPropagation();
				return false;
			}
		});

		volumebutton.appendChild(volumebar);
		
		
		var inVolumeDrag=false;
		volumebutton.setVideo=function(video_) {
			video=video_;
			lastVolume=video.volume;

			for(var i=8; i--; ) {
				var tick=document.createElement("div");
				tick.className="bivrost-volume-tick bivrost-volume-tick-on";
				var setVolumeCond=(function(vol) { return function() {
					if(inVolumeDrag)
						video.volume=vol; 
					return true;
				}; })((i+1)/8);
				var setVolumeBreak=(function(vol) { return function() { 
					volumebar.classList.add("bivrost-hidden");
					video.volume=vol; 
					inVolumeDrag=false;
				}; })((i+1)/8);
				var setVolumeStart=(function(vol) { return function() { 
					video.volume=vol; 
					inVolumeDrag=true;
				}; })((i+1)/8);
				tick.addEventListener("click", setVolumeBreak);
				tick.addEventListener("mouseup", setVolumeBreak);
				tick.addEventListener("touchend", setVolumeBreak);
				tick.addEventListener("mousemove", setVolumeCond);
				tick.addEventListener("touchmove", setVolumeCond);
				tick.addEventListener("mousedown", setVolumeStart);
				tick.addEventListener("touchstart", setVolumeStart);
				ticks.push(tick);
				volumebar.appendChild(tick);
			}
			
			video.addEventListener("volumechange", volume_change);
			volume_change();
		};
		
		var volume_change=function() {
			volumebutton.changeIcons(video.volume > 0 ? "speaker" : "mute");
			volumebutton.title=Bivrost.lang.volumeButtonLabel(video.volume);
			for(var i=0; i < ticks.length; i++)
				ticks[i].className="bivrost-volume-tick bivrost-volume-tick-"+((video.volume >= (8-i)/8)?"on":"off");
		};
		
		
		volumebutton.clearVideo=function() {};
		
		return volumebutton;
	}
	
	

	
	/**
	 * UI is short for User Interface - the buttons, slider and timing information
	 * @param {HTMLElement} domElement
	 * @param {Bivrost.Player} player
	 */
	Bivrost.UI=function(domElement, player) {
		var thisRef=this;
		
		this.domElement=domElement;
		this.player=player;
		
		this.loading=widget_loading();
		player.container.appendChild(this.loading);		// TODO: in UI		
		
		var cancel=function(e) { e.stopPropagation(); return false; };
		domElement.addEventListener("mousedown", cancel);
		domElement.addEventListener("mousemove", cancel);
		domElement.addEventListener("mouseup", cancel);
		domElement.addEventListener("dblclick", cancel);
		domElement.addEventListener("click", cancel);
		domElement.addEventListener("touchstart", cancel);
		domElement.addEventListener("touchmove", cancel);
		domElement.addEventListener("touchend", cancel);

		var logo=document.createElement("div");
		logo.addEventListener("click", function() { window.open("https://bivrost360.com", "_blank"); });
		logo.className="bivrost-logo";
		player.container.appendChild(logo);
	};

	
	/**
	 * @param {Bivrost.Media} media
	 */
	Bivrost.UI.prototype.setMedia=function(media) {
		var thisRef=this;
		this.media=media;
		
		var leftAligned=document.createElement("div");
		leftAligned.className="bivrost-aligned bivrost-left-aligned";
		
		var rightAligned=document.createElement("div");
		rightAligned.className="bivrost-aligned bivrost-right-aligned";
		
		rightAligned.appendChild(Bivrost.UI.makeButton("bivrost", function() { 
			window.open(media.getBivrostProtocolURI(), "_blank", "width=600, height=400, toolbar=no, scrollbars=no, resizable=yes");	
		}, Bivrost.lang.bivrostButtonLabel));
		
		rightAligned.appendChild(Bivrost.UI.makeButton("oculus", function() { thisRef.player.vrModeEnterOrCycle(); }, Bivrost.lang.vrButtonLabel ));
		
		// hide on picture
		if(!media.video) {
			this.loading.hide();
		}
		
		if(media.video) {
			var video=media.video;
			
			// loading 
			this.loading.setVideo(video);

			// status bar
			var status=widget_status(this.player);
			status.setVideo(video);

			// media range
			var range=widget_range(this.player);
			range.setVideo(video);
			this.domElement.appendChild(range);

			// play/pause button
			var playButton=widget_playpause(this.player);
			playButton.setVideo(video);
//			 this.domElement.appendChild(makeButton("back", function() { media.time-=5; }, "<<"));
			leftAligned.appendChild(playButton);
//			 this.domElement.appendChild(makeButton("next", function() { media.time+=5; }, ">>"));


			// add status as first right element
			if(rightAligned.childNodes.length > 0)
				rightAligned.insertBefore(status, rightAligned.childNodes[0]);
			else
				rightAligned.appendChild(status);
			
			// volume
			var volumebutton=widget_volumebutton(this.player);
			volumebutton.setVideo(video);
			rightAligned.appendChild(volumebutton);
			
		}			
		
		
		// show the ui bar on user activity
		if(media.video) {
			this.player.container.addEventListener("mousemove", this.show.bind(this));
			this.player.container.addEventListener("touchstart", this.show.bind(this));
			this.player.container.addEventListener("touchmove", this.show.bind(this));
			this.show();
		}


		var gyroButton;
		var listenGyro=function() {
			if(gyroButton) return;
			if(!thisRef.player.input.gyroAvailable) return;
			gyroButton=Bivrost.UI.makeButton("gyro", function() {
				thisRef.player.input.enableGyro=!thisRef.player.input.enableGyro; 
				gyroButton.changeIcons(thisRef.player.input.enableGyro ? "gyrooff" : "gyro");
			}, Bivrost.lang.gyroscopeButtonLabel);
			rightAligned.insertBefore(gyroButton, fullscreenButton);
			window.removeEventListener("deviceorientation", listenGyro);
		};
		window.addEventListener("deviceorientation", listenGyro);

		var fullscreenButton=Bivrost.UI.makeButton("fullscreen", function() { thisRef.player.fullscreen=!thisRef.player.fullscreen; }, Bivrost.lang.fullscreenButtonLabel );
		rightAligned.appendChild(fullscreenButton);

		var onFullscreenChange=function() {
			fullscreenButton.changeIcons(thisRef.player.fullscreen ? "window" : "fullscreen");
			
			// exiting fullscreen on touch
			if(!thisRef.player.fullscreen && thisRef.player.input.isTouchInterface) {
				thisRef.media.pause();
				thisRef.bigPlay.show();		// TODO: from player?
			}
			
			// entering fullscreen on touch or other
			if(thisRef.player.fullscreen) {
				thisRef.bigPlay.hide();
			}
		};
		document.addEventListener("fullscreenchange", onFullscreenChange);
		document.addEventListener("fullScreenchange", onFullscreenChange);
		document.addEventListener("webkitfullscreenchange", onFullscreenChange);
		document.addEventListener("mozfullscreenchange", onFullscreenChange);
		document.addEventListener("MSFullscreenChange", onFullscreenChange);

		this.domElement.appendChild(leftAligned);
		this.domElement.appendChild(rightAligned);


		// big play
		this.bigPlay=widget_bigplay(this.player);
		this.player.container.appendChild(this.bigPlay);
	};
	
	
	/**
	 * Container for the UI
	 * @type {HTMLElement}
	 */
	Bivrost.UI.prototype.domElement=null;
	
	
	/**
	 * Reference to the Bivrost player instance
	 * @type {Bivrost.Player}
	 */
	Bivrost.UI.prototype.player=null;
	
	
	/**
	 * After how many seconds will the UI hide.
	 * Set to 0 to disable
	 * @type {number}
	 */
	Bivrost.UI.prototype.autoHide=5;
	
	
	Bivrost.UI.prototype.show=function() {
		var thisRef=this;
		this.player.container.classList.remove("bivrost-hide-ui");
		if(this._hideTimeoutId)
			clearTimeout(this._hideTimeoutId);
		if(this.autoHide > 0) {
			this._hideTimeoutId=setTimeout(function() {
				if(!thisRef.media.paused && thisRef.autoHide > 0)
					thisRef.hide();
			} , this.autoHide*1000);
		}
	};
	
	
	Bivrost.UI.prototype.hide=function() {
		this.player.container.classList.add("bivrost-hide-ui");
		clearTimeout(this._hideTimeoutId);
	};
	
	Bivrost.UI.prototype._hideTimeoutId=null;
			

	Bivrost.UI.prototype.loading=null;
	
	
	/**
	 * @type {HTMLElement}
	 * @private
	 */
	Bivrost.UI.bigPlay=null;
	
	
	/// UTILITIES
	/**
	 * Creates a button for use in the UI
	 * @param {string} name of the image
	 * @param {function} action on press
	 * @param {string} alt
	 * @static
	 * @returns {HTMLElement}
	 */
	Bivrost.UI.makeButton=function(name, action, alt) {
		var button=document.createElement("span");
		button.className="bivrost-button bivrost-icon-"+name;
		button.changeIcons=function(newName) {
			button.className="bivrost-button bivrost-icon-"+newName;
		};
		
		button.action=action;
		
		button.addEventListener("click", function() { button.action(); button.blur(); });
		
		button.title=alt;
		
		return button;
	};
	
	
	/**
	 * Formats a number of seconds to a minute:second format
	 * @param {number} seconds
	 * @returns {String}
	 * @static
	 */
	Bivrost.UI.timeFormat=function(seconds) {
		if(isNaN(seconds))
			return "-";
		return ~~(seconds/60) +":"+ ("00"+ ~~(seconds % 60).toString()).substr(-2);
	};
	
	
})();