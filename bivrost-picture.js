"use strict";

window.Bivrost=window.Bivrost || {};

Bivrost.PROJECTION_EQUIRECTANGULAR=101;
Bivrost.PROJECTION_FRAME=102;

Bivrost.SOURCE_AUTODETECT_FROM_EXT=200;
Bivrost.SOURCE_VIDEO=201;
Bivrost.SOURCE_STILL=202;

Bivrost.STEREOSCOPY_AUTODETECT_FROM_RATIO=300;
Bivrost.STEREOSCOPY_NONE=301;
Bivrost.STEREOSCOPY_TOP_BOTTOM=302;
Bivrost.STEREOSCOPY_TOP_BOTTOM_REVERSED=303;
Bivrost.STEREOSCOPY_LEFT_RIGHT=304;

(function() {

	var log=console.log.bind(console, "[Bivrost.Picture]");


	/**
	 * Parametrless callback when a texture is loaded
	 * @callback Picture.onloadCallback
	 */
	

	/**
	 * Loads a picture (still or video), you might want to add an onload
	 * @constructor
	 * @class
	 * @param {string} url
	 * @param {onloadCallback} onload
	 * @param {number} [projection=Bivrost.PROJECTION_EQUIRECTANGULAR]
	 * @param {number} [stereoscopy=Bivrost.STEREOSCOPY_NONE]
	 * @param {number} [source=Bivrost.SOURCE_AUTODETECT_FROM_EXT]
	 * @returns {Bivrost.Picture}
	 */
	Bivrost.Picture=function(url, onload, projection, stereoscopy, source) {
		var that=this;
		
		if(arguments.length < 2)
			throw "url and onload required";
		this.onload=onload;
		
		this.projection=projection=projection || Bivrost.PROJECTION_EQUIRECTANGULAR;
		this.stereoscopy=stereoscopy=stereoscopy || Bivrost.STEREOSCOPY_AUTODETECT_FROM_RATIO;
		
		if(!source || source === Bivrost.SOURCE_AUTODETECT_FROM_EXT) {
			source=(/\.(jpe?g|png|bmp|tiff|gif)$/i.test(url))
				?Bivrost.SOURCE_STILL
				:Bivrost.SOURCE_VIDEO;
			log("detected source: "+Bivrost.reverseConstToName(source));
		}
		
		switch(source) {
			case Bivrost.SOURCE_STILL:
				this.title="still:"+url;
				log("still loading", url);
				
				var loader=new THREE.TextureLoader();
				loader.load(
					url,
					function(texture) {
						log("still loaded", that);
						texture.name="still:"+url;
						that.gotTexture(texture);
					},
					function(xhr) {
						that.onprogress(xhr.loaded/xhr.total);
					},
					this.onerror
				);
				break;
				
			case Bivrost.SOURCE_VIDEO:
				this.title="video:"+url;
				log("video loading", url);
				
				var video=document.createElement("video");
				video.width=32;	// TODO: ważne?
				video.height=32;	// TODO: ważne?
				video.loop=true;	// TODO: config

				this.play=function() {
					log("video play");
					video.play();
				};

				video.addEventListener("loadeddata", function() {
					log("video loaded", this, arguments);
					var texture = new THREE.VideoTexture(video);
					texture.name="video:"+url;
					texture.minFilter = THREE.LinearFilter;
					texture.magFilter = THREE.LinearFilter;
					that.gotTexture(texture);
				});

				// last to prevent event before load
				video.src=url;
				break;
				
			default:
				throw "unknown source type: "+source;
		}	
	};
	
	
	Bivrost.Picture.prototype={
		
		constructor: Bivrost.Picture,
		
		
		width: 360,
		
		
		height: 180,
		
		
		hoffset: 0,
		
		
		woffset: 0,
		
		
		projection: Bivrost.PROJECTION_EQUIRECTANGULAR,
		
		
		stereoscopy: Bivrost.STEREOSCOPY_AUTODETECT_FROM_RATIO,
		
		
		title: null,
		
		
		texture: null,
		
		
		onload: function() {},
		
		
		onprogress: function(progress01) {
			console.log(this, "progress", ~~(100*progress01)+"%");
		},
		
		
		onerror: function(error) {
			throw error;
		},
		
		
		/**
		 * @param {THREE.Texture} texture
		 */
		gotTexture: function(texture) {
			this.texture=texture;
			log(this.stereoscopy);
			if(this.stereoscopy === Bivrost.STEREOSCOPY_AUTODETECT_FROM_RATIO) {
				var w=texture.image.videoWidth || texture.image.width;
				var h=texture.image.videoHeight || texture.image.height;
				if(w === h)
					this.stereoscopy=Bivrost.STEREOSCOPY_TOP_BOTTOM;
				else // if(w === 2*h)
					this.stereoscopy=Bivrost.STEREOSCOPY_NONE;
				
				// TODO: guess frame
				log("guessed stereoscopy from ratio: ", Bivrost.reverseConstToName(this.stereoscopy));
			}
			log("got texture", texture);
			this.onload();
		},
		
		
		play: function() {}
		
	};

	
	/**
	 * Promise style constructor
	 * @param {type} url
	 * @param {number} [projection=Bivrost.PROJECTION_EQUIRECTANGULAR]
	 * @param {number} [stereoscopy=Bivrost.STEREOSCOPY_NONE]
	 * @param {number} [source=Bivrost.SOURCE_AUTODETECT_FROM_EXT]
	 * @returns {Q@call;defer.promise}
	 */
	Bivrost.Picture.load=function(url, projection, stereoscopy, source) {
		var deferred=Q.defer();
		var pic=new Bivrost.Picture(url, function() {deferred.resolve(pic);}, projection, stereoscopy, source);
		pic.onerror=function(error) {deferred.reject(error);};
		pic.onprogress=function(progress01) {deferred.notify(progress01);};
		return deferred.promise;
	};
	
})();