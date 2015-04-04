<!DOCTYPE html>
<html>
	<head>
		<title>Bivrost.js</title>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="stylesheet" type="text/css" href="style.css" />
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
		
		
		<script src="three.js" type="text/javascript"></script>
		<script src="VRControls.js" type="text/javascript"></script>
		<!--<script src="VREffect.js" type="text/javascript"></script>-->
		<script src="OculusRiftEffect.js" type="text/javascript"></script>
		<script src="q.js" type="text/javascript"></script>
		<script src="bivrost-viewer.js" type="text/javascript"></script>
		<script src="bivrost-picture.js" type="text/javascript"></script>
		<script src="bivrost-mouselook.js" type="text/javascript"></script>
		<script src="bivrost-main.js" type="text/javascript"></script>
		<!--<script src="bivrost.js" type="text/javascript"></script>-->
		<script type="text/javascript">
			window.addEventListener("load", function() {			
				var b=new Bivrost.Main(document.getElementById("bivrost_container"));
				
				window.bivrost=b;
					
				Bivrost.Picture.load(<?=json_encode($_GET['file'])?>).then(function(pic){
//					window.viewer=new Bivrost.Viewer(pic);
//					console.log(b);
					
//					pic.stereoscopy=Bivrost.STEREOSCOPY_LEFT_RIGHT;
//					
					b.setPicture(pic);
				});
			});
		</script>
	</body>
</html>
