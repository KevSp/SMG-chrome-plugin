function executeScriptOnCurrentTab(script) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tab) {
        chrome.tabs.executeScript(tab.id, {
            code: script
        });
    });
}

function setTitle(newTitle) {
    var script = "document.title = '" + newTitle + "'";
    executeScriptOnCurrentTab(script);
}

function on_siteSupported(tab) {
    var port = chrome.tabs.connect(tab.id, {name: "smg-music"});

    function nag_for_songs() {
        console.log("get_current_song");
        port.postMessage({action: "get_current_song"});
    }

    var interval_id = setInterval(nag_for_songs, 500);

    port.onDisconnect.addListener(function () {
        console.log("Disconnected port :(");
        clearInterval(interval_id, nag_for_songs);
    });

    port.onMessage.addListener(function (answer) {
        if (answer === undefined) {
            // uncomment for debugging
            // console.log(chrome.runtime.lastError);
            return;
        }
        console.log(answer);
        setTitle(answer.send_this_over_channel);
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