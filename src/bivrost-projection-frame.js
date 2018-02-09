/* global Bivrost */

/**
 * Media will be projected on a quad (resembling a picture frame)
 * @type String
 */
Bivrost.PROJECTION_FRAME="frame";


Bivrost.Projection.Frame = function() { };
Bivrost.extend(Bivrost.Projection.Frame, Bivrost.Projection);


Bivrost.Projection.Frame.prototype.create = function(texture, args) {
	this.dispose();
	
	this.textureWidth = texture.image.videoWidth || texture.image.width;
	this.textureHeight = texture.image.videoHeight || texture.image.height;
	
	this.meshLeft=new THREE.Mesh(
		new THREE.PlaneGeometry(1,1,1),
		new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			map: texture,
			needsUpdate: true
		})
	);
	this.meshLeft.rotateY(Math.PI/2);
	this.meshLeft.translateZ(0.5);
	
	this.meshRight=new THREE.Mesh(
		new THREE.PlaneGeometry(1,1,1),
		new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			map: texture,
			needsUpdate: true
		})
	);
	this.meshRight.rotateY(Math.PI/2);
	this.meshRight.translateZ(0.5);
};


Bivrost.Projection.Frame.prototype.enablePositionalCamera = true;


Bivrost.Projection.Frame.prototype.textureWidth = null;


Bivrost.Projection.Frame.prototype.textureHeight = null;


Bivrost.Projection.Frame.prototype.applyStereoscopy = function(stereoscopy) {
	Bivrost.Projection.prototype.applyStereoscopy.call(this, stereoscopy);
	var stereo=Bivrost.Stereoscopy.find(stereoscopy);
	var aspect=stereo.aspectFunc(this.textureWidth/this.textureHeight);
	this.meshLeft.scale.x=aspect;
	this.meshRight.scale.x=aspect;
};


Bivrost.Projection.store.register(Bivrost.PROJECTION_FRAME, Bivrost.Projection.Frame);
