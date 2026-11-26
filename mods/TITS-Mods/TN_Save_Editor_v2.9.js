// Kitty Save Editor v3 — runtime JavaScript (not .mod syntax)
//
// Opens start-5's TiTS save editor (https://start-5.github.io/tits.js-save-editor/)
// from the Save/Load sidebar.
//
// Saving: the editor's own "Save File" button makes a download link. Inside the game
// on Android that link did nothing, because the editor sat in a frame from another
// site and the game never saw downloads from it. Now the editor's page is loaded into
// the frame as the game's own page (its scripts and styles still come from start-5's
// site), so Save File opens a pop-up here: name the file and tap Save, and the game's
// own save window (Android) or a download (PC) keeps it. If the editor can't be loaded
// that way, the frame falls back to the plain site, as before.
(function () {
  'use strict';
  if (window.__tnSaveEditorV3Installed) return;
  window.__tnSaveEditorV3Installed = true;

  var EDITOR_URL = 'https://start-5.github.io/tits.js-save-editor/';
  var STORAGE_PREFIX = 'tnSaveEditor:';
  var LOAD_TIMEOUT_MS = 15000;
  var panel = null, frame = null, help = null, status = null;
  var frameMode = '';          // 'local' (the game's own page, Save works) or 'remote'
  var loadToken = 0;
  var MOD_ID = 'tn-save-editor';
  var MOD_NAME = 'TiTS Save Editor';
  var MOD_DESCRIPTION = 'Open the save editor from the Save/Load sidebar.';
  var HELP_TEXT = 'Export a save using Save To File, then tap Load File in the editor. After editing, tap Save File: a pop-up asks for a name, then the save window keeps the file. Load it in the game with Load From File.';

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

  function isAndroid() {
    try {
      if (window.cordova && /android/i.test(String(window.cordova.platformId || ''))) return true;
      if (window.Capacitor && typeof window.Capacitor.getPlatform === 'function' &&
          window.Capacitor.getPlatform() === 'android') return true;
      return /android/i.test(navigator.userAgent || '');
    } catch (err) { return false; }
  }

  function setStatus(text) {
    if (!status) return;
    status.textContent = text || '';
    status.style.display = text ? 'block' : 'none';
  }

  /* ---------- Saving the edited file ---------- */

  function cleanName(s) {
    s = String(s || '').replace(/\.json$/i, '');
    s = s.replace(/[\\\/:*?"<>|\u0000-\u001f]+/g, '').replace(/\s+/g, ' ').trim().replace(/^\.+|\.+$/g, '');
    return (s || 'Edited save').slice(0, 120) + '.json';
  }

  function plainDownload(blob, name) {
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.setAttribute('download', name);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { try { (window.URL || window.webkitURL).revokeObjectURL(url); } catch (err) {} }, 120000);
  }

  // The game's own Save To File route on Android (cordova saveDialog), else a download.
  function saveBlob(blob, name) {
    var sd = null;
    try { sd = window.cordova && window.cordova.plugins && window.cordova.plugins.saveDialog; } catch (err) {}
    return new Promise(function (resolve) {
      function download() {
        try {
          plainDownload(blob, name);
          resolve({ ok: true, how: 'download' });
        } catch (err) {
          resolve({ ok: false, error: err });
        }
      }
      if (sd && typeof sd.saveFile === 'function') {
        try {
          Promise.resolve(sd.saveFile(blob, name)).then(function (where) {
            resolve({ ok: true, how: 'dialog', where: where });
          }, function (err) {
            if (/cancel/i.test(String(err && (err.message || err)))) resolve({ ok: false, cancelled: true });
            else download();
          });
          return;
        } catch (err) {}
      }
      download();
    });
  }

  function closeSavePrompt() {
    var old = document.getElementById('tn-save-editor-prompt');
    if (old) old.remove();
  }

  // The pop-up that the editor's Save File button now opens.
  function showSavePrompt(blob, suggested) {
    closeSavePrompt();
    var wrap = document.createElement('div');
    wrap.id = 'tn-save-editor-prompt';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Save your edited save');

    var box = document.createElement('div');
    box.className = 'tn-se-box';
    var title = document.createElement('strong');
    title.textContent = 'Save your edited save';
    var text = document.createElement('p');
    text.textContent = 'Name the file, then tap Save. Load it in the game with Save/Load > Load From File.';
    var input = document.createElement('input');
    input.type = 'text';
    input.value = cleanName(suggested).replace(/\.json$/i, '');
    input.setAttribute('aria-label', 'File name');
    input.setAttribute('autocomplete', 'off');
    var note = document.createElement('p');
    note.className = 'tn-se-note';
    var row = document.createElement('div');
    row.className = 'tn-se-row';
    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Cancel';
    var save = document.createElement('button');
    save.type = 'button';
    save.className = 'tn-se-primary';
    save.textContent = 'Save';

    cancel.addEventListener('click', function () { closeSavePrompt(); setStatus(''); });
    function doSave() {
      var name = cleanName(input.value);
      save.disabled = true;
      cancel.disabled = true;
      note.textContent = 'Saving…';
      saveBlob(blob, name).then(function (res) {
        save.disabled = false;
        cancel.disabled = false;
        if (res.ok) {
          closeSavePrompt();
          if (res.how === 'dialog') setStatus('Saved "' + name + '". Load it in the game with Save/Load > Load From File.');
          else if (isAndroid()) setStatus('Sent "' + name + '" to your device. If no save window opened, tap Open in Browser and save it from there.');
          else setStatus('Saved "' + name + '" (check your Downloads folder if no save window opened). Load it with Save/Load > Load From File.');
        } else if (res.cancelled) {
          note.textContent = 'Save cancelled. Tap Save to try again.';
        } else {
          note.textContent = 'Saving didn’t work here. Tap Open in Browser and save it from there.';
        }
      });
    }
    save.addEventListener('click', doSave);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') { event.preventDefault(); doSave(); }
      else if (event.key === 'Escape') { event.preventDefault(); closeSavePrompt(); }
    });

    row.appendChild(cancel);
    row.appendChild(save);
    box.appendChild(title);
    box.appendChild(text);
    box.appendChild(input);
    box.appendChild(note);
    box.appendChild(row);
    wrap.appendChild(box);
    (panel || document.body).appendChild(wrap);
    try { input.focus(); input.select(); } catch (err) {}
  }

  // Called from inside the editor's frame when its Save File button makes a download.
  function handOff(url, name) {
    if (!enabled()) return;
    setStatus('Getting your edited save…');
    fetch(url).then(function (r) { return r.text(); }).then(function (text) {
      setStatus('');
      showSavePrompt(new Blob([text], { type: 'application/json' }), name);
    }, function (err) {
      setStatus('Couldn’t read the edited save (' + (err && err.message || err) + '). Tap Open in Browser and save it from there.');
    });
  }
  window.tnSaveEditorHandOff = handOff;

  /* ---------- Loading the editor into the frame ---------- */

  // Sends a page's Save File download link to handOff() instead of a download.
  // Used both inside the editor's page (bridge script) and from here (hookWindow).
  function hookAnchorClick(win, report) {
    var proto = win.HTMLAnchorElement.prototype;
    if (proto.__tnSaveEditorHooked) return;
    var original = proto.click;
    proto.click = function () {
      try {
        var href = String(this.href || '');
        var name = this.getAttribute('download');
        if (name == null && typeof this.download === 'string' && this.download) name = this.download;
        if (name != null && /^(blob|data):/i.test(href)) {
          report(href, name);
          return;
        }
      } catch (err) {}
      return original.apply(this, arguments);
    };
    proto.__tnSaveEditorHooked = true;
  }

  // Runs first inside the editor's page: keeps its settings apart from the game's
  // own storage, and hooks its Save File download.
  function bridgeSource() {
    return '(function(prefix){' +
      'try{var ls=window.localStorage;if(ls){var shim={' +
        'getItem:function(k){return ls.getItem(prefix+k)},' +
        'setItem:function(k,v){ls.setItem(prefix+k,String(v))},' +
        'removeItem:function(k){ls.removeItem(prefix+k)},' +
        'clear:function(){},key:function(){return null},length:0};' +
        'Object.defineProperty(window,"localStorage",{configurable:true,get:function(){return shim}})}}catch(e){}' +
      'try{(' + hookAnchorClick.toString() + ')(window,function(h,n){window.parent.tnSaveEditorHandOff(h,n)})}catch(e){}' +
    '})(' + JSON.stringify(STORAGE_PREFIX) + ');';
  }

  function buildLocalPage(html) {
    var inject = '<base href="' + EDITOR_URL + '"><script>' + bridgeSource().replace(/<\/script/gi, '<\\/script') + '<\/script>';
    if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, function (m) { return m + inject; });
    if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, function (m) { return m + '<head>' + inject + '</head>'; });
    return '<head>' + inject + '</head>' + html;
  }

  // Backup: if the page's own bridge script was blocked, hook it from here.
  function hookWindow() {
    try {
      var w = frame && frame.contentWindow;
      if (!w || !w.HTMLAnchorElement) return false;
      hookAnchorClick(w, handOff);
      return true;
    } catch (err) { return false; }
  }

  function editorStarted() {
    try {
      var d = frame && frame.contentDocument;
      return !!(d && d.querySelector('#app > *'));
    } catch (err) { return false; }
  }

  function useRemote(reason) {
    frameMode = 'remote';
    frame.removeAttribute('srcdoc');
    frame.src = EDITOR_URL;
    if (help) help.textContent = HELP_TEXT + ' The editor couldn’t load inside the game (' + reason + '), so its Save File button may not work here: if nothing happens, tap Open in Browser and edit there.';
  }

  function loadFrame() {
    var token = ++loadToken;
    frameMode = 'loading';
    setStatus('');
    closeSavePrompt();
    if (help) help.textContent = HELP_TEXT;
    frame.removeAttribute('src');
    frame.removeAttribute('srcdoc');
    if (typeof window.fetch !== 'function' || !('srcdoc' in frame)) { useRemote('old WebView'); return; }
    setStatus('Loading the editor…');
    fetch(EDITOR_URL, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (html) {
      if (token !== loadToken) return;
      frameMode = 'local';
      frame.srcdoc = buildLocalPage(html);
      var started = Date.now();
      (function check() {
        if (token !== loadToken || frameMode !== 'local') return;
        if (editorStarted()) { hookWindow(); setStatus(''); return; }
        if (Date.now() - started > LOAD_TIMEOUT_MS) { setStatus(''); useRemote('it didn’t start'); return; }
        setTimeout(check, 250);
      })();
    }).catch(function (err) {
      if (token !== loadToken) return;
      setStatus('');
      useRemote(String(err && err.message || err || 'no connection'));
    });
  }

  /* ---------- Panel ---------- */

  function openEditor() {
    if (!enabled()) return;
    if (!panel) {
      var style = document.createElement('style');
      style.textContent = '#tn-save-editor-panel{position:fixed;inset:0;z-index:2147483001;display:flex;flex-direction:column;background:var(--backgroundColor,#3D5174);color:var(--textColor,#fff);font:14px sans-serif}' +
        '#tn-save-editor-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px;background:var(--foregroundColorB,#2C3649)}' +
        '#tn-save-editor-toolbar button,#tn-save-editor-toolbar a{background:var(--foregroundColorA,#333E52);color:var(--textColor,#fff);border:1px solid var(--paleColor,#53677B);border-radius:6px;padding:8px;text-decoration:none;font:inherit;cursor:pointer}' +
        '#tn-save-editor-toolbar strong{margin-right:auto}' +
        '#tn-save-editor-help{padding:8px 12px;font-size:12px;line-height:1.4}' +
        '#tn-save-editor-status{display:none;padding:8px 12px;font-size:13px;line-height:1.4;background:var(--foregroundColorA,#333E52);border-top:1px solid var(--paleColor,#53677B)}' +
        '#tn-save-editor-frame{width:100%;flex:1;min-height:100px;background:#fff;border:0}' +
        '#tn-save-editor-prompt{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);padding:16px;box-sizing:border-box}' +
        '#tn-save-editor-prompt .tn-se-box{width:100%;max-width:420px;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:10px;background:var(--backgroundColor,#3D5174);color:var(--textColor,#fff);border:1px solid var(--paleColor,#53677B)}' +
        '#tn-save-editor-prompt strong{font-size:16px}' +
        '#tn-save-editor-prompt p{margin:0;font-size:13px;line-height:1.4}' +
        '#tn-save-editor-prompt .tn-se-note:empty{display:none}' +
        '#tn-save-editor-prompt input{width:100%;box-sizing:border-box;padding:10px;font:inherit;font-size:15px;border-radius:6px;border:1px solid var(--paleColor,#53677B);background:var(--foregroundColorB,#2C3649);color:var(--textColor,#fff)}' +
        '#tn-save-editor-prompt .tn-se-row{display:flex;gap:8px;justify-content:flex-end}' +
        '#tn-save-editor-prompt button{min-width:88px;padding:10px 14px;font:inherit;font-size:15px;border-radius:8px;cursor:pointer;background:var(--foregroundColorA,#333E52);color:var(--textColor,#fff);border:1px solid var(--paleColor,#53677B)}' +
        '#tn-save-editor-prompt button.tn-se-primary{background:var(--paleColor,#53677B);font-weight:bold}' +
        '#tn-save-editor-prompt button:disabled{opacity:.6;cursor:default}';
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
      button('Reload', function () { if (frame) loadFrame(); });
      button('Close', closeEditor);
      panel.appendChild(toolbar);

      help = document.createElement('div');
      help.id = 'tn-save-editor-help';
      help.textContent = HELP_TEXT;
      panel.appendChild(help);

      status = document.createElement('div');
      status.id = 'tn-save-editor-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      panel.appendChild(status);

      frame = document.createElement('iframe');
      frame.id = 'tn-save-editor-frame';
      frame.title = 'start-5 TiTS save editor';
      frame.addEventListener('load', function () { if (frameMode === 'local') hookWindow(); });
      panel.appendChild(frame);
      document.body.appendChild(panel);
    }
    panel.style.display = 'flex';
    if (!frameMode) loadFrame();
  }

  function closeEditor() {
    closeSavePrompt();
    if (panel) panel.style.display = 'none';
  }
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
