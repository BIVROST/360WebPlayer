

/* global Bivrost, THREE */
"use strict";

(function() {
	
	function log(/*vargs...*/) { if(Bivrost.verbose) console.log("[Bivrost.MouseLook] "+Array.prototype.join.call(arguments, " ")); };
	
	
	var DEG2RAD=Math.PI/180.0;
	
	
	Bivrost.MouseLook=function(domElement, scale) {
		this.lookEuler=new THREE.Euler(0,-Math.PI/2,0,'YXZ');
		this.lookEulerDelta=new THREE.Euler();
		this.lookQuaternion=new THREE.Quaternion();
		this.vrLookQuaternion=new THREE.Quaternion();
		
		var isDown=false;
		var isIn=false;
		
		var originX,originY;

		var originEulerY=0, originEulerX=0;

		var that=this;

		function mousedown(e) {
			isDown=true;
			isIn=true;
			originX=~~(e.x || e.clientX);
			originY=~~(e.y || e.clientY);
			originEulerX=that.lookEuler.x;
			originEulerY=that.lookEuler.y;
			
			window.addEventListener("mouseup", mouseup);
			window.addEventListener("mousemove", mousemove);
			window.addEventListener("selectstart", selectstart);
			
			return false;
		}

		function mouseup(e) {
			isDown=false;
			isIn=false;
			window.removeEventListener("up", mouseup);
			window.removeEventListener("move", mousemove);
			window.removeEventListener("selectstart", selectstart);
		}

		function mousemove(e) {
			if(!that.enabled || !isDown || !isIn)
				return false;
			
			var dx=~~(e.x || e.clientX)-originX;
			var dy=~~(e.y || e.clientY)-originY;
			that.lookEuler.x=originEulerX+scale*dy/domElement.offsetHeight;
			that.lookEuler.y=originEulerY+scale*dx/domElement.offsetWidth;
		}
		
		function mouseover(e) { isIn=true; }
		
		function mouseout(e) { isIn=false; }
		
		function selectstart(e) { e.preventDefault(); e.stopPropagation(); return false; }

		domElement.addEventListener("mousedown", mousedown);
		domElement.addEventListener("mouseout", mouseout);
		domElement.addEventListener("mouseover", mouseover);


		var KEYCODE_LEFT=37;
		var KEYCODE_UP=38;
		var KEYCODE_RIGHT=39;
		var KEYCODE_DOWN=40;

		function keydown(e) {
			switch(e.which) {
				case KEYCODE_DOWN:
					that.lookEulerDelta.x=-scale*that.keyboardSpeed;
					break;
				case KEYCODE_UP:
					that.lookEulerDelta.x=scale*that.keyboardSpeed;
					break;
				case KEYCODE_LEFT:
					that.lookEulerDelta.y=scale*that.keyboardSpeed;
					break;
				case KEYCODE_RIGHT:
					that.lookEulerDelta.y=-scale*that.keyboardSpeed;
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
					that.lookEulerDelta.x=0;
					break;
				case KEYCODE_LEFT:
				case KEYCODE_RIGHT:
					that.lookEulerDelta.y=0;
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
		
		
		this.unattach=function() {
			domElement.removeEventListener("mousedown", mousedown);
			window.removeEventListener("mousemove", mousemove);
			window.removeEventListener("mouseup", mouseup);
			window.removeEventListener("selectstart", selectstart);
			domElement.removeEventListener("mouseout", mouseout);
			domElement.removeEventListener("mouseover", mouseover);
			domElement.removeEventListener("keydown", keydown);
			domElement.removeEventListener("keyup", keyup);
		}
		
		
		
		
		
		// VR controls; based on VRContols.js by dmarcos and mrdoob
		if(navigator.getVRDevices)
			navigator.getVRDevices().then(function(devices) {
				for(var i in devices)
					if(devices.hasOwnProperty(i)) {
						if(devices[i] instanceof PositionSensorVRDevice && devices[i].getState().hasOrientation) {
							that.vrDevice=devices[i];
							log(
								"found VR device",
								"state=", that.vrDevice.getState(),
								"hardwareUnitId=", that.vrDevice.hardwareUnitId, 
								"deviceId=", that.vrDevice.deviceId, 
								"deviceName=", that.vrDevice.deviceName,
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

		window.addEventListener("deviceorientation", function(ev) {
			var a=DEG2RAD*ev.alpha;	// bank (left-right)
			var b=DEG2RAD*ev.beta; // pitch (up-down)
			var c=DEG2RAD*ev.gamma;
			
			var euler=new THREE.Euler(c,0,0, 'XZY');
			var gyro=new THREE.Quaternion();
			gyro.setFromEuler(euler);
			if(!that.gyroOriginQuaternion) {
				log("deviceorientation: reoriented gyro to ", euler);
				that.gyroOriginQuaternion=gyro.clone();
				that.gyroOriginQuaternion.inverse();
			}
//			that.gyroLookQuaternion.multiplyQuaternions(that.gyroOriginQuaternion, gyro);
		}, false);
	};
	
	
	Bivrost.MouseLook.prototype.unattach=function() {};
	
	
	Bivrost.MouseLook.prototype.vrDevice=undefined;
	
	
	Bivrost.MouseLook.prototype.clampY=true;
	
	Bivrost.MouseLook.prototype.gyroOriginQuaternion=undefined;
	Bivrost.MouseLook.prototype.gyroLookQuaternion=new THREE.Quaternion();
	
	
	
	Bivrost.MouseLook.prototype.update=function(dt) {
		this.lookEuler.x+=this.lookEulerDelta.x*dt;
		this.lookEuler.y+=this.lookEulerDelta.y*dt;
		this.lookEuler.z+=this.lookEulerDelta.z*dt;
		
		if(this.clampY) {
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
		
		if(this.gyroLookQuaternion) {
			this.lookQuaternion.multiplyQuaternions(this.gyroLookQuaternion, this.lookQuaternion);
			return;
		}
	};
	
	Bivrost.MouseLook.prototype.lookDelta=new THREE.Euler();
	Bivrost.MouseLook.prototype.lookEuler=new THREE.Euler();
	Bivrost.MouseLook.prototype.lookQuaternion=new THREE.Quaternion();
	Bivrost.MouseLook.prototype.vrLookQuaternion=new THREE.Quaternion();
	Bivrost.MouseLook.prototype.enabled=true;
	Bivrost.MouseLook.prototype.keyboardSpeed=Math.PI*0.5;
	
})();