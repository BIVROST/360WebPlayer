/* global Bivrost */
"use strict";

/**
 * Observer-Observable pattern
 * @param {?function(function)} onSubscribe - optional function to be called on subscription (for example to publish a starter event)
 */
Bivrost.Observable=function(onSubscribe) {
	this._observers=[];
	this._onSubscribe=onSubscribe;
};


/**
 * @private
 * @type {array<function>}
 */
Bivrost.Observable.prototype._observers=null;


/**
 * @private
 * @type {function(function)}
 */
Bivrost.Observable.prototype._onSubscribe=null;


/**
 * Sends an event to all observers
 * @param {?object} args - arguments to be sent to all observers
 */
Bivrost.Observable.prototype.publish=function(args) {
	for(var h in this._observers)
		if(this._observers.hasOwnProperty(h))
			this._observers[h].call(this, args);
};


/**
 * Adds the observer to the list of callbacks to be called when the event is published
 * @param {function(object)} observer
 * @returns {function()} a shortcut function to unsubscribe the observer, ignore if not needed
 */
Bivrost.Observable.prototype.subscribe=function(observer) {
	if(this._observers.indexOf(observer) === -1) {
		this._observers.push(observer);
		if(this._onSubscribe)
			this._onSubscribe(observer);
	}
	return this.unsubscribe.bind(this);
};


/**
 * Adds the observer to the list of callbacks to be called when the event is published. The observer is then removed from the event list.
 * @param {function(object)} observer
 * @returns {function()} a shortcut function to unsubscribe the observer, ignore if not needed - note this is the only method that you can unsubscribe this kind of event
 */
Bivrost.Observable.prototype.subscribeOnce=function(observer) {
	var thisRef=this;
	var runAndUnsubscribe=function(args) {
		observer(args);
		thisRef.unsubscribe(runAndUnsubscribe);
	};
	return this.subscribe(runAndUnsubscribe);
};


/**
 * Cancel the listening of the observer. Note that with subscribeOnce, you can't use this method.
 * @param {function(object)} observer
 * @returns {Boolean} true is unsubscribe succeeded
 */
Bivrost.Observable.prototype.unsubscribe=function(observer) {
	var idx=this._observers.indexOf(observer);
	if(idx === -1)
		return false;
	this._observers.splice(idx, 1);
	return true;
};