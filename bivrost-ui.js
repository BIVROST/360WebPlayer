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
	 * Creates a button for use in the UI
	 * @param {string} name of the image
	 * @param {function} action on press
	 * @param {string} alt
	 * @returns {HTMLElement}
	 */
	function makeButton(name, action, alt) {
		var button=document.createElement("span");
		button.className="bivrost-button bivrost-icon-"+name;
		button.changeIcons=function(newName) {
			button.className="bivrost-button bivrost-icon-"+newName;
		};
		
		button.action=action;
		
		button.addEventListener("click", function() { button.action(); button.blur(); });
		
		button.title=alt;
		
		return button;
	}
	
	
	/**
	 * Formats a number of seconds to a minute:second format
	 * @param {number} seconds
	 * @returns {String}
	 */
	function timeFormat(seconds) {
		if(isNaN(seconds))
			return "-";
		return ~~(seconds/60) +":"+ ("00"+ ~~(seconds % 60).toString()).substr(-2);
	}
	
	
	/**
	 * UI is short for User Interface - the buttons, slider and timing information
	 * @param {HTMLElement} domElement
	 * @param {Bivrost.Player} player
	 */
	Bivrost.UI=function(domElement, player) {
		this.domElement=domElement;
		this.player=player;
		
		var loading=this.loading=document.createElement("div");
		loading.className="bivrost-loading";
		loading.show=function() { loading.classList.remove("hidden"); }
		loading.hide=function() { loading.classList.add("hidden"); }
		loading.appendChild(document.createElement("div"));
		player.container.appendChild(loading);
		
		var cancel=function(e) { e.stopPropagation(); return false; };
		domElement.addEventListener("mousedown", cancel);
		domElement.addEventListener("mousemove", cancel);
		domElement.addEventListener("mouseup", cancel);
		domElement.addEventListener("dblclick", cancel);
		domElement.addEventListener("click", cancel);
		domElement.addEventListener("touchstart", cancel);
		domElement.addEventListener("touchmove", cancel);
		domElement.addEventListener("touchend", cancel);
	};

	
	/**
	 * @param {Bivrost.Media} media
	 */
	Bivrost.UI.prototype.setMedia=function(media) {
		var thisRef=this;
		this.media=media;
		
		var bivrostButtonLink="player-jump.html";
		
		var leftAligned=document.createElement("div");
		leftAligned.className="bivrost-aligned bivrost-left-aligned";
		
		var rightAligned=document.createElement("div");
		rightAligned.className="bivrost-aligned bivrost-right-aligned";
		
		rightAligned.appendChild(makeButton("bivrost", function() { 
			window.open(bivrostButtonLink, "_blank", "width=600, height=400, toolbar=no, scrollbars=no, resizable=yes");	
		}, "powered by Bivrost"));
		
		rightAligned.appendChild(makeButton("oculus", function() { thisRef.player.vrModeEnterOrCycle(); }, "VR" ));
		
		// hide on picture
		if(!media.video) {
			this.loading.hide();
		}
		
		if(media.video) {
			this.loading.show();
			
			var video=media.video;

			var currentTime=document.createElement("span");
			currentTime.textContent=timeFormat(media.time);

			var separator=document.createElement("span");
			separator.textContent=" / ";

			var duration=document.createElement("span");
			duration.textContent=timeFormat(media.duration);

			var status=document.createElement("span");
			status.className="bivrost-status";
			status.appendChild(currentTime);
			status.appendChild(separator);
			status.appendChild(duration);

			var range=document.createElement("input");
			range.setAttribute("type", "range");
			range.setAttribute("min", 0);
			range.setAttribute("max", media.duration || 1);
			range.setAttribute("step", 0.025);
			range.setAttribute("value", 0);

			var rangeBackground=document.createElement("div");
			rangeBackground.className="bivrost-range-background";
			this.domElement.appendChild(rangeBackground);

			var rangeForeground=document.createElement("div");
			rangeForeground.className="bivrost-range-foreground";
			rangeBackground.appendChild(rangeForeground);
			rangeForeground.setValue01=function(value01) {
				var thumbWidth=15;
				rangeForeground.style.width=Math.round(value01 * (rangeBackground.offsetWidth-thumbWidth) + thumbWidth/2)+"px";
			};

			var onFullscreenChange=function() {
				setTimeout(function() {
					rangeForeground.setValue01(media.time/media.duration);
				}, 0);
			};
			document.addEventListener("fullscreenchange", onFullscreenChange);
			document.addEventListener("fullScreenchange", onFullscreenChange);
			document.addEventListener("webkitfullscreenchange", onFullscreenChange);
			document.addEventListener("mozfullscreenchange", onFullscreenChange);
			document.addEventListener("MSFullscreenChange", onFullscreenChange);

			rangeBackground.appendChild(range);


			video.addEventListener("timeupdate", function(e) {
				currentTime.textContent=timeFormat(media.time);
				range.value=media.time;
				rangeForeground.setValue01(media.time/media.duration);
			});

			video.addEventListener("durationchange", function(e) {
				duration.textContent=timeFormat(media.duration);
				range.setAttribute("max", media.duration || 1);
			});

			var rangeChange=function() {
				rangeForeground.setValue01(range.value/media.duration)+"px";
				media.time=range.value; 
			};
			range.addEventListener("change", rangeChange);
			range.addEventListener("input", rangeChange);

			var playButton=makeButton("play", media.play.bind(media), "play");

			var pauseCheck=function() {
				if(video.paused || video.ended) {
					playButton.changeIcons("play");
					playButton.title="play";
					playButton.action=video.play.bind(video);
					thisRef.show();
					thisRef._paused=true;
				}
				else {
					playButton.changeIcons("pause");
					playButton.title="pause";
					playButton.action=video.pause.bind(video);
					thisRef._paused=false;
				}
			};
			video.addEventListener("playing", pauseCheck);
			video.addEventListener("stalled", pauseCheck);
			video.addEventListener("play", pauseCheck);
			video.addEventListener("pause", pauseCheck);

			// this.domElement.appendChild(makeButton("back", function() { media.time-=5; }, "<<"));
			leftAligned.appendChild(playButton);
			// this.domElement.appendChild(makeButton("next", function() { media.time+=5; }, ">>"));

			rightAligned.insertBefore(status, rightAligned.childNodes[0]);
			
			
			// loading
			if(video.readyState >= video.HAVE_FUTURE_DATA)
				this.loading.hide();
			video.addEventListener("canplay", this.loading.hide);
			video.addEventListener("playing", this.loading.hide);
			video.addEventListener("waiting", this.loading.show);
			
			// volume
			var volumebar=document.createElement("div");
			volumebar.addEventListener("click", function(e) { e.stopPropagation(); return false; })
			volumebar.className="bivrost-volume hidden";
			var ticks=[];
			var inVolumeDrag=false;
			for(var i=8; i--; ) {
				var tick=document.createElement("div");
				tick.className="bivrost-volume-tick bivrost-volume-tick-on";
				var setVolumeCond=(function(vol) { return function() {
//					log("cond", arguments[0].type, inVolumeDrag);
					if(inVolumeDrag)
						video.volume=vol; 
					return true;
				}; })((i+1)/8);
				var setVolumeBreak=(function(vol) { return function() { 
					volumebar.classList.add("hidden");
//					log("break", arguments[0].type, inVolumeDrag);
					video.volume=vol; 
					inVolumeDrag=false;
				}; })((i+1)/8);
				var setVolumeStart=(function(vol) { return function() { 
//					log("start", arguments[0].type, inVolumeDrag);
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
				

			var lastVolume=video.volume;
			var volumebutton=makeButton("speaker", function () {
				if(video.volume === 0) {
					if(lastVolume < 1/8)
						lastVolume=1/8;
					video.volume=lastVolume;
				}
				else {
					lastVolume=video.volume;
					video.volume=0;
				}
			}, Math.round(video.volume*100)+"%");
			
			var volumeActive=false;
			volumebutton.addEventListener("mouseover", function() { volumebar.classList.remove("hidden"); volumeActive=true; });
			volumebutton.addEventListener("mouseleave", function() { volumebar.classList.add("hidden"); inVolumeDrag=volumeActive=false; });
			
			// on first touch cancel click, so it doesn't mute automaticaly
			volumebutton.addEventListener("touchstart", function(ev) {
				log("touchstart");
				if(!volumeActive) {
					ev.stopPropagation();
					return false;
				}
			});
			
			video.addEventListener("volumechange", function() {
				log(volumebutton.title=Math.round(video.volume*100)+"%");
				volumebutton.changeIcons(video.volume > 0 ? "speaker" : "mute");
				for(var i=0; i < ticks.length; i++)
					ticks[i].className="bivrost-volume-tick bivrost-volume-tick-"+((video.volume >= (8-i)/8)?"on":"off");
			});
			
			volumebutton.appendChild(volumebar);
			rightAligned.appendChild(volumebutton);
			
		}			
		
		if(media.video) {
			this.player.container.addEventListener("mousemove", this.show.bind(this));
			this.player.container.addEventListener("touchstart", this.show.bind(this));
			this.player.container.addEventListener("touchmove", this.show.bind(this));
			this.show();
		}


		var gyroButton;
		var listenGyro=function() {
			log("listengyro", gyroButton, thisRef.player.input.gyroAvailable);
			if(gyroButton) return;
			if(!thisRef.player.input.gyroAvailable) return;
			gyroButton=makeButton("gyro", function() {
				thisRef.player.input.enableGyro=!thisRef.player.input.enableGyro; 
				gyroButton.changeIcons(thisRef.player.input.enableGyro ? "gyrooff" : "gyro");
			}, "gyroscope");
			rightAligned.insertBefore(gyroButton, fullscreenButton);
			// window.removeEventListener("deviceorientation", listenGyro);
		};
		window.addEventListener("deviceorientation", listenGyro);

		var fullscreenButton=makeButton("fullscreen", function() { thisRef.player.fullscreen=!thisRef.player.fullscreen; }, "fullscreen" );
		rightAligned.appendChild(fullscreenButton);

		this.domElement.appendChild(leftAligned);
		this.domElement.appendChild(rightAligned);



		// protocol
		var urls=[];
		for(var url in media.url)	if(media.url.hasOwnProperty(url)) {
			var a = document.createElement('a');
			a.href=url;
			if(a.href)
				urls.push(a.href);
			else {	// ie fix
				var img = document.createElement('img');
				img.src = url;
				url = img.src;
				img.src = null;
				urls.push(url);
			}
		}

		var protocol="bivrost:"+encodeURIComponent(urls.pop(url));
		var args="";
		var arg=function(name, value) { 
			args+=(args === "") ? "?" : "&";
			args+=encodeURIComponent(name)+"="+encodeURIComponent(value);
		};
		urls.forEach(function(e,i) { arg("alt"+(i || ""), e); });
		arg("version", Bivrost.version);
		arg("stereoscopy", media.stereoscopy);
		arg("projection", media.projection);
		arg("autoplay", this.player.autoplay);
		arg("loop", media.loop);
		bivrostButtonLink+="#"+encodeURI(protocol+args);
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
		this.domElement.classList.remove("hidden");
		if(this._hideTimeoutId)
			clearTimeout(this._hideTimeoutId);
//		log("shown pause timeout, paused=", this._paused);
		if(this.autoHide > 0) {
			this._hideTimeoutId=setTimeout(function() {
//				log("pause, paused=", thisRef._paused);
				if(!thisRef._paused && thisRef.autoHide > 0)
					thisRef.hide();
			} , this.autoHide*1000);
		}
	};
	
	
	Bivrost.UI.prototype._paused=null;
	
	
	Bivrost.UI.prototype.hide=function() {
		this.domElement.classList.add("hidden");
//		log("hidden, paused=", this._paused);
		clearTimeout(this._hideTimeoutId);
	};
	
	Bivrost.UI.prototype._hideTimeoutId=null;
			

	Bivrost.UI.prototype.loading=null;
	
})();