/* global Bivrost, THREE */

"use strict";


/**
 * Media will be projected on a sphere (also called equirectangular, spherical mercator)
 * @type String
 */
Bivrost.PROJECTION_EQUIRECTANGULAR="equirectangular";


Bivrost.Projection.Equirectangular = function() { };
Bivrost.extend(Bivrost.Projection.Equirectangular, Bivrost.Projection);


Bivrost.Projection.Equirectangular.prototype.create = function(texture, args) {
	this.dispose();
	
	this.meshLeft=new THREE.Mesh(
		new THREE.SphereGeometry(1, 64, 64),
		new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			map: texture,
			needsUpdate: true
		})
	);
	
	this.meshRight=new THREE.Mesh(
		new THREE.SphereGeometry(1, 64, 64),
		new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			map: texture,
			needsUpdate: true
		})
	);
};


Bivrost.Projection.store.register(Bivrost.PROJECTION_EQUIRECTANGULAR, Bivrost.Projection.Equirectangular);
