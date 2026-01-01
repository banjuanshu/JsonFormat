
function htmlEncode(t) {
    return t != null ? t.toString().replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
}

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

function decorateWithSpan(value, className) {
    return '<span class="' + className + '">' + htmlEncode(value) + '</span>';
}

function valueToHTML(value) {
    var valueType = typeof value, output = "";
    if (value == null)
        output += decorateWithSpan("null", "type-null");
    else if (valueType == "number")
        output += decorateWithSpan(value, "type-number");
    else if (valueType == "string")
        if (/^(http|https):\/\/[^\s]+$/.test(value))
            output += decorateWithSpan('"', "type-string") + '<a href="' + value + '" target="_blank" rel="noopener noreferrer">' + htmlEncode(value) + '</a>' + decorateWithSpan('"', "type-string");
        else
            output += decorateWithSpan('"' + value + '"', "type-string");
    else if (valueType == "boolean")
        output += decorateWithSpan(value, "type-boolean");
    else if (typeof value === 'object') {
        if (Array.isArray(value)) return value.length ? '[...]' : '[]';
        return Object.keys(value).length ? '{...}' : '{}';
    }
    return output;
}

// --- Standard Viewer ---

function standardArrayToHTML(json) {
    var i, length, output = '<div class="collapser"></div>[<span class="ellipsis"></span><ul class="array collapsible">', hasContents = false;
    for (i = 0, length = json.length; i < length; i++) {
        hasContents = true;
        output += '<li><div class="hoverable">' + standardValueToHTML(json[i]) + (i < length - 1 ? ',' : '') + '</div></li>';
    }
    output += '</ul>]';
    if (!hasContents) output = "[ ]";
    return output;
}

function standardObjectToHTML(json) {
    var i, key, length, keys = Object.keys(json), output = '<div class="collapser"></div>{<span class="ellipsis"></span><ul class="obj collapsible">', hasContents = false;
    for (i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        hasContents = true;
        output += '<li><div class="hoverable"><span class="property">' + htmlEncode(key) + '</span>: ' + standardValueToHTML(json[key]) + (i < length - 1 ? ',' : '') + '</div></li>';
    }
    output += '</ul>}';
    if (!hasContents) output = "{ }";
    return output;
}

function standardValueToHTML(value) {
    var valueType = typeof value;
    if (value == null) return decorateWithSpan("null", "type-null");
    if (Array.isArray(value)) return standardArrayToHTML(value);
    if (valueType == "object") return standardObjectToHTML(value);
    return valueToHTML(value);
}

function jsonToHTML(json, fnName) {
    var output = '';
    if (fnName) output += '<div class="callback-function">' + fnName + '(</div>';
    output += '<div id="json">' + standardValueToHTML(json) + '</div>';
    if (fnName) output += '<div class="callback-function">)</div>';
    return output;
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
    panel.style.width = getStoredWidth();
    
    var handle = document.createElement("div");
    handle.id = "resize-handle";
    panel.appendChild(handle);
    
    var titleBlock = document.createElement("div");
    titleBlock.className = "history-title-block";
    titleBlock.innerHTML = '<span>History Records</span><a href="#" id="clear-history-btn">Clear All</a>';
    panel.appendChild(titleBlock);
    
    var list = document.createElement("div");
    list.id = "history-list";
    
    var diffView = document.createElement("div");
    diffView.id = "diff-view";

    panel.appendChild(list);
    panel.appendChild(diffView);
    
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

function attachCollapsers(container) {
    var collapsers = container.getElementsByClassName("collapser");
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
        var content = document.createElement("div");
        content.id = "json-content";
        content.innerHTML = jsonToHTML(currentJSON, "");
        jsonContainer.appendChild(content);
        attachCollapsers(content);
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
}

function load(){
    function test(text) {
        if (!text) return false;
        text = text.trim();
        return ((text.charAt(0) == "[" && text.charAt(text.length - 1) == "]") || (text.charAt(0) == "{" && text.charAt(text.length - 1) == "}"));
    }
    var rawHtml = document.body.innerText; 
    if(! test(rawHtml)) return false;
    try { currentJSON = JSON.parse(rawHtml); } catch (e) { return false; }

    injectCustomCss("css/json.css");
    injectCustomCss("css/json-core.css");
    saveHistory(currentJSON);

    var mainContainer = document.createElement("div");
    mainContainer.id = "main-container";
    var jsonContainer = document.createElement("div");
    jsonContainer.id = "json-container";
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

load();
