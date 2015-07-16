"use strict";

Bivrost.UI=(function() {
	
	var log=console.log.bind(console, "[Bivrost.UI]");
	
	
	function UI(domElement, picture) {
		this.domElement=domElement;
		this.picture=picture;
	}
	
	UI.prototype.setPicture=function(picture) {}
	
	UI.prototype.domElement=null;
	
	UI.prototype.picture=null;
	
	return MouseLook;
	
})();