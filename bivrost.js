var width=640, height=480;
var scene, camera, renderer;


var rotatable=[];
var container;
var textures=[];

function set_size() {
	width=container.offsetWidth;
	height=container.offsetHeight;
	console.log("[Bivrost] resize: "+width+"x"+height);
	renderer.setSize(width, height);	
	if(camera) {
		camera.aspect=width/height;
		camera.updateProjectionMatrix();
	}
}

function init() {
	container=document.body;
	
	scene=new THREE.Scene();
	renderer = new THREE.WebGLRenderer();
	set_size();

	vrEffect=new THREE.VREffect(renderer);

	// http://stackoverflow.com/a/14139497/785171
	window.addEventListener("resize", set_size);
	
	container.appendChild(renderer.domElement);	
}

var vrControls, vrEffect;

function player_mono(texture, on_play) {
	console.log("[bivrost] loading mono player");

	textures=[texture];

	init();

	camera=new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
	scene.add(camera);
	
	vrControls = new THREE.VRControls(camera, function(e){console.warn(e);});	
	
	var material=new THREE.MeshBasicMaterial({
		map: texture,
		side: THREE.DoubleSide
	});
	
	var sphere=new THREE.Mesh(
		new THREE.SphereGeometry(3, 20, 20), 
		material
	);
	scene.add(sphere);
	rotatable.push(sphere);
	
	if(on_play)
		on_play();

	console.log("[bivrost] start mono renderer");
	render();
}


function player_stereo(textureLeft, textureRight, on_play) {
	console.log("[bivrost] loading stereo player");
	
	textures=[textureLeft, textureRight];

	init();
	
	camera=new THREE.PerspectiveCamera(75, width/height, 0.1, 1000 );
	scene.add(camera);
	
	var sphereLeft=new THREE.Mesh(
		new THREE.SphereGeometry(1, 20, 20), 
		new THREE.MeshBasicMaterial({
			map: textureLeft,
			side: THREE.DoubleSide
		})
	)
	sphereLeft.position.setX(1);
	scene.add(sphereLeft);
	rotatable.push(sphereLeft);
	
	var sphereRight=new THREE.Mesh(
		new THREE.SphereGeometry(1, 20, 20), 
		new THREE.MeshBasicMaterial({
			map: textureRight,
			side: THREE.DoubleSide
		})
	);
	sphereRight.position.setX(-1);
	scene.add(sphereRight);
	rotatable.push(sphereRight);
	
	camera.position.setZ(2);
	
	on_play();

	console.log("[bivrost] start stereo renderer");
	render();
}


function load_texture(path, onload) {
	var loader=new THREE.TextureLoader();
	loader.load(
		path,
		function(texture) {
			texture.name="texture:path";
			(onload || player_mono)(texture);
		},
		function progress(xhr) {
			console.log(path + ": "+ (xhr.loaded / xhr.total * 100) + '% loaded' );
		}
	);
}


function load_video(path, onload, width, height) {
	console.log("[bivrost] video loading: "+path);
	var video=document.createElement("video");
	video.width=width || 512;
	video.height=height || 512;
	video.loop=true;
	
	video.addEventListener("loadeddata", function() {
		console.log("[bivrost] video loaded");
		var texture = new THREE.VideoTexture(video);
		texture.name="video:"+path;
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		(onload || player_mono)(texture, function() {
			console.log("[bivrost] playing "+path);
			video.play();
		});
	});
	
	video.src=path;
}


var lookEuler=[0,0,0];
(function(domElement, scale) {
	var enabled=false;
	var originX,originY;
	var reverseWidth=1/domElement.offsetWidth;
	var reverseHeight=1/domElement.offsetHeight;
	
	var originEulerY=0, originEulerX=0;
	
	function mousedown(e) {
		enabled=true;
		originX=~~(e.x || e.clientX);
		originY=~~(e.y || e.clientY);
		originEulerX=lookEuler[0];
		originEulerY=lookEuler[1];
	}
	
	function mouseend(e) {
		enabled=false;
	}
	
	function mousemove(e) {
		if(!enabled)
			return;
		var dx=~~(e.x || e.clientX)-originX;
		var dy=~~(e.y || e.clientY)-originY;
		lookEuler[0]=originEulerX+scale*dx*reverseWidth;
		lookEuler[1]=originEulerY+scale*dy*reverseHeight;
	}
	
	domElement.addEventListener("mousedown", mousedown);
	domElement.addEventListener("mousemove", mousemove);
	domElement.addEventListener("mouseup", mouseend);
	domElement.addEventListener("mouseout", mouseend);
	
	
	function keydown(e) {
		console.log("down", e);
	}
	
	function keyup(e) {
		console.log("up", e);
	}
	
	window.addEventListener("keydown", keydown);
	window.addEventListener("keyup", keyup);

	
})(document.body, -1);


var clock=new THREE.Clock();
function render() {
	var dt=clock.getDelta();

	vrControls.update();

	for(var i in rotatable)
		if(rotatable.hasOwnProperty(i)) {
			rotatable[i].rotation.x=lookEuler[1];
			rotatable[i].rotation.y=lookEuler[0];
		}
	
//	renderer.render(scene, camera);
	vrEffect.render(scene, camera);
	requestAnimationFrame(render);
}

