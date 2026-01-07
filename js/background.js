
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: 'editor.html' });
});

chrome.commands.onCommand.addListener((command) => {
    if (command === "open-editor") {
        chrome.tabs.create({ url: 'editor.html' });
    }
});
