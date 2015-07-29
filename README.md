Bivrost Web Player
==================

The Bivrost Web Player is a part of the family of [immersive video players][1] made by [Bivrost][2] to supplement our [360 stereoscopic camera][3] and [software suite][4].


[1]: TODO 
[2]: http://bivrost360.com
[3]: TODO
[4]: TODO



Features
--------

* Easy integration into any website
* Simple to use for the end user
* Free (see the [license][12] for details)
* Works on major browsers (chrome, firefox, IE9+)
* Possible to embed more than one on the same page
* Themable
* Supports mono and stereoscopic video
* [MozVR][11] support - working with Oculus Rift DK1, DK2, cardboard and more
* Lots of configuration options
* Accepting feature requests - tell us what you want in the player!

[11]: http://mozvr.com/
[12]: #License


Quickstart
----------

1. [Get][21] and unpack to `bivrost_dir`
2. Copy and paste:

	<link rel="stylesheet" href="bivrost_dir/bivrost.css" />
	<script type="text/javascript" src="bivrost_dir/bivrost-min.js"></script>

	<bivrost-player url="stereoscopic_movie_LR.mp4"></bivrost-player>

Installation
------------

1. Get the js, css and image files from [the download page][21]
2. 


Configuration
-------------

Possible options:

	* `url` (or `data-bivrost-url`), multiple
	* `url-type` (or `data-bivrost-url-type`), multiple

- urls
- projection
- stereoscopy
- source
- vr/gyro input enabled
- autoplay
- looping

The player can be run and configured in two ways:

### Declarative configuration

### Classic API



Media preparation guide
-----------------------
https://wiki.whatwg.org/wiki/Video_type_parameters
http://linux.goeszen.com/html5-video-tag-and-codecs.html
#t=10,20

Roadmap
-------
* Standalone web component


License
-------


Changelog
---------
initial release, see Changelog