/*
 * TN_CodexWiki_v2.7.js — a Wiki button in the in-game Codex (TN mod pack, Modv2.7)
 * ---------------------------------------------------------------------------
 * Adds a "Wiki" button to the Codex's left sidebar, right under the "Codex" header.
 *
 *  - "Wiki" opens the TiTS wiki's main page.
 *  - While you read a Codex entry (for example "Gabilani"), a second button,
 *    "Look up: Gabilani", searches the wiki for that entry. The wiki goes straight to the
 *    page when the name matches one.
 *  - If the game isn't showing the sidebar (some small screens), the Wiki button goes in
 *    the empty slot of the Codex's bottom menu instead (next to Appearance).
 *
 * Where it opens:
 *  - With the Wiki Browser mod (WikiBrowser_v2.7.js) it opens in that overlay, over the
 *    game, with Back / Forward / Search / Close. (WikiBrowser_v2.5.js works too, but it
 *    can only open the main page.)
 *  - Without it, or with the Wiki Browser switched off in Android Mods, the Android app
 *    opens the page in your web browser. If the app can't do that (and on Windows, Linux
 *    and Mac), a small wiki window opens over the game instead, with Close and
 *    "Open in browser" buttons. Android Back and Escape close it.
 *
 * Android: it has its own switch in Android Mods ("Codex Wiki Button").
 * Desktop: always on while it's in enabled.txt (the TN Desktop Menu has no switches).
 *
 * INSTALL: put this file in the mods folder and list it in enabled.txt. Load order
 * doesn't matter.
 */
(function () {
  "use strict";
  if (window.__tnCodexWikiLoaded) return;
  window.__tnCodexWikiLoaded = true;

  var VERSION = "2.7";
  var MOD_ID = "tn-codex-wiki";
  var MOD_NAME = "Codex Wiki Button";
  var MOD_DESCRIPTION = "Adds a Wiki button to the Codex sidebar. It opens the TiTS wiki, or looks up the Codex entry you're reading.";
  var HOME = "https://wiki.smutosaur.us/TiTS/Main_Page";
  var SEARCH = "https://wiki.smutosaur.us/TiTS/index.php?search=";
  var CODEX_SCREEN = 7;    // the game's UI state value for the Codex screen
  var SECTION_ID = "tnCodexWikiSection";
  var SLOT = 3;            // bottom-menu fallback slot; the Codex leaves 3 empty (Appearance is 4)
  var LABEL = "Wiki";

  // ---------------------------------------------------------------------------
  //  On/off switch (Android Mods only; always on elsewhere)
  // ---------------------------------------------------------------------------
  function enabled() {
    if (window.tnModMenuActive === true && typeof window.isTnModEnabled === "function") {
      return window.isTnModEnabled(MOD_ID);
    }
    return true;
  }

  function debug(msg) {
    try {
      if (window.tnModMenuActive === true && typeof window.tnDebugLog === "function") window.tnDebugLog("[Codex Wiki] " + msg);
    } catch (err) {}
  }

  function registerToggle() {
    if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
    window.registerModMenu({
      id: MOD_ID,
      name: MOD_NAME,
      author: "Neston",
      description: MOD_DESCRIPTION,
      supportsToggle: true,
      onEnabledChange: function () {
        lastKey = null;
        schedule();
        return true;
      }
    });
    return true;
  }

  // Runtime scripts load in any order, so retry until the menu exists.
  function waitForModMenu(tries) {
    tries = tries || 0;
    if (registerToggle()) return;
    if (window.tnModMenuActive === false && tries >= 6) return;   // no TN menu running
    if (tries < 240) setTimeout(function () { waitForModMenu(tries + 1); }, 500);
  }

  // ---------------------------------------------------------------------------
  //  Opening the wiki
  // ---------------------------------------------------------------------------
  function urlFor(query) {
    var text = String(query == null ? "" : query).trim();
    return text ? SEARCH + encodeURIComponent(text) : HOME;
  }

  function wikiBrowserReady() {
    if (typeof window.TnWikiBrowser !== "function") return false;
    if (typeof window.tnWikiEnabled === "function") {
      try { return !!window.tnWikiEnabled(); } catch (err) { return false; }
    }
    return true;   // older Wiki Browser (v2.5): no way to ask, so assume it's on
  }

  function openWiki(query) {
    if (!enabled()) return;
    if (wikiBrowserReady()) {
      var opened;
      try {
        // v2.7+ takes a search word; v2.5 ignores it and opens the main page.
        opened = window.TnWikiBrowser(query || undefined);
      } catch (err) {
        debug("ERROR from Wiki Browser: " + err);
        opened = false;
      }
      if (opened !== false) { debug("Opened in Wiki Browser: " + (query || "home")); return; }
    }
    var url = urlFor(query);
    if (openOutside(url)) { debug("Opened outside the game: " + url); return; }
    openFallback(url);
    debug("Opened in the small wiki window: " + url);
  }

  // Android (Cordova): hand the link to the phone's browser. Never navigate the
  // game's own WebView, because that would close the game.
  function openOutside(url) {
    try {
      var iab = window.cordova && window.cordova.InAppBrowser;
      if (iab && typeof iab.open === "function") { iab.open(url, "_system"); return true; }
    } catch (err) {}
    try {
      if (window.cordova && window.navigator && navigator.app && typeof navigator.app.loadUrl === "function") {
        navigator.app.loadUrl(url, { openExternal: true });
        return true;
      }
    } catch (err) {}
    return false;
  }

  // ---------------------------------------------------------------------------
  //  Styles
  // ---------------------------------------------------------------------------
  function ensureStyle() {
    if (document.getElementById("tnCodexWikiStyle")) return;
    var style = document.createElement("style");
    style.id = "tnCodexWikiStyle";
    style.textContent = ""
      // Sidebar buttons (same look as the game's sidebar buttons)
      + "#" + SECTION_ID + "{clear:both;padding-top:0.5em;}"
      + "#" + SECTION_ID + " .optionCategory{cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}"
      + "#" + SECTION_ID + " .optionCategory:active{background:var(--highlightColor,#8D31B0);}"
      // Small wiki window
      + "#tnCodexWiki{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;background:var(--backgroundColor,#3D5174);color:var(--textColor,#fff);font-family:Lato,sans-serif;}"
      + "#tnCodexWikiBar{display:flex;align-items:center;gap:0.45em;padding:0.55em 0.7em;background:var(--foregroundColorB,#2C3649);box-shadow:0 0.2em 0.4em 0 var(--shadowColor,#202735);}"
      + "#tnCodexWikiBar .tnTitle{flex:1;min-width:0;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}"
      + "#tnCodexWikiBar button{flex:0 0 auto;min-width:5.6em;height:2.4em;padding:0 0.8em;border:none;border-radius:0.3125em;background:var(--foregroundColorA,#333E52);color:var(--textColor,#fff);font:inherit;font-weight:bold;cursor:pointer;box-shadow:0 0.2em 0.4em 0 var(--shadowColor,#202735);}"
      + "#tnCodexWikiBar button:hover,#tnCodexWikiBar button:active,#tnCodexWikiBar button:focus{background:var(--highlightColor,#8D31B0);outline:none;}"
      + "#tnCodexWikiFrame{flex:1;width:100%;border:0;background:#fff;}";
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  //  Small wiki window (used only when there's no Wiki Browser and no outside browser)
  // ---------------------------------------------------------------------------
  function closeFallback() {
    var root = document.getElementById("tnCodexWiki");
    if (root) root.remove();
  }

  function openFallback(url) {
    closeFallback();
    ensureStyle();
    var root = document.createElement("div");
    root.id = "tnCodexWiki";
    var bar = document.createElement("div");
    bar.id = "tnCodexWikiBar";
    var title = document.createElement("span");
    title.className = "tnTitle";
    title.textContent = "TiTS Wiki";
    var outside = document.createElement("button");
    outside.type = "button";
    outside.textContent = "Open in browser";
    outside.onclick = function () {
      if (!openOutside(url)) {
        try { window.open(url, "_blank", "noopener"); } catch (err) {}
      }
    };
    var close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    close.onclick = closeFallback;
    bar.appendChild(title);
    bar.appendChild(outside);
    bar.appendChild(close);
    var frame = document.createElement("iframe");
    frame.id = "tnCodexWikiFrame";
    frame.src = url;
    root.appendChild(bar);
    root.appendChild(frame);
    document.body.appendChild(root);
    try { close.focus(); } catch (err) {}
  }

  // Android Back closes the small window before the game sees it.
  document.addEventListener("backbutton", function (event) {
    if (!document.getElementById("tnCodexWiki")) return;
    if (event && event.preventDefault) event.preventDefault();
    if (event && event.stopImmediatePropagation) event.stopImmediatePropagation();
    closeFallback();
  }, true);

  // Escape closes it too (the game would otherwise act on the key underneath).
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !document.getElementById("tnCodexWiki")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeFallback();
  }, true);

  // ---------------------------------------------------------------------------
  //  The sidebar buttons
  // ---------------------------------------------------------------------------
  function codexShowing() {
    try { return !!(window.ui && ui.state && ui.state.mainElement === CODEX_SCREEN); }
    catch (err) { return false; }
  }

  function currentEntry() {
    try { return ui.state.codexEntry ? String(ui.state.codexEntry) : ""; }
    catch (err) { return ""; }
  }

  function makeButton(id, text, tip, onClick) {
    var btn = document.createElement("div");
    btn.className = "optionCategory";
    btn.id = id;
    btn.setAttribute("role", "button");
    btn.setAttribute("tabindex", "0");
    btn.title = tip;
    var label = document.createElement("span");
    label.textContent = text;
    btn.appendChild(label);
    function run(event) {
      event.preventDefault();
      event.stopPropagation();
      try { onClick(); } catch (err) { debug("ERROR: " + err); }
    }
    btn.addEventListener("click", run);
    btn.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") run(event);
    });
    return btn;
  }

  function buildSection(entry) {
    var section = document.createElement("div");
    section.id = SECTION_ID;
    section.setAttribute("data-entry", entry);
    section.appendChild(makeButton("tnCodexWiki_home", LABEL,
      "Open the Trials in Tainted Space wiki.",
      function () { openWiki(""); }));
    if (entry) {
      section.appendChild(makeButton("tnCodexWiki_entry", "Look up: " + entry,
        "Look up “" + entry + "” on the Trials in Tainted Space wiki.",
        function () { openWiki(entry); }));
    }
    return section;
  }

  function removeSection() {
    var old = document.getElementById(SECTION_ID);
    if (old) old.remove();
  }

  // Put the section right under the "Codex" header, above the entry list or stats.
  function placeSection(host, entry) {
    var existing = document.getElementById(SECTION_ID);
    var headerLine = host.querySelector(":scope > .headerLine.head");
    var wantAfter = headerLine || null;
    if (existing && existing.parentElement === host && existing.getAttribute("data-entry") === entry) {
      var prev = existing.previousElementSibling;
      if (!wantAfter || prev === wantAfter) return;   // already in place
    }
    if (existing) existing.remove();
    var section = buildSection(entry);
    if (wantAfter && wantAfter.nextSibling) host.insertBefore(section, wantAfter.nextSibling);
    else host.appendChild(section);
  }

  // ---------------------------------------------------------------------------
  //  Bottom-menu fallback (only when there's no sidebar to put the buttons in)
  // ---------------------------------------------------------------------------
  var bottomButtonShowing = false;

  function addBottomButton(entry) {
    try {
      var buttons = ui.state.buttons;
      if (buttons && buttons[SLOT]) return;   // something already uses this slot
      var body = entry
        ? "Look up “" + entry + "” on the Trials in Tainted Space wiki."
        : "Open the Trials in Tainted Space wiki.";
      ui.addButton(SLOT, LABEL, function () { openWiki(entry); }, "Wiki", body);
      bottomButtonShowing = true;
    } catch (err) { debug("ERROR adding the bottom button: " + err); }
  }

  function removeBottomButton() {
    if (!bottomButtonShowing) return;
    bottomButtonShowing = false;
    try {
      var b = ui.state.buttons && ui.state.buttons[SLOT];
      if (b && b.title === LABEL && typeof ui.removeButton === "function") ui.removeButton(SLOT);
    } catch (err) {}
  }

  // ---------------------------------------------------------------------------
  //  Keep it in sync with the screen
  // ---------------------------------------------------------------------------
  var lastKey = null;

  function sync() {
    if (!enabled() || !codexShowing()) {
      removeSection();
      if (bottomButtonShowing && !codexShowing()) bottomButtonShowing = false;   // the game cleared its menu
      else removeBottomButton();
      return;
    }
    ensureStyle();
    var entry = currentEntry();
    var host = document.querySelector(".leftSideBar .sidebarDetailsContainer");
    if (host) {
      removeBottomButton();
      placeSection(host, entry);
      var key = "side|" + entry;
      if (key !== lastKey) { lastKey = key; debug("Sidebar buttons shown" + (entry ? " for " + entry : "")); }
    } else {
      removeSection();
      addBottomButton(entry);
      var key2 = "bottom|" + entry;
      if (key2 !== lastKey) { lastKey = key2; debug("No sidebar; button added to the Codex menu"); }
    }
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      try { sync(); } catch (err) { debug("ERROR " + err); }
    }, 0);
  }

  function start() {
    if (!document.body) return;
    // React redraws the sidebar whenever the Codex screen changes; put the buttons back.
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    setInterval(schedule, 800);
    schedule();
  }

  window.TnCodexWiki = { version: VERSION, open: openWiki, enabled: enabled, refresh: schedule };

  waitForModMenu();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
