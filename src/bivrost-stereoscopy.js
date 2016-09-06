/* global Bivrost, THREE */
"use strict";


/**
 * Autodetect stereoscopy by keywords and size
 * @type string
 */
Bivrost.STEREOSCOPY_AUTODETECT="autodetect";


/**
 * All available stereoscopy types, filled by Bivrost.Stereoscopy.register
 * @enum {string}
 */
Bivrost.AVAILABLE_STEREOSCOPIES=[
	Bivrost.STEREOSCOPY_AUTODETECT
];


Bivrost.Stereoscopy={
	
	/**
	 * Registered stereoscopy types
	 * @type Array<{ name:string, transformLeft:function(THREE.Mesh), transformRight: function(THREE.Mesh), transformCenter:function(THREE.Mesh), keywords: Array<string>, detectFunc: function(Bivrost.Media):string }>
	 */
	registered: [],
	
	
	/**
	 * Registers a type of stereoscopy
	 * @param {string} name - id of this type
	 * @param {function(THREE.Mesh)} transformLeft - function modyfying an UV map of a mesh for it to be presented as the left eye
	 * @param {function(THREE.Mesh)} transformRight - function modyfying an UV map of a mesh for it to be presented as the right eye
	 * @param {function(THREE.Mesh)} transformCenter - function modyfying an UV map of a mesh for it to be presented as a monoscopic view
	 * @param {?Array<string>} keywords - keywords for filename autodetection of stereoscopy type from filename
	 * @param {function(Bivrost.Media):string} detectFunc - function for autodetection of stereoscopy type from loaded file
	 */
	register: function(name, transformLeft, transformRight, transformCenter, keywords, detectFunc) { 
		if(this.isRegistered(name))
			throw "stereoscopy " + name + " already registered";
		this.registered.push({ 
			name: name,
			transformLeft: transformLeft,
			transformRight: transformRight,
			transformCenter: transformCenter,
			keywords: keywords,
			detectFunc: detectFunc
		});
		Bivrost.AVAILABLE_STEREOSCOPIES.push(name);
		Bivrost.log("Bivrost.Stereoscopy", ["registered", name]);
	},
	
	
	/**
	 * Retrieves a named stereoscopy type
	 * @param {string} name - id of this type
	 * @returns {Object|Bivrost.Stereoscopy.find.s}
	 */
	find: function(name) {
		for(var i = 0; i < this.registered.length; i++) {
			var s = this.registered[i];
			if(s.name === name)
				return s;
		}
		return null;
	},
	
	
	/**
	 * Checkes if a stereoscopy type of that name is registered
	 * @param {string} name - id of this type
	 * @returns {Boolean}
	 */
	isRegistered: function(name) { return !!this.find(name); },
	
	
	/**
	 * A simple version of register method with cropping of the source material to get eye viewports
	 * @param {string} name - id of this type
	 * @param {Array<number>} scaleLeft - crop to get left eye
	 * @param {Array<number>} scaleRight - crop to get right eye
	 * @param {Array<number>} scaleCenter - crop to get mono view
	 * @param {?Array<string>} keywords - keywords for filename autodetection of stereoscopy type from filename
	 * @param {function(Bivrost.Media):string} detectFunc - function for autodetection of stereoscopy type from loaded file
	 */
	registerSimple: function(name, scaleLeft, scaleRight, scaleCenter, keywords, detectFunc) {
		var scaleUV_ = this.scaleUV;
		this.register(
			name,
			function(mesh) { return scaleUV_(mesh, scaleLeft); },
			function(mesh) { return scaleUV_(mesh, scaleRight); },
			function(mesh) { return scaleUV_(mesh, scaleCenter); },
			keywords,
			detectFunc
		);
	},
	
	
	/**
	 * Helper function for cropping UVs
	 * @param {THREE.Mesh} mesh
	 * @param {Array<number>} scale
	 * @param {?number} materialIndex
	 */
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
	
	
	/**
	 * Applies a stereoscopy transform to a set of meshes
	 * @param {string} name - id of the stereoscopy type
	 * @param {?THREE.Mesh} meshLeft
	 * @param {?THREE.Mesh} meshRight
	 * @param {?THREE.Mesh} meshCenter
	 */
	transform: function(name, meshLeft, meshRight, meshCenter) {
		var transforms=this.find(name);
		if(!transforms)
			throw "stereoscopy mode " + name + " unknown";
		if(meshLeft) 
			transforms.transformLeft(meshLeft);
		if(meshRight) 
			transforms.transformRight(meshRight);
		if(meshCenter) 
			transforms.transformCenter(meshCenter);
	},
	
	
	/**
	 * Detects stereoscopy type from filename
	 * @param {string} url
	 * @returns {string}
	 */
	detectByFilename: function(url) {
		// TODO: uridecode?
		for(var i = 0; i < this.registered.length; i++) {
			var s = this.registered[i];
			var keywords = s.keywords;
			if(keywords) {
				var regex = new RegExp("(\\b|_)(" + keywords.join("|") + ")(\\b|_)");
				if(regex.test(url))
					return s.name;
			}
		};
		// on failure to detect, leave as autodetect 
		// for phase 2 detection in detectByProperties
		return Bivrost.STEREOSCOPY_AUTODETECT;
	},
	
	/**
	 * Detects stereoscopy type from media properties
	 * @param {Bivrost.Media} media
	 * @param {number} w width
	 * @param {number} h height
	 * @returns {string}
	 */
	detectByProperties: function(media, w, h) {
		for(var i = 0; i < this.registered.length; i++) {
			var s = this.registered[i];
			if(s.detectFunc && s.detectFunc(media, w, h))
				return s.name;
		}
		
		// on failure to detect, guess mono
		return Bivrost.STEREOSCOPY_MONO;
	}
};

		
/**
 * Side by side stereoscopy
 * keyword: SbS, LR
 * @type string
 */
Bivrost.STEREOSCOPY_SIDE_BY_SIDE="side-by-side";
Bivrost.Stereoscopy.registerSimple(
	Bivrost.STEREOSCOPY_SIDE_BY_SIDE,
	[0.5,0, -0.5,1],
	[1,0, -0.5,1],
	[0.5,0, -0.5,1],
	["SbS", "LR"],
	function(media, w, h) { return w === h*4; }
);


/**
 * Side by side stereoscopy, reversed (left eye on the right, right on the left)
 * keyword: RL
 * @type string
 */
Bivrost.STEREOSCOPY_SIDE_BY_SIDE_REVERSED="side-by-side-reversed";
Bivrost.Stereoscopy.registerSimple(
	Bivrost.STEREOSCOPY_SIDE_BY_SIDE_REVERSED,
	[1,0, -0.5,1],
	[0.5,0, -0.5,1],
	[1,0, -0.5,1],
	["RL"]
);

/**
 * Top and Bottom stereoscopy
 * Left frame is top half, right is bottom
 * keyword: TaB, TB
 * @type string
 */
Bivrost.STEREOSCOPY_TOP_AND_BOTTOM="top-and-bottom";
Bivrost.Stereoscopy.registerSimple(
	Bivrost.STEREOSCOPY_TOP_AND_BOTTOM,
	[1,.5, -1,.5],
	[1,0, -1,.5],
	[1,.5, -1,.5],
	["TaB", "TB"],
	function(media, w, h) { return w === h; }
);


/**
 * Top and Bottom stereoscopy, reversed
 * Right frame is top half, left is bottom
 * @type string
 */
Bivrost.STEREOSCOPY_TOP_AND_BOTTOM_REVERSED="top-and-bottom-reversed";
Bivrost.Stereoscopy.registerSimple(
	Bivrost.STEREOSCOPY_TOP_AND_BOTTOM_REVERSED,
	[1,0, -1,.5],
	[1,.5, -1,.5],
	[1,0, -1,.5],
	null
);


/**
 * Mono, no stereoscopy, default
 * keyword: mono
 * @type string
 */
Bivrost.STEREOSCOPY_MONO="mono";
Bivrost.Stereoscopy.registerSimple(
	Bivrost.STEREOSCOPY_MONO,
	[1,0, -1,1],
	[1,0, -1,1],
	[1,0, -1,1],
	["mono"]
);
