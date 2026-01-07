
function formatTime(dateInput) {
    var date = new Date(dateInput);
    var y = date.getFullYear();
    var m = ('0' + (date.getMonth() + 1)).slice(-2);
    var d = ('0' + date.getDate()).slice(-2);
    var h = ('0' + date.getHours()).slice(-2);
    var i = ('0' + date.getMinutes()).slice(-2);
    var s = ('0' + date.getSeconds()).slice(-2);
    return y + '-' + m + '-' + d + ' ' + h + ':' + i + ':' + s;
}

// --- Diff Logic ---

function buildDiffTree(left, right, keyName) {
    var leftType = getType(left), rightType = getType(right);
    var node = { key: keyName, leftVal: left, rightVal: right, status: 'equal', children: null, type: 'primitive' };

    if (right === undefined) {
        node.status = 'left-only'; 
        if (leftType === 'object' || leftType === 'array') { node.type = leftType; node.children = buildChildren(left, undefined, leftType); }
    } else if (left === undefined) {
        node.status = 'right-only';
        if (rightType === 'object' || rightType === 'array') { node.type = rightType; node.children = buildChildren(undefined, right, rightType); }
    } else if (leftType !== rightType) {
        node.status = 'changed';
    } else if (leftType === 'object' || leftType === 'array') {
        node.type = leftType; node.children = buildChildren(left, right, leftType);
    } else {
        if (left !== right) node.status = 'changed';
    }
    return node;
}

function getType(val) {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
}

function buildChildren(left, right, type) {
    var children = [];
    if (type === 'array') {
        var len = Math.max(left ? left.length : 0, right ? right.length : 0);
        for (var i = 0; i < len; i++) children.push(buildDiffTree(left ? left[i] : undefined, right ? right[i] : undefined, i));
    } else {
        var leftKeys = left ? Object.keys(left) : [], rightKeys = right ? Object.keys(right) : [];
        var keys = leftKeys.slice(), leftKeySet = {};
        leftKeys.forEach(function(k){ leftKeySet[k] = true; });
        rightKeys.forEach(function(k) { if (!leftKeySet.hasOwnProperty(k)) keys.push(k); });
        keys.forEach(function(k) { children.push(buildDiffTree(left ? left[k] : undefined, right ? right[k] : undefined, k)); });
    }
    return children;
}

/**
 * Single Side Diff Renderer
 * @param {boolean} isLast - Whether this is the last item in a collection
 * @param {boolean} isRoot - Whether this is the top-level node
 */
function renderSingleSideDiff(node, side, isLast, isRoot) {
    if (side === 'left' && node.status === 'right-only') return '';
    if (side === 'right' && node.status === 'left-only') return '';

    var className = 'hoverable';
    if (node.status === 'changed') className += ' diff-changed';
    else if (side === 'left' && node.status === 'left-only') className += ' diff-added'; 
    else if (side === 'right' && node.status === 'right-only') className += ' diff-removed'; 

    var val = (side === 'left') ? node.leftVal : node.rightVal;
    var keyHtml = '';
    if (node.key !== undefined && node.key !== null && isNaN(node.key)) {
        keyHtml = '<span class="property">' + htmlEncode(node.key) + '</span>: ';
    }
    
    var output = '<div class="' + className + '">' + keyHtml;

    if (node.type === 'object' || node.type === 'array') {
        var openChar = (node.type === 'array') ? '[' : '{', closeChar = (node.type === 'array') ? ']' : '}';
        // Remove collapser if it's the root node to avoid redundant icons
        var collapserHtml = isRoot ? '' : '<div class="collapser"></div>';
        
        output += collapserHtml + openChar + '<span class="ellipsis"></span>';
        output += '<ul class="' + (node.type === 'array' ? 'array' : 'obj') + ' collapsible">';
        
        if (node.children) {
            var visibleChildren = [];
            for (var i = 0; i < node.children.length; i++) {
                var child = node.children[i];
                if ((side === 'left' && child.status === 'right-only') || (side === 'right' && child.status === 'left-only')) continue;
                visibleChildren.push(child);
            }
            for (var i = 0; i < visibleChildren.length; i++) {
                output += '<li>' + renderSingleSideDiff(visibleChildren[i], side, i === visibleChildren.length - 1, false) + '</li>';
            }
        }
        output += '</ul>' + closeChar + (isLast || isRoot ? '' : ',');
    } else {
        output += valueToHTML(val) + (isLast || isRoot ? '' : ',');
    }
    output += '</div>';
    return output;
}

function renderFullDiffView(diffRoot, side) {
    return '<div id="json">' + renderSingleSideDiff(diffRoot, side, true, true) + '</div>';
}

// --- App Logic ---

function saveHistory(jsonObj) {
    try {
        var key = "json_viewer_history", history = JSON.parse(localStorage.getItem(key) || "[]");
        var newItem = { name: document.title || "Unknown File", time: new Date().getTime(), url: window.location.href, content: jsonObj };
        if (window.location.protocol !== 'file:' && window.location.pathname) {
             var parts = window.location.pathname.split('/');
             newItem.name = parts[parts.length - 1] || window.location.host;
        }
        history.unshift(newItem);
        if (history.length > 17) history = history.slice(0, 17);
        localStorage.setItem(key, JSON.stringify(history));
    } catch (e) { }
}

function getStoredWidth() {
    return localStorage.getItem("json_viewer_width") || "300px";
}

function renderHistoryPanel() {
    var panel = document.createElement("div");
    panel.id = "right-panel";
    
    // Check stored collapse state
    var isCollapsed = localStorage.getItem("json_viewer_right_panel_collapsed") === "true";
    
    var list = document.createElement("div");
    list.id = "history-list";
    
    if (isCollapsed) {
        panel.classList.add("collapsed");
        // Apply inline styles to prevent FOUC before CSS loads
        panel.style.width = "36px";
        list.style.display = "none"; 
    } else {
        panel.style.width = getStoredWidth();
    }
    
    var handle = document.createElement("div");
    handle.id = "resize-handle";
    panel.appendChild(handle);
    
    var titleBlock = document.createElement("div");
    titleBlock.className = "history-title-block";
    titleBlock.innerHTML = '<div class="history-title-group"><span class="history-toggle-icon">▼</span><span>History Records</span></div><a href="#" id="clear-history-btn">Clear All</a>';
    panel.appendChild(titleBlock);
    
    var diffView = document.createElement("div");
    diffView.id = "diff-view";

    panel.appendChild(list);
    panel.appendChild(diffView);
    
    // Toggle Logic
    var titleGroup = titleBlock.querySelector(".history-title-group");
    titleGroup.onclick = function() {
        var isNowCollapsed = panel.classList.toggle("collapsed");
        localStorage.setItem("json_viewer_right_panel_collapsed", isNowCollapsed);
        
        if (isNowCollapsed) {
            // CSS !important handles the width, but we can set it for consistency or animation start points
            // list.style.display is handled by CSS !important
        } else {
            // Expanding: Ensure inline overrides from initialization are cleared
            if (panel.style.width === "36px") {
                 panel.style.width = getStoredWidth();
            }
            if (list.style.display === "none") {
                 list.style.display = "";
            }
        }
    };

    titleBlock.querySelector("#clear-history-btn").onclick = function(e) {
        e.preventDefault();
        if(confirm("Clear all history?")) {
            localStorage.removeItem("json_viewer_history");
            loadHistoryList();
        }
    };


    var isResizing = false;
    handle.onmousedown = function(e) { isResizing = true; document.body.style.cursor = "ew-resize"; e.preventDefault(); };
    document.onmousemove = function(e) {
        if (!isResizing) return;
        var newWidth = document.body.clientWidth - e.clientX;
        if (newWidth < 200) newWidth = 200;
        panel.style.width = newWidth + "px";
        panel.style.maxWidth = "none";
    };
    document.onmouseup = function() { 
        if (isResizing) { 
            isResizing = false; 
            document.body.style.cursor = "default"; 
            localStorage.setItem("json_viewer_width", panel.style.width);
        } 
    };

    return panel;
}

function loadHistoryList() {
    var list = document.getElementById("history-list");
    list.innerHTML = "";
    try {
        var history = JSON.parse(localStorage.getItem("json_viewer_history") || "[]");
        history.forEach(function(item, index) {
            var el = document.createElement("div");
            el.className = "history-item";
            var timeStr = formatTime(item.time);
            var isCurrent = (index === 0);
            var nameHtml = htmlEncode(item.name);
            if (isCurrent) {
                nameHtml += '<span class="current-badge">Current</span>';
            }
            
            el.innerHTML = '<div class="history-index">' + (index + 1) + '</div>' +
                           '<div class="history-info">' +
                             '<div class="history-filename" title="' + htmlEncode(item.name) + '">' + nameHtml + '</div>' +
                             '<div class="history-time">' + htmlEncode(timeStr) + '</div>' + 
                             '<div class="history-url" title="' + htmlEncode(item.url) + '">' + htmlEncode(item.url) + '</div>' +
                           '</div>';
            el.onclick = function() { showDiff(item); };
            list.appendChild(el);
        });
    } catch (e) { }
}

var currentJSON = null;
var currentRawText = "";
var currentViewMode = "parsed";
var isAllCollapsed = false;

function toggleAllNodes() {
    var jsonContent = document.getElementById("json-content");
    if (!jsonContent) return;
    
    var collapsers = jsonContent.querySelectorAll(".collapser");
    if (collapsers.length === 0) return;

    isAllCollapsed = !isAllCollapsed;
    for (var i = 0; i < collapsers.length; i++) {
        var parent = collapsers[i].parentElement;
        if (isAllCollapsed) {
            parent.classList.add("collapsed");
        } else {
            parent.classList.remove("collapsed");
        }
    }
}

function copyJSON() {
    if (!currentJSON) return;
    var textToCopy = (currentViewMode === "raw") ? currentRawText : JSON.stringify(currentJSON, null, 4);
    
    navigator.clipboard.writeText(textToCopy).then(function() {
         var btn = document.querySelector(".btn-copy-action");
         if(btn) {
             var originalHTML = btn.innerHTML;
             btn.innerHTML = "<span>✅</span>";
             setTimeout(function() { btn.innerHTML = originalHTML; }, 1500);
         }
    });
}

function createToolbar() {
    var toolbar = document.createElement("div");
    toolbar.className = "json-toolbar";
    toolbar.style.position = "absolute";
    toolbar.style.top = "5px";
    toolbar.style.right = "20px";
    toolbar.style.zIndex = "10";
    toolbar.style.display = "flex";
    toolbar.style.gap = "8px";

    var btnGroupView = document.createElement("div");
    btnGroupView.className = "btn-group";

    var btnParsed = document.createElement("button");
    btnParsed.innerText = "Parsed";
    btnParsed.className = "toolbar-btn" + (currentViewMode === "parsed" ? " active" : "");
    btnParsed.onclick = function() { switchView("parsed"); };

    var btnRaw = document.createElement("button");
    btnRaw.innerText = "Raw";
    btnRaw.className = "toolbar-btn" + (currentViewMode === "raw" ? " active" : "");
    btnRaw.onclick = function() { switchView("raw"); };

    btnGroupView.appendChild(btnParsed);
    btnGroupView.appendChild(btnRaw);

    var btnGroupAction = document.createElement("div");
    btnGroupAction.className = "btn-group";

    var btnToggle = document.createElement("button");
    btnToggle.innerHTML = "<span>↕️</span>";
    btnToggle.className = "toolbar-btn";
    btnToggle.title = "Expand/Collapse All";
    btnToggle.onclick = toggleAllNodes;

    var btnCopy = document.createElement("button");
    btnCopy.innerHTML = "<span>📋</span>";
    btnCopy.className = "toolbar-btn btn-copy-action";
    btnCopy.title = "Copy JSON";
    btnCopy.onclick = copyJSON;

    btnGroupAction.appendChild(btnToggle);
    btnGroupAction.appendChild(btnCopy);

    toolbar.appendChild(btnGroupView);
    toolbar.appendChild(btnGroupAction);

    return toolbar;
}

function switchView(mode) {
    if (currentViewMode === mode) return;
    currentViewMode = mode;
    
    var buttons = document.querySelectorAll(".toolbar-btn");
    for(var i=0; i<buttons.length; i++) {
        var btn = buttons[i];
        // Only toggle active class for text buttons (Parsed/Raw), avoid messing with icon buttons
        if (btn.innerText === "Parsed" || btn.innerText === "Raw") {
            if (btn.innerText.toLowerCase() === mode) btn.classList.add("active");
            else btn.classList.remove("active");
        }
    }

    var jsonContent = document.getElementById("json-content");
    if (!jsonContent) return;

    if (mode === "parsed") {
        jsonContent.innerHTML = jsonToHTML(currentJSON, "");
        attachCollapsers(jsonContent);
    } else {
        jsonContent.innerHTML = '<pre id="raw-json">' + htmlEncode(currentRawText) + '</pre>';
    }
}

function attachCollapsers(container) {
    var collapsers = container.querySelectorAll(".collapser, .ellipsis");
    for (var i = 0; i < collapsers.length; i++) {
        collapsers[i].onclick = function (e) { e.stopPropagation(); this.parentElement.classList.toggle('collapsed'); };
    }
}

function showDiff(historyItem) {
    var diffView = document.getElementById("diff-view"), list = document.getElementById("history-list");
    var titleBlock = document.querySelector(".history-title-block"), rightPanel = document.getElementById("right-panel");
    var jsonContainer = document.getElementById("json-container");
    
    var diffRoot = buildDiffTree(currentJSON, historyItem.content, undefined);
    
    jsonContainer.innerHTML = '';
    var leftHeader = document.createElement("div");
    leftHeader.className = "diff-header";
    leftHeader.innerHTML = '<span class="diff-header-title">Current</span><span class="diff-header-url" title="' + htmlEncode(window.location.href) + '">' + htmlEncode(window.location.href) + '</span>';
    jsonContainer.appendChild(leftHeader);
    var leftContent = document.createElement("div");
    leftContent.id = "json-content";
    leftContent.innerHTML = renderFullDiffView(diffRoot, 'left');
    jsonContainer.appendChild(leftContent);
    attachCollapsers(leftContent);
    
    diffView.innerHTML = '';
    var rightHeader = document.createElement("div");
    rightHeader.className = "diff-header";
    rightHeader.innerHTML = '<span class="diff-header-title">History (' + htmlEncode(formatTime(historyItem.time)) + ')</span><span class="diff-header-url" title="' + htmlEncode(historyItem.url) + '">' + htmlEncode(historyItem.url) + '</span>';
    var closeBtn = document.createElement("button");
    closeBtn.innerText = "Close";
    closeBtn.className = "diff-close-btn";
    closeBtn.onclick = function() {
        jsonContainer.innerHTML = '';
        jsonContainer.appendChild(createToolbar());
        var content = document.createElement("div");
        content.id = "json-content";
        if (currentViewMode === "parsed") {
            content.innerHTML = jsonToHTML(currentJSON, "");
            attachCollapsers(content);
        } else {
            content.innerHTML = '<pre id="raw-json">' + htmlEncode(currentRawText) + '</pre>';
        }
        jsonContainer.appendChild(content);
        diffView.style.display = "none";
        list.style.display = "block";
        titleBlock.style.display = "flex";
        rightPanel.style.width = getStoredWidth(); 
    };
    rightHeader.appendChild(closeBtn);
    diffView.appendChild(rightHeader);

    var histContainer = document.createElement("div");
    histContainer.className = "diff-container";
    histContainer.innerHTML = renderFullDiffView(diffRoot, 'right');
    diffView.appendChild(histContainer);
    attachCollapsers(histContainer);
    
    titleBlock.style.display = "none";
    list.style.display = "none";
    diffView.style.display = "block"; 
    rightPanel.style.width = "50%"; 

    // Sync Scroll
    function syncScroll(e) {
        var other = (e.target === leftContent) ? histContainer : leftContent;
        // Check if other is currently being scrolled by user to avoid loop (simple lock)
        if (other.isScrolling) return;
        
        e.target.isScrolling = true;
        other.scrollTop = e.target.scrollTop;
        other.scrollLeft = e.target.scrollLeft;
        
        // Reset lock after short delay
        window.cancelAnimationFrame(e.target.scrollTimeout);
        e.target.scrollTimeout = window.requestAnimationFrame(function() {
            e.target.isScrolling = false;
        });
    }

    leftContent.addEventListener('scroll', syncScroll);
    histContainer.addEventListener('scroll', syncScroll);
}

function load(){
    function test(text) {
        if (!text) return false;
        text = text.trim();
        return ((text.charAt(0) == "[" && text.charAt(text.length - 1) == "]") || (text.charAt(0) == "{" && text.charAt(text.length - 1) == "}"));
    }
    var rawHtml = document.body.innerText; 
    if(! test(rawHtml)) return false;
    currentRawText = rawHtml;
    try { currentJSON = JSON.parse(rawHtml); } catch (e) { return false; }

    injectCustomCss("css/json.css");
    injectCustomCss("css/json-core.css");
    saveHistory(currentJSON);

    var mainContainer = document.createElement("div");
    mainContainer.id = "main-container";
    var jsonContainer = document.createElement("div");
    jsonContainer.id = "json-container";
    jsonContainer.style.position = "relative";

    jsonContainer.appendChild(createToolbar());

    var jsonContent = document.createElement("div");
    jsonContent.id = "json-content";
    jsonContent.innerHTML = jsonToHTML(currentJSON, "");
    jsonContainer.appendChild(jsonContent);
    var rightPanel = renderHistoryPanel();
    mainContainer.appendChild(jsonContainer);
    mainContainer.appendChild(rightPanel);
    document.body.innerHTML = "";
    document.body.appendChild(mainContainer);
    attachCollapsers(jsonContent);
    loadHistoryList();
}

function injectCustomCss(cssPath) {
    var temp = document.createElement("link");
    temp.setAttribute("rel", "stylesheet");
    temp.setAttribute("type", "text/css"); 
    temp.setAttribute("href", chrome.runtime.getURL(cssPath));
    document.head.appendChild(temp);
}

function applyTheme() {
    chrome.storage.local.get({ theme: 'light' }, function(items) {
        if (items.theme === 'dark') {
            document.body.classList.add('theme-dark');
        } else {
            document.body.classList.remove('theme-dark');
        }
    });
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.theme) {
        if (changes.theme.newValue === 'dark') {
            document.body.classList.add('theme-dark');
        } else {
            document.body.classList.remove('theme-dark');
        }
    }
});

load();
applyTheme();
