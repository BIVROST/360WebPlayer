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
		
		
		var cancel=function(e) { e.stopPropagation(); return false; };
		domElement.addEventListener("mousedown", cancel);
		domElement.addEventListener("dblclick", cancel);
	}

	
	/**
	 * @param {Bivrost.Media} media
	 */
	Bivrost.UI.prototype.setMedia=function(media) {
		var that=this;
		
		var status=document.createElement("span");
		status.className="status";
		
		if(media.video) {
			var video=media.video;
			
			var currentTime=document.createElement("span");
			currentTime.textContent=timeFormat(media.time);
			
			var separator=document.createElement("span");
			separator.textContent="/";
			
			var duration=document.createElement("span");
			duration.textContent=timeFormat(media.duration);
			status.appendChild(currentTime);
			status.appendChild(separator);
			status.appendChild(duration);

			var range=document.createElement("input");
			range.setAttribute("type", "range");
			range.setAttribute("min", 0);
			range.setAttribute("max", media.duration || 1);
			range.setAttribute("step", 0.025);
			
			video.addEventListener("timeupdate", function(e) {
				currentTime.textContent=timeFormat(media.time);
				range.value=media.time;
			});
			
			video.addEventListener("durationchange", function(e) {
				duration.textContent=timeFormat(media.duration);
				range.setAttribute("max", media.duration || 1);
			});
			
			var rangeChange=function() { media.time=range.value; };
			range.addEventListener("change", rangeChange);
			range.addEventListener("input", rangeChange);
			
			var playButton=makeButton("play", media.play.bind(media), "play");
			
			var pauseCheck=function() {
				if(video.paused || video.ended) {
					playButton.changeIcons("play");
					playButton.action=video.play.bind(video);
				}
				else {
					playButton.changeIcons("pause");
					playButton.action=video.pause.bind(video);
				}
			};
			video.addEventListener("playing", pauseCheck);
			video.addEventListener("stalled", pauseCheck);
			video.addEventListener("play", pauseCheck);
			video.addEventListener("pause", pauseCheck);
			
			
			this.domElement.appendChild(range);
			
			this.domElement.appendChild(makeButton("back", function() { media.time-=5; }, "<<"));
			this.domElement.appendChild(playButton);
			this.domElement.appendChild(makeButton("next", function() { media.time+=5; }, ">>"));
			
			this.domElement.appendChild(makeButton("display", function() { that.player.fullscreen=!that.player.fullscreen; }, "fullscreen" ));
		}
		else {
			status.textContent="";
		}
		
		
		this.domElement.appendChild(status);
	};
	
	
	/**
	 * Container for the UI
	 * @type {HTMLElement}
	 */
	Bivrost.UI.prototype.domElement=null;
	
	
	/**
	 * Reference to the Bivrost player instance
	 */
	Bivrost.UI.prototype.player=null;
	
})();