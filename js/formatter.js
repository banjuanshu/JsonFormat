
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
