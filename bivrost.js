var width=640, height=480;
var scene, camera, renderer;


var rotatable=[];


function init() {
	scene=new THREE.Scene();
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	document.getElementById("bivrost_pano").appendChild(renderer.domElement);
}


function player_mono(texture, on_play) {
	console.log("[bivrost] loading mono player");

	init();

	camera=new THREE.PerspectiveCamera(75, width/height, 0.1, 1000 );
	scene.add(camera);
	
	var sphere=new THREE.Mesh(
		new THREE.SphereGeometry(3, 20, 20), 
		new THREE.MeshBasicMaterial({
			map: texture,
			overdraw: 0.5,
			side: THREE.BackSide
		})
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
	
	init();
	
	camera=new THREE.PerspectiveCamera(75, width/height, 0.1, 1000 );
	scene.add(camera);
	
	var sphereLeft=new THREE.Mesh(
		new THREE.SphereGeometry(1, 20, 20), 
		new THREE.MeshBasicMaterial({
			map: textureLeft,
			side: THREE.BackSide
		})
	)
	sphereLeft.position.setX(1);
	scene.add(sphereLeft);
	rotatable.push(sphereLeft);
	
	var sphereRight=new THREE.Mesh(
		new THREE.SphereGeometry(1, 20, 20), 
		new THREE.MeshBasicMaterial({
			map: textureRight,
			side: THREE.BackSide
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
		onload || player_mono,
		function progress(xhr) {
			console.log(path + ": "+ (xhr.loaded / xhr.total * 100) + '% loaded' );
		}
	);
}


function load_video(path, onload, width, height) {
	console.log("[bivrost] video loading: "+path);
	var video=document.createElement( 'video' );
	video.width=width || 32;
	video.height=height || 32;
	video.loop=true;
	
	video.addEventListener("loadeddata", function() {
		console.log("[bivrost] video loaded");
		var texture = new THREE.VideoTexture(video);
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
(function(domElement, scale){
	var enabled=false;
	var x,y;
	var w=domElement.offsetWidth;
	var h=domElement.offsetHeight;
	domElement.addEventListener("mousedown", function(e) {
		enabled=true;
		x=e.x;
		y=e.y;
//		console.log("down", e);
	});
	domElement.addEventListener("mouseup", function() {
		enabled=false;
//		console.log("up");
	});
	domElement.addEventListener("mousemove", function(e) {
		if(!enabled)
			return;
		var dx=e.x-x;
		var dy=e.y-y;
		x=e.x;
		y=e.y;
		lookEuler[0]-=scale*dx/width;
		lookEuler[1]-=scale*dy/height;
//		console.log("move", e);
	});
	
})(document.getElementById("bivrost_pano"), 1);


var clock=new THREE.Clock();
function render() {
	var dt=clock.getDelta();

	for(var i in rotatable)
		if(rotatable.hasOwnProperty(i)) {
//			console.log(lookEuler);
			rotatable[i].rotation.x=lookEuler[1];
			rotatable[i].rotation.y=lookEuler[0];
		}
	
//	if(cube) {
////		cube.rotation.x+=dt*.1;
////		cube.rotation.y+=dt*1;
//	}
	
	renderer.render(scene, camera);
	requestAnimationFrame(render);
}
//
load_video("scenes/holland.mp4", function(vid1, onload1) {
	load_video("scenes/holland2.mp4", function(vid2, onload2) {
		player_stereo(vid1, vid2, function(){
			onload1();
			onload2();
		});
	});
} );



//load_video("scenes/holland.mp4");
//load_texture("scenes/holland.jpeg");