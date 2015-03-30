<!DOCTYPE html>
<html>
	<head>
		<title>Bivrost.js</title>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="stylesheet" type="text/css" href="style.css" />
	</head>
	<body class="show">
		<p>Lorem ipsum dolor sit amet enim. Suspendisse et netus et malesuada velit sed eros. Fusce venenatis tristique, urna luctus tellus ante ipsum dolor sit amet, consectetuer lectus. Curabitur volutpat quam molestie aliquam. Etiam aliquam vehicula vitae, ullamcorper ut, rutrum ut, faucibus orci et lacus at lacus diam justo, hendrerit sollicitudin quis, tincidunt tellus. Fusce enim. Maecenas eget urna. Nulla facilisi. Phasellus vulputate tempus ornare vitae, fringilla sem vel lorem. Sed in quam velit, a mauris. Etiam varius risus facilisis enim. Aenean ipsum ut quam elit nibh, mollis aliquam, purus convallis ligula felis, feugiat pede. Morbi felis tincidunt wisi, eu odio. Vestibulum ante congue eu, eleifend vel, tortor. Phasellus dignissim. Donec odio consequat diam. Fusce nonummy sodales quam. Cum sociis natoque penatibus et ultrices fringilla ligula enim sodales lectus urna a leo. Aliquam gravida tellus non augue. Maecenas eget lectus. Vestibulum ante ipsum dolor tellus tincidunt in, purus. Sed laoreet enim. Quisque quis neque vitae imperdiet tempor, sapien a pellentesque at, lacus. Quisque placerat vestibulum. Nunc eleifend et, tristique ullamcorper. Nam ultrices. Sed mauris quis enim. Duis mauris pulvinar mollis, orci.</p>
		
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
				var b=new Bivrost.Main(document.body);
				
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
