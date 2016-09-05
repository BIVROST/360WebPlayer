/* global Bivrost */
"use strict";


/**
 * Autodetect stereoscopy by keywords and size
 * @type string
 */
Bivrost.STEREOSCOPY_AUTODETECT="autodetect";


/**
 * Mono, no stereoscopy, default
 * keyword: mono
 * @type string
 */
Bivrost.STEREOSCOPY_MONO="mono";


/**
 * Top and Bottom stereoscopy
 * Left frame is top half, right is bottom
 * keyword: TaB, TB
 * @type string
 */
Bivrost.STEREOSCOPY_TOP_AND_BOTTOM="top-and-bottom";


/**
 * Side by side stereoscopy
 * keyword: SbS, LR
 * @type string
 */
Bivrost.STEREOSCOPY_SIDE_BY_SIDE="side-by-side";


/**
 * Side by side stereoscopy, reversed (left eye on the right, right on the left)
 * @type string
 */
Bivrost.STEREOSCOPY_SIDE_BY_SIDE_REVERSED="side-by-side-reversed";


/**
 * Top and Bottom stereoscopy, reversed
 * Right frame is top half, left is bottom
 * @type string
 */
Bivrost.STEREOSCOPY_TOP_AND_BOTTOM_REVERSED="top-and-bottom-reversed";


/**
 * All available stereoscopy types, filled by Bivrost.Stereoscopy.register
 * @type Array
 */
Bivrost.AVAILABLE_STEREOSCOPIES=[
	Bivrost.STEREOSCOPY_AUTODETECT
];




Bivrost.Stereoscopy={
	available: {},
	register: function(name, transformLeft, transformRight, transformCenter) { 
		this.available[name] = { 
			transformLeft: transformLeft,
			transformRight: transformRight,
			transformCenter: transformCenter,
		};
	},
	isRegistered: function(name) { return name in this.available; },
	registerSimple: function(name, scaleLeft, scaleRight, scaleCenter) {
		this.register(
			name,
			function(mesh) { return this.ScaleUV(mesh, scaleLeft); },
			function(mesh) { return this.ScaleUV(mesh, scaleRight); },
			function(mesh) { return this.ScaleUV(mesh, scaleCenter); }
		);
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
	transform: function(name, meshLeft, meshRight, meshCenter) {
		var transforms=this.available[name];
		Bivrost.AVAILABLE_STEREOSCOPIES.push(name);
		if(!transforms)
			throw "stereoscopy mode " + name + " unknown";
		if(meshLeft) 
			transforms.transformLeft(meshLeft);
		if(meshRight) 
			transforms.transformRight(meshRight);
		if(meshCenter) 
			transforms.transformCenter(meshCenter);
	}
};


Bivrost.Stereoscopy.registerSimple(
	Bivrost.STEREOSCOPY_MONO,
	[1,0, -1,1],
	[1,0, -1,1],
	[1,0, -1,1]
);


Bivrost.Stereoscopy.registerSimple(
	Bivrost.STEREOSCOPY_SIDE_BY_SIDE,
	[0.5,0, -0.5,1],
	[1,0, -0.5,1],
	[0.5,0, -0.5,1]
);


Bivrost.Stereoscopy.registerSimple(
	Bivrost.STEREOSCOPY_SIDE_BY_SIDE_REVERSED,
	[1,0, -0.5,1],
	[0.5,0, -0.5,1],
	[1,0, -0.5,1]
);


Bivrost.Stereoscopy.registerSimple(
	Bivrost.STEREOSCOPY_TOP_AND_BOTTOM,
	[1,.5, -1,.5],
	[1,0, -1,.5],
	[1,.5, -1,.5]
);


Bivrost.Stereoscopy.registerSimple(
	Bivrost.STEREOSCOPY_TOP_AND_BOTTOM_REVERSED,
	[1,0, -1,.5],
	[1,.5, -1,.5],
	[1,0, -1,.5]
);
