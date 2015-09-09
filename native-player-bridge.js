/**
 * Tries to open the external player using the hash part of the url
 * Warning: https:// must link to wss:// (security sandbox unsafe origin)
 * @param {?function} onSuccess executed if the player is running (websocket check)
 * @param {?function} onPopup executed if the "should i run the external app" window was opened
 * @param {?function} onFail executed if could not detect running of said window, possibly protocol not supported
 */
function open_native_player(onSuccess, onPopup, onFail) {
	"use strict";

	function ws_check(result, tries) {
		console.log("ws check...");
		var ws=new WebSocket(location.protocol !== "https://" ? "ws://127.0.0.1:24876" : "wss://127.0.0.1:24877", "bivrost"); 

		ws.onerror=function(err) { 
			console.error("fail, tries left="+~~tries, err);
			if(tries > 0) {
				setTimeout(function() { ws_check(result, tries-1); }, 1000);
			}
			else {
				console.error("surrender");
				result(false);
			}
		};

		ws.onmessage=function(msg) {
			console.log("version=", msg);
			result(true);
			ws.close();
		};

		ws.onopen=function() { 
			console.log("open");
			ws.send("version"); 
		};
	}


	var blur_handler=function() {
		removeEventListener("blur", blur_handler);
		clearTimeout(timeout);
		onPopup && onPopup();
	};
	var timeout=setTimeout(function() {
		removeEventListener("blur", blur_handler);
		onFail && onFail();
	}, 1000);
	addEventListener("blur", blur_handler);

	onSuccess && ws_check(
		function(result) { 
			console.log("result", result);
			if(result)
				onSuccess && onSuccess(); 
			else 
				onFail && onFail(); 
		},
		5
	);

	var link=location.hash.substr(1);
	var iframe=document.createElement("iframe");
	iframe.height=iframe.width=0;
	iframe.style.display="none";
	iframe.src=link;
	document.body.appendChild(iframe);
};
