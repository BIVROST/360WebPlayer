"use strict";

window.Bivrost=window.Bivrost || {};

Bivrost.VRMODE_NONE=501;
// Bivrost.VRMODE_OCULUS_RIFT_DK1=502;
Bivrost.VRMODE_OCULUS_RIFT_DK2=503;
Bivrost.AVAILABLE_VRMODES=[
	Bivrost.VRMODE_NONE, 
	Bivrost.VRMODE_OCULUS_RIFT_DK2
];


Bivrost.reverseConstToName=function(constValue) {
	for(var k in Bivrost)
		if(Bivrost[k] === constValue)
			return k;
	return undefined;
//	throw "const value "+k+" not found";
};


(function(){
	
	var log=console.log.bind(console, "[Bivrost.Main]");

	
	/**
	 * @constructor
	 * @class Bivrost.Main
	 * @param {HTMLElement} container
	 * @param {string} [url=null]
	 * @param {number} [projection=Bivrost.PROJECTION_EQUIRECTANGULAR]
	 * @param {number} [stereoscopy=Bivrost.STEREOSCOPY_NONE]
	 * @param {number} [source=Bivrost.SOURCE_AUTODETECT_FROM_EXT]
	 * @returns {Bivrost.Picture}
	 */
	Bivrost.Main=function(container, url, projection, stereoscopy, source) {
		this._clock=new THREE.Clock();
		
		this.renderer=new THREE.WebGLRenderer();		
		var mainDom=this.renderer.domElement;
		container.appendChild(mainDom);
		container.setAttribute("tabindex", 1337);
		this.container=container;
		
		var uiDiv=document.createElement("div");
		uiDiv.className="ui";
		container.appendChild(uiDiv);
		this.ui=new Bivrost.UI(uiDiv, this);
		

		// http://stackoverflow.com/a/14139497/785171
		window.addEventListener("resize", this.resize.bind(this));
		
		container.addEventListener("dblclick", this.fullscreenToggle.bind(this));
		
		container.addEventListener("keypress", this.keyPress.bind(this));
		
		this.mouseLook=new Bivrost.MouseLook(container, 1);
		
		this.riftRenderer=new THREE.OculusRiftEffect(this.renderer);
		
		// fullscreen
		var onFullscreenChange=this.onFullscreenChange.bind(this);
		document.addEventListener("fullscreenchange", onFullscreenChange);
		document.addEventListener("fullscreenchange", onFullscreenChange);
		document.addEventListener("webkitfullscreenchange", onFullscreenChange);
		document.addEventListener("mozfullscreenchange", onFullscreenChange);
		document.addEventListener("MSFullscreenChange", onFullscreenChange);
		
		this._loopBound=this.loop.bind(this);
		this.loop();
		
		this.resize();
		
		if(url) {
			new Bivrost.Picture(url, this.setPicture.bind(this), projection, stereoscopy, source);
		}
		
		// TODO:
		// if(hmd detected)
		//   riftmode is default in fullscreen
	};

	
	Bivrost.Main.prototype={
			
		mouseLook: null,
		
		
		container: null,
		
		
		ui: null,
		
		
		picture: null,
		
		
		viewer: null,
		
		
		renderer: null,
		
		
		riftRenderer: null,


		loop: function() {
			var dt=this._clock.getDelta();
			this.mouseLook.update(dt);
			var pos=0;
			
			if(this.viewer) {
				switch(this.isFullscreen?this._vrMode:Bivrost.VRMODE_NONE) {
	//				case Bivrost.VRMODE_OCULUS_RIFT_DK1:	// TODO: inne parametry
					case Bivrost.VRMODE_OCULUS_RIFT_DK2:
						this.viewer.renderStereo(this.riftRenderer.render2.bind(this.riftRenderer), this.mouseLook, pos);
						break;
					case Bivrost.VRMODE_NONE:
						this.viewer.renderMono(this.renderer.render.bind(this.renderer), this.mouseLook, pos);
						break;
				}
			} //else
			//	console.log("waiting for viewer");
			
			requestAnimationFrame(this._loopBound);
		},


		/**
		 * @param {Bivrost.Picture} picture
		 * @returns {Bivrost.Picture}
		 */
		setPicture: function(picture) {
			log("picture set", picture);
			this.picture=picture;
			this.viewer=new Bivrost.Viewer(picture);
			this.viewer.aspect=this.aspect;
			this.ui.setPicture(picture);
			picture.play();
			return picture;
		},
		
		
		resize: function() {
			var width=this.container.offsetWidth;
			var height=this.container.offsetHeight;
			if(height === 0) {
				log("guess height from w=", width, "and aspect=", this.aspect);
				height=width/this.aspect;
				this.container.style.height=height+"px";
			}
			
			log("size", width, height);
			if(this.riftRenderer) {
				this.riftRenderer.HMD.hResolution=width;
				this.riftRenderer.HMD.vResolution=height;
				this.riftRenderer.setSize(width, height);
			}
			this.renderer.setSize(width, height, false);
			//this.container.style.width=width+"px";
			this.aspect=width/height;
			if(this.viewer)
				this.viewer.aspect=this.aspect;
//			this.renderer.setViewport(0, 0, width, height);
		},


		aspect: 4/3,

		
		_vrMode: Bivrost.VRMODE_NONE,
		
		
		setVRMode: function(mode) {
			this._vrMode=mode;
			this.resize();
		},
		
		
		_sizeBeforeFullscreen: null,
		
		
		fullscreenEnter: function() {
			if(this.isFullscreen) {
				console.warn("already in fullscreen");
				return;
			}
			
			var elem=this.container;
			
			if(!this._sizeBeforeFullscreen)
				this._sizeBeforeFullscreen=[elem.offsetWidth, elem.offsetHeight];
			log("fullscreen enter, stored size", this._sizeBeforeFullscreen);
			
			(
				elem.requestFullscreen 
				|| elem.msRequestFullscreen 
				|| elem.mozRequestFullScreen
				|| elem.webkitRequestFullscreen 
				|| function() {throw "fullscreen not supported";}
			).call(elem, this.hmd && {vrDisplay: this.hmd} || undefined);			/// TODO: wypuścić hmd na zewnątrz
		},
		
		
		fullscreenExit: function() {
			if(!this.isFullscreen) {
				console.warn("not in fullscreen");
				return;
			}
			
			(
				document.exitFullscreen
				|| document.mozCancelFullScreen 
				|| document.webkitExitFullscreen 
				|| document.msExitFullscreen 
				|| function() {throw "exiting fullscreen not supported";}
			).call(document);
		},
		
		
		fullscreenToggle: function() {
			if(this.isFullscreen)
				this.fullscreenExit();
			else {
				if(this.mouseLook.vrDevice && this.mouseLook.vrDevice.getState().hasOrientation)
					this.setVRMode(Bivrost.VRMODE_OCULUS_RIFT_DK2);
				this.fullscreenEnter();
			}
		},
		
		
		isFullscreen: false,
		
		
		onFullscreenChange: function() {
			this.isFullscreen=(
				document.fullscreenElement ||
				document.webkitFullscreenElement ||
				document.mozFullScreenElement ||
				document.msFullscreenElement
			) === this.container;
	
			if(!this.isFullscreen) {
				log("fullscreen exit, resize to", this._sizeBeforeFullscreen);
				this.renderer.setSize(this._sizeBeforeFullscreen[0], this._sizeBeforeFullscreen[1], true);
			}
	
			setTimeout(this.resize.bind(this), 0);
		},
		
		
		keyPress: function(e) {
			switch(e.key || String.fromCharCode(e.which)) {
				case "f": case "F":
					this.fullscreenToggle();
					break;
					
				case "v": case "V":
					if(!this.isFullscreen)
						this.fullscreenEnter();
					this.setVRMode(Bivrost.AVAILABLE_VRMODES[(Bivrost.AVAILABLE_VRMODES.indexOf(this._vrMode)+1) % Bivrost.AVAILABLE_VRMODES.length]);
					break;
				
				case "s": case "S": break; // TODO: toggle stereoscopy mode
				
				case "i": case "I": break; // TODO: show picture info

				// z/Z - zoom
				case "z": 
					this.viewer.zoom/=0.95; 
					break;
				case "Z": 
					this.viewer.zoom*=0.95; 
					break;
					
				// space - play/pause
				case " ":
					this.picture.pauseToggle();
					break;
					
				// r - rewind
				case "r": case "R":
					this.picture.rewind();
					break;
					
				// [/] - seek 5 sec
				case "[":
					this.picture.time-=5;
					break;
				case "]":
					this.picture.time+=5;
					break;
					
				case "w": break // TODO: picture.width--;
				case "W": break // TODO: picture.width++;
				case "h": break // TODO: picture.height--;
				case "H": break // TODO: picture.height++;
				case "x": break // TODO: picture.woffset--;
				case "X": break // TODO: picture.woffset++;
				case "y": break // TODO: picture.hoffset--;
				case "Y": break // TODO: picture.hoffset++;
					
				default:
					return true;
			};
			
			e.preventDefault();
			e.stopPropagation();
			return false;
		},
		

		dispose: function() {
			// TODO: picture.dispose
		},


		_clock: null
		
	};
	
})();