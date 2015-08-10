/* global Bivrost, THREE, PositionSensorVRDevice */
"use strict";

(function() {
	
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.Input", arguments); };
	
	
	var DEG2RAD=Math.PI/180.0;
	
	
	var KEYCODE_LEFT=37;
	var KEYCODE_UP=38;
	var KEYCODE_RIGHT=39;
	var KEYCODE_DOWN=40;
	
	
	/**
	 * This class manages the input of the player - it handles mouse, keyboard, gyro and VR headset movement
	 * @constructor
	 * @class Bivrost.Input
	 * @param {HTMLElement} domElement
	 * @param {number} scale - the scale in which mouse events work
	 */
	Bivrost.Input=function(domElement, scale) {
		/**
		 * @type {Bivrost.Input}
		 */
		var thisRef=this;
		
		
		this.lookEuler=new THREE.Euler(0, -Math.PI/2, 0, 'YXZ');
		this.lookEulerDelta=new THREE.Euler();
		this.lookQuaternion=new THREE.Quaternion();
		this.vrLookQuaternion=new THREE.Quaternion();
		
		var isDown=false;
		var isIn=false;
		
		var originX, originY;

		var originEulerY=0, originEulerX=0;

		function mousedown(e) {
			isDown=true;
			isIn=true;
			originX=~~(e.x || e.clientX);
			originY=~~(e.y || e.clientY);
			originEulerX=thisRef.lookEuler.x;
			originEulerY=thisRef.lookEuler.y;
			
			window.addEventListener("mouseup", mouseup);
			window.addEventListener("mousemove", mousemove);
			window.addEventListener("selectstart", selectstart);
			
			domElement.classList.add("grabbing");
			
			return false;
		}

		function mouseup(e) {
			isDown=false;
			isIn=false;
			window.removeEventListener("up", mouseup);
			window.removeEventListener("move", mousemove);
			window.removeEventListener("selectstart", selectstart);
			thisRef._mouseLookInProgress=false;
			domElement.classList.remove("grabbing");
		}

		function mousemove(e) {
			if(!isDown || !isIn)
				return false;
			
			var dx=~~(e.x || e.clientX)-originX;
			var dy=~~(e.y || e.clientY)-originY;
			var revSize=2/(domElement.offsetHeight+domElement.offsetWidth)
			thisRef.lookEuler.x=originEulerX+scale*dy*revSize;
			thisRef.lookEuler.y=originEulerY+scale*dx*revSize;
			thisRef._mouseLookInProgress=true;
		}
		
		function mouseover(e) { isIn=true; }
		
		function mouseout(e) { isIn=false; }
		
		function selectstart(e) { e.preventDefault(); e.stopPropagation(); return false; }

		domElement.addEventListener("mousedown", mousedown);
		domElement.addEventListener("mouseout", mouseout);
		domElement.addEventListener("mouseover", mouseover);


		function keydown(e) {
			switch(e.which) {
				case KEYCODE_DOWN:
					thisRef.lookEulerDelta.x=-scale*thisRef.keyboardSpeed;
					break;
				case KEYCODE_UP:
					thisRef.lookEulerDelta.x=scale*thisRef.keyboardSpeed;
					break;
				case KEYCODE_LEFT:
					thisRef.lookEulerDelta.y=scale*thisRef.keyboardSpeed;
					break;
				case KEYCODE_RIGHT:
					thisRef.lookEulerDelta.y=-scale*thisRef.keyboardSpeed;
					break;
				default:
					return true;
			};
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

		function keyup(e) {
			switch(e.which) {
				case KEYCODE_DOWN:
				case KEYCODE_UP:
					thisRef.lookEulerDelta.x=0;
					break;
				case KEYCODE_LEFT:
				case KEYCODE_RIGHT:
					thisRef.lookEulerDelta.y=0;
					break;
				default:
					return true;
			}
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

		domElement.addEventListener("keydown", keydown);
		domElement.addEventListener("keyup", keyup);
		
		
		this._keyboardShortcuts={};
		function keypress(e) {
			var keyName=e.key || String.fromCharCode(e.which);
			log("keypress", e);
			if(thisRef._keyboardShortcuts[keyName]) {
				log("recognised", keyName);
				thisRef._keyboardShortcuts[keyName]();
				e.preventDefault();
				e.stopPropagation();
			}
			else
				log("unrecognised", keyName, thisRef._keyboardShortcuts);

		};
		domElement.addEventListener("keypress", keypress);
		
		
		this._unattach=function() {
			domElement.removeEventListener("mousedown", mousedown);
			window.removeEventListener("mousemove", mousemove);
			window.removeEventListener("mouseup", mouseup);
			window.removeEventListener("selectstart", selectstart);
			domElement.removeEventListener("mouseout", mouseout);
			domElement.removeEventListener("mouseover", mouseover);
			domElement.removeEventListener("keydown", keydown);
			domElement.removeEventListener("keyup", keyup);
			domElement.removeEventListener("keypress", keypress);
		}
		
		
		
		
		
		// VR controls; based on VRContols.js by dmarcos and mrdoob
		if(navigator.getVRDevices)
			navigator.getVRDevices().then(function(devices) {
				for(var i in devices)
					if(devices.hasOwnProperty(i)) {
						if(devices[i] instanceof PositionSensorVRDevice && devices[i].getState().hasOrientation) {
							thisRef.vrDevice=devices[i];
							log(
								"found VR device",
								"state=", thisRef.vrDevice.getState(),
								"hardwareUnitId=", thisRef.vrDevice.hardwareUnitId, 
								"deviceId=", thisRef.vrDevice.deviceId, 
								"deviceName=", thisRef.vrDevice.deviceName,
								"(using and ignoring other)"
							);
							return;
						}
						else {
							log(
								"found VR device, but no orientation",
								"hardwareUnitId=", devices[i].hardwareUnitId, 
								"deviceId=", devices[i].deviceId, 
								"deviceName=", devices[i].deviceName,
								"(ignored)"
							);
						}
					}
			});
		else
			log("no VR API available, try http://webvr.info");

		// gyroscope controls
		window.addEventListener("deviceorientation", function(ev) {
			var a=DEG2RAD*ev.alpha;	// bank (left-right)
			var b=DEG2RAD*ev.beta; // pitch (up-down)
			var c=DEG2RAD*ev.gamma;
			
			var euler=new THREE.Euler(c,0,0, 'XZY');
			var gyro=new THREE.Quaternion();
			gyro.setFromEuler(euler);
			if(!thisRef._gyroOriginQuaternion) {
				log("deviceorientation: reoriented gyro to ", euler);
				thisRef._gyroOriginQuaternion=gyro.clone();
				thisRef._gyroOriginQuaternion.inverse();
			}
//			that._gyroLookQuaternion.multiplyQuaternions(that._gyroOriginQuaternion, gyro);
		}, false);
	};
	
	
	/**
	 * Unattach events, replaced by construtor
	 * @type {function}
	 */
	Bivrost.Input.prototype.dispose=null;
	
	
	/**
	 * Other keyboard shortcuts required by different modules.
	 * @type {object(string, function())}
	 * @private
	 */
	Bivrost.Input.prototype._keyboardShortcuts={};
	
	
	/**
	 * Maps a keyboard shortcut to an action
	 * @param {string|array<string>} key
	 * @param {function} action
	 * @returns {Bivrost.Input}
	 */
	Bivrost.Input.prototype.registerShortcut=function(key, action) {
		if(this._keyboardShortcuts[key])
			log("remaping keyboard shortcut: ", key);
		var keys=key.map && key || [key];
		for(var i=keys.length-1; i >= 0; i--)
			this._keyboardShortcuts[keys[i]]=action;
		return this;
	};
	
	
	/**
	 * Currently used position sensor
	 * @type {PositionSensorVRDevice}
	 */
	Bivrost.Input.prototype.vrDevice=null;
	
	
	/**
	 * Should the Y axis be clamped
	 * if set to true, the user cannot look much more than to the zenith or nadir
	 * @type {boolean}
	 */
	Bivrost.Input.prototype.clampY=true;
	
	
	/**
	 * Gyroscope origin (start angle)
	 * @private
	 */
	Bivrost.Input.prototype._gyroOriginQuaternion=null;
	
	
	/** 
	 * Gyroscope angle (difference between now and origin)
	 * @private 
	 */
	Bivrost.Input.prototype._gyroLookQuaternion=new THREE.Quaternion();
	
	
	/**
	 * Update runs once per frame
	 * @param {number} dt - the delta time
	 */
	Bivrost.Input.prototype.update=function(dt) {
		this.lookEuler.x+=this.lookEulerDelta.x*dt;
		this.lookEuler.y+=this.lookEulerDelta.y*dt;
		this.lookEuler.z+=this.lookEulerDelta.z*dt;
		
		if(this.clampY && !this._mouseLookInProgress) {
			var clamped=this.lookEuler.x;
			var clamp=Math.PI/2;
			var lerp=dt*3;
			if(lerp > 1) lerp=1;
			if(clamped < -clamp) clamped=-clamp;
			if(clamped > clamp) clamped=clamp;
			this.lookEuler.x=(1-lerp)*this.lookEuler.x+clamped*lerp;
		}
		
		this.lookQuaternion.setFromEuler(this.lookEuler);
		
		if(this.vrDevice) {
			var vrState=this.vrDevice.getState();
			if(vrState.hasOrientation) {
				this.vrLookQuaternion.copy(vrState.orientation);
				this.lookQuaternion.multiplyQuaternions(this.lookQuaternion, this.vrLookQuaternion);
				return;
			}
		}
		
		if(this._gyroLookQuaternion) {
			this.lookQuaternion.multiplyQuaternions(this._gyroLookQuaternion, this.lookQuaternion);
			return;
		}
	};
	
	
	/**
	 * Current movement delta (from keyboard)
	 * @type {THREE.Euler}
	 */
	Bivrost.Input.prototype.lookDelta=new THREE.Euler();
	
	
	/**
	 * Current angle
	 * @type {THREE.Euler}
	 */
	Bivrost.Input.prototype.lookEuler=new THREE.Euler();
	
	
	/**
	 * Look direction - this is the primary output
	 * @type {THREE.Quaternion}
	 */
	Bivrost.Input.prototype.lookQuaternion=new THREE.Quaternion();
	
	
	/**
	 * VR part of the look direction
	 * @type {THREE.Quaternion}
	 */
	Bivrost.Input.prototype.vrLookQuaternion=new THREE.Quaternion();
	
	
	/**
	 * How much rotation per second of keyboard rotation, in radians
	 * @type {number}
	 */
	Bivrost.Input.prototype.keyboardSpeed=Math.PI*0.5;
	
	
	/**
	 * Is the user using the mouse to look around at this moment?
	 * @private
	 * @type {boolean}
	 */
	Bivrost.Input.prototype._mouseLookInProgress=false;
	
})();
