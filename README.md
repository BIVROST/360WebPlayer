BIVROST 360WebPlayer
====================

![The default theme](README-player.png)

Easy virtual reality on desktop and mobile: the BIVROST 360WebPlayer is a simple way to show 360 videos and pictures on your blog or website.

This player is a part of the family of [immersive video players][player-windows] made by [Bivrost][bivrost-website] to supplement our [360 stereoscopic camera][camera] and [software suite][stitcher].

Please view the [live demo][live-demo].

[player-windows]: https://download.bivrost360.com/player-desktop/?campaign=player-web-ref
[bivrost-website]: https://bivrost360.com
[camera]: TODO:camera
[stitcher]: TODO:sticher
[live-demo]: https://tools.bivrost360.com/webplayer-docs







Features
--------

* Easy integration into any web site
* Simple for the end user
* Works on both desktop and mobile
* Free for personal use (see the [license][wordpress-plugin] for details)
* Works on major browsers
* Possible to embed more than one on the same page
* Themable
* Supports mono and stereoscopic pictures and video
* [WebVR][webvr] (MozVR) support - working with Oculus Rift DK1, DK2, cardboard and more
* Lots of configuration options
* Supports viewing media in native players (also [supplied by Bivrost][player-windows])
* Available also as [a WordPress plugin][wordpress-plugin]
* Accepting feature requests - tell us what you want in the player!

[wordpress-plugin]: TODO:wordpress-plugin







Quickstart
----------

1.	[Get][download-link] and unpack to `bivrost_dir`
2.	Copy and paste:

	```html
	<link rel="stylesheet" href="bivrost_dir/bivrost.css" />
	<script type="text/javascript" src="bivrost_dir/bivrost-min.js"></script>
	<bivrost-player url="stereoscopic_movie_SbS.mp4"></bivrost-player>
	```
3.	Enjoy. 


### How does this work?

All configuration is autodetected, from the `.mp4` extension it assumes it's a movie, from the `SbS` it takes it's a side-by-side stereoscopic one. It also assumes it's and equirectangular projection, because almost everything is.

You might want to provide an additional webm version for browsers not supporting mp4 and tweak other options, but these three lines with a well named file should work in 90% of cases.

There are no additional image assets downloaded from some CDN, just the two files. Everything is embedded in the css and js files.




Installation
------------

1. Get the JS and CSS files from [the download page][download-link], put on your server.
2. Link to the CSS and JS files anywhere in the HTML (for example in the head):
```html
<link rel="stylesheet" href="bivrost.css" />
<script type="text/javascript" src="bivrost-min.js"></script>
```
Don't forget to set the correct paths.
3. [Configure the player][configuration]
4. [Encode the media][media-preparation-guide]

[download-link]: TODO:download-link
[configuration]: #configuration
[media-preparation-guide]: #media-preparation-guide





Configuration
-------------

Following configuration options are allowed:

*	`url`: media address, may be multiple for alternative sources (translates to `source` tag of HTML5 `video` or `img` if a picture); At least one `url` attribute or `bivrost-media` tag is required.

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
	Allowed value: "equirectangular", "cubemap", "cubemap:configuration...";
	optional, default: "equirectangular".
	Cubemap can be configured with cubemap type. There are a few presets defining the order of faces: 

	* "horizontal" (default) - all sides of the cube are in one line in the order; left, right, down, up, back, front. OBRX uses this format.
	* "two-by-three" - sides are in two rows: left, right, down and up, bottom, front. Facebook 360 videos use this format.
	* "facebook" - the same as in two-by-three, but rotated and each face is cropped by 1%.
	* "horizontal-cross" - sides are in a cross with bottom, right, front and left in the middle row; up is in the top row and down in the bottom. 
	* "vertical-cross" - up is in the first row, bottom, right and front in the second, left in the third and down in the fourth. ATI CubeMapGen uses this format.
	* custom - advanced, please use presets if possible; you can specify any alignment with a simple description string. The order string is an 2d array of face names in the order they appear on the texture. The rows are separated by "," and the faces are one letter acronyms (also accepts capital letters):

		*  "f" - front
		*  "b" - back
		*  "l" - left
		*  "r" - right
		*  "u" - up
		*  "d" - down
		*  "-" - unused space

	Each face can be supplied with a rotation with `*x` where x is a number from 0 to 3. For example `r*1` is right rotated 90 degrees clockwise.

	Additionally two optional modifiers are supported at the end of the string:

	*  ">90" - rotate clockwise by x degrees (90 in example)
	*  "<72" - rotate counter clockwise by x degrees (72 in example)
	*  "+0.01" - crop faces by amount (prevents visible edges)

	Example: `-u--,blfr,-d*2-->90+0.002`
	
	Please note that with cubemaps, seams can be visible due to texture filtering - this is most visible on horizontal and vertical crosses. It's best you fix them on picture by duplicating some border into the unused part of the image. The 1% zoom with facebook is to prevent this from happening.

Apart from that, you can tune down the player console information with `Bivrost.verbose=false` in a script.

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

* `player.view.zoom:number`: gets or sets the current zoom, default value is `1`, higher values zoom in, lower zoom out.

* `player.ui.show()`, `player.ui.hide()`: shows or hides the UI.

* `player.ui.autohide:number`: number of seconds of user inactivity after which the UI hides, set to `0` to never hide.

* `player.media.play()`: plays the movie

* `player.media.pause()`: pauses the movie

* `player.media.pauseToggle()`: plays or pauses the movie

* `player.media.rewind()`: resets the movie

* `player.media.time:number`: gets or sets the current time of the movie (in seconds).

* `player.media.duration:number`: gets the total time of the movie (in seconds).

* `player.media.loop:boolean`: gets or sets if the movie should loop.

* `player.input.clampY:boolean`: should user movement be constrained if he or she looks too far up or down, default true (does not restrict VR headset movement).

* `player.input.lookEuler:`[`THREE.Euler`][threejs-euler]: gets or sets the direction that the user is looking towards, does include VR headset movement (`vrLookQuaternion` is for that). The values are in radians.

* `player.input.keyboardSpeed:number`: gets or sets the speed in which the keyboard rotates the camera, value in radians per second. Default π/2 (full horizontal rotation in 4 seconds). 

* `player.fullscreen:boolean`: gets or sets if the player is displayed in fullscreen. Browsers require this to be called in a user event handler.

* `player.aspect:number`: gets or sets default aspect ratio, override by styling (default 4/3).

* `Bivrost.Loader(domNode)`: if you have changed a part of HTML code and want it parsed for `bivrost-player` tags, you can call this static function on a dom node or `document.body`. Already parsed tags will not be parsed again.

* `Bivrost.verbose:boolean`: set to false to suppress log output.

* `Bivrost.version:string`: the current player version.


[threejs-euler]: http://threejs.org/docs/#Reference/Math/Euler




Themes
------

There are three themes available:

## The default theme

![The default theme](README-skin-default.jpeg)



## The spring theme

![The spring theme](README-skin-spring.jpeg)

You can change the theme by adding a `bivrost-theme-spring` class to the `bivrost-player` tag.



## The autumn theme

![The autumn theme](README-skin-autumn.jpeg)

You can change the theme by adding a `bivrost-theme-autumn` class to the `bivrost-player` tag.





Media preparation guide
-----------------------


VR needs high definition material and browsers aren't best at playing video, so there are quite few guidelines and restrictions on how to make the most portable video for the web. 

First of all, not all browsers support the same **content types**: there is mp4, webm and sometimes even ogv. There are a lot of options to fine tune these formats, this is even more true in mp4 where there are lots of codecs you can use. We suggest using an combination of mp4/h264 and webm/vp8 and not using ogv as it is only required on old/low end platforms that won't support the required resolution anyway (ogv is usually software decoded). Provide both files, some browsers support one or the other.

**Resoulution** - full HD (1920x1080) is a minimum for quality, HD ready (1280x720) will be watchable, but not necessarily enjoyable. Good quality is 4k (4096x2048, 3840x2160 etc). 8k would be great, but currently unachievable on almost all configurations. The perfect aspect ratio for equirectangular 360 video is 2:1, but it will stretch nicely if you stay close. Remember about stereoscopy - you might need to cramp two frames into that picture.

Then you have the **bitrate** - VR movies take a lot of that, with full HD an absolute minimum is 10mbps, 16 or even 25 might be required if there is more detail. With higher resolutions 30, 50mbps or even more are not unseen.

Last, but not least, there's **the hardware** - a movie with this high of a resolution must be hardware decoded. Decoding is done on operating system or browser level, and there are always restrictions to it. For the **desktop**, it is safe to make a 4k mp4/h264 and webm/vp8 file, newer codecs like hevc/h265 work great in terms of compression, but take up a lot of the CPU, as they're decoded in software. For **mobile** do full HD, all but the newest flagships support video only up to 1080p.

And as always there is some **random stuff** to remember: 

* make keyframes often (a few times per second) or the movie will take forever to scroll (ffmpeg's `-g` option) 
* make the movie streamable by putting the headers in the begining of the file (ffmpeg's `+faststart` option)
* codecs, especially h264, have lots of black magic like switches that should be used, for example using the yuv420p colorspace or keeping a correct level and profile
* don't forget the audio 

Here at Bivrost we use [ffmpeg][ffmpeg] with these options for web/mobile:

    ffmpeg -i input.mp4 -codec:v libx264 -profile:v high -b:v 10M -bufsize 20M -vf scale=1920:1080 \
		-movflags +faststart -pix_fmt yuv420p -g 5 -strict experimental -codec:a aac -b:a 128k output.mp4

    ffmpeg -i input.mp4 -codec:v libvpx -vb 10M -bufsize 20M -vf scale=1920:1080 -g 5 -c:a libvorbis -b:a 128k output.webm

If you want to know more, there are some good manuals to look into:

* https://wiki.whatwg.org/wiki/Video_type_parameters
* http://linux.goeszen.com/html5-video-tag-and-codecs.html
* https://trac.ffmpeg.org/wiki/Encode/H.264
* https://trac.ffmpeg.org/wiki/Encode/VP8


[ffmpeg]: https://www.ffmpeg.org/

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

See instructions at [MozVR][mozvr] and [WebVR.info][webvr] for how to setup your browser.

When you have a working setup, press ` V ` or the "eye" button to go to VR mode.

[mozvr]: http://mozvr.com/downloads/
[webvr]: http://webvr.info/


### Virtual Reality on mobile with Google Cardboard

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
* GearVR - currently no way to run in the Samsung web browser

If you're experiencing problems with any other recent platform, please let us know.


### Video does not work

Check if your device supports this kind of video (play it in the browser directly). Some devices support only up to 1920x1080 resolution.

Videos or pictures have to be served from the same domain or provide [Cross-Origin Resource Sharing][cors]

[cors]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS

Do not test from your local filesystem (the `file:///` protocol). You have to have a working webserver for the plugin to work.


### Seeking does not work

Either your webserver doesn't support [Content-Range][content-range] or your video file has issues. Common server not supporting Content-Range is the builtin PHP development webserver.

[content-range]: http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.16


### Where can I submit feature requests or bug reports? Where can I find the unminified version?

Please send bugs and feature requests to our GitHub at http://github.com/Bivrost/360WebPlayer the sources are located there too. Thanks.



Standalone players
------------------

Browsers are the most accessible platform, but far from most performant - that's why we didn't stop at creating just one player, we have made a whole family.

The Bivrost Web Player has a special button that allows the content to be run in a native player that allows for performance and user experience better then what will be possible inside a browser for the next few years. If the user doesn't have the player, he will be asked if he would like to download it.




Roadmap
-------

- [x] Standalone web component
- [x] Mobile support - Android
- [ ] Posters - flat thumbnails for spherical video
- [ ] Multi-resolution video ("HD" button)
- [ ] Support built-in media galleries and switching media
- [ ] Overlays - add content on top of your media
- [ ] More supported projections - frame, cylindrical, partial sphere mappings etc.
- [ ] Interactive overlays
- [ ] Mobile support - iOS
- [ ] Mobile support - Windows Phone
- [x] video on Internet Exporer/Edge
- [ ] Smaller footprint
- [ ] 3d glasses stereoscopic display support (line by line, red cyan)

Please post suggestions using the issue function of GitHub, always provide a valid use case.



License
-------

There are two separate licenses to choose from:

1. [The free license][license-free] - use for web sites that are non commercial
		2. [The paid license][license-commercial] - use for commercial web sites, one license per domain ([contact sales][email-sales] for payment).

If you want to remove or replace our branding or are unsure about which license applies to you, please [contact us for help and additional licensing options][email-sales].

[email-sales]: mailto:contact@bivrost360.com
[license-free]: LICENSE-free.md
[license-commercial]: LICENSE-commercial.md



Changelog
---------

2015-09-01: initial release


Third party libraries
---------------------

The Bivrost Web Player uses third party libraries:

* [THREE.js][threejs] (MIT license)


[threejs]: http://threejs.org