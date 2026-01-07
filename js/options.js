// Saves options to chrome.storage
function save_options() {
  var theme = document.getElementById('theme').value;
  chrome.storage.local.set({
    theme: theme
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.style.opacity = '1';
    setTimeout(function() {
      status.style.opacity = '0';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.local.get({
    theme: 'light' // Default value
  }, function(items) {
    document.getElementById('theme').value = items.theme;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('theme').addEventListener('change', save_options);
