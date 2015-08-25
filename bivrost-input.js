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
	 * @param {Bivrost.Player} player
	 * @param {HTMLElement} domElement
	 * @param {number} scale - the scale in which mouse events work
	 */
	Bivrost.Input=function(player, domElement, scale) {
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
		var inDrag=false;
		var dragSize=16;
		
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
			// click
			if(player.media && !inDrag)
				player.media.pauseToggle();
			
			isDown=false;
			isIn=false;
			inDrag=false;
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
			
			if(dx*dx + dy*dy > dragSize*dragSize)
				inDrag=true;
		}
		
		function mouseover(e) { isIn=true; }
		
		function mouseout(e) { isIn=false; }
		
		function selectstart(e) { e.preventDefault(); e.stopPropagation(); return false; }

		domElement.addEventListener("mousedown", mousedown);
		domElement.addEventListener("mouseout", mouseout);
		domElement.addEventListener("mouseover", mouseover);
		
		// mouse select cancel
//		domElement.addEventListener("mousedown", function(e) { e.preventDefault(); } );
		domElement.addEventListener("mousemove", function(e) { e.preventDefault(); } );


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

		domElement.setAttribute("tabindex", 1337);	// for keyboard hooks to work
		domElement.addEventListener("keydown", keydown);
		domElement.addEventListener("keyup", keyup);
		
		
		this._keyboardShortcuts={};
		function keypress(e) {
			var keyName=e.key || String.fromCharCode(e.which);
			if(thisRef._keyboardShortcuts[keyName]) {
				thisRef._keyboardShortcuts[keyName]();
				e.preventDefault();
				e.stopPropagation();
			}

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



		// gyroscope controls, based on https://dev.opera.com/articles/w3c-device-orientation-usage/, 
		var deviceEuler = new THREE.Euler();
		var screenTransform = new THREE.Quaternion();
		var minusHalfAngle = - THREE.Math.degToRad(window.orientation || 0) / 2;
		screenTransform.set( 0, Math.sin( minusHalfAngle ), 0, Math.cos( minusHalfAngle ) );
		var worldTransform = new THREE.Quaternion( - Math.sqrt(0.5), 0, 0, Math.sqrt(0.5) ); // - PI/2 around the x-axis
		
		window.addEventListener('deviceorientation', function(ev) {
			if(ev.alpha === null || ev.beta === null || ev.gamma === null)
				return;
			var alpha=THREE.Math.degToRad(ev.alpha);    // roll (clockwise-anticlockwise)
			var beta=THREE.Math.degToRad(ev.beta);      // pitch (up-down)
			var gamma=THREE.Math.degToRad(ev.gamma);    // bank (left-right)
			if (isNaN(alpha) || isNaN(beta) || isNaN(gamma))
				throw "device orientation? "+ev;
			deviceEuler.set(beta, alpha, - gamma, 'YXZ');
			var quat=thisRef._gyroLookQuaternion;
			quat.setFromEuler(deviceEuler);
			quat.multiply(screenTransform);
			quat.multiply(worldTransform);
			if(!thisRef._gyroOriginQuaternion) {
				var originEuler=new THREE.Euler();
				var origin=quat.clone();
				origin.inverse();
				originEuler.setFromQuaternion(origin);
				originEuler.x=0;
				originEuler.z=0;
				origin.setFromEuler(originEuler);
				thisRef._gyroOriginQuaternion=origin;
			}
			quat.multiplyQuaternions(thisRef._gyroOriginQuaternion, quat);
		}, false);
		
		window.addEventListener('orientationchange', function(ev) { 
			var orient=THREE.Math.degToRad(window.orientation);
			log("orient", orient);
			if(isNaN(orient))
				throw "screen orientation? "+window.orientation;
			var minusHalfAngle = - orient / 2;
			screenTransform.set( 0, Math.sin( minusHalfAngle ), 0, Math.cos( minusHalfAngle ) );
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
			this.lookQuaternion.multiplyQuaternions(this.lookQuaternion, this._gyroLookQuaternion);
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
