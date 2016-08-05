var identifier;
var port;

function onChannelMessage(message) {
	if (message.action === "get_current_song") {
		if (identifier === undefined) {
			identifier = smg.get_identifier(window.location.host, document);
		}
		port.postMessage({
			song: identifier(document)
		});
	}
}

chrome.runtime.onConnect.addListener(function(port) {
	console.assert(port.name == "smg-music");
	port.onMessage.addListener(function(message) {
		if (message.action === "get_current_song") {
			console.log("Got get_current_song");
			if (identifier === undefined) {
				identifier = smg.get_identifier(window.location.host, document);
			}
			port.postMessage(identifier(document));
		}
	});
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (message.action === "is_site_supported") {
		var supported = smg.is_site_supported(window.location.host, document);
		// if supported is true, the background script will open a connection
		// resulting in the code in chrome.runtime.onConnect.addListener
		// to run
		sendResponse({
			supported: supported
		});
	}
});