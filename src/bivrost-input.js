/* global Bivrost, THREE */
"use strict";

(function() {
	
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.Input", arguments); };
	
	
	var DEG2RAD=Math.PI/180.0;



	var PINCH_ZOOM_SCALE = 3000;
	var WHEEL_ZOOM_SCALE = 1;
		
	
	/**
	 * This class manages the input of the player - it handles mouse, keyboard and gyro movement
	 * @constructor
	 * @class Bivrost.Input
	 * @param {Bivrost.Player} player
	 * @param {HTMLElement} domElement
	 * @param {number} scale - the sensitivity in which mouse and keyboard events work
	 */
	Bivrost.Input=function(player, domElement, scale) {
		/**
		 * @type {Bivrost.Input}
		 */
		var thisRef=this;
		
		this.onMove=new Bivrost.Observable();
		this.onInputMethodAdded=new Bivrost.Observable();

		this.lookEuler=new THREE.Euler(0, -Math.PI/2, 0, 'YXZ');
		this.lookEulerDelta=new THREE.Euler();
		this.lookQuaternion=new THREE.Quaternion();
		
		this.sensitivity=scale;

		/**
		 * Contains the sum of pinch and mousewheel events that may be translated into zoom by the view
		 * @type {number}
		 */
		this.relativeZoom = 0;
		
		var isDown=false;
		var isIn=false;
		var inDrag=false;
		var dragSize=16;
		
		var originX, originY;

		var originEulerY=0, originEulerX=0;

		function mousedown(e) {
			isDown=true;
			isIn=true;
			inDrag=false;
			originX=~~(e.x || e.clientX);
			originY=~~(e.y || e.clientY);
			originEulerX=thisRef.lookEuler.x;
			originEulerY=thisRef.lookEuler.y;
			
			window.addEventListener("mouseup", mouseup);
			window.addEventListener("mousemove", mousemove);
			window.addEventListener("selectstart", cancel);
			
			domElement.classList.add("bivrost-grabbing");
			
			return false;
		}

		function mouseup(e) {
			// click
//			if(player.media && !inDrag && isIn && isDown)
//				player.media.pauseToggle();
			
			isDown=false;
			isIn=false;
			inDrag=false;
			window.removeEventListener("up", mouseup);
			window.removeEventListener("move", mousemove);
			window.removeEventListener("selectstart", cancel);
			thisRef._mouseLookInProgress=false;
			domElement.classList.remove("bivrost-grabbing");
		}

		function mousemove(e) {
			if(!isDown || !isIn)
				return false;
			
			var dx=~~(e.x || e.clientX)-originX;
			var dy=~~(e.y || e.clientY)-originY;
			var revSize=2/(domElement.offsetHeight+domElement.offsetWidth);
			thisRef.lookEuler.x=originEulerX+scale*dy*revSize;
			thisRef.lookEuler.y=originEulerY+scale*dx*revSize;
			thisRef._mouseLookInProgress=true;
			
			if(dx*dx + dy*dy > dragSize*dragSize && !inDrag) {
				inDrag=true;
				thisRef.onMove.publish();
			}
		}
		
		function mouseover(e) { isIn=true; }
		
		function mouseout(e) { isIn=false; }
		
		function cancel(e) { e.preventDefault(); e.stopPropagation(); return false; }

		domElement.addEventListener("mousedown", mousedown);
		domElement.addEventListener("mouseout", mouseout);
		domElement.addEventListener("mouseover", mouseover);
		
		// mouse select cancel
//		domElement.addEventListener("mousemove", function(e) { e.preventDefault(); } );



		// touch events
		
		var inDoubleTap=false;
		var clearDoubleTapTimeoutId=null;
		function clearDoubleTap() { 
			inDoubleTap=false; 
			clearDoubleTapTimeoutId=null;  
		}
		
		var pinchOrigin=undefined;
		var relativeZoomOrigin=undefined;
		function touchPinchMove(ev) {
			if(ev.touches.length < 2)
				return;

			var x1=(ev.touches[0].clientX || ev.touches[0].pageX);
			var y1=(ev.touches[0].clientY || ev.touches[0].pageY);
			var x2=(ev.touches[1].clientX || ev.touches[1].pageX);
			var y2=(ev.touches[1].clientY || ev.touches[1].pageY);

			var pinch = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
			var pinchDiff = pinchOrigin - pinch;
			// log("Distance between fingers: ", pinch, "diff:", pinchDiff);
			if(typeof(pinchOrigin) === "undefined") {
				log("Set pinch origin to", pinch);
				pinchOrigin = pinch;
			}

			thisRef.relativeZoom = relativeZoomOrigin - pinchDiff / (0.5 * (domElement.offsetWidth + domElement.offsetWidth)) * PINCH_ZOOM_SCALE;
		}

		function touchstartend(ev) {		
			thisRef.isTouchInterface=true;
			if(ev.touches.length === 1) {	// one finger touch					
				window.removeEventListener("touchmove", touchPinchMove);
				window.addEventListener("touchmove", touchmove);
				window.addEventListener("touchend", touchstartend);
				inDrag=false;
				pinchOrigin = undefined;
				var x=~~(ev.touches[0].clientX || ev.touches[0].pageX);
				var y=~~(ev.touches[0].clientY || ev.touches[0].pageY);
				originX=x;
				originY=y;
				originEulerX=thisRef.lookEuler.x;
				originEulerY=thisRef.lookEuler.y;
			}
			else if(ev.touches.length === 2) {	// pinch
				window.removeEventListener("touchmove", touchmove);
				window.addEventListener("touchmove", touchPinchMove);
				window.addEventListener("touchend", touchstartend);
				relativeZoomOrigin = thisRef.relativeZoom;
			}
			else {	// no fingers or more than two
				window.removeEventListener("touchend", touchstartend);
				window.removeEventListener("touchmove", touchmove);
				window.removeEventListener("touchmove", touchPinchMove);
				thisRef._mouseLookInProgress=false;
				pinchOrigin = undefined;
//				if(!inDrag && ev.touches.length === 0)
//					player.fullscreen=true;
			}

			if(player.fullscreen && inDoubleTap) {
				log("prevented double tap");
				ev.preventDefault();
				return false;
			}
			
			inDoubleTap=true;
			if(clearDoubleTapTimeoutId)
				clearTimeout(clearDoubleTapTimeoutId);
			clearDoubleTapTimeoutId=setTimeout(clearDoubleTap, 300);
		}
		function touchmove(ev) {
			var x=~~(ev.touches[0].clientX || ev.touches[0].pageX);
			var y=~~(ev.touches[0].clientY || ev.touches[0].pageY);
			var dx=x-originX;
			var dy=y-originY;
			var revSize=2/(domElement.offsetHeight+domElement.offsetWidth);
			
			if(dx*dx + dy*dy > dragSize*dragSize)
				inDrag=true;
				
			if(player.fullscreen) {
				thisRef.lookEuler.x=originEulerX+scale*dy*revSize;
				thisRef.lookEuler.y=originEulerY+scale*dx*revSize;
				thisRef._mouseLookInProgress=true;
				ev.preventDefault();
				ev.stopPropagation();
				thisRef.onMove.publish();
				return false;
			}
		}
		domElement.addEventListener("touchstart", touchstartend);

		// hack for Edge not supporting touchdown, but supporting pointer events
		function pointerdown(ev) {
			if(ev.pointerType === "touch")
				thisRef.isTouchInterface=true;
		}
		window.addEventListener("pointerdown", pointerdown);

		// disable pinch in fullscreen - don't want the UI to be scaled
		function gesturestart(ev) {
			if(player.fullscreen) {
				ev.preventDefault();
				return false;
			}
			return true;
		}
		domElement.addEventListener("gesturestart", gesturestart);


		function wheel(ev) {
			if(!player.fullscreen)
				return;
			ev.preventDefault();
			var px = ev.deltaY;
			thisRef.relativeZoom += px * -WHEEL_ZOOM_SCALE;
		}
		domElement.addEventListener("wheel", wheel);


		this.dispose=function() {
			domElement.removeEventListener("mousedown", mousedown);
			window.removeEventListener("mousemove", mousemove);
			window.removeEventListener("mouseup", mouseup);
			window.removeEventListener("selectstart", cancel);
			domElement.removeEventListener("mouseout", mouseout);
			domElement.removeEventListener("mouseover", mouseover);
			
			domElement.removeEventListener("touchstart", touchstartend);
			domElement.removeEventListener("touchend", touchstartend);
			window.removeEventListener("touchmove", touchmove);
			
			window.removeEventListener("pointerdown", pointerdown);
			domElement.removeEventListener("gesturestart", gesturestart);
			
			domElement.removeEventListener("wheel", wheel);
		};
		

		// keyboard controls
		this.__initKeyboard(player);
		

		// gyroscope controls
		this.__initGyroscope(player);
		
		
		// WebXR and legacy WebVR support
		this.__initWebXR(player);
		this.__initWebVR(player);
	}; 
		
	
	/// REGION: Keyboard
	{
		var KEYCODE_LEFT=37;
		var KEYCODE_UP=38;
		var KEYCODE_RIGHT=39;
		var KEYCODE_DOWN=40;	

		/**
		 * Other keyboard shortcuts required by different modules.
		 * @type {object(string, function())}
		 * @private
		 */
		Bivrost.Input.prototype._keyboardShortcuts={};

		/**
		 * Initiates keyboard support
		 * @param {Bivrost.Input} input
		 * @param {Bivrost.Player} player
		 */
		Bivrost.Input.prototype.__initKeyboard=function(player) {
			var domElement=player.container;
			var input=this;
			
			function keydown(e) {
				switch(e.which) {
					case KEYCODE_DOWN:
						input.lookEulerDelta.x=-input.sensitivity*input.keyboardSpeed;
						break;
					case KEYCODE_UP:
						input.lookEulerDelta.x=input.sensitivity*input.keyboardSpeed;
						break;
					case KEYCODE_LEFT:
						input.lookEulerDelta.y=input.sensitivity*input.keyboardSpeed;
						break;
					case KEYCODE_RIGHT:
						input.lookEulerDelta.y=-input.sensitivity*input.keyboardSpeed;
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
						input.lookEulerDelta.x=0;
						break;
					case KEYCODE_LEFT:
					case KEYCODE_RIGHT:
						input.lookEulerDelta.y=0;
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
				if(input._keyboardShortcuts[keyName]) {
					input._keyboardShortcuts[keyName]();
					e.preventDefault();
					e.stopPropagation();
				}
			};
			domElement.addEventListener("keypress", keypress);
			
			this.dispose=(function(chained) {
				domElement.removeEventListener("keydown", keydown);
				domElement.removeEventListener("keyup", keyup);
				domElement.removeEventListener("keypress", keypress);
				chained.apply(this);
			}).bind(this, this.dispose);
		}
	}
	
	
	
	/// REGION: WebVR
	{
		Bivrost.Input.prototype.vrDisplay = null;
		Bivrost.Input.prototype.vrDisplaySize = { x:undefined, y:undefined };
		Bivrost.Input.prototype.isGearVR = false;

		/**
		 * Initiates WebVR support
		 * @param {Bivrost.Input} input
		 * @param {Bivrost.Player} player
		 */
		Bivrost.Input.prototype.__initWebVR=function(input, player) {
			function installWebVR11Shim() {
				// Copyright 2016 The Chromium Authors. All rights reserved.
				// Use of this source code is governed by a BSD-style license that can be
				// found in the LICENSE file.

				// Installs a shim that emulates functionality from the WebVR "1.1" spec if the
				// browser only exposes WebVR "1.0".
				if ('getVRDisplays' in navigator) {

				  // A lot of Chrome builds to date don't have depthNear and depthFar, even
				  // though they're in the WebVR 1.0 spec. They're more necessary in 1.1.
				  if(!("depthNear" in VRDisplay.prototype)) {
					VRDisplay.prototype.depthNear = 0.01;
				  }

				  if(!("depthFar" in VRDisplay.prototype)) {
					VRDisplay.prototype.depthFar = 10000.0;
				  }

				  // If the browser has a WebVR implementation but does not include the 1.1
				  // functionality patch it with JS.
				  if(!('VRFrameData' in window)) {
					window.VRFrameData = function() {
					  this.leftProjectionMatrix = new Float32Array(16);
					  this.leftViewMatrix = new Float32Array(16);
					  this.rightProjectionMatrix = new Float32Array(16);
					  this.rightViewMatrix = new Float32Array(16);
					  this.pose = null;
					};

					VRDisplay.prototype.getFrameData = (function() {
					  // Borrowed from glMatrix.
					  function mat4_perspectiveFromFieldOfView(out, fov, near, far) {
						var upTan = Math.tan(fov.upDegrees * Math.PI/180.0),
						downTan = Math.tan(fov.downDegrees * Math.PI/180.0),
						leftTan = Math.tan(fov.leftDegrees * Math.PI/180.0),
						rightTan = Math.tan(fov.rightDegrees * Math.PI/180.0),
						xScale = 2.0 / (leftTan + rightTan),
						yScale = 2.0 / (upTan + downTan);

						out[0] = xScale;
						out[1] = 0.0;
						out[2] = 0.0;
						out[3] = 0.0;
						out[4] = 0.0;
						out[5] = yScale;
						out[6] = 0.0;
						out[7] = 0.0;
						out[8] = -((leftTan - rightTan) * xScale * 0.5);
						out[9] = ((upTan - downTan) * yScale * 0.5);
						out[10] = far / (near - far);
						out[11] = -1.0;
						out[12] = 0.0;
						out[13] = 0.0;
						out[14] = (far * near) / (near - far);
						out[15] = 0.0;
						return out;
					  }

					  function mat4_fromRotationTranslation(out, q, v) {
						// Quaternion math
						var x = q[0], y = q[1], z = q[2], w = q[3],
							x2 = x + x,
							y2 = y + y,
							z2 = z + z,

							xx = x * x2,
							xy = x * y2,
							xz = x * z2,
							yy = y * y2,
							yz = y * z2,
							zz = z * z2,
							wx = w * x2,
							wy = w * y2,
							wz = w * z2;

						out[0] = 1 - (yy + zz);
						out[1] = xy + wz;
						out[2] = xz - wy;
						out[3] = 0;
						out[4] = xy - wz;
						out[5] = 1 - (xx + zz);
						out[6] = yz + wx;
						out[7] = 0;
						out[8] = xz + wy;
						out[9] = yz - wx;
						out[10] = 1 - (xx + yy);
						out[11] = 0;
						out[12] = v[0];
						out[13] = v[1];
						out[14] = v[2];
						out[15] = 1;

						return out;
					  };

					  function mat4_translate(out, a, v) {
						var x = v[0], y = v[1], z = v[2],
							a00, a01, a02, a03,
							a10, a11, a12, a13,
							a20, a21, a22, a23;

						if (a === out) {
						  out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
						  out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
						  out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
						  out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
						} else {
						  a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
						  a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
						  a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

						  out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
						  out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
						  out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

						  out[12] = a00 * x + a10 * y + a20 * z + a[12];
						  out[13] = a01 * x + a11 * y + a21 * z + a[13];
						  out[14] = a02 * x + a12 * y + a22 * z + a[14];
						  out[15] = a03 * x + a13 * y + a23 * z + a[15];
						}

						return out;
					  };

					  function mat4_invert(out, a) {
						var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
							a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
							a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
							a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

							b00 = a00 * a11 - a01 * a10,
							b01 = a00 * a12 - a02 * a10,
							b02 = a00 * a13 - a03 * a10,
							b03 = a01 * a12 - a02 * a11,
							b04 = a01 * a13 - a03 * a11,
							b05 = a02 * a13 - a03 * a12,
							b06 = a20 * a31 - a21 * a30,
							b07 = a20 * a32 - a22 * a30,
							b08 = a20 * a33 - a23 * a30,
							b09 = a21 * a32 - a22 * a31,
							b10 = a21 * a33 - a23 * a31,
							b11 = a22 * a33 - a23 * a32,

							// Calculate the determinant
							det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

						if (!det) {
						  return null;
						}
						det = 1.0 / det;

						out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
						out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
						out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
						out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
						out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
						out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
						out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
						out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
						out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
						out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
						out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
						out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
						out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
						out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
						out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
						out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

						return out;
					  };

					  function mat4_multiply(out, a, b) {
						var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
							a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
							a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
							a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

						// Cache only the current line of the second matrix
						var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
						out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
						out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
						out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
						out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

						b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
						out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
						out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
						out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
						out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

						b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
						out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
						out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
						out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
						out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

						b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
						out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
						out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
						out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
						out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
						return out;
					  };

					  var defaultOrientation = new Float32Array([0, 0, 0, 1]);
					  var defaultPosition = new Float32Array([0, 0, 0]);

					  function updateEyeMatrices(projection, view, pose, parameters, vrDisplay) {
						mat4_perspectiveFromFieldOfView(projection, parameters.fieldOfView, vrDisplay.depthNear, vrDisplay.depthFar);

						var orientation = pose.orientation;
						var position = pose.position;
						if (!orientation) { orientation = defaultOrientation; }
						if (!position) { position = defaultPosition; }

						mat4_fromRotationTranslation(view, orientation, position);
						mat4_translate(view, view, parameters.offset);
						mat4_invert(view, view);
					  }

					  return function(frameData) {
						var pose = this.getPose();
						if (!pose)
						  return false;

						frameData.pose = pose;
						frameData.timestamp = pose.timestamp;

						updateEyeMatrices(
							frameData.leftProjectionMatrix, frameData.leftViewMatrix,
							pose, this.getEyeParameters("left"), this);
						updateEyeMatrices(
							frameData.rightProjectionMatrix, frameData.rightViewMatrix,
							pose, this.getEyeParameters("right"), this);

						return true;
					  };
					})();
				  }
				}

			}
			installWebVR11Shim();

			if(!navigator.getVRDisplays) {
				log("WebVR: WebVR not supported");
				return;
			}

			var input=this;

			navigator.getVRDisplays().then(function (displays) {
				// TODO: support more than one
				if (displays.length > 0) {
					input.vrDisplay = displays[0];

					var eyeLeft = input.vrDisplay.getEyeParameters("left");
					var eyeRight = input.vrDisplay.getEyeParameters("right");

					var width = eyeLeft.renderWidth + eyeRight.renderWidth;
					var height = Math.max(eyeLeft.renderWidth, eyeRight.renderWidth);

					// Samsung Internet Beta lies about resolution of connected devices. 
					// As of 2016-09-20, GearVR supports devices of only one resolution - 2560x1440
					// - SM-G920x (S6)
					// - SM-G925x (S6 Edge)
					// - SM-G928x (S6 Edge+)
					// - SM-G930x (S7)
					// - SM-G935x (S7 Edge)
					// - SM-N910x (Note 4)
					// - SM-N920x (Note 5)
					// - SM-N930x (Note 7)
					if(/SAMSUNG\s+(SM-G920.|SM-G925.|SM-G928.|SM-G930.|SM-G935.|SM-N910.|SM-N920.|SM-N930.)/.test(navigator.userAgent)) {
						log("WebVR: Overriding reported resolution for known Samsung device");
						width = 2560;
						height = 1440;
						input.isGearVR = true;
					}

					input.vrDisplaySize.x=width;
					input.vrDisplaySize.y=height;

					log("WebVR: Found VR Display with size: "+width+"x"+height);
					input.onInputMethodAdded.publish(input);
				}
				else {
					log("WebVR: No VR Displays found");
				}
			});
		}
	}
	
	
	
	/// REGION: WebXR
	{
		Bivrost.Input.prototype.xrAvailable = false;
		// Bivrost.Input.prototype.vrDisplaySize = { x:undefined, y:undefined };

		/**
		 * Initiates WebXR support
		 * @param {Bivrost.Input} input
		 * @param {Bivrost.Player} player
		 */
		Bivrost.Input.prototype.__initWebXR=function(input, player) {
			if(!navigator.xr) {
				log("WebVR: WebVR not supported");
				return;
			}

			var input=this;

			navigator.xr.isSessionSupported('immersive-vr').then(function(supported) {
				if (supported) {
					// input.vrDisplay = displays[0];

					// var eyeLeft = input.vrDisplay.getEyeParameters("left");
					// var eyeRight = input.vrDisplay.getEyeParameters("right");

					// var width = eyeLeft.renderWidth + eyeRight.renderWidth;
					// var height = Math.max(eyeLeft.renderWidth, eyeRight.renderWidth);

					// input.vrDisplaySize.x=width;
					// input.vrDisplaySize.y=height;

					// log("WebVR: Found VR Display with size: "+width+"x"+height);
					// input.onInputMethodAdded.publish(input);
					input.xrAvailable = true;
					log("WebXR: supported")
				}
				else {
					log("WebXR: No VR Displays found");
				}
			});
		};
	}


	/// REGION: Gyroscope
	{
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
		 * Interactive events on player call this as a placeholder to activate permissions.
		 * Overloaded when required.
		 */
		Bivrost.Input.prototype.handlePermissions=function() {};


		Bivrost.Input.prototype.__initGyroscope=function(player) {
			var thisRef=this;
			
			var yAngle=0;
			if(window.orientation)
				yAngle=window.orientation;
			if(screen.orientation)
				yAngle=screen.orientation.angle;
			
			var orientation=new THREE.Quaternion();
			var tempEuler=new THREE.Euler(0, DEG2RAD*-yAngle, 0);
			orientation.setFromEuler(tempEuler);

			var lookForward=new THREE.Quaternion();
			tempEuler.set(DEG2RAD*-90, 0, 0);
			lookForward.setFromEuler(tempEuler);

			function handleDeviceOrientation(ev) {
				if(ev.alpha === null || ev.beta === null || ev.gamma === null)
					return;
				var alpha=DEG2RAD*ev.alpha;    // roll (clockwise-anticlockwise)
				var beta=DEG2RAD*ev.beta;      // pitch (up-down)
				var gamma=DEG2RAD*ev.gamma;    // yaw (left-right)
				if (isNaN(alpha) || isNaN(beta) || isNaN(gamma))
					throw "device orientation? "+ev;
				tempEuler.set(beta, alpha, -gamma, 'YXZ');
				var quat=thisRef._gyroLookQuaternion;
				quat.setFromEuler(tempEuler);
				quat.multiply(orientation);
				quat.multiply(lookForward);
				if(!thisRef._gyroOriginQuaternion) {	// regenerate origin
					var origin=quat.clone();
					origin.inverse();
					tempEuler.setFromQuaternion(origin);
					tempEuler.x=0;	// keep only
					tempEuler.z=0;	//   yaw in origin
					origin.setFromEuler(tempEuler);
					thisRef._gyroOriginQuaternion=origin;
					thisRef.gyroAvailable=true;
				}
				quat.multiplyQuaternions(thisRef._gyroOriginQuaternion, quat);
			};
			
			function handleOrientationChange() { 
				var orient=DEG2RAD*(window.orientation || (screen.orientation && screen.orientation.angle) || 0);
				if(isNaN(orient))
					throw "screen orientation? "+window.orientation;
				tempEuler.set(0, -orient, 0);
				orientation.setFromEuler(tempEuler);
			}
			
			if(typeof(DeviceOrientationEvent) != "undefined" && DeviceOrientationEvent.requestPermission)
			{
				var permissionAsked = false;
				var prevHandlePermissions = this.handlePermissions;

				var handlePermissionsWrapped = function() {
					thisRef.handlePermissions();
				};

				this.handlePermissions = function() {
					if(prevHandlePermissions) prevHandlePermissions();

					if(permissionAsked) return;

					log("Permission ask handler executing for deviceorientation...");
					
					DeviceOrientationEvent
						.requestPermission()
						.then(function(response) {
							log("Permission ask handler for deviceorientation: " + response);
							if (response == "granted") {
								window.addEventListener("deviceorientation", handleDeviceOrientation);
							}
							permissionAsked = true;
							window.removeEventListener("click", handlePermissionsWrapped);
							window.removeEventListener("mousedown", handlePermissionsWrapped);
						})
						.catch(console.error);
				};

				// listen for gyro at first available moment
				window.addEventListener("click", handlePermissionsWrapped);
				window.addEventListener("mousedown", handlePermissionsWrapped);
			}
			else
			{
				window.addEventListener("deviceorientation", handleDeviceOrientation);
			}

			window.addEventListener("orientationchange", handleOrientationChange);
			
			this.dispose=(function(chained){
				window.removeEventListener("deviceorientation", handleDeviceOrientation);
				window.removeEventListener("orientationchange", handleOrientationChange);
				chained.apply(this);
			}).bind(this, this.dispose);
		}
		
		
		/**
		 * Is looking around with a gyroscope enabled?
		 * @private
		 */
		Bivrost.Input.prototype._enableGyro=false;


		/**
		 * Is looking around with a gyroscope enabled?
		 */
		Object.defineProperty(Bivrost.Input.prototype, "enableGyro", {
			set: function(value) { 
				value=!!value;
				if(value === this._enableGyro)
					return;
				this._enableGyro=value;
				this._gyroOriginQuaternion=null;

				// when off, sets the new position (with gyro data) to the lookEuler
				if(!value) {
					this.lookEuler.setFromQuaternion(this.lookQuaternion);
					this.lookEuler.z=0;
				}
				else {	// when turning on, remove euler up-down
					this.lookEuler.x=0;
				}
			},
			get: function() { return this._enableGyro; }
		});
	}
	
	
	/**
	 * Unattach events, replaced by construtor
	 * @type {function}
	 */
	Bivrost.Input.prototype.dispose=null;

	
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
	 * Should the Y axis be clamped
	 * if set to true, the user cannot look much more than to the zenith or nadir
	 * @type {boolean}
	 */
	Bivrost.Input.prototype.clampY=true;
	
	
	/**
	 * The sensitivity in which mouse and keyboard events work
	 * @type {number}
	 */
	Bivrost.Input.prototype.sensitivity=Math.PI/2;
	
	
	
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
		
		if(this.enableGyro && this._gyroLookQuaternion) {
//  			this.lookQuaternion.multiplyQuaternions(this.lookQuaternion, this._gyroLookQuaternion);
//			this.lookQuaternion.multiplyQuaternions(this._gyroLookQuaternion, this.lookQuaternion);
			this.lookQuaternion.copy(this._gyroLookQuaternion);
			
			var yaw = new THREE.Quaternion();
			yaw.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), this.lookEuler.y );
			this.lookQuaternion.multiplyQuaternions(yaw, this.lookQuaternion);
			
			var pitch = new THREE.Quaternion();
			var right=new THREE.Vector3( 1, 0, 0 );
//			this.lookQuaternion.multiplyVector3(right);
			right.applyQuaternion(this.lookQuaternion);
			pitch.setFromAxisAngle( right, this.lookEuler.x );
			this.lookQuaternion.multiplyQuaternions(pitch, this.lookQuaternion);
			
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
	
	
	/**
	 * Event handler that fires when the position is changed by mouse, keyboard or touch
	 * @type {Bivrost.Observable}
	 */
	Bivrost.Input.prototype.onMove;
	

	/**
	 * Event called whenever an input capability is added (touch, gyroscope, webvr etc)
	 * @type {Bivrost.Observable}
	 */
	Bivrost.Input.prototype.onInputMethodAdded;


	/**
	 * Is true if there was at least one touch event
	 */
	Bivrost.Input.prototype.isTouchInterface=false;
	
	
	
})();
