M3U support
===========

HLS: http://demo.live-fstreams.rambla.be/live-demo/360.stream/playlist.m3u8
DASH: http://demo.live-fstreams.rambla.be/live-demo/360.stream/manifest.mpd

Demo HLS content:
http://stackoverflow.com/questions/10104301/hls-streaming-video-url-need-for-testing
https://fish.schou.me/
http://www.dash-player.com/blog/2015/04/10-free-public-mpeg-dash-teststreams-and-datasets/
http://dashif.org/test-vectors/

Wowza says HLS not supported on most platforms (like Chrome)




Huawei P8
---------

machine: Huawei P8
os: Android 5.0.1
browser: Chrome 48
mp4:
mp4-cors: 
dash-url: stream fail
dash-shaka: ok
dash.js: ok
hls-url: ok, very slow start (~60 sec)
hls.js: ok, slow start (~15 sec)

native DASH: no
native HLS: maybe



Tests plan
----------

A video tag with one of video sources in list
bivrost-player always loaded on button press
check all "video.canPlay" types

1. mp4+webm local (control)
2. mp4+webm CORS
3. dash url
4. hls url
5. dash+hls url
6. hls+hls.js
7. dash+mpeg-dash shiv (shakra?)

Run on:

1. Safari 9/OSX
2. Chrome current/OSX
3. Chrome current/Windows 10
4. IE 11/Windows 10
5. Edge/Windows 10
6. Firefox current/OSX
7. Firefox current/Windows 10




Native HLS/DASH
---------------

https://msdn.microsoft.com/en-us/library/dn904193(v=vs.85).aspx:
	HLS and DASH
	Microsoft Edge introduces support for HTTP Live Streaming (HLS) and enhanced supported for MPEG-DASH. These two media streaming protocols automate adaptive streaming, making it simple for web developers to deliver professional quality videos, like live streams, on their web sites without needing a plug-in.
	You can detect HLS or the enhanced DASH manifest support using the canPlayType method:
	HLS: Use one of 4 optional MIME types for HLS .m3u8 files (the first two are recommended):
	video.canPlayType('application/vnd.apple.mpegurl')
	video.canPlayType('audio/mpegurl')
	video.canPlayType('application/x-mpegurl')
	video.canPlayType('audio/x-mpegURL')
	DASH: Use the MIME type for DASH .mpd files:
	video.canPlayType('application/dash+xml')


Safari video CORS
-----------------

DOM security exception 18
failing CORS: http://krpano.com/ios/bugs/ios8-webgl-video-cors/
working not-CORS: http://www.scirra.com/labs/bugs/webglvideo/

https://bugs.webkit.org/show_bug.cgi?id=133511 says the issue is here:
https://trac.webkit.org/browser/trunk/Source/WebCore/html/canvas/CanvasRenderingContext.cpp#L70

What does exactly CORS want?

The header "Access-Control-Allow-Origin: *" is set everywhere in HLS

Proxy? https://github.com/mafintosh/hls-buffer
https://bugs.webkit.org/show_bug.cgi?id=135379#c9

Official issues
https://bugs.webkit.org/show_bug.cgi?id=135379	<- main issue, also: noone knows how CORS should work at Apple
https://bugs.webkit.org/show_bug.cgi?id=154189
https://bugs.webkit.org/show_bug.cgi?id=125157
https://openradar.appspot.com/24641824

HTTPS webplayer to HTTP wowza: 
[Warning] [blocked] The page at https://sojbnlrrst.localtunnel.me/webplayer-hls-demo/ was not allowed to display insecure content from http://demo.live-fstreams.rambla.be/live-demo/360.stream/playlist.m3u8. (hls.js, line 7956)

HTTP webplayer to HTTP wowza:
SecurityError: DOM Exception 18: An attempt was made to break through the security policy of the user agent.

HTTPS webplayer to HTTPS wowza:
https certificate not working

This issue blocks YT on safari.
 
Vrideo modifies url to: http://www.vrideo.com/magic/prod_videos/v1/bgI8R8ma_2k_full.mp4
chrome: http://cdn2.vrideo.com/prod_videos/v1/babCkq1A_1080p_full.mp4
(guess what "magic" is...)

https://jsfiddle.net/7t77rz6L/11/

Possible reason: http://www.contextis.com/resources/blog/webgl-new-dimension-browser-exploitation/


Possible players
----------------

http://orange-opensource.github.io/hasplayer.js/1.2.6/dashif.html
https://www.wowza.com/testplayers
https://github.com/Dash-Industry-Forum/dash.js
HLS.js: http://dailymotion.github.io/hls.js/demo/	<- works!
http://rreverser.github.io/mpegts/
https://flowplayer.electroteque.org/vr360/fp6
https://github.com/Dash-Industry-Forum/dash.js/wiki

hls.js is compatible with browsers supporting MSE with 'video/MP4' inputs. as of today, it is supported on:
Chrome for Android 34+
Chrome for Desktop 34+
Firefox for Android 41+
Firefox for Desktop 42+
IE11+ for Windows 8.1
Safari for Mac 8+ (beta)



HLS URI disassembly
-------------------


http://demo.live-fstreams.rambla.be/live-demo/360.stream/playlist.m3u8:
	*   Trying 85.17.96.163...
	* Connected to demo.live-fstreams.rambla.be (85.17.96.163) port 80 (#0)
	> GET /live-demo/360.stream/playlist.m3u8 HTTP/1.1
	> Host: demo.live-fstreams.rambla.be
	> User-Agent: curl/7.43.0
	> Accept: */*
	>
	< HTTP/1.1 200 OK
	< Accept-Ranges: bytes
	< Server: WowzaStreamingEngine/4.2.0
	< Cache-Control: no-cache
	< Access-Control-Allow-Origin: *
	< Date: Mon, 15 Feb 2016 12:39:05 GMT
	< Content-Type: application/vnd.apple.mpegurl
	< Content-Length: 128
	<
	#EXTM3U
	#EXT-X-VERSION:3
	#EXT-X-STREAM-INF:BANDWIDTH=2593564,CODECS="avc1.100.40",RESOLUTION=1920x960
	chunklist_w929118404.m3u8

curl -v http://demo.live-fstreams.rambla.be/live-demo/360.stream/chunklist_w929118404.m3u8:
	*   Trying 83.149.89.49...
	* Connected to demo.live-fstreams.rambla.be (83.149.89.49) port 80 (#0)
	> GET /live-demo/360.stream/chunklist_w929118404.m3u8 HTTP/1.1
	> Host: demo.live-fstreams.rambla.be
	> User-Agent: curl/7.43.0
	> Accept: */*
	>
	< HTTP/1.1 200 OK
	< Accept-Ranges: bytes
	< Server: WowzaStreamingEngine/4.2.0
	< Cache-Control: no-cache
	< Access-Control-Allow-Origin: *
	< Date: Mon, 15 Feb 2016 12:39:39 GMT
	< Content-Type: application/vnd.apple.mpegurl
	< Content-Length: 183
	<
	#EXTM3U
	#EXT-X-VERSION:3
	#EXT-X-ALLOW-CACHE:NO
	#EXT-X-TARGETDURATION:11
	#EXT-X-MEDIA-SEQUENCE:87665
	#EXTINF:9.433,
	media_w929118404_87665.ts
	#EXTINF:10.833,
	media_w929118404_87666.ts

curl -v http://demo.live-fstreams.rambla.be/live-demo/360.stream/media_w929118404_87665.ts:

	*   Trying 85.17.96.163...
	* Connected to demo.live-fstreams.rambla.be (85.17.96.163) port 80 (#0)
	> GET /live-demo/360.stream/media_w929118404_87665.ts HTTP/1.1
	> Host: demo.live-fstreams.rambla.be
	> User-Agent: curl/7.43.0
	> Accept: */*
	>
	< HTTP/1.1 404 Not Found
	< Accept-Ranges: bytes
	< Server: WowzaStreamingEngine/4.2.0
	< Content-Length: 0
	<
	* Connection #0 to host demo.live-fstreams.rambla.be left intact

curl -v http://demo.live-fstreams.rambla.be/live-demo/360.stream/media_w929118404_87666.ts:

	*   Trying 85.17.96.163...
	* Connected to demo.live-fstreams.rambla.be (85.17.96.163) port 80 (#0)
	> GET /live-demo/360.stream/media_w929118404_87666.ts HTTP/1.1
	> Host: demo.live-fstreams.rambla.be
	> User-Agent: curl/7.43.0
	> Accept: */*
	>
	< HTTP/1.1 404 Not Found
	< Accept-Ranges: bytes
	< Server: WowzaStreamingEngine/4.2.0
	< Content-Length: 0
	<
	* Connection #0 to host demo.live-fstreams.rambla.be left intact





Forum posts
-----------

https://www.wowza.com/forums/showthread.php?38896-Can-wowza-stream-to-HTML-5-player
https://www.wowza.com/blog/a-note-on-html5
https://www.wowza.com/forums/content.php?572-How-to-playback-with-the-example-MPEG-DASH-players-(DASH)
https://www.wowza.com/forums/content.php?727-How-to-use-Google-Shaka-Player-with-Wowza-Streaming-Engine-(MPEG-DASH)


Docs
----

https://www.jwplayer.com/html5/#video-audio-codecs
http://engineering.dailymotion.com/introducing-hls-js/
http://www.dash-player.com/browser-capabilities/
new 360 player: https://github.com/flimshaw/Valiant360
http://caniuse.com/#search=mse