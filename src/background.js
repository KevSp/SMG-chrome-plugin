// short diagram of all communications and ports
// name                      from               to
// =====================================================
// "smg-music-display"       groovemarklet.js   background.js
// -----------------------------------------------------
// action                    response
// "send-last-song-playing"  lastSongPlaying
//
//
// name                      from               to
// =====================================================
// "smg-music-receive"       background.js      foreground.js
// -----------------------------------------------------
// action                    response
// "get_current_song"        smg.get_identifier(...)(document)
//

// this variable points to the last message received from the content script
var lastSongPlaying = undefined;

function executeScriptOnTab(script, tabId) {
    chrome.tabs.executeScript(tabId, {
        code: script
    });
}

function setTitle(newTitle, tabId) {
    var script = "document.title = '" + newTitle + "'";
    executeScriptOnTab(script, tabId);
}

function getActiveTab(callback) {
    return chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        // I'm not sure if it's possible for the tabs array to be empty, so I added this inline check just to be sure
        callback(tabs.length >= 1 ? tabs[0] : undefined);
    });
}

// port to communicate with the popup
chrome.runtime.onConnect.addListener(function (port) {
    if (port.name === "smg-music-display") {
        port.onMessage.addListener(function (message) {
            if (message.action === "send-last-song-playing") {
                port.postMessage(lastSongPlaying);
            }
        });
    }
});

function on_siteSupported(tab) {
    // musicRetrievalPort is to communicate with the content script `foreground.js`, which retrieves
    // music from the web-page
    var musicRetrievalPort = chrome.tabs.connect(tab.id, {name: "smg-music-retrieve"});

    function nag_for_songs() {
        musicRetrievalPort.postMessage({action: "get_current_song"});
    }

    var interval_id = setInterval(nag_for_songs, 500);

    musicRetrievalPort.onDisconnect.addListener(function () {
        clearInterval(interval_id, nag_for_songs);
    });

    musicRetrievalPort.onMessage.addListener(function (answer) {
        if (answer === undefined) {
            // uncomment for debugging
            // console.log(chrome.runtime.lastError);
            return;
        }

        if (answer.song) {
            // SMG should detect the active tab only
            // when trying to communicate with the popup script (groovemarklet.js), we need to be able to send
            // what song is currently playing (if any). If multiple tabs are open with different music players
            // e.g. tab1 = twitter, tab2 = di.fm, tab3 = youtube
            // SMG will pick the one that is currently focused.
            getActiveTab(function (activeTab) {
                if (activeTab && tab.id === activeTab.id) {
                    setTitle(answer.send_this_over_channel, tab.id);
                    lastSongPlaying = answer;
                }
            });
        }
    });
}

function on_siteNotSupported() {
    // don't do anything :D
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        chrome.tabs.sendMessage(
            tab.id,
            {action: "is_site_supported"},
            function(answer) {
                if (answer === undefined) {
                    console.log(chrome.runtime.lastError);
                } else {
                    if (answer.supported) {
                        on_siteSupported(tab);
                    } else {
                        on_siteNotSupported();
                    }                   
                }
            }
        );
    }
});