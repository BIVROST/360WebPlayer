/* global Bivrost */
"use strict";

(function() {
	
	Bivrost.Store = function(storeName) {
		if(storeName)
			this.storeName = storeName;
		this.registered = [];
	};
	
	Bivrost.Store.prototype.get = function(name) {
		return this.find(function(o, n) { console.log(o,n,n === name); return n === name; } );
	};
	
	Bivrost.Store.prototype.require = function(name) {
		var o = this.get(name);
		if(!o)
			throw "Unregistered " + this.storeName + ": " + name; 
		return o;
	};
	
	/**
	 * @param {function(o:object, n:string)} predicate
	 * @returns {object}
	 */
	Bivrost.Store.prototype.find = function(predicate) {
		for(var i = this.registered.length-1; i >= 0; i--) {
			var r = this.registered[i];
			if(predicate(r.object, r.name, r)) {
				return r.object;
			}
		}
		return undefined;
	};
	
	Bivrost.Store.prototype.findByKeywords = function(searchString) {
		return this.find(function(o, n, r) {
			var keywords = r.keywords;
			if(keywords) {
				var regex = new RegExp("(\\b|_)(" + keywords.join("|") + ")(\\b|_)");
				return regex.test(searchString);
			}
			return false;
		});
	};
	
	Bivrost.Store.prototype.register = function(name, object, keywords) {
		this.registered.push({name:name, object:object, keywords:keywords || []});
	};

	/**
	 * @type {Array<{name:string, object:object}>}
	 */
	Bivrost.Store.prototype.registered = null;
	
	Bivrost.Store.prototype.storeName = "Object";
	
	
	Bivrost.Store.prototype.isRegistered = function(name) {
		return !!this.get(name);
	};
	
	Bivrost.Store.prototype.allRegisteredNames = function() {
		return this.registered.map(function(r) { return r.name; }).sort();
	};
	
}());

