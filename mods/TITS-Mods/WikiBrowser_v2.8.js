/* Wiki Browser. Opens the Trials in Tainted Space wiki over the game and keeps its own search, links, and pages.
   Revision 2: the Wiki button lives in an "Info" section of the left sidebar whenever the
   main menu is showing (title screen or in-game menu), styled like the game's own sidebar
   buttons. If the sidebar is hidden, a small floating Info panel is used instead.
   The wiki overlay also closes with Android Back.
   Revision 3: other mods can add their own buttons to the Info section:
     window.tnInfo.addButton({ id, label, title, order, onClick })
     window.tnInfo.refresh()   // redraw after a label changes
   (Wiki is order 10; lower numbers appear first.)
   Revision 4 (Modv2.8): other mods can open the wiki on a search or a page:
     window.TnWikiBrowser()              // wiki home
     window.TnWikiBrowser('Gabilani')    // search (goes straight to the page on an exact match)
     window.TnWikiBrowser('https://wiki.smutosaur.us/TiTS/...')   // that page
   It returns true when the wiki opened, or false when the Wiki Browser is switched off
   in Android Mods. window.tnWikiEnabled() says which. The Codex Wiki button uses this. */
(function () {
    if (window.__tnWikiBrowserLoaded) return;
    window.__tnWikiBrowserLoaded = true;

    var HOME = "https://wiki.smutosaur.us/TiTS/Main_Page";
    var SEARCH = "https://wiki.smutosaur.us/TiTS/index.php?search=";
    var MOD_ID = 'tn-wiki-browser';
    var MOD_NAME = 'Wiki Browser';
    var MOD_DESCRIPTION = 'Browse the TiTS wiki from the Info section of the main menu sidebar.';
    var MAIN_MENU = 0;            // the game's UI state value for the main menu
    var SECTION_ID = 'tnInfoSection';

    // The Android Mods switch counts only while that menu is running (Android).
    // On desktop, or without the menu, the Wiki is always on.
    function enabled() {
        if ((window.tnModMenuActive===true&&typeof window.isTnModEnabled==="function")) return window.isTnModEnabled(MOD_ID);
        return true;
    }

    function debug(msg) {
        try { if ((window.tnModMenuActive===true&&typeof window.tnDebugLog==="function")) window.tnDebugLog('[Wiki] ' + msg); } catch (err) {}
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

    // Runtime scripts may load in any order, so retry until the menu exists.
    function waitForModMenu(tries) {
        tries = tries || 0;
        if (registerToggle()) return;
        if (window.tnModMenuActive === false && tries >= 6) return;   // no TN menu running
        if (tries < 240) setTimeout(function () { waitForModMenu(tries + 1); }, 500);
    }

    // ---------------------------------------------------------------------
    // Wiki overlay
    // ---------------------------------------------------------------------
    function closeWiki() {
        var root = document.getElementById("tnWiki");
        if (root) root.remove();
    }

    function ensureStyle() {
        if (document.getElementById("tnWikiStyle")) return;
        var style = document.createElement("style");
        style.id = "tnWikiStyle";
        style.textContent = "#tnWiki{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;background:var(--backgroundColor,#3D5174);color:var(--textColor,#fff);font-family:Lato,sans-serif;}"
            + "#tnWikiBar{display:flex;align-items:center;gap:0.45em;padding:0.55em 0.7em;background:var(--foregroundColorB,#2C3649);box-shadow:0 0.2em 0.4em 0 var(--shadowColor,#202735);}"
            + "#tnWikiBar button{flex:0 0 auto;min-width:5.6em;height:2.4em;padding:0 0.8em;border:none;border-radius:0.3125em;background:var(--foregroundColorA,#333E52);color:var(--textColor,#fff);font:inherit;font-weight:bold;cursor:pointer;box-shadow:0 0.2em 0.4em 0 var(--shadowColor,#202735);}"
            + "#tnWikiBar button:hover,#tnWikiBar button:active{background:var(--highlightColor,#8D31B0);}"
            + "#tnWikiBar input{flex:1;min-width:0;height:2.4em;padding:0 0.75em;font:inherit;color:var(--textColor,#fff);background:var(--shadowColorSemiTransparent,rgba(32,39,53,.35));border:0.15em solid var(--foregroundColorA,#333E52);border-radius:0.3125em;outline:none;}"
            + "#tnWikiBar input:hover,#tnWikiBar input:focus{background:var(--foregroundColorA,#333E52);border-color:var(--focusColor,#00F5EF);}"
            + "#tnWikiFrame{flex:1;width:100%;border:0;background:#fff;}"
            // Info section in the left sidebar
            + "#" + SECTION_ID + "{clear:both;padding-top:0.6em;}"
            + "#" + SECTION_ID + " .tnInfoButtons{clear:both;padding-top:0.3em;}"
            + "#" + SECTION_ID + " .optionCategory{cursor:pointer;user-select:none;}"
            + "#" + SECTION_ID + " .optionCategory:active{background:var(--highlightColor,#8D31B0);}"
            // Floating fallback when the sidebar is hidden
            + "#" + SECTION_ID + ".tnInfoFloating{position:fixed;left:0.8em;top:4.5em;z-index:50;width:11em;padding:0.6em;"
            + "background:var(--foregroundColorB,#2C3649);border-radius:0.4em;box-shadow:0 0.2em 0.4em 0 var(--shadowColor,#202735);}";
        document.head.appendChild(style);
    }

    function openWiki(url) {
        if (!enabled()) return;
        closeWiki();
        ensureStyle();
        var root = document.createElement("div");
        root.id = "tnWiki";
        root.innerHTML = ''
            + '<div id="tnWikiBar">'
            + '<button type="button" data-wiki="back">Back</button>'
            + '<button type="button" data-wiki="forward">Forward</button>'
            + '<button type="button" data-wiki="home">Home</button>'
            + '<input data-wiki="query" type="text" placeholder="Search the wiki">'
            + '<button type="button" data-wiki="go">Search</button>'
            + '<button type="button" data-wiki="close">Close</button>'
            + '</div>'
            + '<iframe id="tnWikiFrame" data-wiki="frame" src="' + String(url).replace(/"/g, '%22') + '"></iframe>';
        document.body.appendChild(root);
        var frame = root.querySelector("[data-wiki=frame]");
        var query = root.querySelector("[data-wiki=query]");
        var stack = [url];
        var at = 0;
        function go(next) {
            if (stack[at] === next) {
                frame.src = next;
                return;
            }
            stack = stack.slice(0, at + 1);
            stack.push(next);
            at = stack.length - 1;
            frame.src = next;
        }
        function step(dir) {
            try {
                frame.contentWindow.history.go(dir);
                return;
            } catch (err) {}
            var next = at + dir;
            if (next < 0 || next >= stack.length) return;
            at = next;
            frame.src = stack[at];
        }
        root.querySelector("[data-wiki=back]").onclick = function () { step(-1); };
        root.querySelector("[data-wiki=forward]").onclick = function () { step(1); };
        root.querySelector("[data-wiki=home]").onclick = function () { go(HOME); };
        root.querySelector("[data-wiki=go]").onclick = function () {
            var text = query.value.trim();
            go(text ? SEARCH + encodeURIComponent(text) : HOME);
        };
        query.addEventListener("keydown", function (event) {
            if (event.key === "Enter") root.querySelector("[data-wiki=go]").click();
        });
        root.querySelector("[data-wiki=close]").onclick = closeWiki;
        root.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeWiki();
        });
        debug('Wiki opened');
    }

    // Android Back closes the wiki overlay before the game sees it.
    document.addEventListener('backbutton', function (event) {
        if (!document.getElementById("tnWiki")) return;
        if (event && event.preventDefault) event.preventDefault();
        if (event && event.stopImmediatePropagation) event.stopImmediatePropagation();
        closeWiki();
    }, true);

    // ---------------------------------------------------------------------
    // "Info" section in the main menu's left sidebar
    // ---------------------------------------------------------------------
    // Shared button list, so other mods (like the Changelog) can live here too.
    var infoButtons = [];
    var infoApi = window.tnInfo || {};
    infoApi.addButton = function (spec) {
        if (!spec || !spec.id) return;
        infoButtons = infoButtons.filter(function (b) { return b.id !== spec.id; });
        infoButtons.push(spec);
        infoButtons.sort(function (a, b) { return (a.order || 50) - (b.order || 50); });
        infoApi.refresh();
    };
    infoApi.removeButton = function (id) {
        infoButtons = infoButtons.filter(function (b) { return b.id !== id; });
        infoApi.refresh();
    };
    infoApi.refresh = function () { removeSection(); schedule(); };
    // Buttons other mods queued before this file loaded.
    (infoApi.pending || []).forEach(function (spec) { infoButtons.push(spec); });
    delete infoApi.pending;
    window.tnInfo = infoApi;

    infoApi.addButton({
        id: 'wiki', label: 'Wiki', order: 10,
        title: 'Browse the Trials in Tainted Space wiki.',
        visible: function () { return enabled(); },
        onClick: function () { openWiki(HOME); }
    });
    function mainMenuShowing() {
        try { return !!(window.ui && ui.state && ui.state.mainElement === MAIN_MENU); }
        catch (err) { return false; }
    }

    function buildSection(floating) {
        var section = document.createElement('div');
        section.id = SECTION_ID;
        if (floating) section.className = 'tnInfoFloating';
        // Same header markup as the game's own sidebar headers.
        var head = document.createElement('div');
        head.className = 'headerText';
        head.textContent = 'Info';
        var line = document.createElement('div');
        line.className = 'headerLine head';
        var buttons = document.createElement('div');
        buttons.className = 'tnInfoButtons';
        infoButtons.forEach(function (spec) {
            try { if (typeof spec.visible === 'function' && !spec.visible()) return; } catch (err) { return; }
            var btn = document.createElement('div');
            btn.className = 'optionCategory';
            btn.id = 'tnInfo_' + spec.id;
            btn.setAttribute('role', 'button');
            btn.setAttribute('tabindex', '0');
            if (spec.title) btn.title = spec.title;
            var label = document.createElement('span');
            var text = typeof spec.label === 'function' ? spec.label() : spec.label;
            label.innerHTML = String(text == null ? spec.id : text);
            btn.appendChild(label);
            function run(event) {
                event.preventDefault();
                event.stopPropagation();
                try { spec.onClick(); } catch (err) { debug('ERROR in ' + spec.id + ': ' + err); }
            }
            btn.addEventListener('click', run);
            btn.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') run(event);
            });
            buttons.appendChild(btn);
        });
        section.appendChild(head);
        section.appendChild(line);
        section.appendChild(buttons);
        return section;
    }

    function removeSection() {
        var old = document.getElementById(SECTION_ID);
        if (old) old.remove();
    }

    function syncSection() {
        var anyVisible = infoButtons.some(function (b) {
            try { return typeof b.visible !== 'function' || b.visible(); } catch (err) { return false; }
        });
        if (!anyVisible || !mainMenuShowing()) { removeSection(); return; }
        // Ensure the style sheet exists even before the wiki has been opened once.
        ensureStyle();
        var host = document.querySelector('.leftSideBar .sidebarDetailsContainer');
        var existing = document.getElementById(SECTION_ID);
        if (host) {
            if (existing && existing.parentElement === host && host.lastElementChild === existing) return;
            if (existing) existing.remove();
            host.appendChild(buildSection(false));
            debug('Info section added to the sidebar');
        } else {
            if (existing && existing.classList.contains('tnInfoFloating')) return;
            if (existing) existing.remove();
            document.body.appendChild(buildSection(true));
            debug('Sidebar not found; floating Info panel used');
        }
    }

    var scheduled = false;
    function schedule() {
        if (scheduled) return;
        scheduled = true;
        setTimeout(function () {
            scheduled = false;
            try { syncSection(); } catch (err) { debug('ERROR ' + err); }
        }, 0);
    }

    function disableUI() {
        closeWiki();
        infoApi.refresh();
    }
    function enableUI() {
        schedule();
    }
    // Turns a search word or a wiki link into the page to show.
    function targetUrl(what) {
        var text = String(what == null ? '' : what).trim();
        if (!text) return HOME;
        if (/^https?:\/\//i.test(text)) return text;
        return SEARCH + encodeURIComponent(text);
    }
    window.TnWikiBrowser = function (what) {
        if (!enabled()) return false;
        openWiki(targetUrl(what));
        return true;
    };
    window.TnWikiBrowser.version = '2.8';
    window.tnWikiEnabled = function () { return enabled(); };

    // Redraw the Info section whenever the game draws the main menu.
    function hook(tries) {
        tries = tries || 0;
        if (!window.ui || typeof ui.generateMainMenuButtons !== "function") {
            if (tries < 300) setTimeout(function () { hook(tries + 1); }, 400);
            return;
        }
        if (ui.generateMainMenuButtons.__tnWiki) return;
        var original = ui.generateMainMenuButtons;
        var wrapped = function () {
            var result = original.apply(this, arguments);
            schedule();
            return result;
        };
        wrapped.__tnWiki = true;
        ui.generateMainMenuButtons = wrapped;
        debug('Main menu hook ready');
    }

    function start() {
        if (!document.body) return;
        // React may redraw the sidebar at any time; put the section back if it disappears,
        // and remove it when you leave the main menu.
        new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
        setInterval(schedule, 800);
        schedule();
    }

    waitForModMenu();
    hook();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
