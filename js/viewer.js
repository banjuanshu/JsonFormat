

function htmlEncode(t) {
    return t != null ? t.toString().replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
}

function decorateWithSpan(value, className) {
    return '<span class="' + className + '">' + htmlEncode(value) + '</span>';
}

function valueToHTML(value) {
    var valueType = typeof value, output = "";
    if (value == null)
        output += decorateWithSpan("null", "type-null");
    else if (value && value.constructor == Array)
        output += arrayToHTML(value);
    else if (valueType == "object")
        output += objectToHTML(value);
    else if (valueType == "number")
        output += decorateWithSpan(value, "type-number");
    else if (valueType == "string")
        if (/^(http|https):\/\/[^\s]+$/.test(value))
            output += decorateWithSpan('"', "type-string") + '<a href="' + value + '">' + htmlEncode(value) + '</a>' + decorateWithSpan('"', "type-string");
        else
            output += decorateWithSpan('"' + value + '"', "type-string");
    else if (valueType == "boolean")
        output += decorateWithSpan(value, "type-boolean");

    return output;
}

function arrayToHTML(json) {
    var i, length, output = '<div class="collapser"></div>[<span class="ellipsis"></span><ul class="array collapsible">', hasContents = false;
    for (i = 0, length = json.length; i < length; i++) {
        hasContents = true;
        output += '<li><div class="hoverable">';
        output += valueToHTML(json[i]);
        if (i < length - 1)
            output += ',';
        output += '</div></li>';
    }
    output += '</ul>]';
    if (!hasContents)
        output = "[ ]";
    return output;
}

function objectToHTML(json) {
    var i, key, length, keys = Object.keys(json), output = '<div class="collapser"></div>{<span class="ellipsis"></span><ul class="obj collapsible">', hasContents = false;
    for (i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        hasContents = true;
        output += '<li><div class="hoverable">';
        output += '<span class="property">' + htmlEncode(key) + '</span>: ';
        output += valueToHTML(json[key]);
        if (i < length - 1)
            output += ',';
        output += '</div></li>';
    }
    output += '</ul>}';
    if (!hasContents)
        output = "{ }";
    return output;
}

function jsonToHTML(json, fnName) {
    var output = '';
    if (fnName)
        output += '<div class="callback-function">' + fnName + '(</div>';
    output += '<div id="json">';
    output += valueToHTML(json);
    output += '</div>';
    if (fnName)
        output += '<div class="callback-function">)</div>';
    return output;
}


//向页面注入CSS
function injectCustomCss(cssPath) {
    cssPath = cssPath || "css/json.css";
    var temp = document.createElement("link");
    temp.setAttribute("rel", "stylesheet");
    temp.setAttribute("type", "text/css"); // 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
    temp.setAttribute("href", chrome.runtime.getURL(cssPath));
    temp.onload = function () {
        // 放在页面不好看，执行完后移除掉
        // this.parentNode.removeChild(this);
    };

    document.head.appendChild(temp);
}
// injectJS
function injectCustomJs(jsPath) {
    jsPath = jsPath || "css/json.css";
    var temp = document.createElement("script");
    temp.setAttribute("type", "text/javascript"); // 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
    temp.setAttribute("src", chrome.runtime.getURL(jsPath));
    temp.onload = function () {
        // 放在页面不好看，执行完后移除掉
        // this.parentNode.removeChild(this);
    };

    document.head.appendChild(temp);
}


function load(){
    function test(text) {
        return ((text.charAt(0) == "[" && text.charAt(text.length - 1) == "]") || (text.charAt(0) == "{" && text.charAt(text.length - 1) == "}"));
    }

    html = document.body.innerText;

    if(! test(html)){
        return false;
    }


    var object;
    try {
        object = JSON.parse(document.body.innerText);
    } catch (e) {
    }



    injectCustomCss("css/json.css")
    injectCustomCss("css/json-core.css")

    // chrome.tabs.executeScript(null, { file: "css/json.css" });

    // chrome.tabs.insertCSS(tabs[0].id, { file: "css/json-core.css" });
    // chrome.tabs.InjectDetails({ file: "css/json-core.css" });

    // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //     chrome.tabs.insertCSS(tabs[0].id, { file: "css/json-core.css" });
    // });

    // chrome.windows.getCurrent(function (currentWindow) {
    //     console.log("当前窗口ID：" + currentWindow.id);
    //     chrome.tabs.insertCSS(currentWindow.id, { file: "css/json-core.css" });
    // });







    html = jsonToHTML(object, "")

    document.body.innerHTML = html



}


load()
