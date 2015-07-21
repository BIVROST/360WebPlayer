"use strict";

window.Bivrost=window.Bivrost || {};


/**
 * @class
 * @constructor
 * @param {Bivrost.Picture} picture
 */
Bivrost.Viewer=function(picture) {
	this.picture=picture;
	
	if(picture.projection !== Bivrost.PROJECTION_EQUIRECTANGULAR)
		throw "only equirectangular implemented";
	
	// mesh transform declaration: [left, top, width, height] for eyes:
	var left, right, center;
	
	switch(picture.stereoscopy) {
		case Bivrost.STEREOSCOPY_NONE:
			left=right=center=[1,0, -1,1];
			break;
		case Bivrost.STEREOSCOPY_SIDE_BY_SIDE:
			left=[0.5,0, -0.5,1];
			right=[1,0, -0.5,1];
			center=left;
			break;
		case Bivrost.STEREOSCOPY_TOP_AND_BOTTOM:
			left=[1,.5, -1,.5];
			right=[1,0, -1,.5];
			center=left;
			break;
		case Bivrost.STEREOSCOPY_TOP_AND_BOTTOM_REVERSED:
			left=[1,0, -1,.5];
			right=[1,.5, -1,.5];
			center=left;
			break;
		default:
			throw "stereoscopy mode "+(Bivrost.reverseConstToName(picture.stereoscopy) || picture.stereoscopy)+" unknown";
	}
	
	this._leftCamera=new THREE.PerspectiveCamera(75, 3/4, 0.1, 1000);
	this._leftCamera.position.setZ(0);
	this._rightCamera=this._leftCamera.clone();
	
	var sphereLeft=new THREE.Mesh(
		new THREE.SphereGeometry(1, 50, 50),
		new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			map: this.picture.texture,
			needsUpdate: true
		})
	);
	var sphereRight=new THREE.Mesh(
		new THREE.SphereGeometry(1, 50, 50),
		new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			map: this.picture.texture,
			needsUpdate: true
		})
	);
	
	this.scaleUV(sphereRight, right);
	this.scaleUV(sphereLeft, left);
	
	this._leftScene=new THREE.Scene();
	this._leftScene.add(this._leftCamera);
	this._leftScene.add(sphereLeft);
	
	this._rightScene=new THREE.Scene();
	this._rightScene.add(this._rightCamera);
	this._rightScene.add(sphereRight);
	
	window.sphereLeft=sphereLeft;
	window.sphereRight=sphereRight;
};


Bivrost.Viewer.prototype={
	
	constructor: Bivrost.Viewer,
	
	
	/**
	 * @type Bivrost.Picture
	 */
	picture: undefined,
	
	
	/**
	 * Renders one picture from the left eye
	 * @param {function(cameras[], scenes[])} renderDelegate, must be run immidiately
	 * @param {Bivrost.MouseLook} look
	 * @param {number} position - 0 is current, -1 is previous, +1 is next, fractions occur during animations
	 */
	renderStereo: function(renderStereoDelegate, look, position) {
		this._leftCamera.quaternion.copy(look.lookQuaternion);
		this._rightCamera.quaternion.copy(look.lookQuaternion);
		renderStereoDelegate([this._leftScene,this._rightScene], [this._leftCamera,this._rightCamera]);
	},
	
	
	/**
	 * Renders one picture from a mono perspective
	 * @param {function(camera, scene)} renderMonoDelegate
	 * @param {Bivrost.MouseLook} look
	 * @param {number} position - 0 is current, -1 is previous, +1 is next, fractions occur during animations
	 */
	renderMono: function(renderMonoDelegate, look, position) {
		this._leftCamera.quaternion.copy(look.lookQuaternion);
		renderMonoDelegate(this._leftScene, this._leftCamera);
	},
	
	
	scaleUV: function(mesh, scale, materialIndex) {
		materialIndex=materialIndex || 0;
		var uvs=mesh.geometry.faceVertexUvs[materialIndex];
		for(var faceIndex=uvs.length-1; faceIndex >= 0; faceIndex--) {
			for(var vertexIndex=uvs[faceIndex].length-1; vertexIndex >= 0; vertexIndex--) {
				/** @type {THREE.Vector2} uvs */
				var uv=uvs[faceIndex][vertexIndex];
				uv.x=scale[0]+uv.x*scale[2];
				uv.y=scale[1]+uv.y*scale[3];
			}
		}
		mesh.geometry.uvsNeedUpdate=true;
	},
	
	
	set aspect(value) {
		this._leftCamera.aspect=value;
		this._rightCamera.aspect=value;
		this._leftCamera.updateProjectionMatrix();
		this._rightCamera.updateProjectionMatrix();
	},
	get aspect() {
		return this._leftCamera.aspect;
	},
	
	
	set zoom(value) {
		this._leftCamera.zoom=value;
		this._rightCamera.zoom=value;
		this._leftCamera.updateProjectionMatrix();
		this._rightCamera.updateProjectionMatrix();
	},
	get zoom() {
		return this._leftCamera.zoom;
	}
	
};