chrome.omnibox.onInputChanged.addListener(function(n, e) {
	console.log("inputChanged: " + n), e([{
		content: "格式化 JSON",
		description: "校验并格式化json功能!"
	}])
}), chrome.omnibox.onInputEntered.addListener(function(n) {
	chrome.tabs.query({
		active: !0,
		currentWindow: !0
	}, function(e) {
		var o = chrome.extension.getURL("/pages/json-container.html") + "?json=" + encodeURIComponent(n);
		chrome.tabs.update(e[0].id, {
			url: o
		})
	})
});