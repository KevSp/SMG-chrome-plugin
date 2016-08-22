// $NAME are NOT jQuery tags, just normal HTMLElements
var $status            = document.querySelector(".status");
var $currently_playing = document.querySelector(".currently-playing");

// this port is for asking background.js (which asks foreground.js) what song is currently playing
var musicRetrievalPort = chrome.runtime.connect({name: "smg-music-display"});
setInterval(function () {
	musicRetrievalPort.postMessage({action: "send-last-song-playing"});
}, 500);

musicRetrievalPort.onMessage.addListener(function (message) {
	// error checking is mandatory, background.js always sends a response, 
	// even if the answer is null/undefined so check that here
	if (message !== null && message !== undefined) {
		console.log("received message from background.js", message);
		$status.innerHTML = "You're listening to music on " + "<span class='music_player_name'>" + message.music_player_name + "</span>";
		$currently_playing.innerHTML = message.song;
	} else {
		$status.innerHTML = "Not connected to a webpage";
		$currently_playing = "No song playing";
	}
});
