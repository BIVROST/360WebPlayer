<!DOCTYPE html>
<html>
	<head>
		<title>Bivrost.js</title>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="stylesheet" type="text/css" href="style.css" />
	</head>
	<body class="show">
		<script src="three.js" type="text/javascript"></script>
		<script src="VRControls.js" type="text/javascript"></script>
		<script src="VREffect.js" type="text/javascript"></script>
		<script src="bivrost.js" type="text/javascript"></script>
		<script type="text/javascript">
			window.addEventListener("load", function() {
				<?php if(preg_match('/\.(jpe?g?|png)$/', $subject)): ?>
				load_texture(<?=json_encode($_GET['file'])?>);
				<?php else: ?>
				load_video(<?=json_encode($_GET['file'])?>);
				<?php endif ?>
			});
		</script>
	</body>
</html>
