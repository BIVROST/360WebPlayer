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
		
		button.addEventListener("click", function() { button.action(); });
		
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
		loading.className="bivrost-loading hidden";
		loading.show=function() { loading.className="bivrost-loading"; }
		loading.hide=function() { loading.className="bivrost-loading hidden"; }
		loading.appendChild(document.createElement("div"));
		player.container.appendChild(loading);
		
		var cancel=function(e) { e.stopPropagation(); return false; };
		domElement.addEventListener("mousedown", cancel, true);
		domElement.addEventListener("dblclick", cancel, true);
		domElement.addEventListener("selectionstart", cancel, true);
	};

	
	/**
	 * @param {Bivrost.Media} media
	 */
	Bivrost.UI.prototype.setMedia=function(media) {
		var that=this;
		
		var leftAligned=document.createElement("div");
		leftAligned.className="bivrost-aligned bivrost-left-aligned";
		
		var rightAligned=document.createElement("div");
		rightAligned.className="bivrost-aligned bivrost-right-aligned";
		
		rightAligned.appendChild(makeButton("bivrost", function() { window.open("http://bivrost360.com", "_blank");	}, "powered by Bivrost"));
		
		rightAligned.appendChild(makeButton("oculus", function() { that.player.vrModeEnterOrCycle(); }, "VR" ));
		
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
				}
				else {
					playButton.changeIcons("pause");
					playButton.title="pause";
					playButton.action=video.pause.bind(video);
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
			video.addEventListener("playing", this.loading.hide);
			video.addEventListener("waiting", this.loading.show);
			
			
			// volume
			var volumebar=document.createElement("div");
			volumebar.addEventListener("click", function(e) { e.stopPropagation(); return false; })
			volumebar.className="bivrost-volume";
			var ticks=[];
			for(var i=8; i--; ) {
				var tick=document.createElement("div");
				tick.className="bivrost-volume-tick bivrost-volume-tick-on";
				tick.addEventListener("click", (function(vol) { return function() { log(vol); video.volume=vol; }; })( (i+1)/8) );
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
			
			volumebutton.addEventListener("mouseover", function() { volumebar.className="bivrost-volume"; });
			volumebutton.addEventListener("mouseout", function() { volumebar.className="bivrost-volume hidden"; });
			
			video.addEventListener("volumechange", function() {
				log(volumebutton.title=Math.round(video.volume*100)+"%");
				volumebutton.changeIcons(video.volume > 0 ? "speaker" : "mute");
				for(var i=0; i < ticks.length; i++)
					ticks[i].className="bivrost-volume-tick bivrost-volume-tick-"+((video.volume >= (8-i)/8)?"on":"off");
			});
			
			volumebutton.appendChild(volumebar);
			rightAligned.appendChild(volumebutton);
		}


		rightAligned.appendChild(makeButton("fullscreen", function() { that.player.fullscreen=!that.player.fullscreen; }, "fullscreen" ));

		this.domElement.appendChild(leftAligned);
		this.domElement.appendChild(rightAligned);

		if(this.autoHide > 0) {
			this.player.container.addEventListener("mousemove", this.show.bind(this));
			this.show();
		}
		
		
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
	Bivrost.UI.prototype.autoHide=2;
	
	
	Bivrost.UI.prototype.show=function() {
		this.domElement.className="bivrost-ui";
		if(this._hideTimeoutId)
			clearTimeout(this._hideTimeoutId);
		this._hideTimeoutId=setTimeout(this.hide.bind(this), this.autoHide*1000);
	};
	
	
	Bivrost.UI.prototype.hide=function() {
		this.domElement.className="bivrost-ui hidden";
		clearTimeout(this._hideTimeoutId);
	};
	
	Bivrost.UI.prototype._hideTimeoutId=null;
			

	Bivrost.UI.prototype.loading=null;
	
})();