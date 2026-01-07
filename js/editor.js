
var input = document.getElementById("json-input");
var output = document.getElementById("output-pane");
var errorMsg = document.getElementById("error-msg");
var currentJsonObj = null;

function update() {
    var raw = input.value.trim();
    if (!raw) {
        output.innerHTML = "";
        errorMsg.style.display = "none";
        currentJsonObj = null;
        return;
    }

    try {
        currentJsonObj = JSON.parse(raw);
        output.innerHTML = jsonToHTML(currentJsonObj, "");
        errorMsg.style.display = "none";
        attachCollapsers(output);
    } catch (e) {
        errorMsg.textContent = "Invalid JSON: " + e.message;
        errorMsg.style.display = "block";
        currentJsonObj = null;
    }
}

function attachCollapsers(container) {
    var collapsers = container.querySelectorAll(".collapser, .ellipsis");
    for (var i = 0; i < collapsers.length; i++) {
        collapsers[i].onclick = function (e) { 
            e.stopPropagation(); 
            this.parentElement.classList.toggle('collapsed'); 
        };
    }
}

// Toolbar Logic
var isAllCollapsed = false;
document.getElementById("btn-toggle-nodes").onclick = function() {
    var collapsers = output.querySelectorAll(".collapser");
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
};

document.getElementById("btn-copy").onclick = function() {
    if (!currentJsonObj) return;
    var formatted = JSON.stringify(currentJsonObj, null, 4);
    navigator.clipboard.writeText(formatted).then(function() {
        var btn = document.getElementById("btn-copy");
        var originalText = btn.innerHTML;
        btn.innerHTML = "<span>✅</span> <span>Copied!</span>";
        setTimeout(function() {
            btn.innerHTML = originalText;
        }, 1500);
    });
};

input.addEventListener("input", update);

// Handle Cmd+A / Ctrl+A to select only the formatted JSON when not editing
document.addEventListener("keydown", function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        if (document.activeElement === input) {
            return; // Let default behavior handle textarea selection
        }
        
        e.preventDefault();
        var range = document.createRange();
        var jsonDiv = document.getElementById("json");
        if (jsonDiv) {
            range.selectNodeContents(jsonDiv);
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
});

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

// Initial check if there's any content (e.g. browser restored)
update();
applyTheme();
