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

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    var url = tab.url;

    console.log("changed tab!");

    if (url.indexOf("martijn") !== -1) {
      console.log("setting icon to check");
      chrome.browserAction.setIcon({
        path: "resources/check-128.png",
        tabId: tab.id
      });
    } else {
      console.log("setting icon to smg");
      chrome.browserAction.setIcon({
        path: "resources/icon-60.png",
        tabId: tab.id
      });
    }

    setTitle("hello world!");
  }
});
