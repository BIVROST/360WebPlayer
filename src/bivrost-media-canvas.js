/* global Bivrost, THREE */
"use strict";

(function() {
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.CanvasMedia", arguments); };


	/**
	 * Uses a canvas element as a media source
	 * @constructor
	 * @class
	 * @param {string|object} url - a HTML element, a querySelector pointing to it or null
	 * @param {onloadCallback} onload
	 * @param {string=} [projection=Bivrost.PROJECTION_EQUIRECTANGULAR]
	 * @param {string=} [stereoscopy=Bivrost.STEREOSCOPY_MONO]
	 * @param {boolean} [loop=false]
	 */
	Bivrost.CanvasMedia = function(url, onload, projection, stereoscopy, loop) {
		Bivrost.Media.call(this, url, onload, projection, stereoscopy, Bivrost.SOURCE_CANVAS, loop);
		
		var thisRef = this;
		
		if(Object.keys(url).length > 1)
			throw "Use none or none sources";
		this.title="canvas";

		var mainUrl = url[0];
		this.setCanvas(mainUrl);


// 		var loader=new THREE.TextureLoader();
// 		loader.setCrossOrigin("anonymous");
// 		loader.load(
// 			Object.keys(url)[0],
// 			function(texture) {
// 				log("still loaded", thisRef);
// 				texture.name=thisRef.title;
// //						texture.minFilter=THREE.LinearMipMapLinearFilter;
// //						texture.magFilter=THREE.LinearMipMapLinearFilter;
// 				texture.anisotropy=16;
// 				thisRef.gotTexture(texture);
// 			},
// 			function(xhr) {
// 				thisRef.onprogress(xhr.loaded/xhr.total);
// 			},
// 			this.onerror
// 		);
	};

	Bivrost.extend(Bivrost.CanvasMedia, Bivrost.Media);
	
	Bivrost.Media.store.register(Bivrost.SOURCE_CANVAS, Bivrost.CanvasMedia);


	Bivrost.CanvasMedia.prototype.setCanvas = function(canvasElementOrQuery)
	{
		var canvas = null;
		if (canvasElementOrQuery == null || typeof canvasElementOrQuery == "undefined" || canvasElementOrQuery == "") canvas = null;
		else if (canvasElementOrQuery instanceof HTMLElement) canvas = canvasElementOrQuery;
		else if (typeof canvasElementOrQuery == "string") canvas = document.querySelector(canvasElementOrQuery);
		else log("Unknown url type provided to CanvasMedia");

		if (canvas != null)
		{
			log("Canvas element:", canvas);
			var canvasTexture = new THREE.Texture(canvas);
			
			canvas.minFilter = THREE.LinearFilter;
			canvas.magFilter = THREE.LinearFilter;
			canvas.generateMipmaps = false;
			canvasTexture.anisotropy=16;

			this.gotTexture(canvasTexture);
			this._canvasTexture = canvasTexture;
		}
		else 
		{
			log("Canvas element not provided, use (player_instance).media_loading.setCanvas(canvasElement)");
		}
	}


	Bivrost.CanvasMedia.prototype.update = function(dt) 
	{
		this._canvasTexture.needsUpdate = true;
	}

})();