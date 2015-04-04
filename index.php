<!DOCTYPE html>
<html>
	<head>
		<title>Bivrost.js</title>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="stylesheet" type="text/css" href="style.css" />
	</head>
	<body class="index">
		
		<article>
			<h1><img src="logo.png" alt="Bivrost" /></h1>
			
			<ul>
			<?php foreach(glob('scenes/*') as $f): 
				$uri=http_build_query(array(
					'file' => $f
				));
				$name=str_replace('scenes/', '', $f);
				$size=(round(filesize($f)/104857)/10).'MB';
				?>
				<li><a href="show.php?<?=$uri?>"><?=$name?> <span style="file-size">(<?=$size?>)</span></a></li>
			<?php endforeach ?>
			</ul>
			
			<p>
				Do oglądania sugerowany
				<a href="http://mozvr.com/downloads/" target="_blank">Firefox Nightly with VR</a>
				lub
				<a href="http://webvr.info/" target="_blank">Chromium branch WebVR</a>.
			</p>
		</article>
		
	</body>
</html>
