<?php 
header('Content-Type: application/javascript');
print <<< END_INTRO
// minified
END_INTRO;
foreach(json_decode(file_get_contents('scripts.json')) as $f) {
	print "\n// file: $f\n";
	readfile($f);
}
