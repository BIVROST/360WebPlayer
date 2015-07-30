<?php 

ini_set('display_errors', true);
error_reporting(E_ALL);

ob_start();
print <<< END_INTRO
// Source minified:
//  Bivrost, http://bivrost360.com
//  THREEjs, http://threejs.org

END_INTRO;
foreach(json_decode(file_get_contents('scripts.json')) as $f) {
	print "\n// file: $f\n";
	readfile($f);
}
$contents=ob_get_flush();

file_put_contents('bivrost-min.js', $contents);
header('Content-Type: application/javascript');

