/* global Bivrost, THREE */
"use strict";


/**
 * Cubemap, all faces in one row
 * @type String
 */
Bivrost.PROJECTION_CUBEMAP="cubemap";


Bivrost.Projection.Cubemap = function() { };
Bivrost.extend(Bivrost.Projection.Cubemap, Bivrost.Projection);


Bivrost.Projection.Cubemap.prototype.create = function(texture, args) {
	this.dispose();
	
	texture.wrapT=texture.wrapS=THREE.ClampToEdgeWrapping;
	texture.needsUpdate=true;
	
	var size = 100;
	
	this.meshLeft=new THREE.Mesh(
		new THREE.BoxGeometry(size, size, size),
		new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			map: texture,
			needsUpdate: true
		})
	);
	
	this.meshRight=new THREE.Mesh(
		new THREE.BoxGeometry(size, size, size),
		new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			map: texture,
			needsUpdate: true
		})
	);

	var orderPresets={
		"horizontal":"fbu*2d*2lr",
		"two-by-three":"bfu,drl",
		"facebook":"bfu,drl+0.01>90",
		"horizontal-cross":"-u--,frbl,-d-->180",
		"vertical-cross":"-u-,frb,-d-,-l*2-"
	};
	if(!args)
		args="horizontal";

	var order=this.orderStringToPositions(orderPresets[args] || args);

	for(var cn=0; cn < 2; cn++) {
		var cube=(cn === 0) ? this.meshLeft : this.meshRight;
		var faces=cube.geometry.faceVertexUvs[0];
		for(var face=0; face < 12; face+=2) {
			var o=order[face/2] || {};
//						if(face === 0 || face === 10) o.xmax=o.xmin=o.ymax=o.ymin=0.5;
//						else o.xmax=o.xmin=o.ymax=o.ymin=0.1;
			var uv=[
				[o.xmin,o.ymin],
				[o.xmax,o.ymin],
				[o.xmax,o.ymax],
				[o.xmin,o.ymax]
			];

			/// min xxxxxx
			///  A --/ B  y
			///  |  /  |  y
			///  D /-- C  y
			///       max
			var r=o.rot;
			var A=uv[(0+r)%4], B=uv[(1+r)%4], C=uv[(2+r)%4], D=uv[(3+r)%4];
			faces[face+1][1].set(A[0], A[1]);	// A
			faces[face+0][1].set(B[0], B[1]);	// B
			faces[face+1][0].set(B[0], B[1]);	// B
			faces[face+0][0].set(C[0], C[1]);	// C
			faces[face+0][2].set(D[0], D[1]);	// D
			faces[face+1][2].set(D[0], D[1]);	// D
		};
		cube.geometry.uvsNeedUpdate=true;
		cube.rotation.y=THREE.Math.degToRad(order.rotate);
	}
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
Bivrost.Projection.Cubemap.prototype.orderStringToPositions = function(orderStr) {
	var n2i={
		f:0, F:0,
		b:1, B:1,
		u:2, U:2,
		d:3, D:3,
		r:4, R:4,
		l:5, L:5
	};
	var empty={xmin:0,xmax:0,ymin:0,ymax:0};
	var pos={0:empty,1:empty,2:empty,3:empty,4:empty,5:empty,rotate:0,epsilon:0};

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
	var width=0;
	for(var i=0; i < orderArr[0].length; i++)
		if(orderArr[0][i] in n2i || orderArr[0][i] === '-')
			width++;
	var he=pos.epsilon/2;

	orderArr.forEach(function(row, rowNum) {
		for(var i=0, colNum=0; i < row.length; i++, colNum++) {
			var face=row[i];
			var rot=0;
			if(i+2 < row.length && row[i+1] === '*') {
				rot=parseInt(row[i+2]);
				i+=2;
			}
			if(face === '-') continue;
			if(!(face in n2i)) throw "unknown face: "+face;
			// log("face",face, "rot:", rot, "i=",i,"col/row:",colNum,rowNum);
			pos[n2i[face]]={
				xmin: ((width-colNum-1)+1-he)/width,
				xmax: ((width-colNum-1)+he)/width,
				ymin: ((height-rowNum-1)+he)/height,
				ymax: ((height-rowNum-1)+1-he)/height,
				rot: rot
			};
		};
	});

	// log("order: ",orderStr,"->",orderArr,"->",pos);

	return pos;
};


Bivrost.Projection.store.register(Bivrost.PROJECTION_CUBEMAP, Bivrost.Projection.Cubemap);
