var scene=new THREE.Scene();
var aspect=window.innerWidth / window.innerHeight;
var fov=75;
var camera=new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var cube=null;

var loader=new THREE.TextureLoader();
loader.load(
	"scenes/holland.jpeg", 
	function done(texture) {
		scene.add(cube=new THREE.Mesh(
			new THREE.SphereGeometry(3, 50, 20),
			new THREE.MeshBasicMaterial({
				map: texture,
				overdraw: 0.5,
				side: THREE.BackSide
			})
		));
	}, 
	function progress(xhr) {
		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	}
);

//camera.position.z = 5;


var clock=new THREE.Clock();
function render() {
	var dt=clock.getDelta();
	
	if(cube) {
		cube.rotation.x+=dt*.1;
		cube.rotation.y+=dt*1;
	}
	
	renderer.render( scene, camera );
	requestAnimationFrame( render );
}
render();