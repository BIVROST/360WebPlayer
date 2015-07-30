<!DOCTYPE html>
<html>
	<head>
		<title>Bivrost.js</title>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="stylesheet" type="text/css" href="style.css" />
		<link rel="stylesheet" type="text/css" href="../bivrost.css" />
		<meta http-equiv="X-UA-Compatible" content="IE=Edge"/>
        </head>
	<body class="show">
		
		<article>
			<h1><img src="logo.png" alt="Bivrost" /></h1>

			<a class="rounded" href="index.php">powrót do listy materiałów</a>
			
			<p>Nazwa pliku: <a href="<?=htmlspecialchars($_GET['file'])?>"><tt><?=htmlspecialchars($_GET['file'])?></tt></a></p>
			
			<div id="bivrost_container"></div>

			<p>Skróty klawiszowe playera</p>
			<ul>
				<li><kbd>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</kbd> - play/pauza filmu</li>
				<li><kbd>&uparrow;</kbd> <kbd>&rightarrow;</kbd> <kbd>&downarrow;</kbd> <kbd>&leftarrow;</kbd> lub przeciąganie myszą - rozglądanie się dookoła</li>
				<li><kbd>F</kbd> lub podwójne kliknięcie - pełny ekran</li>
				<li><kbd>V</kbd> - tryb VR (dostępny tylko w pełnym ekranie)</li>
				<li><kbd>R</kbd> - przewinięcie filmu do początku i odtworzenie go</li>
				<li><kbd>[</kbd> / <kbd>]</kbd> - przewinięcie filmu do przodu/tyłu o 5 sekund</li>
				<li><kbd>Z</kbd> / <kbd>shift</kbd>+<kbd>Z</kbd> - zoom (niedostępny w trybie Oculusa)</li>
			</ul>
			
			<p>
				Do oglądania sugerowany
				<a href="http://mozvr.com/downloads/" target="_blank">Firefox Nightly with VR</a>
				lub
				<a href="http://webvr.info/" target="_blank">Chromium branch WebVR</a>.
			</p>
			
			
			
		</article>
		
		
		<?php foreach(json_decode(file_get_contents('../scripts.json')) as $f): ?>
		<script src="../<?=$f?>" type="text/javascript"></script>
		<?php endforeach ?>
		<script type="text/javascript">
			var bivrost=new Bivrost.Player(document.getElementById("bivrost_container"), <?=
				json_encode(
					array_combine(
						$_GET['file'],
						array_fill(0, count($_GET['file']), null)
					)
				)
			?>);			
			<?php if(isset($_GET['file2'])): ?>
			var bivrost2=new Bivrost.Player(document.getElementById("bivrost_container2"), <?=json_encode($_GET['file2'])?>);			
			<?php endif ?>
		</script>
	</body>
</html>
