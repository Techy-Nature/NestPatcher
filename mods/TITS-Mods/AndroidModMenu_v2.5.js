/* Android Mod Menu for Trials in Tainted Space.
   Native sidebar detection revision 2.
   Revision 3: the panel can always be closed: tap "Android Mods" again, tap anywhere
   outside the panel, or press Escape / Android Back. The header (with Close) stays
   pinned to the top while the panel scrolls.
   Other mods call registerModMenu({ id, name, author, description, getHtml, onBind, onAct }).
   Runtime toggles require supportsToggle:true AND mod-side isTnModEnabled(id) guards.
   The list and each page use the game's text pane and button grid.
   Modv2.4: Android only. On desktop (Windows, Linux, Mac, browser) the menu refuses to
   start. On Android it sets window.tnModMenuActive = true (tnModMenuKind "android").
   Other TN mods only touch a menu while window.tnModMenuActive === true, and use their
   default settings otherwise.
   Modv2.5: on desktop, TN_Desktop_Menu is the menu instead (settings, no on/off switches). */
(function () {
    // Already running (the file was listed twice): don't start a second copy.
    if (window.tnModMenuKind === "android") return;
    // TN rename migration (2026-10-29). Our mods used to share the KITTY_ / kitty
    // names with another Kitty mod pack. They now use TN_ / tn. This copies old
    // settings and save flags across once, and never overwrites a TN value or
    // deletes the old one, so the other pack keeps working if it is installed.
    (function migrateKittyToTn() {
        try {
            var ls = window.localStorage, keys = [];
            for (var i = 0; i < ls.length; i++) keys.push(ls.key(i));
            keys.forEach(function (key) {
                if (!/^kitty[.\-]/.test(key)) return;
                var next = 'tn' + key.slice(5);
                if (ls.getItem(next) !== null) return;
                var value = ls.getItem(key);
                // The mod toggle list is keyed by mod id, and those ids were renamed too.
                if (key === 'kitty.modMenu.enabled.v1') {
                    try {
                        var old = JSON.parse(value || '{}'), moved = {};
                        Object.keys(old).forEach(function (id) {
                            moved[id.replace(/^kitty(?=[.\-])/, 'tn')] = old[id];
                        });
                        value = JSON.stringify(moved);
                    } catch (err) {}
                }
                ls.setItem(next, value);
            });
        } catch (err) { console.warn('[TN] Settings migration skipped', err); }

        // Save flags: check whenever a save is loaded or a new game starts.
        var OLD_FLAG = /^KITTY_(SHELLY_|STELLA_|STEPH_|ZHENIYA_|PREG_|CREW_MULT$)/;
        var lastFlags = null;
        function migrateFlags() {
            var f = window.flags;
            if (!f || typeof f !== 'object' || f === lastFlags) return;
            lastFlags = f;
            var moved = 0;
            Object.keys(f).forEach(function (key) {
                if (!OLD_FLAG.test(key)) return;
                var next = 'TN_' + key.slice(6);
                if (f[next] === undefined) { f[next] = f[key]; moved++; }
            });
            if (moved) console.info('[TN] Copied ' + moved + ' old KITTY_ save flags to TN_');
        }
        setInterval(function () { try { migrateFlags(); } catch (err) {} }, 500);
    })();

    // Android check (Modv2.4). The save migration above still runs everywhere,
    // because it only copies old flags and keeps saves working on any system.
    // Everything below (Options > Android Mods, TN DEBUG, the shared mod
    // functions) is Android only.
    function isAndroid() {
        try {
            var nav = window.navigator || {};
            var ua = String(nav.userAgent || '');
            // The desktop game is an Electron app. Never Android, whatever else it says.
            if (/Electron\//i.test(ua)) return false;
            if (window.process && window.process.versions && window.process.versions.electron) return false;
            if (window.cordova && /android/i.test(String(window.cordova.platformId || ''))) return true;
            if (window.device && /android/i.test(String(window.device.platform || ''))) return true;
            if (window.Capacitor && typeof window.Capacitor.getPlatform === 'function' &&
                window.Capacitor.getPlatform() === 'android') return true;
            if (nav.userAgentData && /android/i.test(String(nav.userAgentData.platform || ''))) return true;
            return /Android/i.test(ua);
        } catch (err) { return false; }
    }
    if (!isAndroid()) {
        // TN_Desktop_Menu may already have said yes; only say no if nothing has.
        if (window.tnModMenuActive !== true) window.tnModMenuActive = false;
        console.info('[Android Mods] Not running on Android, so the Android mod menu stays off. ' +
            'On desktop, TN_Desktop_Menu gives the settings pages. You can take AndroidModMenu out of enabled.txt on desktop.');
        return;
    }

    var menus = [];
    var pageId = "";
    var indexPage = 0;
    var enabledCache = {};
    var STORAGE_KEY = "tn.modMenu.enabled.v1";

    // Preferences are device-wide. Actual disabling requires each mod to opt in
    // and check isTnModEnabled(id) before performing its effects.
    try {
        var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        if (saved && typeof saved === "object" && !Array.isArray(saved)) enabledCache = saved;
    } catch (err) { console.warn("[TN] Cannot read mod toggle preferences", err); }

    function isModEnabled(id) { return enabledCache[id] !== false; }
    function setModEnabled(id, enabled) {
        var entry = byId(id);
        if (!entry || !entry.supportsToggle) return false;
        var next = !!enabled;
        var previous = isModEnabled(id);
        if (previous === next) return true;
        if (typeof entry.onEnabledChange === "function") {
            try {
                if (entry.onEnabledChange(next, previous) === false) return false;
            } catch (err) {
                console.error("[TN] Toggle failed for", id, err);
                return false;
            }
        }
        enabledCache[id] = next;
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledCache)); }
        catch (err) { console.warn("[TN] Preferences could not be saved", err); }
        return true;
    }

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function byId(id) {
        for (var i = 0; i < menus.length; i++) {
            if (menus[i] && menus[i].id === id) return menus[i];
        }
        return null;
    }

    function registerModMenu(spec) {
        if (!spec || !spec.id) {
            console.error("registerModMenu: id is required");
            return null;
        }
        var existing = byId(spec.id);
        var entry = existing || { id: spec.id };
        entry.name = spec.name || entry.name || spec.id;
        entry.author = spec.author != null ? spec.author : (entry.author || "");
        entry.description = spec.description != null ? spec.description : (entry.description || "");
        if (spec.getHtml) entry.getHtml = spec.getHtml;
        if (spec.onBind) entry.onBind = spec.onBind;
        if (spec.onAct) entry.onAct = spec.onAct;
        if (spec.fillMenu) entry.fillMenu = spec.fillMenu;
        // A setting is meaningful only when the mod actually honors this state.
        if (typeof spec.supportsToggle === "boolean") entry.supportsToggle = spec.supportsToggle;
        if (typeof spec.onEnabledChange === "function") entry.onEnabledChange = spec.onEnabledChange;
        if (!existing) menus.push(entry);
        return entry;
    }

    function header(title) {
        if (typeof blockHeader === "function") return blockHeader(title);
        return "<b>" + esc(title) + "</b>\n\n";
    }

    function begin() {
        if (typeof clearOutput === "function") clearOutput();
        if (typeof clearBust === "function") clearBust();
        if (typeof clearName === "function") clearName();
        if (typeof clearMenu === "function") clearMenu();
    }

    function pullButtons(html) {
        var buttons = [];
        var rest = String(html || "").replace(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi, function (_, attrs, text) {
            var act = /data-mod-act="([^"]*)"/.exec(attrs);
            var open = /data-mod-open="([^"]*)"/.exec(attrs);
            var label = text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
            if (act || open) buttons.push({ act: act && act[1], open: open && open[1], label: label || "Choice" });
            return "";
        });
        return { html: rest, buttons: buttons };
    }

    function openIndex(page) {
        if (typeof page === "number") indexPage = Math.max(0, page);
        var pageSize = 11;
        var pages = Math.max(1, Math.ceil(menus.length / pageSize));
        indexPage = Math.min(indexPage, pages - 1);
        pageId = "";
        begin();
        var body = header("Mod Menu");
        body += "Only mods registered with this menu appear below. Runtime toggles work only with mods explicitly designed to honor them; to completely remove a patch, disable it in enabled.txt and rebuild the APK.";
        body += "\n\nPage " + (indexPage + 1) + " / " + pages;
        if (!menus.length) body += "\n\nNo mods have registered a menu yet.";
        var start = indexPage * pageSize;
        var end = Math.min(start + pageSize, menus.length);
        for (var i = start; i < end; i++) {
            var spec = menus[i];
            body += "\n\n<b>" + esc(spec.name || spec.id) + "</b>";
            if (spec.author) body += " by " + esc(spec.author);
            body += spec.supportsToggle ? (isModEnabled(spec.id) ? " — <b>Enabled</b>" : " — <b>Disabled</b>") : " — Toggle unavailable";
            if (spec.description) body += "\n" + esc(spec.description);
        }
        output(body);
        for (var j = start; j < end; j++) {
            (function (item, slot) {
                addButton(slot, item.name || item.id, function () { openPage(item.id); }, item.name || item.id, item.description || "Open this mod's page.");
            })(menus[j], j - start);
        }
        if (indexPage > 0) addButton(11, "Previous", function () { openIndex(indexPage - 1); });
        if (indexPage < pages - 1) addButton(12, "Next", function () { openIndex(indexPage + 1); });
        addButton(14, "Back", function () {
            if (typeof showMainMenu === "function") showMainMenu(true);
            else mainGameMenu();
        }, "Back", "Return to the main menu.");
    }

    function openPage(id) {
        pageId = id;
        var spec = byId(id);
        begin();
        var title = (spec && spec.name) || "Mod settings";
        var inner = "";
        if (!spec) inner = "That mod menu is not loaded.";
        else if (typeof spec.getHtml === "function") {
            try { inner = spec.getHtml() || ""; } catch (err) {
                console.error("[TN] mod menu getHtml", id, err);
                inner = "This page failed to draw.";
            }
        }
        if (spec && !inner && typeof spec.fillMenu !== "function") inner = "This mod has not added any settings.";
        if (spec) inner = (spec.supportsToggle ?
            "<b>Status: " + (isModEnabled(id) ? "Enabled" : "Disabled") + "</b>\n\n" :
            "<i>This mod does not support runtime enable/disable.</i>\n\n") + inner;
        var pulled = pullButtons(inner);
        output(header(title) + pulled.html);
        pulled.buttons.forEach(function (btn, index) {
            if (index > 12) return;
            addButton(index, btn.label, function () {
                if (btn.open) {
                    openPage(btn.open);
                    return;
                }
                if (!spec || typeof spec.onAct !== "function") return;
                var refresh = false;
                try { refresh = !!spec.onAct(btn.act, null, spec); }
                catch (err) { console.error("[TN] mod menu onAct", id, err); }
                if (refresh) openPage(id);
            }, btn.label, btn.label);
        });
        if (spec && typeof spec.fillMenu === "function") {
            try { spec.fillMenu(); } catch (err) { console.error("[TN] mod menu fillMenu", id, err); }
        }
        if (spec && spec.supportsToggle) {
            addButton(13, isModEnabled(id) ? "Disable Mod" : "Enable Mod", function () {
                if (setModEnabled(id, !isModEnabled(id))) openPage(id);
                else openPage(id);
            }, "Toggle mod", "Change this mod's runtime enabled state.");
        }
        addButton(14, "Back", function () { openIndex(); }, "Back", "Return to the mod list.");
        if (spec && typeof spec.onBind === "function") {
            var host = document.getElementById("mainText");
            try { spec.onBind(host, spec); } catch (err) { console.error("[TN] mod menu onBind", id, err); }
        }
    }

    function bindModMenuFields(root, attr, loadFn, saveFn) {
        if (!root || !root.querySelectorAll) return;
        var fields = root.querySelectorAll("[" + attr + "]");
        function write() {
            var cfg = (typeof loadFn === "function" ? loadFn() : {}) || {};
            for (var i = 0; i < fields.length; i++) {
                var el = fields[i];
                var key = el.getAttribute(attr);
                if (!key) continue;
                if (el.type === "checkbox") cfg[key] = !!el.checked;
                else if (el.type === "number") cfg[key] = Number(el.value);
                else cfg[key] = el.value;
            }
            if (typeof saveFn === "function") saveFn(cfg);
        }
        for (var i = 0; i < fields.length; i++) fields[i].addEventListener("change", write);
    }

    function gameLoaded() {
        try { return typeof getGameState === "function" && !!getGameState(); }
        catch (err) { return false; }
    }

    function enterFromMenu(next) {
        try {
            if (gameLoaded() && window.ui && typeof ui.returnFromElement === "function") ui.returnFromElement(true);
        } catch (err) {}
        next();
    }

    // Android Options category. The game's Options page does not use the
    // story text pane; consequently openIndex() cannot be its page renderer.
    // This self-contained panel keeps Options content and gameplay buttons intact.
    var sidebarPanel = null;
    var sidebarRow = null;

    // Mobile-only-friendly diagnostics; the floating DEBUG button opens the log.
    var tnLog = [];
    var debugRoot = null;
    var lastScanState = '';
    // The diagnostic overlay is opt-in and independent of mod enable/disable.
    var DEBUG_STORAGE_KEY = 'tn.androidMods.debugMode.v1';
    var debugEnabled = false;
    try { debugEnabled = window.localStorage.getItem(DEBUG_STORAGE_KEY) === 'true'; }
    catch (err) { console.warn('[Android Mods] Could not load debug preference', err); }

    function setDebugEnabled(value) {
        debugEnabled = !!value;
        try { window.localStorage.setItem(DEBUG_STORAGE_KEY, String(debugEnabled)); }
        catch (err) { console.warn('[Android Mods] Could not save debug preference', err); }
        if (debugEnabled) ensureDebug();
        else if (debugRoot) {
            debugRoot.remove();
            debugRoot = null;
        }
    }
    function tnDebug(message) {
        var entry = new Date().toLocaleTimeString() + '  ' + message;
        tnLog.push(entry);
        if (tnLog.length > 100) tnLog.shift();
        console.info('[Android Mods debug] ' + message);
        if (debugRoot) {
            var list = debugRoot.querySelector('#tn-debug-lines');
            if (list) { list.textContent = tnLog.join('\n'); list.scrollTop = list.scrollHeight; }
        }
    }
    function ensureDebug() {
        if (!debugEnabled || !document.body || (debugRoot && debugRoot.isConnected)) return;
        debugRoot = null;
        var root = document.createElement('aside');
        root.id = 'tn-debug-widget';
        root.style.cssText = 'position:fixed;z-index:2147483646;bottom:100px;right:10px;font:13px sans-serif;color:#fff;max-width:min(90vw,440px);';
        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.textContent = 'TN DEBUG';
        toggle.style.cssText = 'display:block;margin-left:auto;background:#74219b;color:white;border:2px solid #e7b9f7;border-radius:7px;padding:8px 10px;font:600 12px sans-serif;';
        var detail = document.createElement('div');
        detail.style.cssText = 'display:none;margin-top:5px;background:#16232d;border:1px solid #a77cbe;border-radius:6px;padding:9px;box-shadow:0 4px 14px #0009;';
        var label = document.createElement('div');
        label.textContent = 'Android Mods diagnostics';
        label.style.cssText = 'font-weight:bold;margin-bottom:6px;';
        var pre = document.createElement('pre');
        pre.id = 'tn-debug-lines';
        pre.style.cssText = 'overflow:auto;max-height:40vh;white-space:pre-wrap;overflow-wrap:anywhere;font:11px monospace;margin:0 0 8px;';
        pre.textContent = tnLog.join('\n');
        var copy = document.createElement('button');
        copy.type = 'button';
        copy.textContent = 'Select log';
        copy.style.cssText = 'padding:6px;background:#496f7b;color:white;border:0;border-radius:4px;';
        copy.addEventListener('click', function () {
            var area = document.createElement('textarea');
            area.value = tnLog.join('\n');
            area.style.cssText = 'display:block;width:100%;height:110px;margin-top:8px;color:#111;background:white;';
            detail.appendChild(area);
            area.focus(); area.select();
            copy.disabled = true;
        });
        detail.appendChild(label);
        detail.appendChild(pre);
        detail.appendChild(copy);
        toggle.addEventListener('click', function () {
            detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
            pre.scrollTop = pre.scrollHeight;
        });
        root.appendChild(toggle);
        root.appendChild(detail);
        document.body.appendChild(root);
        debugRoot = root;
        tnDebug('Diagnostics active. Open Options, then tap Android Mods.');
    }
    window.tnAndroidModsDebugLog = function () { return tnLog.join('\n'); };
    // Let other mods ask whether Debug Mode is on, and add lines to the debug log.
    window.isTnDebugEnabled = function () { return debugEnabled; };
    window.tnDebugLog = function (message) { tnDebug(String(message)); };

    // Locate the game's real Options sidebar by its heading and native category
    // elements. React may replace these nodes on any render.
    function getOptionsCategories() {
        var containers = document.querySelectorAll('.sidebarDetailsContainer');
        for (var i = 0; i < containers.length; i++) {
            var root = containers[i];
            var heading = root.querySelector('.headerText');
            if (!((heading && (heading.textContent || '').includes('Options')) ||
                  (root.textContent || '').includes('Gameplay'))) continue;
            var candidates = root.querySelectorAll('.optionCategory[id^="sidebarFilter_"]');
            if (!candidates.length) continue;
            var categories = [];
            var parent = candidates[0].parentElement;
            for (var j = 0; j < candidates.length; j++) {
                if (candidates[j].parentElement === parent) categories.push(candidates[j]);
            }
            if (categories.length) return categories;
        }
        return null;
    }

    function scanState() {
        var roots = document.querySelectorAll('.sidebarDetailsContainer');
        var opts = getOptionsCategories();
        var state = 'sidebar roots=' + roots.length + ', Options categories=' + (opts ? opts.length : 0) +
            ', Android button=' + !!document.getElementById('kitty-android-options-mods');
        if (state !== lastScanState) { lastScanState = state; tnDebug(state); }
    }

    function isPanelOpen() {
        return !!(sidebarPanel && sidebarPanel.isConnected);
    }

    function closeOptionsPanel() {
        if (sidebarPanel) sidebarPanel.remove();
        sidebarPanel = null;
        if (sidebarRow) sidebarRow.classList.remove('tn-mods-selected');
    }

    // Tapping "Android Mods" toggles the panel instead of only opening it.
    function toggleOptionsPanel() {
        if (isPanelOpen()) {
            tnDebug('Panel closed from the Android Mods button');
            closeOptionsPanel();
        } else {
            openOptionsPanel();
        }
    }

    // Close when tapping anywhere outside the panel (and outside the Android Mods
    // button, which has its own toggle). The debug overlay doesn't count as outside.
    // Registered once, in the capture phase, so it runs before React handlers that
    // might re-render or stop the event.
    var outsideCloseBound = false;
    function bindOutsideClose() {
        if (outsideCloseBound) return;
        outsideCloseBound = true;
        function onOutside(event) {
            if (!isPanelOpen()) return;
            var target = event.target;
            if (!target || !target.isConnected) return; // panel re-rendered underneath the tap
            if (sidebarPanel.contains(target)) return;
            var row = document.getElementById('kitty-android-options-mods');
            if (row && row.contains(target)) return;
            if (debugRoot && debugRoot.contains(target)) return;
            tnDebug('Panel closed by tapping outside');
            closeOptionsPanel();
        }
        document.addEventListener('pointerdown', onOutside, true);
        document.addEventListener('keydown', function (event) {
            if (!isPanelOpen()) return;
            if (event.key === 'Escape' || event.key === 'Esc' || event.key === 'GoBack' || event.key === 'BrowserBack') {
                event.preventDefault();
                event.stopPropagation();
                tnDebug('Panel closed with ' + event.key);
                closeOptionsPanel();
            }
        }, true);
        // Cordova fires "backbutton" for the Android Back gesture/button.
        document.addEventListener('backbutton', function (event) {
            if (!isPanelOpen()) return;
            if (event && event.preventDefault) event.preventDefault();
            if (event && event.stopImmediatePropagation) event.stopImmediatePropagation();
            tnDebug('Panel closed with Android Back');
            closeOptionsPanel();
        }, true);
    }

    function openOptionsPanel(id) {
        tnDebug('Open panel requested: ' + (id || 'all mods'));
        sidebarRow = document.getElementById('kitty-android-options-mods');
        if (!sidebarRow || !sidebarRow.isConnected) {
            tnDebug('ERROR: button missing or detached before opening');
            console.warn('[Android Mods] Button was replaced before panel could open');
            return;
        }
        closeOptionsPanel();
        var sidebar = sidebarRow.getBoundingClientRect();
        var panel = document.createElement('section');
        panel.id = 'kitty-android-mods-panel';
        panel.setAttribute('aria-label', 'Android Mods settings');
        panel.style.cssText = 'position:fixed;z-index:2147483000;left:' + Math.ceil(sidebar.right + 14) +
            'px;right:14px;top:51px;bottom:92px;overflow:auto;padding:18px;' +
            'background:#294655;color:#f0f3f8;border-radius:8px;box-sizing:border-box;' +
            'box-shadow:0 4px 20px rgba(0,0,0,.3);font:inherit;';
        sidebarPanel = panel;
        sidebarRow.classList.add('tn-mods-selected');
        document.body.appendChild(panel);
        tnDebug('Panel mounted; left=' + panel.style.left + ', width=' + panel.getBoundingClientRect().width + ', mod count=' + menus.length);

        var head = document.createElement('div');
        // Pinned to the top of the scrolling panel so Close is always reachable.
        head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin:-18px -18px 14px;' +
            'padding:14px 18px;position:sticky;top:-18px;z-index:2;background:#294655;border-bottom:1px solid #3d6070;' +
            'border-radius:8px 8px 0 0';
        var heading = document.createElement('h2');
        heading.textContent = id ? ((byId(id) || {}).name || id) : 'Android Mods';
        heading.style.cssText = 'margin:0;color:#fff;font-size:23px';
        head.appendChild(heading);
        var back = document.createElement('button');
        back.textContent = id ? '← All Mods' : 'Close ✕';
        back.setAttribute('aria-label', id ? 'Back to all mods' : 'Close Android Mods');
        back.style.cssText = 'padding:9px 16px;border:0;border-radius:5px;background:#74219b;color:white;font:inherit;cursor:pointer';
        back.addEventListener('click', function () { if (id) openOptionsPanel(); else closeOptionsPanel(); });
        head.appendChild(back);
        panel.appendChild(head);

        var intro = document.createElement('p');
        intro.textContent = 'Switches apply only to mods that support runtime disabling. Existing save progress and previous transformations are not undone. Tap outside this panel or tap Android Mods again to close it.';
        intro.style.cssText = 'margin:0 0 18px;color:#d8e1e8';
        panel.appendChild(intro);
        // First-party Debug Mode setting belongs to Android Mods, not the registered mod list.
        if (!id) {
            var debugCard = document.createElement('section');
            debugCard.style.cssText = 'background:#354f5d;border-radius:7px;margin:0 0 12px;padding:15px;box-sizing:border-box;';
            var debugTitle = document.createElement('div');
            debugTitle.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap';
            var debugName = document.createElement('strong');
            debugName.textContent = 'Debug Mode';
            debugName.style.fontSize = '18px';
            debugTitle.appendChild(debugName);
            var debugToggle = document.createElement('button');
            debugToggle.type = 'button';
            debugToggle.textContent = debugEnabled ? 'On — Turn off' : 'Off — Turn on';
            debugToggle.setAttribute('aria-pressed', String(debugEnabled));
            debugToggle.style.cssText = 'padding:10px 14px;border:0;border-radius:5px;color:#fff;font:inherit;cursor:pointer;background:' + (debugEnabled ? '#74219b' : '#4c7380');
            debugToggle.addEventListener('click', function () {
                setDebugEnabled(!debugEnabled);
                debugToggle.textContent = debugEnabled ? 'On — Turn off' : 'Off — Turn on';
                debugToggle.setAttribute('aria-pressed', String(debugEnabled));
                debugToggle.style.background = debugEnabled ? '#74219b' : '#4c7380';
                tnDebug('Debug Mode ' + (debugEnabled ? 'enabled' : 'disabled'));
            });
            debugTitle.appendChild(debugToggle);
            debugCard.appendChild(debugTitle);
            var debugDescription = document.createElement('p');
            debugDescription.textContent = 'Show the floating TN DEBUG log for troubleshooting. Off by default; saved on this device.';
            debugDescription.style.cssText = 'margin:9px 0 0;color:#dbe3e7';
            debugCard.appendChild(debugDescription);
            panel.appendChild(debugCard);
        }
        var visible = id ? [byId(id)].filter(Boolean) : menus.slice();
        if (!visible.length) {
            var empty = document.createElement('p');
            empty.textContent = 'No mods have registered with this menu yet.';
            panel.appendChild(empty);
        }
        visible.forEach(function (mod) {
            var card = document.createElement('section');
            card.style.cssText = 'background:#354f5d;border-radius:7px;margin:0 0 12px;padding:15px;box-sizing:border-box;';
            var title = document.createElement('div');
            title.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap';
            var name = document.createElement('strong');
            name.textContent = mod.name || mod.id;
            name.style.fontSize = '18px';
            title.appendChild(name);
            var toggle = document.createElement('button');
            var active = isModEnabled(mod.id);
            toggle.textContent = !mod.supportsToggle ? 'No runtime toggle' : active ? 'Enabled — Disable' : 'Disabled — Enable';
            toggle.disabled = !mod.supportsToggle;
            toggle.style.cssText = 'padding:10px 14px;border:0;border-radius:5px;color:#fff;font:inherit;' +
                'background:' + (mod.supportsToggle ? active ? '#74219b' : '#4c7380' : '#59676e') +
                ';cursor:' + (mod.supportsToggle ? 'pointer' : 'default') + ';';
            if (mod.supportsToggle) toggle.addEventListener('click', function () {
                setModEnabled(mod.id, !isModEnabled(mod.id));
                openOptionsPanel(id);
            });
            title.appendChild(toggle);
            card.appendChild(title);
            if (mod.description) {
                var desc = document.createElement('p');
                desc.textContent = mod.description;
                desc.style.cssText = 'margin:9px 0 0;color:#dbe3e7';
                card.appendChild(desc);
            }
            if (!id && (mod.getHtml || mod.fillMenu)) {
                var details = document.createElement('button');
                details.textContent = 'Settings →';
                details.style.cssText = 'margin-top:10px;border:0;background:transparent;color:#e7b9f7;font:inherit;cursor:pointer';
                details.addEventListener('click', function () { openOptionsPanel(mod.id); });
                card.appendChild(details);
            }
            if (id && typeof mod.getHtml === 'function') {
                try {
                    var content = pullButtons(mod.getHtml() || '');
                    var detailsBody = document.createElement('div');
                    detailsBody.innerHTML = content.html;
                    card.appendChild(detailsBody);
                    content.buttons.forEach(function (choice) {
                        var action = document.createElement('button');
                        action.textContent = choice.label;
                        action.style.cssText = 'margin:8px 8px 0 0;padding:8px 12px;background:#496f7b;color:white;border:0;border-radius:5px';
                        action.addEventListener('click', function () {
                            if (choice.open) openOptionsPanel(choice.open);
                            else if (mod.onAct) {
                                try { mod.onAct(choice.act, null, mod); }
                                catch (err) { console.error('[Android Mods] action', err); }
                                openOptionsPanel(id);
                            }
                        });
                        card.appendChild(action);
                    });
                    if (mod.onBind) mod.onBind(detailsBody, mod);
                } catch (err) { console.error('[Android Mods] Settings error:', err); }
            }
            panel.appendChild(card);
        });
    }

    function attachOptionsSidebarButton() {
        scanState();
        var categories = getOptionsCategories();
        if (!categories) {
            if (sidebarRow && !sidebarRow.isConnected) closeOptionsPanel();
            sidebarRow = null;
            return;
        }
        var parent = categories[0].parentElement;
        var existing = parent.querySelector('#kitty-android-options-mods');
        if (existing) {
            sidebarRow = existing;
            return;
        }
        // Same native element/class construction as the working Save Editor.
        // No cloning, modifying, or otherwise touching Haptics.
        var row = document.createElement('div');
        row.id = 'kitty-android-options-mods';
        row.className = 'optionCategory';
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.setAttribute('aria-label', 'Android Mods');
        var label = document.createElement('span');
        label.textContent = 'Android Mods';
        row.appendChild(label);
        row.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            tnDebug('Android Mods click received');
            console.info('[Android Mods] Button clicked');
            toggleOptionsPanel();
        });
        row.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleOptionsPanel();
            }
        });
        categories[categories.length - 1].insertAdjacentElement('afterend', row);
        sidebarRow = row;
        if (!parent.__tnAndroidModsBound) {
            parent.__tnAndroidModsBound = true;
            parent.addEventListener('click', function (event) {
                if (sidebarRow && !sidebarRow.contains(event.target)) closeOptionsPanel();
            }, true);
        }
        tnDebug('Inserted independent category after ' + (categories[categories.length - 1].textContent || '').trim());
        console.info('[Android Mods] Native Options category ready');
    }

    function hookMenu() {
        var scheduled = false;
        function schedule() {
            if (scheduled) return;
            scheduled = true;
            setTimeout(function () {
                scheduled = false;
                try { attachOptionsSidebarButton(); }
                catch (error) { tnDebug('ERROR sidebar hook: ' + error); console.warn('[Android Mods] Sidebar hook', error); }
            }, 0);
        }
        function start() {
            if (!document.body) return;
            if (debugEnabled) ensureDebug();
            bindOutsideClose();
            new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','id']});
            // Some navigation paths reuse nodes without inserting children.
            setInterval(schedule, 800);
            schedule();
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
        else start();
    }

    window.tnModMenuActive = true;
    window.tnModMenuKind = "android";
    window.isTnModEnabled = isModEnabled;
    window.setTnModEnabled = setModEnabled;
    window.registerModMenu = registerModMenu;
    window.bindModMenuFields = bindModMenuFields;
    window.listModMenus = function () { return menus.slice(); };
    window.getModMenu = byId;
    window.openModMenu = openIndex;
    window.openModMenuPage = openPage;
    window.closeAndroidModsPanel = closeOptionsPanel;
    window.ModMenu = {
        register: registerModMenu,
        isEnabled: isModEnabled,
        setEnabled: setModEnabled,
        list: window.listModMenus,
        get: byId,
        open: openIndex,
        openPage: openPage,
        bindFields: bindModMenuFields
    };
    hookMenu();
})();
