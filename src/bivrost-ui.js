/* global Bivrost */
"use strict";


(function() {
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.UI", arguments); };
		
	
	/**
	 * Formats a number of seconds to a minute:second format
	 * @param {number} seconds
	 * @returns {String}
	 * @static
	 */
	function time_format(seconds) {
		if(isNaN(seconds))
			return "-";
		return ~~(seconds/60) +":"+ ("00"+ ~~(seconds % 60).toString()).substr(-2);
	};
	
	
	/**
	 * Creates a button for use in the UI
	 * @param {string} name of the image
	 * @param {function} action on press
	 * @param {string} alt
	 * @static
	 * @returns {HTMLElement}
	 */
	function widget_button(name, action, alt) {
		var button=document.createElement("span");
		button.className="bivrost-button bivrost-icon-"+name;
		button.changeIcons=function(newName) {
			button.className="bivrost-button bivrost-icon-"+newName;
		};
		
		button.action=action;
		
		button.addEventListener("click", function(ev) { 
			button.action(); 
			button.blur(); 
			ev.preventDefault();
			return false;
		});
		
		button.title=alt;
		
		button.dispose=function() {};
		
		return button;
	}
	
	
	function widget_loading(player) {
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
			{ debugger; loading.dispose(); }
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
		
		loading.dispose=function() {
			if(loading.parentNode)
				loading.parentNode.removeChild(loading);
			
			loading.hide();
			
			var video=loading.video;
			loading.video=null;
			if(video) {
				video.removeEventListener("canplay", loading.hide);
				video.removeEventListener("waiting", loading.show);

				video.removeEventListener("playing", loading.show);
				video.removeEventListener("seeking", loading.show);
				video.removeEventListener("seeked", loading.show);
				video.removeEventListener("timeupdate", loading.hide);
			}
		};
		
		player.container.appendChild(loading);
		
		return loading;
	}
	
	
	function widget_playpause(player) {
		var pauseCheck=function() {
			var video=playButton.video;
			
			if(player.media.paused || video.ended) {
				playButton.changeIcons("play");
				playButton.title="play";
				if(player.ui.show)
					player.ui.show();
			}
			else {
				player.ui.bigPlay.hide();
				playButton.changeIcons("pause");
				playButton.title="pause";
			}
		};
		
		var playButton=widget_button(
			"play", 
			player.media.pauseToggle.bind(player.media), 
			Bivrost.lang.playButtonLabel
		);
		
		playButton.setVideo=function(video) {
			if(this.video) { debugger; this.dispose(); }
			this.video=video;
			video.addEventListener("playing", pauseCheck);
			video.addEventListener("stalled", pauseCheck);
			video.addEventListener("play", pauseCheck);
			video.addEventListener("pause", pauseCheck);
		};
		
		playButton.dispose=function() {
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
		
		bigPlay.setVideo=function(video) { ; };
		bigPlay.dispose=function() {
			player.container.removeChild(bigPlay);
		};
		
		player.container.appendChild(bigPlay);

		return bigPlay;
	}
	
	
	function widget_status(player) {
		var status=document.createElement("span");
		status.className="bivrost-status";
		
		var currentTime=document.createElement("span");
		status.appendChild(currentTime);
		
		var duration=document.createElement("span");
		status.appendChild(duration);

		var currentTime_update;
		var duration_update;

		status.setVideo=function(video) {
			if(this.video) { debugger; this.dispose(); }
			this.video=video;
			
			currentTime_update=function() {
				currentTime.textContent=time_format(video.currentTime);
			}
			video.addEventListener("timeupdate", currentTime_update);
			currentTime_update();

			duration_update=function() {
				if(!isFinite(player.media.duration))
					duration.textContent="";
				else
					duration.textContent=" / " + time_format(player.media.duration);
			};
			video.addEventListener("durationchange", duration_update);
			duration_update();
		}
		
		status.dispose=function() {
			this.video.removeEventListener("timeupdate", currentTime_update);
			this.video.removeEventListener("durationchange", duration_update);
		}
		
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
			this.video = video;
			
			range.style.display=isFinite(player.media.duration)
				?"block":"hidden";

			video.addEventListener("timeupdate", time_update);
			video.addEventListener("durationchange", duration_update);
			time_update();
			duration_update();
		};
		
		rangeBackground.dispose=function() {
			this.video.removeEventListener("timeupdate", time_update);
			this.video.removeEventListener("durationchange", duration_update);
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

		var volumebutton=widget_button("speaker", button_press, Bivrost.lang.volumeButtonLabel(0));

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
		
		volumebutton.dispose=function() {
			video.removeEventListener("volumechange", volume_change);
			ticks.forEach(function(t) {
				// TODO:
//				tick.addEventListener("click", setVolumeBreak);
//				tick.addEventListener("mouseup", setVolumeBreak);
//				tick.addEventListener("touchend", setVolumeBreak);
//				tick.addEventListener("mousemove", setVolumeCond);
//				tick.addEventListener("touchmove", setVolumeCond);
//				tick.addEventListener("mousedown", setVolumeStart);
//				tick.addEventListener("touchstart", setVolumeStart);
			});
		};
		
		var volume_change=function() {
			volumebutton.changeIcons(video.volume > 0 ? "speaker" : "mute");
			volumebutton.title=Bivrost.lang.volumeButtonLabel(video.volume);
			for(var i=0; i < ticks.length; i++)
				ticks[i].className="bivrost-volume-tick bivrost-volume-tick-"+((video.volume >= (8-i)/8)?"on":"off");
		};
		
		return volumebutton;
	}
	
	
	function widget_gyro(player) {
		var gyroButton=widget_button("gyro", function() {
			player.input.enableGyro=!player.input.enableGyro; 
			gyroButton.changeIcons(player.input.enableGyro ? "gyrooff" : "gyro");
		}, Bivrost.lang.gyroscopeButtonLabel);
		
		gyroButton.style.display="none";

		var listenGyro=function() {
			if(!player.input.gyroAvailable) return;
			gyroButton.style.removeProperty("display");
			window.removeEventListener("deviceorientation", listenGyro);
		};
		window.addEventListener("deviceorientation", listenGyro);
		
		gyroButton.dispose=function() {
			window.removeEventListener("deviceorientation", listenGyro);
		};
		
		return gyroButton;
	}
	
	
	function widget_fullscreen(player) {
		var fullscreenButton=widget_button("fullscreen", function() { player.fullscreen=!player.fullscreen; }, Bivrost.lang.fullscreenButtonLabel );

		var onFullscreenChange=function() {
			fullscreenButton.changeIcons(player.fullscreen ? "window" : "fullscreen");
			
			// exiting fullscreen on touch
			if(!player.fullscreen && player.input.isTouchInterface) {
				player.media.pause();
				player.ui.bigPlay.show();		// TODO: from player?
			}
			
			// entering fullscreen on touch or other
			if(player.fullscreen) {
				player.ui.bigPlay.hide();
			}
		};
		
		document.addEventListener("fullscreenchange", onFullscreenChange);
		document.addEventListener("fullScreenchange", onFullscreenChange);
		document.addEventListener("webkitfullscreenchange", onFullscreenChange);
		document.addEventListener("mozfullscreenchange", onFullscreenChange);
		document.addEventListener("MSFullscreenChange", onFullscreenChange);
		
		fullscreenButton.dispose=function() {
			document.removeEventListener("fullscreenchange", onFullscreenChange);
			document.removeEventListener("fullScreenchange", onFullscreenChange);
			document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
			document.removeEventListener("mozfullscreenchange", onFullscreenChange);
			document.removeEventListener("MSFullscreenChange", onFullscreenChange);
		};

		return fullscreenButton;
	}
	

	function widget_logo(player) {
		var logo=document.createElement("div");
		logo.addEventListener("click", function() { window.open("https://bivrost360.com", "_blank"); });
		logo.className="bivrost-logo";
		
		player.container.appendChild(logo);
		
		logo.dispose=function() {
			player.container.removeChild(logo);
		};
		
		return logo;
	}
		
		
	function widget_bivrost(player) {
		var media;
		var btn=widget_button("bivrost", function() { 
			window.open(media.getBivrostProtocolURI(), "_blank", "width=600, height=400, toolbar=no, scrollbars=no, resizable=yes");	
		}, Bivrost.lang.bivrostButtonLabel)
		
		btn.setMedia=function(media_) {
			media=media_;
		}
		
		btn.dispose=function() { ; };
		
		return btn;
	}
	
	
	function widget_vr(player) {
		var btn=widget_button(
			"oculus", 
			function() { player.vrModeEnterOrCycle(); }, 
			Bivrost.lang.vrButtonLabel 
		);
		
		btn.dispose=function() { ; };
		
		return btn;
	}
	
	
	/// UI:abstract
	{
		/**
		 * UI is short for User Interface - the buttons, slider and timing information
		 * @param {Bivrost.Player} player
		 */
		Bivrost.UI=function(player, className) {
			this._widgets=[];		
			this.player=player;
			
			var domElement=document.createElement("div");
			domElement.className=className;
			player.container.appendChild(domElement);

			var cancel=function(e) { e.stopPropagation(); return false; };
			domElement.addEventListener("mousedown", cancel);
			domElement.addEventListener("mousemove", cancel);
			domElement.addEventListener("mouseup", cancel);
			domElement.addEventListener("dblclick", cancel);
			domElement.addEventListener("click", cancel);
			domElement.addEventListener("touchstart", cancel);
			domElement.addEventListener("touchmove", cancel);
			domElement.addEventListener("touchend", cancel);

			this.domElement=domElement;

			this.player.container.appendChild(this.domElement);
		};


		Bivrost.UI.prototype.setMedia=function(media) {
			if(this.media)
				throw "cannot set media more than once";
			this.media=media;
		};


		Bivrost.UI.prototype.setMediaToAllWidgets=function() {
			var media=this.media;
			this._widgets.forEach(function(w) {
				if(w.setMedia) 
					w.setMedia(media);
				if(w.setVideo && media.video) 
					w.setVideo(media.video);
				if(w.setPicture && media.picture) 
					w.setPicture(media.picture);
			});
		};


		Bivrost.UI.prototype._widgets=[];


		Bivrost.UI.prototype.dispose=function() {
			this._widgets.forEach(function(w) {
				if(w.dispose) 
					w.dispose();
			});
			this._widgets=[];
			this.player.container.removeChild(this.domElement);
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
	}
	
	
	/// UI:Classic
	{
		Bivrost.UI.Classic=function(player) {
			Bivrost.UI.call(this, player, "bivrost-ui");

			this._showBound=this.show.bind(this);

			this.loading=widget_loading(player);
			this._widgets.push(this.loading);

			this.logo=widget_logo(this.player);
			this._widgets.push(this.logo);
		};
		Bivrost.extend(Bivrost.UI.Classic, Bivrost.UI);


		/**
		 * @type {function}
		 * @private
		 */
		Bivrost.UI.Classic.prototype._showBound=null;


		/**
		 * @param {Bivrost.Media} media
		 */
		Bivrost.UI.Classic.prototype.setMedia=function(media) {
			Bivrost.UI.prototype.setMedia.call(this, media);

			var widgetsLeft=[];
			var widgetsRight=[];
			var widgetsSpecial=[];

			var video=media.video;
			var picture=undefined;

			// loading widget - if picture, there is nothing more to load
			if(!media.video)
				this.loading.hide();

			var leftAligned=document.createElement("div");
			leftAligned.className="bivrost-aligned bivrost-left-aligned";

			// play/pause button
			if(media.video) {
				widgetsLeft.push(widget_playpause(this.player));
			}

			var rightAligned=document.createElement("div");
			rightAligned.className="bivrost-aligned bivrost-right-aligned";

			// status bar
			if(media.video) {
				widgetsRight.push(widget_status(this.player));
			}

			// bivrost button
			widgetsRight.push(widget_bivrost(this.player));

			// vr button
			widgetsRight.push(widget_vr(this.player));

			// volume button
			if(video) {
				widgetsRight.push(widget_volumebutton(this.player));
			}

			// gyroscope button
			widgetsRight.push(widget_gyro(this.player));

			// fullscreen button
			widgetsRight.push(widget_fullscreen(this.player));


			// special widgets:

			// media range, disabled for streaming
			if(video && Number.isFinite(media.duration)) {
				var range=widget_range(this.player);
				this.domElement.appendChild(range);
				widgetsSpecial.push(range);
			}

			// show the ui bar on user activity
			if(media.video) {
				this.player.container.addEventListener("mousemove", this._showBound);
				this.player.container.addEventListener("touchstart", this._showBound);
				this.player.container.addEventListener("touchmove", this._showBound);
				this.show();
			}

			// add big play
			this.bigPlay=widget_bigplay(this.player);
			widgetsSpecial.push(this.bigPlay);


			// add the buttons to ui
			var widgets=this._widgets;
			widgetsLeft.forEach(function(w) {
				widgets.push(w);
				leftAligned.appendChild(w);
			});
			widgetsRight.forEach(function(w) {
				widgets.push(w);
				rightAligned.appendChild(w);
			});
			widgetsSpecial.forEach(function(w) {
				widgets.push(w);
			});

			this.domElement.appendChild(leftAligned);
			this.domElement.appendChild(rightAligned);

			this.setMediaToAllWidgets();
		};


		/**
		 * After how many seconds will the UI hide.
		 * Set to 0 to disable
		 * @type {number}
		 */
		Bivrost.UI.prototype.autoHide=5;
		

		Bivrost.UI.Classic.prototype.show=function() {
			var thisRef=this;
			this.player.container.classList.remove("bivrost-hide-ui");
			if(this._hideTimeoutId) {
				clearTimeout(this._hideTimeoutId);
				this._hideTimeoutId=null;
			}
			if(this.autoHide > 0) {
				this._hideTimeoutId=setTimeout(function() {
					if(!thisRef.media.paused && thisRef.autoHide > 0)
						thisRef.hide();
				} , this.autoHide*1000);
			}
		};


		Bivrost.UI.Classic.prototype.hide=function() {
			this.player.container.classList.add("bivrost-hide-ui");
			clearTimeout(this._hideTimeoutId);
			this._hideTimeoutId=null;
		};


		Bivrost.UI.Classic.prototype._hideTimeoutId=null;


		Bivrost.UI.Classic.prototype.dispose=function() {
			Bivrost.UI.prototype.dispose.call(this);
			
			if(this._hideTimeoutId) {
				clearTimeout(this._hideTimeoutId);
				this._hideTimeoutId=null;
			}
			
			this.player.container.removeEventListener("mousemove", this._showBound);
			this.player.container.removeEventListener("touchstart", this._showBound);
			this.player.container.removeEventListener("touchmove", this._showBound);
			this._showBound=null;
		};


		Bivrost.UI.Classic.prototype.loading=null;


		/**
		 * @type {HTMLElement}
		 * @private
		 */
		Bivrost.UI.Classic.bigPlay=null;


		/**
		 * @type {HTMLElement}
		 * @private
		 */
		Bivrost.UI.Classic.logo=null;
	}
	
	
	/// UI:stereo
	{
		
		function widget_button_circle(name, action, alt) {
			var inner=widget_button(name, action, alt);
			
			var outer=document.createElement("span");
			outer.className="bivrost-button-holder";
			outer.appendChild(inner);
			
			return outer;
		}
		
		Bivrost.UI.Stereo=function(player, type) {
			Bivrost.UI.call(this, player, "bivrost-ui bivrost-ui-stereo");
			this.type=type;

//			this.loading=widget_loading(player);
//			this._widgets.push(this.loading);
//
//			this.logo=widget_logo(this.player);
//			this._widgets.push(this.logo);
		};
		Bivrost.extend(Bivrost.UI.Stereo, Bivrost.UI);


		/**
		 * @param {Bivrost.Media} media
		 */
		Bivrost.UI.Stereo.prototype.setMedia=function(media) {
			Bivrost.UI.prototype.setMedia.call(this, media);

			var player=this.player;
			var closeButton=widget_button_circle("close", function() { player.vrExit(); }, Bivrost.lang.exitVRButtonLabel);
			this._widgets.push(closeButton);
			this.domElement.appendChild(closeButton);
			
			this.domElement.appendChild(document.createElement("br"));
			
			var type=document.createElement("span");
			type.appendChild(document.createTextNode("renderer: " + this.type));
			type.style.color="white";
			type.style.backgroundColor="black";
			type.style.borderRadius="8px";
			type.style.padding="2px 8px";
			type.style.display="inline-block";
			this._widgets.push(type);
			this.domElement.appendChild(type);
			
			if(media.video)
				this.domElement.addEventListener("click", function() { media.pauseToggle(); });
			
			this.setMediaToAllWidgets();
		};
	}

})();