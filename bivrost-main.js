"use strict";

window.Bivrost=window.Bivrost || {};

Bivrost.VRMODE_NONE=501;
// Bivrost.VRMODE_OCULUS_RIFT_DK1=502;
Bivrost.VRMODE_OCULUS_RIFT_DK2=503;
Bivrost.AVAILABLE_VRMODES=[
	Bivrost.VRMODE_NONE, 
	Bivrost.VRMODE_OCULUS_RIFT_DK2
];


(function(){
	
	var log=console.log.bind(console, "[Bivrost.Main]");

	
	/**
	 * @constructor
	 * @class Bivrost.Main
	 * @param {HTMLElement} container
	 */
	Bivrost.Main=function(container) {
		this._clock=new THREE.Clock();
		
		this.renderer=new THREE.WebGLRenderer();		
		var mainDom=this.renderer.domElement;
		container.appendChild(mainDom);
		
		mainDom.setAttribute("tabindex", 1337);

		// http://stackoverflow.com/a/14139497/785171
		window.addEventListener("resize", this.resize.bind(this));
		this.resize();
		
		mainDom.addEventListener("dblclick", this.toggleFullscreen.bind(this));
		
		mainDom.addEventListener("keypress", this.keyPress.bind(this));
		
		this.mouseLook=new Bivrost.MouseLook(mainDom, 1);
		
		this.riftRenderer=new THREE.OculusRiftEffect(this.renderer);
//		this.riftRenderer.
		
		this._loopBound=this.loop.bind(this);
		this.loop();
		
		// TODO:
		// if(hmd detected)
		//   riftmode is default in fullscreen
	};
	
	/// TEMP viewer
	var scene=new THREE.Scene();
	var camera=new THREE.PerspectiveCamera(75, 3/4, 0.1, 1000);
	scene.add(camera);
	camera.position.setZ(0);
	var mat,sphere=new THREE.Mesh(
		new THREE.SphereGeometry(1, 20, 20),
		mat=new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide
		})
	);
	scene.add(sphere);	
	
	
	Bivrost.Main.prototype={
			
		mouseLook: null,
		
		
		picture: null,
		
		
		renderer: null,
		
		
		riftRenderer: null,


		loop: function() {
			var dt=this._clock.getDelta();
			this.mouseLook.update(dt);
//			sphere.rotation.x=this.mouseLook.lookEuler[1];
//			sphere.rotation.y=this.mouseLook.lookEuler[0];

			camera.quaternion.copy(this.mouseLook.lookQuaternion);
			
			switch(this._vrMode) {
//				case Bivrost.VRMODE_OCULUS_RIFT_DK1:	// TODO: inne parametry
				case Bivrost.VRMODE_OCULUS_RIFT_DK2:
					this.riftRenderer.render(scene, camera);
					break;
				case Bivrost.VRMODE_NONE:
					this.renderer.render(scene, camera);
					break;
			}
			
			requestAnimationFrame(this._loopBound);
		},


		/**
		 * @param {Bivrost.Picture} picture
		 * @returns {Bivrost.Picture}
		 */
		setPicture: function(picture) {
			log("picture set", picture);
			this.picture=picture;
			mat.map=picture.texture;
			mat.needsUpdate=true;
			picture.play();
			return picture;
		},
		
		
		resize: function() {
			var width=this.renderer.domElement.offsetWidth;
			var height=this.renderer.domElement.offsetHeight;
			log("size", width, height);
//			this.renderer.setSize(width, height);
//			camera=new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
//			this.renderer.setViewport(0, 0, width, height);
			camera.aspect=width/height;
			camera.updateProjectionMatrix();
			this.renderer.setViewport(0, 0, this.renderer.domElement.offsetWidth, this.renderer.domElement.offsetHeight);		
		},

		
		_vrMode: Bivrost.VRMODE_NONE,
		
		
		setVRMode: function(mode) {
			this._vrMode=mode;
			this.resize();
		},
		
				
		_fullscreen: false,
		
		
		_fullscreenLastSize: null,
		

		toggleFullscreen: function() {
			this._fullscreen=!this._fullscreen;
			log("fullscreen", this._fullscreen);
			var elem = this.renderer.domElement;
			switch(this._fullscreen) {
				case true:
					// TODO: bind esc
					this._fullscreenLastSize=[
						this.renderer.domElement.offsetWidth,
						this.renderer.domElement.offsetHeight,
					];
					this.renderer.setSize(screen.width, screen.height);
					(
						elem.requestFullscreen 
						|| elem.msRequestFullscreen 
						|| elem.mozRequestFullScreen
						|| elem.webkitRequestFullscreen 
						|| function() {throw "fullscreen not supported";}
					).call(elem);
					setTimeout(this.resize.bind(this), 0);
					break;
				case false:
					this.renderer.setSize(this._fullscreenLastSize[0], this._fullscreenLastSize[1]);
					(
						document.exitFullscreen
						|| document.mozCancelFullScreen 
						|| document.webkitExitFullscreen 
						|| document.msExitFullscreen 
						|| function() {console.warn("no API to exit fullscreen");}
					).call(document);
					setTimeout(this.resize.bind(this), 0);
					break;
			}
		},
		
		
		keyPress: function(e) {
			switch(e.key) {
				case "f": case "F":
					this.toggleFullscreen();
					break;
					
				case "v": case "V": // TODO: toggle VR mode
					this.setVRMode(Bivrost.AVAILABLE_VRMODES[(Bivrost.AVAILABLE_VRMODES.indexOf(this._vrMode)+1) % Bivrost.AVAILABLE_VRMODES.length]);
					break;
				
				case "s": case "S": break; // TODO: toggle stereoscopy mode
				
				case "i": case "I": break; // TODO: show picture info

				// z/Z - zoom
				case "z": 
					camera.zoom*=0.95; 
					camera.updateProjectionMatrix();
					break;
				case "Z": 
					camera.zoom/=0.95; 
					camera.updateProjectionMatrix();
					break;
					
				case "w": break // TODO: picture.width--;
				case "W": break // TODO: picture.width++;
				case "h": break // TODO: picture.height--;
				case "H": break // TODO: picture.height++;
				case "x": break // TODO: picture.woffset--;
				case "X": break // TODO: picture.woffset++;
				case "y": break // TODO: picture.hoffset--;
				case "Y": break // TODO: picture.hoffset++;
			};
		},
		

		dispose: function() {
			// TODO: picture.dispose
		},


		_clock: null
		
	};
	
})();