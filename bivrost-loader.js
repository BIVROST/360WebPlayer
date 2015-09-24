/* global Bivrost */
"use strict";


Bivrost.Loader=function(dom) {
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.Loader", arguments); };
	
	
	/**
	 * Helper returning an custom or data attribute 
	 * @param {HTMLEleemnt} element
	 * @param {string} name
	 * @param {?string} throws
	 * @returns {string|null}
	 */
	function attr(element, name, throws) {
		if(element.hasAttribute(name))
			return element.getAttribute(name);
		if(element.hasAttribute("data-bivrost-"+name))
			return element.getAttribute("data-bivrost-"+name);
		if(throws)
			throw throws;
		return undefined;
	};
	
	/**
	 * @param {string} value
	 * @param {array<string>} allowed
	 * @param {string} throws
	 */
	function assert(value, allowed, throws) {
		if(allowed.indexOf(value) === -1)
			throw throws;
	}
	
	
	return [].map.call(document.querySelectorAll("bivrost-player, [data-bivrost-player]"), function(container) {
		var urls={};
		
		// root url+type configuration
		var url=attr(container, "url");
		var type=attr(container, "type");
		if(url)
			urls[url]=type;
	
		// additional media-source url+type
		[].slice.call(container.querySelectorAll("bivrost-media, [data-bivrost-media]")).forEach(function(ee) {
			urls[attr(ee, "url", "url (or data-bivrost-url) attribute is required in the bivrost-media tag")]=attr(ee, "type");
		});
		
		log("loading media: ", container, urls);

		var stereoscopy=attr(container, "stereoscopy") || Bivrost.STEREOSCOPY_AUTODETECT;
		assert(stereoscopy, Bivrost.AVAILABLE_STEREOSCOPIES, "stereoscopy must be "+Bivrost.AVAILABLE_STEREOSCOPIES.join(" or "));

		var projection=attr(container, "projection") || Bivrost.PROJECTION_EQUIRECTANGULAR;
		assert(projection.replace(/:.+/, ""), Bivrost.AVAILABLE_PROJECTIONS, "projection must be "+Bivrost.AVAILABLE_PROJECTIONS.join(" or "));
		
		var source=attr(container, "source") || Bivrost.SOURCE_AUTODETECT;
		assert(source, Bivrost.AVAILABLE_SOURCES, "source must be "+Bivrost.AVAILABLE_SOURCES.join(" or "));
		
		var loop=attr(container, "loop") || "false";
		assert(loop, ["true", "false"], "loop must be true or false");
		loop=loop === "true";
		
		var autoplay=attr(container, "autoplay") || "true";
		assert(autoplay, ["true", "false"], "autoplay must be true or false");
		autoplay=autoplay === "true";
		
		return new Bivrost.Player(container, urls, projection, stereoscopy, source, JSON.parse(loop), JSON.parse(autoplay));
	});
	
};


document.addEventListener('DOMContentLoaded', Bivrost.Loader.bind(Bivrost, document.body));


// not using document.registerElement to it's fullness - it's not it's time, yet we can always register the element for future use
// TODO: Maybe polymer/x-tag?
if(document.registerElement) {
	document.registerElement('bivrost-player');
	document.registerElement('bivrost-media');
}