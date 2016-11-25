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
	
	
	var KEYCODE_LEFT=37;
	var KEYCODE_UP=38;
	var KEYCODE_RIGHT=39;
	var KEYCODE_DOWN=40;
	
	
	/**
	 * This class manages the input of the player - it handles mouse, keyboard and gyro movement
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
		
		this.onMove=new Bivrost.Observable();

		this.lookEuler=new THREE.Euler(0, -Math.PI/2, 0, 'YXZ');
		this.lookEulerDelta=new THREE.Euler();
		this.lookQuaternion=new THREE.Quaternion();
		
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
		
		function touchstartend(ev) {
			thisRef.isTouchInterface=true;
			if(ev.touches.length === 1) {	// one finger touch					
				window.addEventListener("touchmove", touchmove);
				window.addEventListener("touchend", touchstartend);
				inDrag=false;
				var x=~~(ev.touches[0].clientX || ev.touches[0].pageX);
				var y=~~(ev.touches[0].clientY || ev.touches[0].pageY);
				originX=x;
				originY=y;
				originEulerX=thisRef.lookEuler.x;
				originEulerY=thisRef.lookEuler.y;
			}
			else {	// pinch or no fingers - not interesting at the moment
				window.removeEventListener("touchend", touchstartend);
				window.removeEventListener("touchmove", touchmove);
				thisRef._mouseLookInProgress=false;
				
//				if(!inDrag && ev.touches.length === 0)
//					player.fullscreen=true;
			}
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
				return false;
			}
		}
		domElement.addEventListener("touchstart", touchstartend);


		// keyboard controls
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
			window.removeEventListener("selectstart", cancel);
			domElement.removeEventListener("mouseout", mouseout);
			domElement.removeEventListener("mouseover", mouseover);
			domElement.removeEventListener("keydown", keydown);
			domElement.removeEventListener("keyup", keyup);
			domElement.removeEventListener("keypress", keypress);
			
			domElement.removeEventListener("touchstart", touchstartend);
			domElement.removeEventListener("touchend", touchstartend);
			window.removeEventListener("touchmove", touchmove);
		}
		

		// gyroscope controls
		var orientation=new THREE.Quaternion();
		var tempEuler=new THREE.Euler(0, DEG2RAD*-(window.orientation || screen.orientation.angle || 0), 0);
		orientation.setFromEuler(tempEuler);
		
		var lookForward=new THREE.Quaternion();
		tempEuler.set(DEG2RAD*-90, 0, 0);
		lookForward.setFromEuler(tempEuler);
		
		window.addEventListener("deviceorientation", function(ev) {
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
		});
		
		window.addEventListener("orientationchange", function() { 
			var orient=DEG2RAD*(window.orientation || screen.orientation.angle || 0);
			if(isNaN(orient))
				throw "screen orientation? "+window.orientation;
			tempEuler.set(0, -orient, 0);
			orientation.setFromEuler(tempEuler);
		});
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
	
	
	
	/**
	 * Event handler that fires when the position is changed by mouse, keyboard or touch
	 * @type {Bivrost.Observable}
	 */
	Bivrost.Input.prototype.onMove;
	

	/**
	 * Is true if there was at least one touch event
	 */
	Bivrost.Input.prototype.isTouchInterface=false;
	
	

	
})();
