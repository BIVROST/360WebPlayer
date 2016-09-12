/* global Bivrost, THREE */
"use strict";

Bivrost.Projection = function() { };


Bivrost.Projection.prototype.attach = function(sceneLeft, sceneRight) {
	sceneLeft.add(this.meshLeft);
	sceneRight.add(this.meshRight);
};

Bivrost.Projection.prototype.meshLeft = null;

Bivrost.Projection.prototype.meshRight = null;

Bivrost.Projection.prototype.create = function(texture, args) { throw "not implemented"; };


Bivrost.Projection.prototype.dispose = function() {
	if(this.meshLeft) {
		this.meshLeft.material.dispose();
		this.meshLeft.geometry.dispose();
		this.meshLeft = null;
	}

	if(this.meshRight) {
		this.meshRight.material.dispose();
		this.meshRight.geometry.dispose();
		this.meshRight = null;
	}
	
	// TODO: detach from scenes
};

Bivrost.Projection.prototype.applyStereoscopy = function(stereoscopy) {
	Bivrost.Stereoscopy.transform(stereoscopy, this.meshLeft, this.meshRight, null);
};

Bivrost.Projection.store = new Bivrost.Store("projection");
