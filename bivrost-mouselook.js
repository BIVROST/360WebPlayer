"use strict";

window.Bivrost=window.Bivrost || {};

Bivrost.MouseLook=(function() {
	
	var log=console.log.bind(console, "[Bivrost.MouseLook]");
	
	
	var DEG2RAD=Math.PI/180.0;
	
	
	function MouseLook(domElement, scale) {
		this.lookEuler=new THREE.Euler(0,-Math.PI/2,0,'YXZ');
		this.lookEulerDelta=new THREE.Euler();
		this.lookQuaternion=new THREE.Quaternion();
		this.vrLookQuaternion=new THREE.Quaternion();
		this._domElement=domElement;
		this.enabled=false;
		
		var originX,originY;

		var originEulerY=0, originEulerX=0;

		var that=this;

		function mousedown(e) {
			that.enabled=true;
			originX=~~(e.x || e.clientX);
			originY=~~(e.y || e.clientY);
			originEulerX=that.lookEuler.x;
			originEulerY=that.lookEuler.y;
		}

		function mouseend(e) {
			that.enabled=false;
		}

		function mousemove(e) {
			if(!that.enabled)
				return;
			var dx=~~(e.x || e.clientX)-originX;
			var dy=~~(e.y || e.clientY)-originY;
			that.lookEuler.x=originEulerX+scale*dy/domElement.offsetHeight;
			that.lookEuler.y=originEulerY+scale*dx/domElement.offsetWidth;
		}

		domElement.addEventListener("mousedown", mousedown);
		domElement.addEventListener("mousemove", mousemove);
		domElement.addEventListener("mouseup", mouseend);
		domElement.addEventListener("mouseout", mouseend);


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
					return;
			};
			e.preventDefault();
			e.stopPropagation();
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
			}
		}

		window.addEventListener("keydown", keydown);
		window.addEventListener("keyup", keyup);
		
		
		this.unattach=function() {
			that._domElement.removeEventListener("mousedown", mousedown);
			that._domElement.removeEventListener("mousemove", mousemove);
			that._domElement.removeEventListener("mouseup", mouseend);
			that._domElement.removeEventListener("mouseout", mouseend);
			window.removeEventListener("keydown", keydown);
			window.removeEventListener("keyup", keyup);
		}
		
		
		// VR controls; based on VRContols.js by dmarcos and mrdoob
		if(navigator.getVRDevices)
			navigator.getVRDevices().then(function(devices) {
				for(var i in devices)
					if(devices.hasOwnProperty(i)) {
						if(devices[i] instanceof PositionSensorVRDevice) {
							that.vrDevice=devices[i];
							log(
								"found VR device",
								"state=", that.vrDevice.getState(),
								"hardwareUnitId=", that.vrDevice.hardwareUnitId, 
								"deviceId=", that.vrDevice.deviceId, 
								"deviceName=", that.vrDevice.deviceName,
								"(using)"
							);
						}
						else {
							log(
								"found VR device, but not PositionSensorVRDevice",
								"hardwareUnitId=", that.vrDevice.hardwareUnitId, 
								"deviceId=", that.vrDevice.deviceId, 
								"deviceName=", that.vrDevice.deviceName,
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
	
	
	MouseLook.prototype.unattach=function() {};
	
	
	MouseLook.prototype.vrDevice=undefined;
	
	
	MouseLook.prototype.gyroOriginQuaternion=undefined;
	MouseLook.prototype.gyroLookQuaternion=new THREE.Quaternion();
	
	
	
	MouseLook.prototype.update=function(dt) {
		this.lookEuler.x+=this.lookEulerDelta.x*dt;
		this.lookEuler.y+=this.lookEulerDelta.y*dt;
		this.lookEuler.z+=this.lookEulerDelta.z*dt;
		
		this.lookQuaternion.setFromEuler(this.lookEuler);
		
		if(this.vrDevice) {
			var vrState=this.vrDevice.getState();
			if(vrState.hasOrientation) {
				this.vrLookQuaternion.copy(vrState.orientation);
				this.lookQuaternion.multiplyQuaternions(this.vrLookQuaternion, this.lookQuaternion);
				return;
			}
		}
		
		if(this.gyroLookQuaternion) {
			this.lookQuaternion.multiplyQuaternions(this.gyroLookQuaternion, this.lookQuaternion);
			return;
		}
	};
	
	MouseLook.prototype.lookDelta=new THREE.Euler();
	MouseLook.prototype.lookEuler=new THREE.Euler();
	MouseLook.prototype.lookQuaternion=new THREE.Quaternion();
	MouseLook.prototype.vrLookQuaternion=new THREE.Quaternion();
	MouseLook.prototype._domElement=undefined;
	MouseLook.prototype.enabled=false;
	MouseLook.prototype.keyboardSpeed=Math.PI*0.5;
	
	return MouseLook;
	
})();