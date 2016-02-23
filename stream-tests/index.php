<?php

	$available_tests=['mp4', 'mp4-cors', 'dash-url', 'dash-shaka', 'dash.js', 'hls-url', 'hls.js', 'smart'];
	$test=filter_input(INPUT_GET, 'test', FILTER_DEFAULT, ['options' => ['default' => $available_tests[0] ]]);
	$sample=filter_input(INPUT_GET, 'sample', FILTER_VALIDATE_BOOLEAN, ['options' => ['default' =>  false ]]);
	$development=filter_input(INPUT_GET, 'development', FILTER_VALIDATE_BOOLEAN, ['options' => ['default' => true ]]);

	$HLS='http://demo.live-fstreams.rambla.be/live-demo/360.stream/playlist.m3u8';
	$DASH='http://demo.live-fstreams.rambla.be/live-demo/360.stream/manifest.mpd';
	$MP4_LOCAL='../demo-source/media/Morskie Oko 5s (mono, 1080p).mp4';
	$MP4_CORS='http://tools.bivrost360.com/webplayer-docs/media/Morskie%20Oko%205s%20(mono,%201080p).mp4';

	// sample content
	if($sample) {
//		$DASH="http://dash.edgesuite.net/envivio/EnvivioDash3/manifest.mpd";
//		$DASH="http://dash.edgesuite.net/dash264/TestCases/1a/netflix/exMPD_BIP_TC1.mpd";
		$DASH="http://bitlivedemo-a.akamaihd.net/mpds/stream.php?streamkey=bitcodin";
		
//		$HLS="http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch2/appleman.m3u8";
		$HLS="https://bitlivedemo-a.akamaihd.net/m3u8s/bitcodin.m3u8";
	}
	
	
	error_log('hit: '.json_encode([
		'ua' => $_SERVER['HTTP_USER_AGENT'],
		'test' => $test,
		'sample' => $sample
	]));
	
	function url(array $overrides) {
		global $test;
		global $development;
		global $sample;
		return "?".  http_build_query(array_merge(array(
			'test' => $test,
			'development' => $development,
			'sample' => $sample
		), $overrides));
	}
	
	function menu($arg, $current, $available) {
		?>
		<span class="menu-<?=$arg?>">
		<?php foreach($available as $k => $v): 
			$label=  is_string($k) ? $k : $v;
		?>
			<?php if($v === $current): ?>
			<strong><?=$label?></strong>
			<?php else: ?>
			<a href="<?=url([$arg => $v])?>"><?=$label?></a>
			<?php endif ?>
		<?php endforeach; ?>
		</span>
		<?php
	}
?>
<!DOCTYPE html>
<html>
	<head>
		<title>Bivrost 360WebPlayer streaming</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=800, initial-scale=1.0">
		
		<?php if($development): ?>
		<link href="../output/bivrost.css" rel="stylesheet" />
		<?php foreach(json_decode(file_get_contents('../scripts.json')) as $js): ?>
		<script src="../<?=$js?>" type="text/javascript"></script>
		<?php endforeach ?>
		<?php else: ?>
		<link href="../output/bivrost.css" rel="stylesheet" />
		<script src="../output/bivrost.js" type="text/javascript"></script>
		<?php endif ?>
		
		<style type="text/css">
			.back { text-decoration:none; text-align:center; padding: 0 1ex; border: 1px solid; margin-right: 1ex; }
			#video { width: 640px; height: 320px; }
			button { padding: 1em; }
			pre { white-space: pre-wrap; word-wrap: break-word; }
		</style>
	</head>
	<body style="width: 750px; margin: 1em auto">


	<header>
		<h1>
			Stream test: <?=$test?>
		</h1>
		<p>
			tests: <?php menu('test', $test, $available_tests) ?>
				
			(sample: <?php menu('sample', $sample, ['yes' => true, 'no' => false]) ?>)
			(devel: <?php menu('development', $development, ['yes' => true, 'no' => false]) ?>)
		</p>
	</header>

	<article>
		<pre id="video_log"></pre>
		
		
		<script type='text/javascript'>
			var video = document.getElementById('video');
			function video_onerror(e) { log("video error:", this, e.target, this.networkState); };
			function video_onload(e) { log("video load:", this, e); };
			window.override_bivrost_video=video;  
			
			var player;
			function play_in_webplayer() {
				log("button: 360WebPlayer");
				player=new Bivrost.Player( document.getElementById("bivrost-container"), {} );
			}
			
			function video_play() {
				window.video = document.getElementById('video');  
				log("button: play");
				video.play();
			}
			
			function video_pause() {
				window.video = document.getElementById('video');  
				log("button: pause");
				video.pause();
			}
			
			function log() {
				console.log.apply(console, arguments);
				document.getElementById("video_log").appendChild(document.createTextNode([].join.call(arguments, " ")+"\n"));
			}

			// source detection:
			log("user agent:", navigator.userAgent);
			var tv=document.createElement("video");
			log("can play mp4:", tv.canPlayType("video/mp4") || "no");
			log("can play webm:", tv.canPlayType("video/webm") || "no");
			log("can play native DASH:", tv.canPlayType("application/dash+xml") || "no");
			
			log(
				"can play native HLS:", 
				[
					'application/vnd.apple.mpegurl',
					'audio/mpegurl',
					'application/x-mpegurl',
					'audio/x-mpegURL',
				]
					.map(function(m) { return tv.canPlayType(m) || "no"; })
					.reduce(function(prev, curr) { 
						var v={ "no": 0, "maybe": 1, "probably": 2 };
						return (v[prev] || 0 > v[curr] || 0) ? prev : curr;
					}, "no")
			);
			
			var vsi=setInterval(function() {
				var video=document.getElementById("video");
				if(!(video.videoWidth > 0)) {
					log("video size: still unknown...");
					return;
				}
				log("video size:", video.videoWidth, "x", video.videoHeight); 
				clearInterval(vsi);
			}, 2500);
		</script>



		
		
		<h2>Source vid:</h2>
		
		<?php switch(@$_GET['test']): default: ?>
			<p>&uparrow; SELECT TEST &uparrow;</p>
	
			
			
		<?php break; case 'mp4': ?>
			<video id="video" src="<?=htmlspecialchars($MP4_LOCAL)?>" width="640" height="480" crossorigin="anonymous" controls></video>
		
			
			
		<?php break; case 'mp4-cors': ?>
			<video id="video" src="<?=htmlspecialchars($MP4_CORS)?>" width="640" height="480" crossorigin="anonymous" controls></video>

			
			
		<?php break; case 'dash-url': ?>
			<video id="video" src="<?=htmlspecialchars($DASH)?>" width="640" height="480" crossorigin="anonymous" controls></video>

			
			
		<?php break; case 'dash-shaka': ?>
			public demo: <a href="http://shaka-player-demo.appspot.com/">http://shaka-player-demo.appspot.com/</a>
			<script src="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/1.6.3/shaka-player.live.js"></script>
			
		    <video id="video" width="640" height="480" crossorigin="anonymous" controls>no HTML5 video</video>
			 <script>
				function initPlayer() {
				  // Install polyfills.
				  shaka.polyfill.installAll();

				  // Find the video element.
				  var video = document.getElementById('video');

				  // Construct a Player to wrap around it.
				  var player = new shaka.player.Player(video);

				  // Attach the player to the window so that it can be easily debugged.
				  window.player = player;

				  // Listen for errors from the Player.
				  player.addEventListener('error', function(event) {
					video_onerror(event);
				  });

				  // Construct a DashVideoSource to represent the DASH manifest.
				  var mpdUrl = <?=json_encode($DASH)?>; //'https://turtle-tube.appspot.com/t/t2/dash.mpd';
				  var estimator = new shaka.util.EWMABandwidthEstimator();
				  var source = new shaka.player.DashVideoSource(mpdUrl, null, estimator);

				  // Load the source into the Player.
				  player.load(source);
				}
				document.addEventListener('DOMContentLoaded', initPlayer);
			  </script>
			
			  
			  
		<?php break; case 'dash.js': ?>
			  
			<script src="http://cdn.dashjs.org/latest/dash.all.min.js"></script>
<!--			<script type="text/javascript">
				document.body.addEventListener("load", function() { Dash.createAll(); });
			</script>
			<video class="dashjs-player" autoplay preload="none" controls="true" id="video">
				<source src="<?=  htmlspecialchars($DASH)?>" type="application/dash+xml"/>
			</video>-->
			
			
			<video id="video" data-dashjs-player autoplay src="<?=  htmlspecialchars($DASH)?>" controls></video>
			
			  
			  
		<?php break; case 'hls-url': ?>
			<video id="video" src="<?=htmlspecialchars($HLS)?>" width="640" height="480" crossorigin="anonymous" controls></video>

			
			
		<?php break; case 'hls.js': ?>
			<script src="https://cdn.rawgit.com/dailymotion/hls.js/master/dist/hls.min.js"></script>
			public demo: <a href="http://dailymotion.github.io/hls.js/demo">http://dailymotion.github.io/hls.js/demo</a>

			<video id="video" width="640" height="480" crossorigin="anonymous" controls></video>
			<script type="text/javascript">
			if(!Hls.isSupported()) {
				alert("HLS.js not supported")
			}
			else {
				var video = document.getElementById('video');  
				var hls = new Hls({debug:true});  
				hls.loadSource(<?= json_encode($HLS)?>);  
				hls.attachMedia(video);  
				hls.on(Hls.Events.MANIFEST_PARSED,function() { log("Hls.Events.MANIFEST_PARSED") });
			}
			</script>

			
			
		<?php break; case 'smart': ?>
			TODO
			
			

		<?php endswitch; ?>
			
		<script type="text/javascript">
			window.override_bivrost_video=document.getElementById('video');  
		</script>
			
		
		<br />
		<button onclick="video_play()">play</button>
		<button onclick="video_pause()">pause</button>
		<button onclick="play_in_webplayer()">360WebPlayer</button>
		<button onclick="bivrost_video_override_loaded(); log('button: override')">override: video loaded</button>
				
		<h2>360WebPlayer:</h2>
		<div id="bivrost-container">
		</div>
		
	</article>
		
	</body>
</html>
