'use strict';

const KEYS = ['preferredType', 'preferredRegion', 'preferredDays', 'prefsEnabled'];

function showStatus(msg, ok) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status ' + (ok ? 'ok' : 'err');
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}

// Load saved prefs into UI
chrome.storage.sync.get(KEYS, (data) => {
  if (data.preferredRegion) {
    document.getElementById('sel-region').value = data.preferredRegion;
  }
  if (data.preferredType) {
    document.getElementById('sel-type').value = data.preferredType;
  }
  if (data.preferredDays) {
    document.getElementById('sel-days').value = String(data.preferredDays);
  }
  document.getElementById('chk-enabled').checked = !!data.prefsEnabled;
});

document.getElementById('btn-save').addEventListener('click', () => {
  const data = {
    preferredRegion: document.getElementById('sel-region').value,
    preferredType: document.getElementById('sel-type').value,
    preferredDays: document.getElementById('sel-days').value,
    prefsEnabled: document.getElementById('chk-enabled').checked,
  };
  chrome.storage.sync.set(data, () => {
    if (chrome.runtime.lastError) {
      showStatus('Error saving preferences.', false);
    } else {
      showStatus('Preferences saved!', true);
    }
  });
});

document.getElementById('btn-clear').addEventListener('click', () => {
  chrome.storage.sync.remove(KEYS, () => {
    document.getElementById('sel-region').value = 'nz';
    document.getElementById('sel-type').value = 'rain';
    document.getElementById('sel-days').value = '10';
    document.getElementById('chk-enabled').checked = false;
    showStatus('Preferences cleared.', true);
  });
});
