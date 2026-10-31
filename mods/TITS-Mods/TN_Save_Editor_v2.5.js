// Kitty Save Editor v3 — runtime JavaScript (not .mod syntax)
(function () {
  'use strict';
  if (window.__tnSaveEditorV3Installed) return;
  window.__tnSaveEditorV3Installed = true;

  var EDITOR_URL = 'https://start-5.github.io/tits.js-save-editor/';
  var panel = null, frame = null;
  var MOD_ID = 'tn-save-editor';
  var MOD_NAME = 'TiTS Save Editor';
  var MOD_DESCRIPTION = 'Open the save editor from the Save/Load sidebar.';
  // The Android Mods switch counts only while that menu is running (Android).
  // On desktop, or without the menu, the editor is always on.
  function enabled() {
    if ((window.tnModMenuActive===true&&typeof window.isTnModEnabled==="function")) return window.isTnModEnabled(MOD_ID);
    return true;
  }

  function registerToggle() {
    if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return false;
    window.registerModMenu({
      id: MOD_ID,
      name: MOD_NAME,
      author: 'Kitty',
      description: MOD_DESCRIPTION,
      supportsToggle: true,
      onEnabledChange: function (next) {
        if (!next) disableUI();
        else enableUI();
        return true;
      }
    });
    return true;
  }

  // Runtime scripts may load in any order, so retry for up to 2 minutes.
  // Stop after 3 seconds if no TN menu is running.
  function waitForModMenu(tries) {
    tries = tries || 0;
    if (registerToggle()) return;
    if (window.tnModMenuActive === false && tries >= 6) return;   // no TN menu running
    if (tries < 240) setTimeout(function () { waitForModMenu(tries + 1); }, 500);
  }


  function openEditor() {
    if (!enabled()) return;
    if (!panel) {
      var style = document.createElement('style');
      style.textContent = '#tn-save-editor-panel{position:fixed;inset:0;z-index:2147483001;display:flex;flex-direction:column;background:#111b22;color:#f2f9f8;font:14px sans-serif}' +
        '#tn-save-editor-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px;background:#25343c}' +
        '#tn-save-editor-toolbar button,#tn-save-editor-toolbar a{background:#365d66;color:#fff;border:1px solid #8ccfc3;border-radius:6px;padding:8px;text-decoration:none;font:inherit;cursor:pointer}' +
        '#tn-save-editor-toolbar strong{margin-right:auto}' +
        '#tn-save-editor-help{padding:8px 12px;font-size:12px;line-height:1.4}' +
        '#tn-save-editor-frame{width:100%;flex:1;min-height:100px;background:#fff;border:0}';
      document.head.appendChild(style);

      panel = document.createElement('section');
      panel.id = 'tn-save-editor-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Save editor');
      var toolbar = document.createElement('div');
      toolbar.id = 'tn-save-editor-toolbar';
      var label = document.createElement('strong');
      label.textContent = 'TiTS Save Editor';
      toolbar.appendChild(label);

      function button(text, callback) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = text;
        b.addEventListener('click', callback);
        toolbar.appendChild(b);
      }

      var external = document.createElement('a');
      external.href = EDITOR_URL;
      external.target = '_blank';
      external.rel = 'noopener noreferrer';
      external.textContent = 'Open in Browser ↗';
      toolbar.appendChild(external);
      button('Reload', function () { if (frame) frame.src = EDITOR_URL; });
      button('Close', closeEditor);
      panel.appendChild(toolbar);

      var help = document.createElement('div');
      help.id = 'tn-save-editor-help';
      help.textContent = 'Export a save using Save To File, then load it in the editor using its file picker. After editing, download the changed save and import it with Load From File. If the embedded editor is blank, tap Open in Browser.';
      panel.appendChild(help);

      frame = document.createElement('iframe');
      frame.id = 'tn-save-editor-frame';
      frame.title = 'start-5 TiTS save editor';
      panel.appendChild(frame);
      document.body.appendChild(panel);
    }
    panel.style.display = 'flex';
    if (!frame.getAttribute('src')) frame.src = EDITOR_URL;
  }

  function closeEditor() { if (panel) panel.style.display = 'none'; }
  function disableUI() {
    closeEditor();
    var button = document.getElementById('tn-save-editor-sidebar');
    if (button) button.remove();
  }
  function enableUI() { scheduleRefresh(); }
  window.tnOpenSaveEditor = openEditor;
  window.tnCloseSaveEditor = closeEditor;

  // Save/Load sidebar is React-rendered, so inject beside its native options.
  // This avoids attempting to use occupied bottom menu-button slots.
  function installSidebarButton() {
    if (!enabled()) {
      var oldButton = document.getElementById('tn-save-editor-sidebar');
      if (oldButton) oldButton.remove();
      return;
    }
    var importButton = document.getElementById('globalDataImport');
    var exportButton = document.getElementById('globalDataExport');
    if (!importButton || !exportButton) return;
    var sidebar = importButton.closest('.sidebarDetailsContainer');
    if (!sidebar || !sidebar.contains(exportButton)) return;
    if (sidebar.querySelector('#tn-save-editor-sidebar')) return;

    var button = document.createElement('div');
    button.id = 'tn-save-editor-sidebar';
    button.className = 'optionCategory';
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    button.setAttribute('aria-label', 'Open TiTS Save Editor');
    button.innerHTML = '<span>✎ Save Editor</span>';
    button.addEventListener('click', openEditor);
    button.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openEditor();
      }
    });
    importButton.insertAdjacentElement('afterend', button);
  }

  var scheduled = false;
  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    // Defer until React has finished this render pass.
    setTimeout(function () {
      scheduled = false;
      installSidebarButton();
    }, 0);
  }

  waitForModMenu();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      scheduleRefresh();
      new MutationObserver(scheduleRefresh).observe(document.body, { childList: true, subtree: true });
    }, { once: true });
  } else {
    scheduleRefresh();
    new MutationObserver(scheduleRefresh).observe(document.body, { childList: true, subtree: true });
  }
})();
