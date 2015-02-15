<!DOCTYPE html>
<html>
	<head>
		<title>Bivrost.js</title>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="stylesheet" type="text/css" href="style.css" />
	</head>
	<body class="index">
		<ul>
		<?php foreach(glob('scenes/*') as $f): ?>
			<li><a href="show.php?<?=http_build_query(array(
				'file' => $f,
				'mode' => ''
			))?>"><?=$f?></a></li>
		<?php endforeach ?>
		</ul>
	</body>
</html>
