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
		this._leftCamera=new THREE.PerspectiveCamera(90, 3/4, 0.1, 1000);
		this._leftCamera.position.setZ(0);
		this._rightCamera=this._leftCamera.clone();

		this._leftScene=new THREE.Scene();
		this._leftScene.add(this._leftCamera);
		this._rightScene=new THREE.Scene();
		this._rightScene.add(this._rightCamera);
		
		var projection_name=media.projection.split(":")[0];
		var projection_args=media.projection.split(":")[1] || null;

		var projection = new (Bivrost.Projection.store.get(projection_name));
		projection.create(media.texture, projection_args);
		projection.applyStereoscopy(media.stereoscopy);
		projection.attach(this._leftScene, this._rightScene);
	};


	/**
	 * Renders one Media in the left and right eye of a stereo render delegate
	 * @param {function(cameras[], scenes[])} renderDelegate, must be run immidiately
	 * @param {Bivrost.Input} look
	 * @param {number} position - 0 is current, -1 is previous, +1 is next, fractions occur during animations (currently unused)
	 */
	Bivrost.View.prototype.renderStereo=function(renderStereoDelegate, look, position) {
		this._leftCamera.quaternion.copy(look.lookQuaternion);
		this._rightCamera.quaternion.copy(look.lookQuaternion);
		renderStereoDelegate([this._leftScene,this._rightScene], [this._leftCamera,this._rightCamera]);
	};


	/**
	 * Renders one Media from a mono perspective
	 * @param {function(camera, scene)} renderMonoDelegate
	 * @param {Bivrost.Input} look
	 * @param {number} position - 0 is current, -1 is previous, +1 is next, fractions occur during animations (currently unused)
	 */
	Bivrost.View.prototype.renderMono=function(renderMonoDelegate, look, position) {
		this._leftCamera.quaternion.copy(look.lookQuaternion);
		renderMonoDelegate(this._leftScene, this._leftCamera);
	};


	/**
	 * Camera aspect ratio
	 * @property {number} aspect
	 * @name Bivrost.View#aspect
	 * @member {number} aspect
	 * @memberOf Bivrost.View#
	 */
	Object.defineProperty(Bivrost.View.prototype, "aspect", {
		get: function() { return this._leftCamera.aspect; },
		set: function(value) {
			log("set aspect: ", value);
			this._leftCamera.aspect=value;
			this._rightCamera.aspect=value;
			this._leftCamera.updateProjectionMatrix();
			this._rightCamera.updateProjectionMatrix();
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
			this._leftCamera.zoom=value;
			this._rightCamera.zoom=value;
			this._leftCamera.updateProjectionMatrix();
			this._rightCamera.updateProjectionMatrix();			
		}
	});

})();