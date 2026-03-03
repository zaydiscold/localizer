// Localizer — by Zayd @ ColdCooks
// https://github.com/zaydiscold

const toggle = document.getElementById('enabled');

chrome.storage.local.get({ enabled: true }, (data) => {
  toggle.checked = data.enabled;
});

toggle.addEventListener('change', () => {
  chrome.storage.local.set({ enabled: toggle.checked });
});
