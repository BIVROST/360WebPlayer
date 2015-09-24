/* global Bivrost, THREE */
"use strict";


(function(){

	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.View", arguments); };


	function scaleUV(mesh, scale, materialIndex) {
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
	};

	/**
	 * Parses order string to order object
	 * The order string is an 2d array of face names in the order they appear
	 * on the texture. The rows are separated by "," and the faces are one
	 * letter accronyms (also accepts capital letters):
	 *  "f" - front
	 *  "b" - back
	 *  "l" - left
	 *  "r" - right
	 *  "u" - up
	 *  "d" - down
	 *  "-" - unused space
	 * Additionaly two optional modifiers are supported at the end of the string:
	 *  ">90" - rotate clockwise by x degrees (90 in example)
	 *  "<72" - rotate counter clockwise by x degrees (72 in example)
	 *  "+0.01" - crop faces by amount (prevents visible edges)
	 * @example "-u--,blfr,-d-->90+0.002"
	 * @private
	 * @param {string} orderStr
	 * @returns {bivrost-view_L5.orderStringToPositions.pos}
	 */
	function orderStringToPositions(orderStr) {
		var n2i={
			f:1, F:1,
			r:4, R:4,
			b:0, B:0,
			l:5, L:5,
			u:2, U:2,
			d:3, D:3
		};
		var pos={0:null,1:null,2:null,3:null,4:null,5:null,rotate:0,epsilon:0};
		
		var rotateRegex=/([><])(\d+(\.\d+)?)/;
		var match=rotateRegex.exec(orderStr);
		if(match) {
			orderStr=orderStr.replace(match[0], "");
			pos.rotate=({"<":-1,">":1}[match[1]]) * parseFloat(match[2]);
		}
		
		var cropRegex=/\+(\d+(\.\d+)?)/;
		var match=cropRegex.exec(orderStr);
		if(match) {
			orderStr=orderStr.replace(match[0], "");
			pos.epsilon=parseFloat(match[1]);
		}
		
		var orderArr=(orderStr
			.split(",")
			.map(function(row) { return row.split(""); })
		);

		var height=orderArr.length;
		var width=orderArr[0].length;	// TODO: check all
		var he=pos.epsilon/2;
		
		orderArr.forEach(function(row, rowNum) {
			row.forEach(function(face, colNum) {
				if(face === '-') return;
				if(!(face in n2i)) throw "unknown face: "+face;
				pos[n2i[face]]={
					xmin: (colNum+1-he)/width,
					xmax: (colNum+he)/width,
					ymin: (rowNum+he)/height,
					ymax: (rowNum+1-he)/height
				};
			});
		});
		
		log("order: ",orderStr,"->",orderArr,"->",pos);
		
		return pos;
	}



	/**
	 * The View displays the Media, on a more technical side, it manages scenes and cameras
	 * @constructor
	 * @class Bivrost.Media
	 * @param {Bivrost.Media} media
	 */
	Bivrost.View=function(media) {
		// mesh transform declaration: [left, top, width, height] for eyes:
		var left, right, center;
		
		switch(media.stereoscopy) {
			case Bivrost.STEREOSCOPY_MONO:
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
				throw "stereoscopy mode "+(Bivrost.reverseConstToName(media.stereoscopy) || media.stereoscopy)+" unknown";
		}

		this._leftCamera=new THREE.PerspectiveCamera(75, 3/4, 0.1, 1000);
		this._leftCamera.position.setZ(0);
		this._rightCamera=this._leftCamera.clone();

		this._leftScene=new THREE.Scene();
		this._leftScene.add(this._leftCamera);
		this._rightScene=new THREE.Scene();
		this._rightScene.add(this._rightCamera);
		
		var projection=media.projection.split(":")[0];
		var projection_args=media.projection.split(":")[1] || null;
		switch(projection) {
			case Bivrost.PROJECTION_EQUIRECTANGULAR:
				var sphereLeft=new THREE.Mesh(
					new THREE.SphereGeometry(1, 64, 64),
					new THREE.MeshBasicMaterial({
						side: THREE.DoubleSide,
						map: media.texture,
						needsUpdate: true
					})
				);
				var sphereRight=new THREE.Mesh(
					new THREE.SphereGeometry(1, 64, 64),
					new THREE.MeshBasicMaterial({
						side: THREE.DoubleSide,
						map: media.texture,
						needsUpdate: true
					})
				);

				scaleUV(sphereLeft, left);
				scaleUV(sphereRight, right);
				
				this._leftScene.add(sphereLeft);
				this._rightScene.add(sphereRight);
				
				break;
				
			case Bivrost.PROJECTION_CUBEMAP: 
				media.texture.wrapT=media.texture.wrapS=THREE.ClampToEdgeWrapping;
				media.texture.needsUpdate=true;
				var cubeLeft=new THREE.Mesh(
					new THREE.BoxGeometry(1, 1, 1),
					new THREE.MeshBasicMaterial({
						side: THREE.DoubleSide,
						map: media.texture,
						needsUpdate: true
					})
				);
				var cubeRight=new THREE.Mesh(
					new THREE.BoxGeometry(1, 1, 1),
					new THREE.MeshBasicMaterial({
						side: THREE.DoubleSide,
						map: media.texture,
						needsUpdate: true
					})
				);

				var orderPresets={
					"horizontal":"lrdubf<90",
					"two-by-three":"lrd,ubf",
					"facebook":"lrd,ubf+0.01>90",
					"horizontal-cross":"-u--,brfl,-d--",
					"vertical-cross":"-u-,brf,-l-,-d-"
				};
				if(!projection_args)
					projection_args="horizontal";

				var order=orderStringToPositions(orderPresets[projection_args] || projection_args);

				for(var cn=0; cn < 2; cn++) {
					var cube=(cn === 0)?cubeLeft:cubeRight;
					var faces=cube.geometry.faceVertexUvs[0];
					for(var face=0; face < 12; face+=2) {
						var o=order[face/2];
						faces[face+0][0].set(o.xmax,o.ymax);
						faces[face+0][1].set(o.xmax,o.ymin);
						faces[face+0][2].set(o.xmin,o.ymax);
						faces[face+1][0].set(o.xmax,o.ymin);
						faces[face+1][1].set(o.xmin,o.ymin);
						faces[face+1][2].set(o.xmin,o.ymax);
					};
					cube.geometry.uvsNeedUpdate=true;
					cube.rotation.y=THREE.Math.degToRad(order.rotate);
				}
				
				scaleUV(cubeLeft, left);
				scaleUV(cubeRight, right);
				
				this._leftScene.add(cubeLeft);
				this._rightScene.add(cubeRight);
					
				break;
				
			default: throw "only equirectangular media implemented (got: "+media.projection+")";
		}
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
	 * @type {number}
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
	 * @type {number}
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