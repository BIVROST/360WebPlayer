/* global Bivrost */
"use strict";


Bivrost.Loader=function(dom) {
	
	/**
	 * Logging helper
	 * @private
	 * @param {...object} vargs
	 */
	function log(/*vargs...*/) { Bivrost.log("Bivrost.Loader", arguments); };
	
	// not using document.registerElement - it's not it's time, yet. 
	// TODO: Maybe polymer/x-tag?
	
	
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
		return null;
	};
	
	[].slice.call(document.querySelectorAll("bivrost-player, .bivrost-player")).forEach(function(e,i) {
		var urls={};
		
		// root url+type configuration
		var url=attr(e, "url");
		var type=attr(e, "type");
		if(url)
			urls[url]=type;
	
		// additional media-source url+type
		[].slice.call(e.querySelectorAll("[data-bivrost-url], [url]")).forEach(function(ee, ii) {
			urls[attr(ee, "url")]=attr(ee, "type");
		});
		
		log("found media: ", e, urls);
		
				
		
		var player=new Bivrost.Player(e, urls);
		
		var autoplay=attr(e, "autoplay");
		if(autoplay)
			player.autoplay=JSON.parse(autoplay);
	});
	
};


document.addEventListener('DOMContentLoaded', Bivrost.Loader.bind(Bivrost, document.body));
