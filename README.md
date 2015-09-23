BIVROST 360WebPlayer
====================

The Bivrost 360WebPlayer is a part of the family of [immersive video players][1] made by [Bivrost][2] to supplement our [360 stereoscopic camera][3] and [software suite][4].


TODO: player screenshot linking to demo page

[1]: TODO: player-windows
[2]: http://bivrost360.com
[3]: TODO: camera
[4]: TODO: sticher







Features
--------

* Easy integration into any web site
* Simple for the end user
* Works on both desktop and mobile
* Free for personal use (see the [license][12] for details)
* Works on major browsers
* Possible to embed more than one on the same page
* Themable
* Supports mono and stereoscopic pictures and video
* [WebVR][11] (MozVR) support - working with Oculus Rift DK1, DK2, cardboard and more
* Lots of configuration options
* Supports viewing media in native players (also [supplied by Bivrost][1])
* Accepting feature requests - tell us what you want in the player!

[11]: http://webvr.info/







Quickstart
----------

1. [Get][21] and unpack to `bivrost_dir`
2. Copy and paste:

```html
<link rel="stylesheet" href="bivrost_dir/bivrost.css" />
<script type="text/javascript" src="bivrost_dir/bivrost-min.js"></script>
<bivrost-player url="stereoscopic_movie_LR.mp4"></bivrost-player>
```








Installation
------------

1. Get the JS and CSS files from [the download page][21], put on your server.
2. Link to the CSS and JS files anywhere in the HTML (for example in the head):
```html
<link rel="stylesheet" href="bivrost.css" />
<script type="text/javascript" src="bivrost-min.js"></script>
```
3. [Configure][22] the player
4. [Encode the media][23]

[21]: TODO: download link
[22]: #Configuration
[23]: #Media%20preparation%20guide





Configuration
-------------

Following configuration options are allowed:

*	`url`: media address, may be multiple for alternative sources (translates to `source` tag of HTML5 `video` or `img` if a picture); required.

*	`type`: media mime types and codec information. Format is the same as in HTML5 video; optional, ignored on pictures.

*	`loop`: should the media loop?  
	Allowed values: "true", "false";  
	optional, default: "false".

*	`autoplay`: should the media be played on load? This might fail on some platforms (android).
	Allowed values: "true", "false";  
	optional, default: "true".

*	`stereoscopy`: what kind of stereoscopy is this media in?  
	Allowed values:  
	
	* "autodetect" - guess by filename tags and media ratio (see: Media preparation guide), 
	* "mono" - whole image used,
	* "side-by-side" - image for left eye is on the left half, and right on the right half of the media,
	* "top-and-bottom" - the left eye is the top half of the image, the right one in the bottom half,
 	* "top-and-bottom-reversed" - the left eye is the bottom half of the image, the right one in the top half;

	optional, default: "autodetect".

*	`source`: is this a video or picture?
	Allowed values: "video", "picture", "autodetect";
	optional, default: "autodetect"
	
*	`projection`: reserved for future use; what is the projection (mapping from 2d to 3d) of the media?
	Allowed value: "equirectangular";
	optional, default: "equirectangular"


Apart from that, you can tune down the player console information with `Bivrost.verbose=false` in a script somewhere.

The player can be run and configured in two ways:







### Declarative configuration

Prefered, HTML5/Web Components like way. Use a dedicated HTML tag:

```html
<bivrost-player url="stereoscopic-media_LR.mp4"></bivrost>
```

Or with some more configuration:

```html
<bivrost-player 
		loop="false" 
		autoplay="true" 
		stereoscopy="autodetect" 
		projection="equirectangular" 
		source="autodetect">
	<bivrost-media 
			url="scenes/morskie-oko/morskie-oko-mono.mp4" 
			type="video/mp4; codecs=avc1.640033, mp4a.40.2">
	</bivrost-media>
	<bivrost-media 
			url="scenes/morskie-oko/morskie-oko-mono.webm" 
			type="video/webm; codecs=vp8.0">
	</bivrost-media>
</bivrost-player>
```

The `url` can be placed on the top `bivrost-player` tag and/or in children `bivrost-media` tags. This allows providing the browser with alternative video format. The `type` attribute is optional.

All contents of the `bivrost-player` tag will be removed and future changes in attributes of the tag will be ignored (you have to use the JavaScript API to modify them in runtime).

**NOTE:** if for some reason you cannot use a custom tag, there is an alternative notation using HTML5 data attributes:

```html
<div data-bivrost-player data-bivrost-url="stereoscopic-media_LR.mp4"></div>
```

or for a full example:

```html
<div	data-bivrost-player
		data-bivrost-loop="true" 
		data-bivrost-autoplay="true" 
		data-bivrost-stereoscopy="autodetect" 
		data-bivrost-projection="equirectangular" 
		data-bivrost-source="autodetect">
	<div	data-bivrost-media
			data-bivrost-url="scenes/morskie-oko/morskie-oko-mono.mp4" 
			data-bivrost-type="video/mp4; codecs=avc1.640033, mp4a.40.2">
	</div>
	<div	data-bivrost-media 
			data-bivrost-url="scenes/morskie-oko/morskie-oko-mono.web" 
			data-bivrost-type="video/webm; codecs=vp8.0">
	</div>
</div>
```

**NOTE 2:** the ending tags on `bivrost-player`, `bivrost-media` or `div` tags are required. The self-closing slash in `<tag />` notation is considered syntactic sugar in HTML5. This is called a non-void element in the W3C reference.



### JavaScript configuration

The above can also be written in a script. While it's not as cool as the custom tag, it does work as good.

```javascript
/// Creates a new player
var player=new Bivrost.Player(

	// The containing tag for the player, will be emptied
	document.getElementById("bivrost-container"),

	// Urls for the media, an object with keys being relative urls,
	// and values are media types. The type may be null.
	// As a shorthand you can provide a single string instead of an object.
	{
		"video.mp4": "video/mp4; codecs=avc1.640033, mp4a.40.2",
		"video.webm": "video/webm; codecs=vp8.0",
		"video-2.mp4": null		// no type provided
	},

	// Projection - currently only equirectangular is supported
	// Optional, ommit/provide undefined for equirectangular
	Bivrost.PROJECTION_EQUIRECTANGULAR,

	// What kind of Stereoscopy the media is in?
	// Optional, available choices are:
	// 	Bivrost.STEREOSCOPY_AUTODETECT,
	//	Bivrost.STEREOSCOPY_MONO,
	//	Bivrost.STEREOSCOPY_SIDE_BY_SIDE,
	//	Bivrost.STEREOSCOPY_TOP_AND_BOTTOM,
	//	Bivrost.STEREOSCOPY_TOP_AND_BOTTOM_REVERSED
	// or ommit/provide undefined for autodetect
	Bivrost.STEREOSCOPY_AUTODETECT,

	// Source - is the media a picture or video?
	// Optional, available choices are:
	//  Bivrost.SOURCE_AUTODETECT,
	//  Bivrost.SOURCE_VIDEO,
	//  Bivrost.SOURCE_PICTURE
	// or ommit/provide undefined for autodetect
	Bivrost.SOURCE_AUTODETECT,

	// Loop - should the media loop? 
	// Optional, boolean, default false.
	false,
	
	// Autoplay - should the media play on load? 
	// Optional, boolean, default true.
	true
);
```

### Player API

You can control the Bivrost Player using the `Bivrost.Player` instance. There are two ways to get the object:

1.	From the DOM node:
	```javascript
	var player=document.getElementById("bivrost-container").bivrost;
	```

2.	Returned from the `new Bivrost.Player(...)` statement:
	```javascript
	var player=new Bivrost.Player(url);
	```

Some interesting API methods:

`player.view.zoom` (number): gets or sets the current zoom, default value is `1`, higher values zoom in, lower zoom out.

`player.ui.show()`, `player.ui.hide()`: shows or hides the UI.

`player.ui.autohide` (number): number of seconds of user inactivity after which the UI hides, set to `0` to never hide.

`player.media.play()`: plays the movie

`player.media.pause()`: pauses the movie

`player.media.pauseToggle()`: plays or pauses the movie

`player.media.rewind()`: resets the movie

`player.media.time` (number): gets or sets the current time of the movie (in seconds).

`player.media.duration` (number): gets the total time of the movie (in seconds).

`player.media.loop` (boolean): gets or sets if the movie should loop.

`player.input.clampY` (boolean): should user movement be constrained if he or she looks too far up or down, default true (does not restrict VR headset movement).

`player.input.lookEuler` ([THREE.Euler][51]): gets or sets the direction that the user is looking towards, does include VR headset movement (`vrLookQuaternion` is for that). The values are in radians.

`player.input.keyboardSpeed` (number): gets or sets the speed in which the keyboard rotates the camera, value in radians per second. Default π/2 (full horizontal rotation in 4 seconds). 

`player.fullscreen` (boolean): gets or sets if the player is displayed in fullscreen. Browsers require this to be called in a user event handler.

`player.aspect` (number): gets or sets default aspect ratio, override by styling (default 4/3).

`Bivrost.Loader(domNode)`: if you have changed a part of HTML code and want it parsed for `bivrost-player` tags, you can call this static function on a dom node or `document.body`. Already parsed tags will not be parsed again.

`Bivrost.verbose` (boolean): set to false to suppress log output.

`Bivrost.version` (string): the current player version.


[51]: http://threejs.org/docs/#Reference/Math/Euler




Themes
------

There are five themes available:

## The default theme
![The default theme](README-skin-default.png)

## The winter theme
![The winter theme](README-skin-winter.png)
You can change the theme by adding a `bivrost-theme-winter` class to the `bivrost-player` tag.

## The spring theme
![The spring theme](README-skin-spring.png)
You can change the theme by adding a `bivrost-theme-spring` class to the `bivrost-player` tag.

## The autumn theme
![The autumn theme](README-skin-autumn.png)
You can change the theme by adding a `bivrost-theme-autumn` class to the `bivrost-player` tag.

## The turquoise theme
![The winter theme](README-skin-turquoise.png)
You can change the theme by adding a `bivrost-theme-turquoise` class to the `bivrost-player` tag.



Media preparation guide
-----------------------


VR needs high definition material and browsers aren't best at playing video, so there are quite few guidelines and restrictions on how to make the most portable video for the web. 

First of all, not all browsers support the same **content types**: there is mp4, webm and sometimes even ogv. There are a lot of options to fine tune these formats, this is even more true in mp4 where there are lots of codecs you can use. We suggest using an combination of mp4/h264 and webm/vp8 and not using ogv as it is only required on old/low end platforms that won't support the required resolution anyway (ogv is usually software decoded). Provide both files, some browsers support one or the other.

**Resoulution** - full HD (1920x1080) is a minimum for quality, HD ready (1280x720) will be watchable, but not necessarily enjoyable. Good quality is 4k (4096x2048, 3840x2160 etc). 8k would be great, but currently unachievable on almost all configurations. The perfect aspect ratio for equirectangular 360 video is 2:1, but it will stretch nicely if you stay close. Remember about stereoscopy - you might need to cramp two frames into that picture.

Then you have the **bitrate** - VR movies take a lot of that, with full HD an absolute minimum is 10mbps, 16 or even 25 might be required if there is more detail. With higher resolutions 30, 50mbps or even more are not unseen.

Last, but not least, there's **the hardware** - a movie with this high of a resolution must be hardware decoded. Decoding is done on operating system or browser level, and there are always restrictions to it. For the **desktop**, it is safe to make a 4k mp4/h264 and webm/vp8 file, newer codecs like hevc/h265 work great in terms of compression, but take up a lot of the CPU, as they're decoded in software. For **mobile** do full HD, all but the newest flagships support video only up to 1080p.

And as always there is some random **stuff** to remember: 

* make keyframes often (a few times per second) or the movie will take forever to scroll (ffmpeg's `-g` option) 
* make the movie streamable by putting the headers in the begining of the file (ffmpeg's `+faststart` option)
* codecs, especially h264, have lots of black magic like switches that should be used, for example using the yuv420p colorspace or keeping a correct level and profile
* don't forget the audio 

Here at Bivrost we use [ffmpeg][61] with these options for web/mobile:

    ffmpeg -i input.mp4 -codec:v libx264 -profile:v high -b:v 10M -maxrate 10M -bufsize 20M -vf scale=1920:1080 -movflags +faststart -pix_fmt yuv420p -g 5 -strict experimental -codec:a aac -b:a 128k output.mp4

    ffmpeg -i input.mp4 -codec:v libvpx -b:v 10M -bufsize 20M -vf scale=1920:1080 -g 5 -c:a libvorbis -b:a 128k output.webm

If you want to know more, there are some good manuals to look into:

* https://wiki.whatwg.org/wiki/Video_type_parameters
* http://linux.goeszen.com/html5-video-tag-and-codecs.html
* https://trac.ffmpeg.org/wiki/Encode/H.264
* https://trac.ffmpeg.org/wiki/Encode/VP8


[61]: https://www.ffmpeg.org/

Oh and if you want the guideline for a **static picture**, use a jpeg or png, at least this part is easy. Hugin's equirectangular or Google's Photo Sphere pictures work nicely. You can use a bit more resolution here, but above around 4096x4096 you might experience performance problems.





Stereoscopy types
-----------------

Stereoscopy is deciding what part of the media should go to which eye. It is done before projection.

When stereoscopy is set to "autodetect", it guesses based on parts of the filename and (if that failed) the image ratio.

Parts of the filename are separated by "_", "-" or other non-word characters. For example "stereoscopic-video_LR.mp4" has parts: "stereoscopic", "video", "LR" of which only "LR" is recognized and parsed.


#### Side By Side

```
[       |       ]
[ left  | right ]
[ eye   | eye   ]
[       |       ]
```

1. stereoscopy is set to "side-by-side" (or `Bivrost.STEREOSCOPY_SIDE_BY_SIDE`)
2. there is a "LR" or "SbS" part in the image filename
3. the image ratio is 4:1


#### Top And Bottom (over under)

```
[      left     ]
[      eye      ]
-----------------
[      right    ]
[      eye      ]
```

1. stereoscopy is set to "top-and-bottom" (or `Bivrost.STEREOSCOPY_TOP_AND_BOTTOM`)
2. there is a "TB" or "TaB" part in the image filename
3. the image ratio is 1:1



#### Top And Bottom Reversed

```
[      right    ]
[      eye      ]
-----------------
[      left     ]
[      eye      ]
```

1. stereoscopy is set to "top-and-bottom-reversed" (or `Bivrost.STEREOSCOPY_TOP_AND_BOTTOM_REVERSED`)


#### Mono

```
[               ]
[      both     ]
[      eyes     ]
[               ]
```

1. stereoscopy is set to "mono" (or `Bivrost.STEREOSCOPY_MONO`)
2. no other detection succeeded






User Guide
----------

### Available keyboard shortcuts

* ` ↑ ` ` → ` ` ↓ ` ` ← ` - look around
* ` space ` - pause/play
* ` F ` or doubleclick movie - fullscreen
* ` V ` - enter/toggle VR mode
 ` escape ` - exit fullscreen/VR mode
* ` [ `, ` ] ` - scroll movie by 5 seconds
* ` + `, ` - ` - zoom in/out (not available in VR mode)


### Virtual Reality on the desktop with WebVR

At the time of writing, WebVR is supported by Firefox Nightly with an extension. It supports Oculus Rift and (allegedly) other headsets like HTC Vive.

See instructions at [MozVR][81] and [WebVR.info][82] for how to setup your browser.

When you have a working setup, press ` V ` or the "eye" button to go to VR mode.

[81]: http://mozvr.com/downloads/
[82]: http://webvr.info/


### Virtual Reality in mobile with Google Cardboard

It is possible to use the Bivrost 360Player with Google Cardboard and it's many clones. Just press the "eye" button to go to VR mode.

Some tips:

* Be sure to enable screen rotation on your device.
* If you have a NFC tag in your cardboard it might be a good idea to disable NFC in your phone as it will run the cardboard app instead of allowing you to use a browser.
* Some phones lack a gyroscope, if you have problems looking left and right, but looking up and down works this means that your phone manufacturer did not install one. The phone tries to compensate this with a compass (magnetometer), but the results are far from good.
* Consider setting a longer time for screen timeout.


### Platform availability

We try to make the player run on as many platforms as possible, but we still have far from 100% coverage. Major unsupported platforms are:

* iOS - only pictures work, videos are distorted and without a user interface
* Windows Phone - only pictures work, videos are black
* GearVR - currently no way to run a web browser

If you're experiencing problems with any other recent platform, please let us know.



Standalone players
------------------

Browsers are the most accessible platform, but far from most performant - that's why we didn't stop at creating just one player, we have made a whole family.

The Bivrost Web Player has a special button that allows the content to be run in a native player that allows for performance and user experience better then what will be possible inside a browser for the next few years. If the user doesn't have the player, he will be asked if he would like to download it.




Roadmap
-------

[x] Standalone web component
[x] Mobile support - Android
[ ] Posters - flat thumbnails for spherical video
[ ] Multi-resolution video ("HD" button)
[ ] Support built-in media galleries and switching media
[ ] Overlays - add content on top of your media
[ ] More supported projections - frame, cylindrical, partial sphere mappings etc.
[ ] Interactive overlays
[ ] Mobile support - iOS
[ ] Mobile support - Windows Phone
[x] video on Internet Exporer/Edge
[ ] Smaller footprint
[ ] 3d glasses stereoscopic display support (line by line, red cyan)

Please post suggestions using the issue function of GitHub, always provide a valid use case.



License
-------

There are two separate licenses to choose from:

1. [The free license][92] - use for web sites that are non commercial
2. [The paid license][93] - use for commercial web sites, one license per domain (contact [sales][94] for payment).

If you want to remove or replace our branding or are unsure about which license applies to you, please [contact us for help and additional licensing options][91].

[91]: TODO: mailto:licensing
[92]: LICENSE-free.txt
[93]: LICENSE-paid.txt
[94]: TODO: mailto:sales 



Changelog
---------

2015-09-01: initial release


Third party libraries
---------------------

The Bivrost Web Player uses third party libraries:

* [THREE.js][99] (MIT license)


[99]: http://threejs.org