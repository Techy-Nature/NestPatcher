/* TN Desktop Menu for Trials in Tainted Space (Modv2.5).
   The desktop partner of AndroidModMenu. It adds "TN Mod Settings" to the game's Options
   sidebar, where every TN mod's settings page can be opened. It has NO on/off switches:
   on desktop every mod is always on (turn a mod off by putting # in front of it in
   enabled.txt and patching again).
   Desktop only. On Android it does nothing, because AndroidModMenu is the menu there.
   Mods register the same way as with AndroidModMenu:
     registerModMenu({ id, name, author, description, getHtml, onBind, onAct })
   Settings are saved by each mod itself, so they are the same ones it uses everywhere. */
(function () {
    "use strict";

    function isAndroid() {
        try {
            var nav = window.navigator || {};
            var ua = String(nav.userAgent || "");
            // The desktop game is an Electron app. Never Android, whatever else it says.
            if (/Electron\//i.test(ua)) return false;
            if (window.process && window.process.versions && window.process.versions.electron) return false;
            if (window.cordova && /android/i.test(String(window.cordova.platformId || ""))) return true;
            if (window.device && /android/i.test(String(window.device.platform || ""))) return true;
            if (window.Capacitor && typeof window.Capacitor.getPlatform === "function" &&
                window.Capacitor.getPlatform() === "android") return true;
            if (nav.userAgentData && /android/i.test(String(nav.userAgentData.platform || ""))) return true;
            return /Android/i.test(ua);
        } catch (err) { return false; }
    }
    if (isAndroid()) return;
    // Already running (the file was listed twice).
    if (window.tnModMenuKind === "desktop") return;

    var menus = [];
    var panel = null;
    var row = null;
    var ROW_ID = "tn-desktop-options-mods";
    var PANEL_ID = "tn-desktop-mods-panel";

    function byId(id) {
        for (var i = 0; i < menus.length; i++) if (menus[i].id === id) return menus[i];
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
        // supportsToggle and onEnabledChange are ignored: there are no switches here.
        if (!existing) menus.push(entry);
        return entry;
    }

    function hasSettings(mod) { return !!(mod && typeof mod.getHtml === "function"); }

    // Every mod is always on. A request to turn one off is refused.
    function isModEnabled() { return true; }
    function setModEnabled(id, enabled) { return !!enabled; }

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

    // Mods put choices in their pages as <button data-mod-act="..."> or data-mod-open.
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

    function ensureStyle() {
        if (document.getElementById("tn-desktop-menu-style")) return;
        var style = document.createElement("style");
        style.id = "tn-desktop-menu-style";
        style.textContent =
            "#" + PANEL_ID + "{position:fixed;z-index:2147483000;right:14px;top:51px;bottom:92px;overflow:auto;" +
            "padding:0 18px 18px;box-sizing:border-box;border-radius:8px;background:#1d2733;color:#eef2f7;" +
            "border:1px solid #3a4a5c;box-shadow:0 6px 24px rgba(0,0,0,.45);font:inherit;}" +
            "#" + PANEL_ID + " .tnd-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;" +
            "justify-content:space-between;gap:12px;margin:0 -18px 14px;padding:14px 18px;background:#1d2733;" +
            "border-bottom:1px solid #3a4a5c;}" +
            "#" + PANEL_ID + " h2{margin:0;font-size:1.4em;color:#fff;}" +
            "#" + PANEL_ID + " .tnd-intro{margin:0 0 16px;color:#c3cdd8;}" +
            "#" + PANEL_ID + " .tnd-card{background:#273444;border-radius:7px;margin:0 0 12px;padding:14px;}" +
            "#" + PANEL_ID + " .tnd-card strong{font-size:1.15em;}" +
            "#" + PANEL_ID + " .tnd-author{color:#9fb0c2;font-size:.9em;margin-left:.4em;}" +
            "#" + PANEL_ID + " .tnd-desc{margin:8px 0 0;color:#d3dbe4;}" +
            "#" + PANEL_ID + " .tnd-body{margin-top:10px;white-space:pre-line;}" +
            "#" + PANEL_ID + " button{font:inherit;cursor:pointer;border:0;border-radius:5px;color:#fff;}" +
            "#" + PANEL_ID + " .tnd-close{padding:8px 15px;background:#5b3a8a;}" +
            "#" + PANEL_ID + " .tnd-close:hover,#" + PANEL_ID + " .tnd-choice:hover{outline:2px solid #00f5ef;}" +
            "#" + PANEL_ID + " .tnd-open{margin-top:10px;padding:0;background:transparent;color:#d9b8f5;}" +
            "#" + PANEL_ID + " .tnd-choice{margin:8px 8px 0 0;padding:8px 12px;background:#3d5a6e;}" +
            "#" + ROW_ID + ".tn-selected{outline:2px solid #00f5ef;}";
        document.head.appendChild(style);
    }

    // The game's Options sidebar, found by its heading and its category elements.
    // React may replace these nodes on any render, so this runs again whenever the page changes.
    function getOptionsCategories() {
        var containers = document.querySelectorAll(".sidebarDetailsContainer");
        for (var i = 0; i < containers.length; i++) {
            var root = containers[i];
            var heading = root.querySelector(".headerText");
            if (!((heading && (heading.textContent || "").indexOf("Options") >= 0) ||
                  (root.textContent || "").indexOf("Gameplay") >= 0)) continue;
            var found = root.querySelectorAll('.optionCategory[id^="sidebarFilter_"]');
            if (!found.length) continue;
            var parent = found[0].parentElement, categories = [];
            for (var j = 0; j < found.length; j++) if (found[j].parentElement === parent) categories.push(found[j]);
            if (categories.length) return categories;
        }
        return null;
    }

    function isOpen() { return !!(panel && panel.isConnected); }

    function closePanel() {
        if (panel) panel.remove();
        panel = null;
        if (row) row.classList.remove("tn-selected");
    }

    function openPanel(id) {
        ensureStyle();
        closePanel();
        panel = document.createElement("section");
        panel.id = PANEL_ID;
        panel.setAttribute("aria-label", "TN mod settings");
        if (row && row.isConnected) {
            panel.style.left = Math.ceil(row.getBoundingClientRect().right + 14) + "px";
            row.classList.add("tn-selected");
        } else {
            panel.style.left = "14px";
        }
        var mod = id ? byId(id) : null;

        var head = document.createElement("div");
        head.className = "tnd-head";
        var title = document.createElement("h2");
        title.textContent = mod ? (mod.name || mod.id) : "TN Mod Settings";
        head.appendChild(title);
        var close = document.createElement("button");
        close.type = "button";
        close.className = "tnd-close";
        close.textContent = mod ? "← All mods" : "Close ✕";
        close.addEventListener("click", function () { if (mod) openPanel(); else closePanel(); });
        head.appendChild(close);
        panel.appendChild(head);

        if (!mod) {
            var intro = document.createElement("p");
            intro.className = "tnd-intro";
            intro.textContent = "Settings for your TN mods. Every mod here is on. To turn a mod off, " +
                "put # in front of it in enabled.txt and patch again. Press Escape or click outside to close.";
            panel.appendChild(intro);
        }

        var list = mod ? [mod] : menus.filter(hasSettings).sort(function (a, b) {
            return String(a.name || a.id).localeCompare(String(b.name || b.id));
        });
        if (!list.length) {
            var empty = document.createElement("p");
            empty.textContent = "None of your mods have settings to change.";
            panel.appendChild(empty);
        }
        list.forEach(function (item) { panel.appendChild(card(item, !!mod)); });
        document.body.appendChild(panel);
    }

    function card(mod, detailed) {
        var box = document.createElement("section");
        box.className = "tnd-card";
        var name = document.createElement("strong");
        name.textContent = mod.name || mod.id;
        box.appendChild(name);
        if (mod.author) {
            var by = document.createElement("span");
            by.className = "tnd-author";
            by.textContent = "by " + mod.author;
            box.appendChild(by);
        }
        if (mod.description) {
            var desc = document.createElement("p");
            desc.className = "tnd-desc";
            desc.textContent = mod.description;
            box.appendChild(desc);
        }
        if (!detailed) {
            var open = document.createElement("button");
            open.type = "button";
            open.className = "tnd-open";
            open.textContent = "Settings →";
            open.addEventListener("click", function () { openPanel(mod.id); });
            box.appendChild(open);
            return box;
        }
        try {
            var content = pullButtons(mod.getHtml() || "");
            var body = document.createElement("div");
            body.className = "tnd-body";
            body.innerHTML = content.html;
            box.appendChild(body);
            content.buttons.forEach(function (choice) {
                var btn = document.createElement("button");
                btn.type = "button";
                btn.className = "tnd-choice";
                btn.textContent = choice.label;
                btn.addEventListener("click", function () {
                    if (choice.open) { openPanel(choice.open); return; }
                    if (typeof mod.onAct === "function") {
                        try { mod.onAct(choice.act, null, mod); }
                        catch (err) { console.error("[TN Desktop Menu] action failed for", mod.id, err); }
                    }
                    openPanel(mod.id);
                });
                box.appendChild(btn);
            });
            if (typeof mod.onBind === "function") mod.onBind(body, mod);
        } catch (err) {
            console.error("[TN Desktop Menu] settings page failed for", mod.id, err);
            var broken = document.createElement("p");
            broken.textContent = "This settings page failed to draw.";
            box.appendChild(broken);
        }
        return box;
    }

    function attachRow() {
        var categories = getOptionsCategories();
        if (!categories) {
            if (row && !row.isConnected) closePanel();
            row = null;
            return;
        }
        var parent = categories[0].parentElement;
        var existing = parent.querySelector("#" + ROW_ID);
        if (existing) { row = existing; return; }
        var item = document.createElement("div");
        item.id = ROW_ID;
        item.className = "optionCategory";
        item.setAttribute("role", "button");
        item.setAttribute("tabindex", "0");
        item.setAttribute("aria-label", "TN Mod Settings");
        var label = document.createElement("span");
        label.textContent = "TN Mod Settings";
        item.appendChild(label);
        item.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (isOpen()) closePanel(); else openPanel();
        });
        item.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (isOpen()) closePanel(); else openPanel();
            }
        });
        categories[categories.length - 1].insertAdjacentElement("afterend", item);
        row = item;
    }

    function start() {
        if (!document.body) return;
        // Click outside the panel (and outside its sidebar entry) or press Escape to close.
        document.addEventListener("pointerdown", function (event) {
            if (!isOpen()) return;
            var target = event.target;
            if (!target || !target.isConnected || panel.contains(target)) return;
            if (row && row.contains(target)) return;
            closePanel();
        }, true);
        document.addEventListener("keydown", function (event) {
            if (isOpen() && (event.key === "Escape" || event.key === "Esc")) {
                event.preventDefault();
                event.stopPropagation();
                closePanel();
            }
        }, true);
        var scheduled = false;
        function schedule() {
            if (scheduled) return;
            scheduled = true;
            setTimeout(function () {
                scheduled = false;
                try { attachRow(); } catch (err) { console.warn("[TN Desktop Menu] Options hook", err); }
            }, 0);
        }
        new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
        setInterval(schedule, 800);
        schedule();
    }

    // Shared functions, the same names AndroidModMenu uses, so mods need no changes.
    window.tnModMenuActive = true;
    window.tnModMenuKind = "desktop";
    window.registerModMenu = registerModMenu;
    window.isTnModEnabled = isModEnabled;
    window.setTnModEnabled = setModEnabled;
    window.bindModMenuFields = bindModMenuFields;
    window.listModMenus = function () { return menus.slice(); };
    window.getModMenu = byId;
    window.openModMenu = function () { openPanel(); };
    window.openModMenuPage = function (id) { openPanel(id); };
    window.isTnDebugEnabled = function () { return false; };
    window.tnDebugLog = function (message) { console.info("[TN] " + message); };
    window.ModMenu = {
        register: registerModMenu,
        isEnabled: isModEnabled,
        setEnabled: setModEnabled,
        list: window.listModMenus,
        get: byId,
        open: window.openModMenu,
        openPage: window.openModMenuPage,
        bindFields: bindModMenuFields
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
    console.info("[TN Desktop Menu] Ready: Options > TN Mod Settings");
})();
