var scene=new THREE.Scene();
var aspect=window.innerWidth / window.innerHeight;
var fov=75;
var camera=new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function render() {
	cube.rotation.x+=0.1;
//	cube.rotation.y+=0.05;
	
	requestAnimationFrame( render );
	renderer.render( scene, camera );
}
render();