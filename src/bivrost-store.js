/* global Bivrost */
"use strict";

(function() {
	
	Bivrost.Store = function() {
		this.registered = [];
	};
	
	Bivrost.Store.prototype.get = function(name) {
		return this.find(function(o, n) { console.log(o,n,n === name); return n === name; } );
	};
	
	/**
	 * @param {function(o:object, n:string)} predicate
	 * @returns {object}
	 */
	Bivrost.Store.prototype.find = function(predicate) {
		for(var i = this.registered.length-1; i >= 0; i--) {
			var r = this.registered[i];
						console.log("TRY", r,i);

			if(predicate(r.object, r.name, r)) {
				console.log("FOUND", r,i)
				return r.object;
			}
		}
		debugger;
		
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
	
	Bivrost.Store.prototype.isRegistered = function(name) {
		return !!this.get(name);
	};
	
	Bivrost.Store.prototype.allRegisteredNames = function() {
		return this.registered.map(function(r) { return r.name; }).sort();
	};
	
}());

