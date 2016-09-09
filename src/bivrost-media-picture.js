/* global Bivrost, THREE */
"use strict";

(function() {
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.PictureMedia", arguments); };


	/**
	 * Loads a media (still or video), you might want to add an onload
	 * @constructor
	 * @class
	 * @param {string|object} url - url to the media, may be an 
	 *		object with the key being the url and the value being the
	 *		type or null.
	 * @param {onloadCallback} onload
	 * @param {string=} [projection=Bivrost.PROJECTION_EQUIRECTANGULAR]
	 * @param {string=} [stereoscopy=Bivrost.STEREOSCOPY_MONO]
	 * @param {boolean} [loop=false]
	 */
	Bivrost.PictureMedia = function(url, onload, projection, stereoscopy, loop) {
		Bivrost.Media.call(this, url, onload, projection, stereoscopy, Bivrost.SOURCE_PICTURE, loop);
		
		var thisRef = this;
		
		if(Object.keys(url).length !== 1)
			throw "picture supports only one url at this time";
		this.title="picture:"+Object.keys(url)[0];
		log("picture loading", url);

		var loader=new THREE.TextureLoader();
		loader.setCrossOrigin("anonymous");
		loader.load(
			Object.keys(url)[0],
			function(texture) {
				log("still loaded", thisRef);
				texture.name=thisRef.title;
//						texture.minFilter=THREE.LinearMipMapLinearFilter;
//						texture.magFilter=THREE.LinearMipMapLinearFilter;
				texture.anisotropy=16;
				thisRef.gotTexture(texture);
			},
			function(xhr) {
				thisRef.onprogress(xhr.loaded/xhr.total);
			},
			this.onerror
		);
	};

	Bivrost.extend(Bivrost.PictureMedia, Bivrost.Media);

})();