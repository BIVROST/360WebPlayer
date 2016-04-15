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
	 * Asserts that the value is one of allowed
	 * @private
	 * @param {string} value
	 * @param {array<string>} allowed
	 * @param {string} throws - the message that is thrown as an exception if assertion fails
	 * @return the value if correct
	 */
	function assert(value, allowed, throws) {
		if(allowed.indexOf(value) === -1)
			throw throws;
		return value;
	}
	
	
	/**
	 * Helper returning an custom or data attribute as a string
	 * @private
	 * @param {HTMLElement} element
	 * @param {string} name
	 * @param {?*|?{message:string, is_thrower:bool}} defaultValue - set value or use argumentIsRequiredHelper
	 * @returns {string|undefined}
	 */
	function attrString(element, name, defaultValue) {
		if(element.hasAttribute(name))
			return element.getAttribute(name);
		
		if(element.hasAttribute("data-bivrost-"+name))
			return element.getAttribute("data-bivrost-"+name);
		
		if(typeof(defaultValue) === "undefined")
			return undefined;
		
		if(defaultValue.hasOwnProperty("is_thrower"))
			throw defaultValue.message;
		
		return defaultValue.toString();
	};


	/**
	 * Helper returning an custom or data attribute as a boolean, available values of attribute are "true" and "false"
	 * @private
	 * @param {HTMLElement} element
	 * @param {string} name
	 * @param {?*|?{message:string, is_thrower:bool}} defaultValue - set value or use argumentIsRequiredHelper, note: the default value should be in string form
	 * @returns {boolean|undefined}
	 */
	function attrBool(element, name, defaultValue) {
		var value=attrString(element, name, defaultValue);
		assert(value, ["true", "false"], name+" must be true or false");
		return value === "true";
	}


	/**
	 * Helper returning an custom or data attribute as a number, available values of attribute are "true" and "false"
	 * @private
	 * @param {HTMLElement} element
	 * @param {string} name
	 * @param {?*|?{message:string, is_thrower:bool}} defaultValue - set value or use argumentIsRequiredHelper, note: the default value should be in string form
	 * @returns {number|undefined}
	 */
	function attrNumber(element, name, defaultValue) {
		var value=attrString(element, name, defaultValue);
		if(!/^\d+(.\d*)?$/.test(value))
			throw name+" is not a number";
		return value === "true";
	}
	
	
	/**
	 * Helper returning an custom or data attribute as a string, available values of attribute are to be sent using availableValues param
	 * @private
	 * @param {HTMLElement} element
	 * @param {string} name
	 * @param {?*|?{message:string, is_thrower:bool}} defaultValue - set value or use argumentIsRequiredHelper
	 * @param {array<string>} availableValues
	 * @returns {string|undefined}
	 */
	function attrEnum(element, name, defaultValue, availableValues) {
		var value=attrString(element, name, defaultValue);
		assert(value, availableValues, name+" must be "+availableValues.join(" or "));
		return value;
	}
	
	
	/**
	 * Helper to be used as the argument defaultValue of attr_* functions, if used there it will make
	 * the attr_* helper throw an exception if the argument is not found
	 * @private
	 * @param {type} message
	 * @returns {Bivrost.Loader.helper_targumentIsRequiredHelper-loaderAnonym$1}
	 */
	function argumentIsRequiredHelper(message) {
		return {
			is_thrower: true,
			message: message
		};
	}
	
	
	return [].map.call(document.querySelectorAll("bivrost-player, [data-bivrost-player]"), function(container) {
		var urls={};
		
		// root url+type configuration
		var url=attrString(container, "url");
		var type=attrString(container, "type");
		if(url)
			urls[url]=type;
	
		// additional media-source url+type
		[].slice.call(container.querySelectorAll("bivrost-media, [data-bivrost-media]")).forEach(function(ee) {
			var url=attrString(ee, "url", argumentIsRequiredHelper("url (or data-bivrost-url) attribute is required in the bivrost-media tag"));
			var type=attrString(ee, "type");
			urls[url]=type;
		});
		
		log("loading media: ", container, urls);

		var stereoscopy=attrEnum(container, "stereoscopy", Bivrost.STEREOSCOPY_AUTODETECT, Bivrost.AVAILABLE_STEREOSCOPIES);

		var projection=attrString(container, "projection", Bivrost.PROJECTION_EQUIRECTANGULAR);
		assert(projection.replace(/:.+/, ""), Bivrost.AVAILABLE_PROJECTIONS, "projection must be "+Bivrost.AVAILABLE_PROJECTIONS.join(" or "));
		
		var source=attrEnum(container, "source", Bivrost.SOURCE_AUTODETECT, Bivrost.AVAILABLE_SOURCES);
		
		var loop=attrBool(container, "loop", false);

		var autoplay=attrBool(container, "autoplay", true);
		
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