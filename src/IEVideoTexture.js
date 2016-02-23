THREE.IEVideoTexture = function ( video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy ) {

	/**
	 * Internet Explorer as of Microsoft Edge is not capable of rendering a video
	 * to a WebGL Texture. But it is capable of rendering a video to a canvas and
	 * a canvas to a texture.
	 * 
	 * TODO: feature detection of not being able to set texture, not UA
	 */
	var isIE=/\b(Trident|IEMobile|Edge)\b/.test(navigator.userAgent);
	var canvas, ctx;
	if(isIE) {
		Bivrost.log("IEVideoTexture", "using IE video rendering");
		
		canvas=document.createElement("canvas");
		ctx=canvas.getContext("2d");

		var setCanvasVideoSize=function() {
			canvas.width=video.videoWidth;
			canvas.height=video.videoHeight;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		};
		if(video.videoHeight)
			setCanvasVideoSize();
		else
			video.addEventListener("loadedmetadata", setCanvasVideoSize);

		THREE.Texture.call( this, canvas, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );
	}
	else {
		THREE.Texture.call( this, video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );
	}
	

	this.generateMipmaps = false;

	var scope = this;
	
	var have_enough_data_notified = false;
	var force_enough_data = false;
	
	var update = function () {

		requestAnimationFrame( update );
		
		if ( video.readyState === video.HAVE_ENOUGH_DATA || scope.force_enough_data ) {
			
			if(!have_enough_data_notified) {
				have_enough_data_notified=true;
				console.log("IEVideoTexture.HAVE_ENOUGH_DATA");
			}
			
			if(isIE)
				ctx.drawImage(video, 0, 0);

			scope.needsUpdate = true;

		}

	};

	update();

};

THREE.IEVideoTexture.prototype = Object.create( THREE.Texture.prototype );
THREE.IEVideoTexture.prototype.constructor = THREE.VideoTexture;
