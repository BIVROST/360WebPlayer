/* global Bivrost */

/**
 * Media will be projected on a half sphere in equirectangular projection
 * @type String
 */
Bivrost.PROJECTION_DOME="dome";


Bivrost.Projection.Dome = function() { };
Bivrost.extend(Bivrost.Projection.Dome, Bivrost.Projection);


Bivrost.Projection.Dome.prototype.create = function(texture, args) {
	this.dispose();
	
	var material = new THREE.ShaderMaterial({
		uniforms: {
		    mainTex: { type: "t", value: texture }
		},
		side: THREE.DoubleSide,
		vertexShader: 
				"varying vec2 vUv;																\n\
				varying vec3 vNormal;															\n\
				void main() {																	\n\
					vUv = uv;																	\n\
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);		\n\
					vNormal = normal;															\n\
				}																				\n",
		fragmentShader: 
				"uniform sampler2D mainTex;														\n\
				varying vec2 vUv;																\n\
				varying vec3 vNormal;															\n\
				void main() {																	\n\
					if(vUv.s > 0.0 && vUv.s < 1.0) {											\n\
						gl_FragColor += texture2D(mainTex, vUv);								\n\
					}																			\n\
					else {																		\n\
						float a = (1.0+vNormal.x) * 0.5;										\n\
						vec2 uv=vec2(0, vUv.t);													\n\
						float d = min(0.5, 2.0 * abs(0.5 - vUv.t));								\n\
						if(vUv.s > 1.0) uv.s = 1.0 - d;											\n\
						else uv.s = d;															\n\
						vec2 center = vec2(0.5, 0.5);											\n\
						for(int i = 0; i < 13; i++) {											\n\
							float t = float(i)/50.0;											\n\
							gl_FragColor += 1.0/13.0 * texture2D(mainTex, uv * t + center * (1.0-t));\n\
						}																		\n\
						gl_FragColor *= a;														\n\
					}																			\n\
				}																				\n"
	});
	

	
	
	var dome = new THREE.SphereGeometry(1, 64, 64);
	var uvs = dome.faceVertexUvs[0];
	for(var i = uvs.length-1; i >= 0; i--) {
		uvs[i][0].x = uvs[i][0].x*2 - 0.5;
		uvs[i][1].x = uvs[i][1].x*2 - 0.5;
		uvs[i][2].x = uvs[i][2].x*2 - 0.5;
	}
	dome.uvsNeedUpdate = true;
	
	this.meshLeft=new THREE.Mesh(
		dome,
		material
	);
	
	this.meshRight=new THREE.Mesh(
		dome,
		material
//		new THREE.MeshBasicMaterial({
//			side: THREE.DoubleSide,
//			map: texture,
//			needsUpdate: true
//		})
	);
};




Bivrost.Projection.store.register(Bivrost.PROJECTION_DOME, Bivrost.Projection.Dome);
