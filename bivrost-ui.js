"use strict";

window.Bivrost=window.Bivrost || {};


Bivrost.UI=(function() {
	
	var log=console.log.bind(console, "[Bivrost.UI]");
	
	
	/**
	 * @param {HTMLElement} domElement
	 * @param {Bivrost.Main} bivrostMain
	 * @returns {bivrost-ui_L6.UI}
	 */
	function UI(domElement, bivrostMain) {
		this.domElement=domElement;
		this.bivrostMain=bivrostMain;
		
		
		var cancel=function(e) { e.stopPropagation(); return false; };
		domElement.addEventListener("mousedown", cancel);
		domElement.addEventListener("dblclick", cancel);
	}
	
	// TODO: spritesheet
	function makeButton(name, action, alt) {
		var button=document.createElement("span");
		button.className="bivrost-button";
		
		var normalImg=document.createElement("img");
		normalImg.src="bivrost-ui-"+name+".png";
		normalImg.alt=alt || "";
		button.appendChild(normalImg);
		
		var hoverImg=document.createElement("img");
		hoverImg.src="bivrost-ui-"+name+"-hover.png";
		hoverImg.alt="";
		hoverImg.className="bivrost-button-hover";
		button.appendChild(hoverImg);
		
		button.changeIcons=function(newName) {
			normalImg.src="bivrost-ui-"+newName+".png";
			hoverImg.src="bivrost-ui-"+newName+"-hover.png";
		};
		
		button.action=action;
		
		button.addEventListener("click", function() { button.action(); });
		
		return button;
	}
	
	
	function timeFormat(seconds) {
		if(isNaN(seconds))
			return "-";
		return ~~(seconds/60) +":"+ ("00"+ ~~(seconds % 60).toString()).substr(-2);
	}
	
	
	/**
	 * @param {Bivrost.Picture} picture
	 */
	UI.prototype.setPicture=function(picture) {
		var that=this;
		
		var status=document.createElement("span");
		status.className="status";
		
		if(picture.video) {
			var video=picture.video;
			
			var currentTime=document.createElement("span");
			currentTime.textContent=timeFormat(picture.time);
			
			var separator=document.createElement("span");
			separator.textContent="/";
			
			var duration=document.createElement("span");
			duration.textContent=timeFormat(picture.duration);
			status.appendChild(currentTime);
			status.appendChild(separator);
			status.appendChild(duration);

			var range=document.createElement("input");
			range.setAttribute("type", "range");
			range.setAttribute("min", 0);
			range.setAttribute("max", picture.duration || 1);
			
			video.addEventListener("timeupdate", function(e) {
				currentTime.textContent=timeFormat(picture.time);
				range.value=picture.time;
			});
			
			video.addEventListener("durationchange", function(e) {
				duration.textContent=timeFormat(picture.duration);
				range.setAttribute("max", picture.duration || 1);
			});
			
			var rangeChange=function() { picture.time=range.value; };
			range.addEventListener("change", rangeChange);
			range.addEventListener("input", rangeChange);
			
			var playButton=makeButton("play", picture.play.bind(picture), "play");
			
			var pauseCheck=function() {
				if(video.paused || video.ended) {
					playButton.changeIcons("play");
					playButton.action=video.play.bind(video);
				}
				else {
					playButton.changeIcons("pause");
					playButton.action=video.pause.bind(video);
				}
			}
			video.addEventListener("playing", pauseCheck);
			video.addEventListener("stalled", pauseCheck);
			video.addEventListener("stalled", pauseCheck);
			video.addEventListener("play", pauseCheck);
			video.addEventListener("pause", pauseCheck);
			
			
			this.domElement.appendChild(range);
			
			this.domElement.appendChild(makeButton("back", function() { picture.time-=5; }, "<<"));
			this.domElement.appendChild(playButton);
			this.domElement.appendChild(makeButton("next", function() { picture.time+=5; }, ">>"));
			
			this.domElement.appendChild(makeButton("display", function() { that.bivrostMain.fullscreenToggle(); }, "fullscreen" ));
		}
		else {
			status.textContent="";
		}
		
		
		this.domElement.appendChild(status);
	}
	
	UI.prototype.domElement=null;
	
	UI.prototype.bivrostMain=null;
	
	UI.prototype.picture=null;
	
	return UI;
	
})();