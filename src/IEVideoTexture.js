/* global Bivrost */

THREE.IEVideoTexture = function ( video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy ) {

	/**
	 * Internet Explorer as of Microsoft Edge is not capable of rendering a video
	 * to a WebGL Texture. But it is capable of rendering a video to a canvas and
	 * a canvas to a texture.
	 * 
	 * This now badly named class also fixes an firefox bug with HLS streaming.
	 * 
	 * TODO: feature detection of not being able to set texture, not UA
	 * 
	 * @author Krzysztof Bociurko
	 */
	var isIE=/\b(Trident|IEMobile|Edge)\b/.test(navigator.userAgent);
	var canvas, ctx, ctxWidth, ctxHeight;
	if(isIE) {
		Bivrost.log("IEVideoTexture", ["using IE video rendering hack"]);
		
		canvas=document.createElement("canvas");
		ctx=canvas.getContext("2d");

		var setCanvasVideoSize=function() {
			canvas.width=ctxWidth=video.videoWidth;
			canvas.height=ctxHeight=video.videoHeight;
			Bivrost.log("IEVideoTexture", ["canvas resize", ctxWidth, ctxHeight]);
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
	
	// firefox hack for not receiving video.HAVE_ENOUGH_DATA with HLS.js
	var forceEnoughData = false;
	var haveEnoughDataHack=function() {
		video.removeEventListener("timeupdate", haveEnoughDataHack);
		if(video.readyState === video.HAVE_ENOUGH_DATA)
			return;
		Bivrost.log("IEVideoTexture", ["haveEnoughDataHack used on timeupdate, video.readyState=", video.readyState]);
		forceEnoughData=true;
	};
	video.addEventListener("timeupdate", haveEnoughDataHack);

	
	var update = function () {

		requestAnimationFrame( update );
		
		if ( video.readyState === video.HAVE_ENOUGH_DATA || forceEnoughData ) {
			
			if(isIE) {
				if(video.videoWidth !== ctxWidth || video.videoHeight !== ctxHeight)
					setCanvasVideoSize();
				ctx.drawImage(video, 0, 0);
			}

			scope.needsUpdate = true;

		}

	};

	update();

};

THREE.IEVideoTexture.prototype = Object.create( THREE.Texture.prototype );
THREE.IEVideoTexture.prototype.constructor = THREE.VideoTexture;
