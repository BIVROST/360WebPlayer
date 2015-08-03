Bivrost Web Player
==================

The Bivrost Web Player is a part of the family of [immersive video players][1] made by [Bivrost][2] to supplement our [360 stereoscopic camera][3] and [software suite][4].


[1]: TODO: player-windows
[2]: http://bivrost360.com
[3]: TODO: camera
[4]: TODO: sticher



Features
--------

* Easy integration into any website
* Simple for the end user
* Free (see the [license][12] for details)
* Works on major browsers
* Possible to embed more than one on the same page
* Themable
* Supports mono and stereoscopic pictures and video
* [MozVR][11] support - working with Oculus Rift DK1, DK2, cardboard and more
* Lots of configuration options
* Accepting feature requests - tell us what you want in the player!

[11]: http://mozvr.com/
[12]: #License



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

1. Get the js, css and image files from [the download page][21], put on your server.
2. Link to the CSS and JS files anywhere in the HTML (for example in the head):
```html
<link rel="stylesheet" href="bivrost.css" />
<script type="text/javascript" src="bivrost-min.js"></script>
```
3. Configure the player

[21]: TODO: download link


Configuration
-------------

Following configuration options are allowed:

*	`url`: media address, may be multiple for alternative sources (translates to `source` tag of HTML5 `video` or `img` if a picture); required.

*	`type`: media mime types and codec information. Format is the same as in HTML5 video; optional, ignored on pictures.

*	`loop`: should the media loop?  
	Allowed values: "true", "false";  
	optional, default: "false".

*	`autoplay`: should the media be played on load?  
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

**NOTE:** if for some reason you cannot use a custom tag, there is an alternative notation using HTML5 data attributes:

```html
<div data-bivrost-player data-bivrost-url="stereoscopic-media_LR.mp4"></div>
```

or

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



Media preparation guide
-----------------------
https://wiki.whatwg.org/wiki/Video_type_parameters
http://linux.goeszen.com/html5-video-tag-and-codecs.html
#t=10,20
https://trac.ffmpeg.org/wiki/Encode/H.264
https://trac.ffmpeg.org/wiki/Encode/VP8




Stereoscopy types
-----------------

Stereoscopy is deciding which part of the media should go to which eye. It is done before projection.

When stereoscopy is set to "autodetect", it guesses based on parts of the filename and (if that failed) the image ratio.

Parts of the filename are separated by "_", "-" or other non-word characters. For example "stereoscopy-video_LR.mp4" has parts: "stereoscopy", "video", "LR" of which only "LR" is recognized and parsed.


#### Side By Side

```
[      |       ]    
[ left | right ]
[ eye  | eye   ]
[      |       ]
```

1. stereoscopy is set to "side-by-side" (or `Bivrost.STEREOSCOPY_SIDE_BY_SIDE`)
2. there is a "LR" or "SbS" part in the image filename
3. the image ratio is 4:1


#### Top And Bottom

```
[   left   ]
[   eye    ]
------------
[   right  ]
[   eye    ]
```

1. stereoscopy is set to "top-and-bottom" (or `Bivrost.STEREOSCOPY_TOP_AND_BOTTOM`)
2. there is a "TB" or "TaB" part in the image filename
3. the image ratio is 1:1



#### Top And Bottom Reversed

```
[   right  ]
[   eye    ]
------------
[   left   ]
[   eye    ]
```

1. stereoscopy is set to "top-and-bottom-reversed" (or `Bivrost.STEREOSCOPY_TOP_AND_BOTTOM_REVERSED`)


#### Mono

```
[             ]
[  left and   ]
[  right eye  ]
[             ]
```

1. stereoscopy is set to "mono" (or `Bivrost.STEREOSCOPY_MONO`)
2. no other detection succeeded


Keyboard shortcuts
------------------

* ` ↑ ` ` → ` ` ↓ ` ` ←` - look around
* ` space ` - pause/play
* ` F ` or doubleclick movie - fullscreen
* ` V ` - enter/toggle VR mode
* ` [ `, ` ] ` - scroll movie by 5 seconds
* ` + `, ` - ` - zoom in/out (not available in VR mode)


Roadmap
-------

[ ] Standalone web component
[ ] Support built-in media galleries and switching media
[ ] Overlays - add content on top of your media
[ ] Interactive overlays
[ ] More supported browsers
[ ] More supported projections - frame, cylindrical, partial sphere mappings etc.
[ ] Better mobile support
[ ] Smaller footprint (getting rid of THREEjs?)
[ ] Multi-resolution video (HD/non HD button)


License
-------

TODO


Changelog
---------

2015-08-01: initial release