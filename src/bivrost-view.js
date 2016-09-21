/* global Bivrost, THREE */
"use strict";


(function(){

	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.View", arguments); };


	/**
	 * The View displays the Media, on a more technical side, it manages scenes and cameras
	 * @constructor
	 * @class Bivrost.Media
	 * @param {Bivrost.Media} media
	 */
	Bivrost.View=function(media) {
		this.leftCamera=new THREE.PerspectiveCamera(90, 3/4, 0.1, 1000);
		this.leftCamera.position.setZ(0);
		this.rightCamera=this.leftCamera.clone();

		this.leftScene=new THREE.Scene();
		this.leftScene.add(this.leftCamera);
		this.rightScene=new THREE.Scene();
		this.rightScene.add(this.rightCamera);
		
		var projection_name=media.projection.split(":")[0];
		var projection_args=media.projection.split(":")[1] || null;

		var projection = new (Bivrost.Projection.store.get(projection_name));
		projection.create(media.texture, projection_args);
		projection.applyStereoscopy(media.stereoscopy);
		projection.attach(this.leftScene, this.rightScene);
	};
	
	
	/**
	 * @type {THREE.PerspectiveCamera}
	 */
	Bivrost.View.prototype.leftCamera = null;
	
	
	/**
	 * @type {THREE.PerspectiveCamera}
	 */
	Bivrost.View.prototype.rightCamera = null;

	
	/**
	 * @type {THREE.Scene}
	 */
	Bivrost.View.prototype.leftScene = null;

	
	/**
	 * @type {THREE.Scene}
	 */
	Bivrost.View.prototype.rightScene = null;


	/**
	 * @param {THREE.Quaternion} lookQuaternion
	 */
	Bivrost.View.prototype.updateRotation = function(lookQuaternion) {
		this.leftCamera.quaternion.copy(lookQuaternion);
		this.rightCamera.quaternion.copy(lookQuaternion);
	};


	/**
	 * Camera aspect ratio
	 * @property {number} aspect
	 * @name Bivrost.View#aspect
	 * @member {number} aspect
	 * @memberOf Bivrost.View#
	 */
	Object.defineProperty(Bivrost.View.prototype, "aspect", {
		get: function() { debugger; return this._leftCamera.aspect; },
		set: function(value) {
			log("set aspect: ", value);
			this.leftCamera.aspect=value;
			this.rightCamera.aspect=value;
			this.leftCamera.updateProjectionMatrix();
			this.rightCamera.updateProjectionMatrix();
		}
	});


	/**
	 * Camera zoom
	 * @property {number} zoom
	 * @name Bivrost.View#zoom
	 * @member {number} zoom
	 * @memberOf Bivrost.View#
	 */
	Object.defineProperty(Bivrost.View.prototype, "zoom", {
		get: function() { return this._leftCamera.zoom; },
		set: function(value) {
			if(value < 0.5) value=0.5;
			if(value > 2.0) value=2.0;
			this.leftCamera.zoom=value;
			this.rightCamera.zoom=value;
			this.leftCamera.updateProjectionMatrix();
			this.rightCamera.updateProjectionMatrix();			
		}
	});

})();