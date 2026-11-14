/* TN Sex Scene Gallery v2.9 (Techy-Nest, 2026-11-02; main menu button 2026-11-05; character link 2026-11-11)
   A gallery of every sex scene in the game, with a summary of each one, that fills in as you
   play, plus four achievements for filling it:
     25%  Sex Hound
     50%  The Law of Sexual Exchange
     75%  Nymphomaniac
     100% Sexy Salacious Steele
   Open it from the game's main menu (a Sex Gallery button next to Credits while a save is loaded),
   from the Info section of the main menu sidebar (Sex Gallery), from the mod menu
   (Android Mods or TN Mod Settings), or with window.TnSexGallery.open().

   Needs TN_SexGalleryScenes_v2.9.js (the scene list). The scene list is made by
   mods/tools/sex_scene_scan_v2.9.js, which reads the game files with acorn.js. Run it again
   after a game update.

   Character link: the scene list says which characters from the game's own Gallery (main menu >
   Gallery, the character portraits) are in each scene. Pick a name in the Character drop-down to
   see their portrait and only their scenes. In the game's Gallery, double-tap (or double-click)
   a character's portrait to open the Sex Gallery on that character. A single tap still works as
   before; it just waits a moment to see if a second tap is coming.

   How "seen" works: whenever someone in a scene orgasms, the mod checks the text printed on
   that page (and the page just before it, for scenes that orgasm and then turn the page)
   against the scene list and marks the matching scene as seen. Progress is kept in the save
   (flags.TN_SEXGAL_SEEN and flags.TN_SEXGAL_ACH, both plain text), so every save has its own
   gallery and achievements.

   Unlocking from a save (2026-11-12): many scenes leave a flag in the save when you play them
   (ANNO_PETPLAYED, SEXED_ARDIA_RIDE, ...). The scene list says which flag belongs to which
   scene, so loading a save unlocks every scene its flags show, even ones played before the
   gallery was installed. A counter that a few scenes share (up to 12) unlocks all of them;
   turn "Unlock shared counters" off in the mod menu to count only a scene's own flag. Scenes
   that leave nothing in the save still unlock the normal way, by playing them.

   Search: type any part of a character's name (or several words, in any order: "anno tail",
   "ride mhenga"). Matching characters show as buttons above the list; tap one to see their
   portrait and scenes. Curly and straight quotes and accents count as the same.
   Full scene text (2026-11-12, optional add-on): with TN_SexGalleryText_v3.0.js in enabled.txt,
   every unlocked scene gets a Read scene button that shows the whole scene, written out for your
   Steele as they are now (the add-on packs the text; this file reads it, a chunk at a time). The
   Flashback Visor's Older memories use it too. Leave the add-on out for the lite pack: the gallery
   then works as before, with summaries and openings only. Reading never changes the save.
   Debug: window.TnSexGallery.status() */
(function () {
    "use strict";
    if (window.__tnSexGalleryLoaded) return;
    window.__tnSexGalleryLoaded = true;

    var MOD_ID = "tn-sex-gallery";
    var VERSION = "2.9";
    var SCENES_FILE = "TN_SexGalleryScenes_v2.9.js";
    var DOUBLE_TAP_MS = 350;
    var MAIN_MENU_SLOT = 5;   // the main menu uses 0-4, 7, 13 and 14
    var SEEN_FLAG = "TN_SEXGAL_SEEN";
    var ACH_FLAG = "TN_SEXGAL_ACH";
    var SETTINGS_KEY = "tnSexGallery.settings";
    var PAGE = 60;

    var ACHIEVEMENTS = [
        { id: "sexhound", pct: 25, name: "Sex Hound", text: "See 25% of the game’s sex scenes." },
        { id: "exchange", pct: 50, name: "The Law of Sexual Exchange", text: "See 50% of the game’s sex scenes." },
        { id: "nympho", pct: 75, name: "Nymphomaniac", text: "See 75% of the game’s sex scenes." },
        { id: "steele", pct: 100, name: "Sexy Salacious Steele", text: "See every sex scene in the game." }
    ];

    // ------------------------------------------------------------------ helpers
    function modOn() {
        try {
            return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID);
        } catch (err) { return true; }
    }
    function debug(msg) {
        try { if (window.tnModMenuActive === true && typeof window.tnDebugLog === "function") window.tnDebugLog("[Sex Gallery] " + msg); } catch (err) {}
    }
    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
        });
    }
    // for search: lower case, no accents, one kind of quote, single spaces
    function norm(s) {
        s = String(s == null ? "" : s).toLowerCase();
        try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (err) {}
        return s.replace(/[\u2018\u2019\u02bc`´]/g, "'").replace(/[\u201c\u201d]/g, "\"").replace(/[\u2013\u2014]/g, "-").replace(/\s+/g, " ").trim();
    }
    function inGame() {
        try { return typeof flags !== "undefined" && flags && typeof pc !== "undefined" && pc && !!pc.short; } catch (err) { return false; }
    }

    var settings = { toasts: true, newSceneToasts: true, spoilers: false, size: 1, saveUnlocks: true, sharedUnlocks: true, readLocked: false };
    try {
        var raw = window.localStorage && localStorage.getItem(SETTINGS_KEY);
        if (raw) { var got = JSON.parse(raw); for (var k in got) if (Object.prototype.hasOwnProperty.call(settings, k)) settings[k] = got[k]; }
    } catch (err) {}
    function saveSettings() {
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (err) {}
    }

    // ------------------------------------------------------------------ scene list
    var catalog = null;   // { scenes, byId, index }
    function loadCatalog() {
        var data = window.TN_SEX_GALLERY_SCENES;
        if (!data || !data.scenes) { catalog = null; return null; }
        if (catalog && catalog.data === data) return catalog;
        var byId = {};
        var index = new Map();   // first 10 characters of a fingerprint -> [{ i, fp }]
        for (var i = 0; i < data.scenes.length; i++) {
            var s = data.scenes[i];
            byId[s.id] = s;
            for (var j = 0; j < s.fp.length; j++) {
                var key = s.fp[j].slice(0, 10);
                var list = index.get(key);
                if (!list) { list = []; index.set(key, list); }
                list.push({ i: i, fp: s.fp[j] });
            }
        }
        var chars = Array.isArray(data.characters) ? data.characters.slice() : [];
        var charByName = {};
        for (var c = 0; c < chars.length; c++) {
            charByName[chars[c].name] = chars[c];
            chars[c].hay = norm(chars[c].name + " " + (chars[c].gallery || ""));
        }
        // search text for each scene (the summary is added only once the scene is seen) and the
        // save flags that unlock it
        var flagged = [];
        for (var h = 0; h < data.scenes.length; h++) {
            var sc = data.scenes[h];
            var who = [];
            for (var w = 0; sc.chars && w < sc.chars.length; w++) {
                who.push(sc.chars[w]);
                var cc = charByName[sc.chars[w]];
                if (cc && cc.gallery && cc.gallery !== cc.name) who.push(cc.gallery);
            }
            sc.hay = norm([sc.npc || "", who.join(" "), sc.title || "", sc.place || "", sc.area || "", sc.author || "", (sc.tags || []).join(" ")].join(" "));
            sc.haySum = norm(sc.summary || "");
            if ((sc.uf && sc.uf.length) || (sc.us && sc.us.length)) flagged.push(sc);
        }
        catalog = { data: data, scenes: data.scenes, byId: byId, index: index, chars: chars, charByName: charByName, flagged: flagged };
        debug("scene list loaded: " + data.scenes.length + " scenes (TiTS " + (data.game || "?") + ")");
        return catalog;
    }
    window.tnSexGalleryReload = function () { catalog = null; loadCatalog(); };

    // ------------------------------------------------------------------ per-save progress
    function readSeen() {
        var out = {};
        if (!inGame()) return out;
        var raw = flags[SEEN_FLAG];
        if (typeof raw !== "string" || !raw) return out;
        var parts = raw.split(",");
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i].split(":");
            if (p[0]) out[p[0]] = parseInt(p[1], 10) || 1;
        }
        return out;
    }
    function writeSeen(seen) {
        if (!inGame()) return;
        var parts = [];
        for (var id in seen) if (Object.prototype.hasOwnProperty.call(seen, id)) parts.push(id + ":" + seen[id]);
        flags[SEEN_FLAG] = parts.join(",");
    }
    function readAch() {
        var out = {};
        if (!inGame()) return out;
        var raw = flags[ACH_FLAG];
        if (typeof raw !== "string" || !raw) return out;
        var parts = raw.split(",");
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i].split(":");
            if (p[0]) out[p[0]] = parseInt(p[1], 10) || 0;
        }
        return out;
    }
    function writeAch(ach) {
        if (!inGame()) return;
        var parts = [];
        for (var id in ach) if (Object.prototype.hasOwnProperty.call(ach, id)) parts.push(id + ":" + ach[id]);
        flags[ACH_FLAG] = parts.join(",");
    }
    // Scenes this save's flags show were played: { id: "own" | "shared" }
    function flagOn(name) {
        var v = flags[name];
        return !(v === undefined || v === null || v === 0 || v === false || v === "" || v === "0");
    }
    function readSaveUnlocks() {
        var out = {};
        var cat = loadCatalog();
        if (!cat || !inGame() || !settings.saveUnlocks) return out;
        for (var i = 0; i < cat.flagged.length; i++) {
            var s = cat.flagged[i], j;
            for (j = 0; s.uf && j < s.uf.length; j++) if (flagOn(s.uf[j])) { out[s.id] = "own"; break; }
            if (out[s.id] || !settings.sharedUnlocks) continue;
            for (j = 0; s.us && j < s.us.length; j++) if (flagOn(s.us[j])) { out[s.id] = "shared"; break; }
        }
        return out;
    }
    function progress() {
        var cat = loadCatalog();
        var seen = readSeen();
        var save = readSaveUnlocks();
        var total = cat ? cat.scenes.length : 0;
        var n = 0, fromSave = 0;
        if (cat) {
            for (var id in seen) if (cat.byId[id]) n++;
            for (var id2 in save) if (!seen[id2] && cat.byId[id2]) { n++; fromSave++; }
        }
        return { seen: n, total: total, pct: total ? (n * 100 / total) : 0, map: seen, save: save, fromSave: fromSave };
    }

    function checkAchievements(quiet) {
        if (!inGame()) return [];
        var p = progress();
        if (!p.total) return [];
        var ach = readAch();
        var fresh = [];
        for (var i = 0; i < ACHIEVEMENTS.length; i++) {
            var a = ACHIEVEMENTS[i];
            var need = Math.ceil(p.total * a.pct / 100);
            if (!ach[a.id] && p.seen >= need) {
                ach[a.id] = (typeof days !== "undefined" ? days : 0) || 1;
                fresh.push(a);
            }
        }
        if (fresh.length) {
            writeAch(ach);
            if (!quiet && settings.toasts) for (var j = 0; j < fresh.length; j++) toastAchievement(fresh[j]);
            debug("achievement: " + fresh.map(function (x) { return x.name; }).join(", "));
        }
        return fresh;
    }

    // ------------------------------------------------------------------ recognising scenes
    var buf = [];
    var bufLen = 0;
    var held = "";        // the page that was on screen when an orgasm turned the page
    var pending = false;
    var lastMatch = null;
    var stats = { orgasms: 0, checks: 0, matches: 0, prevPage: 0 };

    function bufferText(t) {
        if (typeof t !== "string" || !t) return;
        buf.push(t);
        bufLen += t.length;
        if (bufLen > 300000) { buf = buf.slice(-200); bufLen = buf.join("").length; }
    }
    function resetBuffer() { buf = []; bufLen = 0; }

    function findScene(text) {
        var cat = loadCatalog();
        if (!cat || !text) return null;
        var hits = {};
        var best = -1, bestN = 0;
        for (var i = 0; i + 10 <= text.length; i++) {
            var list = cat.index.get(text.substr(i, 10));
            if (!list) continue;
            for (var j = 0; j < list.length; j++) {
                var h = list[j];
                if (text.startsWith(h.fp, i)) {
                    var key = h.i + "|" + h.fp;
                    if (hits[key]) continue;
                    hits[key] = 1;
                    hits[h.i] = (hits[h.i] || 0) + 1;
                    if (hits[h.i] > bestN) { bestN = hits[h.i]; best = h.i; }
                }
            }
        }
        return best >= 0 ? cat.scenes[best] : null;
    }

    // Save-flag unlocks seen at the last check, so a flag a scene sets while you play can catch
    // a scene the text match missed. A different flags object means another save was loaded.
    var knownFlags = null, knownSave = {};
    function syncSaveUnlocks(announce) {
        if (!inGame()) { knownFlags = null; knownSave = {}; return []; }
        var now = readSaveUnlocks();
        var fresh = [];
        if (knownFlags === flags) {
            for (var id in now) if (!knownSave[id]) fresh.push(id);
        }
        knownFlags = flags;
        knownSave = now;
        if (!announce) return fresh;
        var cat = loadCatalog(), seen = readSeen(), told = 0;
        for (var i = 0; i < fresh.length; i++) {
            var sc = cat && cat.byId[fresh[i]];
            if (!sc || seen[sc.id]) continue;
            seen[sc.id] = 1;
            told++;
            debug("NEW (save flag) " + sc.id + " " + (sc.npc || "?") + ": " + sc.title);
            if (settings.newSceneToasts && told <= 2) {
                var p = progress();
                toast("New in your gallery", (sc.npc ? sc.npc + ": " : "") + sc.title, p.seen + " / " + p.total + " scenes (" + p.pct.toFixed(1) + "%)", false);
            }
        }
        if (told) { writeSeen(seen); checkAchievements(false); }
        return fresh;
    }

    function checkNow() {
        if (!pending) return;
        pending = false;
        var before = held;
        held = "";
        if (!modOn() || !inGame()) return;
        stats.checks++;
        var scene = null;
        try {
            // this page first; if the orgasm came just before the page was cleared, the page before
            scene = findScene(buf.join(""));
            if (!scene && before) { scene = findScene(before); if (scene) stats.prevPage++; }
        } catch (err) { debug("match failed: " + err); }
        if (!scene) {
            debug("orgasm with no known scene on this page");
            try { syncSaveUnlocks(true); } catch (err) {}
            refreshButton();
            return;
        }
        stats.matches++;
        var seen = readSeen();
        var first = !seen[scene.id] && !knownSave[scene.id];
        seen[scene.id] = (seen[scene.id] || 0) + 1;
        writeSeen(seen);
        lastMatch = { id: scene.id, title: scene.title, npc: scene.npc, first: first };
        debug((first ? "NEW " : "again ") + scene.id + " " + (scene.npc || "?") + ": " + scene.title);
        if (first) {
            if (settings.newSceneToasts) {
                var p = progress();
                toast("New in your gallery", (scene.npc ? scene.npc + ": " : "") + scene.title, p.seen + " / " + p.total + " scenes (" + p.pct.toFixed(1) + "%)", false);
            }
            checkAchievements(false);
        }
        try { syncSaveUnlocks(true); } catch (err) {}
        refreshButton();
    }

    function noteOrgasm() {
        stats.orgasms++;
        if (pending) return;
        pending = true;
        // the scene function finishes printing first, then we look
        setTimeout(checkNow, 0);
    }

    function wrapOutput() {
        var o = window.output;
        if (typeof o !== "function" || o.__tnSexGallery) return !!o;
        var w = function (text) {
            try { bufferText(text); } catch (err) {}
            return o.apply(this, arguments);
        };
        w.__tnSexGallery = true;
        w.__tnOriginal = o;
        window.output = w;
        return true;
    }
    function wrapClear() {
        var c = window.clearOutput;
        if (typeof c !== "function" || c.__tnSexGallery) return !!c;
        var w = function () {
            // Many scenes call pc.orgasm() and then clearOutput() to start the next page in the
            // same breath. The scene text is on the page being cleared, so keep it for the check,
            // which runs once the new page is printed.
            try { if (pending) held = (held ? held + "\n" : "") + buf.join(""); } catch (err) {}
            resetBuffer();
            return c.apply(this, arguments);
        };
        w.__tnSexGallery = true;
        w.__tnOriginal = c;
        window.clearOutput = w;
        return true;
    }
    var orgasmWrapped = false;
    function wrapOrgasm() {
        if (orgasmWrapped) return true;
        if (typeof pc === "undefined" || !pc) return false;
        // the top-most class that defines orgasm (the base Creature); NPC classes call up to it
        var proto = Object.getPrototypeOf(pc), owner = null;
        while (proto && proto !== Object.prototype) {
            if (Object.prototype.hasOwnProperty.call(proto, "orgasm") && typeof proto.orgasm === "function") owner = proto;
            proto = Object.getPrototypeOf(proto);
        }
        if (!owner) return false;
        if (owner.orgasm.__tnSexGallery) { orgasmWrapped = true; return true; }
        var orig = owner.orgasm;
        var w = function () {
            try { noteOrgasm(); } catch (err) {}
            return orig.apply(this, arguments);
        };
        w.__tnSexGallery = true;
        w.__tnOriginal = orig;
        try {
            owner.orgasm = w;
        } catch (err) {
            try { Object.defineProperty(owner, "orgasm", { value: w, writable: true, configurable: true, enumerable: false }); }
            catch (err2) { return false; }
        }
        // classes that override orgasm without calling up to the base
        orgasmWrapped = true;
        debug("watching orgasms");
        return true;
    }
    function wrapOwn(obj) {
        // a creature class with its own orgasm that never reaches the base: wrap it too
        try {
            var p = Object.getPrototypeOf(obj);
            if (p && Object.prototype.hasOwnProperty.call(p, "orgasm") && !p.orgasm.__tnSexGallery) {
                var orig = p.orgasm;
                var w = function () {
                    try { noteOrgasm(); } catch (err) {}
                    return orig.apply(this, arguments);
                };
                w.__tnSexGallery = true;
                p.orgasm = w;
            }
        } catch (err) {}
        // anno.sexed(1), pippa.sexed(1): some scenes only record the sex this way (Anno's vibrator
        // scene has no orgasm() call). sexed() and sexed(0) just read the count, so they don't count.
        try {
            for (var q = Object.getPrototypeOf(obj); q && q !== Object.prototype; q = Object.getPrototypeOf(q)) {
                if (!Object.prototype.hasOwnProperty.call(q, "sexed") || typeof q.sexed !== "function") continue;
                if (!q.sexed.__tnSexGallery) {
                    var origS = q.sexed;
                    var ws = function (n) {
                        try { if (arguments.length && n && n !== "0") noteOrgasm(); } catch (err) {}
                        return origS.apply(this, arguments);
                    };
                    ws.__tnSexGallery = true;
                    ws.__tnOriginal = origS;
                    q.sexed = ws;
                }
                break;
            }
        } catch (err) {}
    }
    // A "Sex Gallery" button on the game's own main menu (New Game, Data, Gallery, Options,
    // Credits, ...) while a save is loaded, so it can be reached from inside a game.
    function saveLoaded() {
        try { if (typeof window.getGameState === "function") return !!window.getGameState() && inGame(); } catch (err) {}
        return inGame();
    }
    function addMainMenuButton() {
        if (!modOn() || !saveLoaded() || typeof window.addButton !== "function") return;
        var p = progress();
        window.addButton(MAIN_MENU_SLOT, "Sex Gallery", function () { openGallery(); }, "Sex Scene Gallery",
            "Every sex scene in the game, and the ones you’ve seen in this save (" + p.seen + " of " + p.total + ", " + p.pct.toFixed(1) + "%).");
    }
    function wrapMainMenu() {
        var host = (typeof ui !== "undefined" && ui) ? ui : null;
        if (!host || typeof host.generateMainMenuButtons !== "function") return false;
        if (host.generateMainMenuButtons.__tnSexGallery) return true;
        var orig = host.generateMainMenuButtons;
        var w = function () {
            var r = orig.apply(this, arguments);
            try { addMainMenuButton(); } catch (err) { debug("main menu button failed: " + err); }
            return r;
        };
        w.__tnSexGallery = true;
        w.__tnOriginal = orig;
        host.generateMainMenuButtons = w;
        // the menu may already be on screen
        try {
            if (host.state && host.state.mainElement === 0 && saveLoaded()) addMainMenuButton();
        } catch (err) {}
        debug("main menu button added");
        return true;
    }

    function wrapAll() {
        wrapOutput();
        wrapClear();
        wrapMainMenu();
        wrapOrgasm();
        try {
            // again whenever the game makes a new chars list (a save was loaded)
            if (orgasmWrapped && typeof chars !== "undefined" && chars && wrapAll.charsDone !== chars) {
                var any = false;
                for (var id in chars) if (chars[id] && typeof chars[id].orgasm === "function") { wrapOwn(chars[id]); any = true; }
                if (any) wrapAll.charsDone = chars;
            }
        } catch (err) {}
    }

    // ------------------------------------------------------------------ portraits
    // Webpack modules in main.js (0.9.168): 94083 .rs = bust lookup that follows the player's
    // artist choices, 37127 = the image manifest (name, artist, paths).
    var gameModules = {};
    function gameModule(id) {
        if (Object.prototype.hasOwnProperty.call(gameModules, id)) return gameModules[id];
        var mod = null;
        try {
            var chunks = window.webpackChunktits_html || self.webpackChunktits_html;
            if (chunks && typeof chunks.push === "function") {
                var req = null;
                chunks.push([["tn-sex-gallery-" + id + "-" + Date.now()], {}, function (r) { req = r; }]);
                if (typeof req === "function") mod = req(id);
            }
        } catch (err) { mod = null; }
        if (mod) gameModules[id] = mod;
        return mod;
    }
    function fixPath(p) {
        p = String(p || "").replace(/\\/g, "/");
        return !p || /^(\.\/|\/|data:|https?:|blob:|file:)/i.test(p) ? p : "./" + p;
    }
    var portraitCache = {};
    function portraitSrc(bust) {
        bust = String(bust || "");
        if (!bust) return "";
        if (Object.prototype.hasOwnProperty.call(portraitCache, bust)) return portraitCache[bust];
        var src = "";
        try {
            var low = bust.toLowerCase();
            if (typeof flags !== "undefined" && flags && flags.artistOverrides && flags.artistOverrides[low] === "custom" &&
                flags.pathOverrides && flags.pathOverrides[low] && flags.pathOverrides[low].x1) src = flags.pathOverrides[low].x1;
        } catch (err) {}
        if (!src) {
            try {
                var m = gameModule(94083);
                if (m && typeof m.rs === "function") { var e = m.rs(bust); if (e && e.paths && e.paths.x1) src = fixPath(e.paths.x1); }
            } catch (err) {}
        }
        if (!src) {
            try {
                var list = gameModule(37127);
                list = list && (Array.isArray(list) ? list : list.default);
                if (Array.isArray(list)) {
                    for (var i = 0; i < list.length; i++) {
                        if (list[i] && list[i].name === bust && list[i].paths && list[i].paths.x1) { src = fixPath(list[i].paths.x1); break; }
                    }
                }
            } catch (err) {}
        }
        if (src) portraitCache[bust] = src;
        return src;
    }

    // ------------------------------------------------------------------ styles
    function ensureStyle() {
        if (document.getElementById("tnSexGalStyle")) return;
        var css = ""
            + "#tnSexGal{position:fixed;inset:0;z-index:99998;display:flex;flex-direction:column;background:var(--backgroundColor,#3D5174);color:var(--textColor,#fff);font-family:Lato,'Segoe UI',sans-serif;font-size:calc(15px * var(--tnsg-size,1));}"
            + "#tnSexGal *{box-sizing:border-box;}"
            + "#tnSexGal .sg-top{flex:0 0 auto;padding:.7em .9em .6em;background:var(--foregroundColorB,#2C3649);border-bottom:1px solid var(--paleColor,#53677B);box-shadow:0 .2em .5em var(--shadowColor,#202735);}"
            + "#tnSexGal .sg-row{display:flex;flex-wrap:wrap;align-items:center;gap:.45em;}"
            + "#tnSexGal h2{margin:0;font-size:1.3em;flex:1 1 auto;color:var(--textColor,#fff);letter-spacing:.02em;}"
            + "#tnSexGal button,#tnSexGal select,#tnSexGal input{font:inherit;color:var(--textColor,#fff);background:var(--foregroundColorA,#333E52);border:1px solid var(--paleColor,#53677B);border-radius:.4em;min-height:2.4em;padding:0 .8em;}"
            + "#tnSexGal button{cursor:pointer;font-weight:bold;}"
            + "#tnSexGal button:hover,#tnSexGal button:focus-visible{background:var(--highlightColor,#8D31B0);border-color:var(--focusColor,#00F5EF);outline:none;}"
            + "#tnSexGal input{flex:1 1 12em;min-width:0;}"
            + "#tnSexGal input:focus,#tnSexGal select:focus{border-color:var(--focusColor,#00F5EF);outline:none;}"
            + "#tnSexGal .sg-bar{height:.8em;border-radius:.4em;background:var(--foregroundColorA,#333E52);overflow:hidden;margin:.55em 0 .35em;}"
            + "#tnSexGal .sg-bar>div{height:100%;background:var(--highlightColor,#8D31B0);background:linear-gradient(90deg,var(--highlightColor,#8D31B0),var(--focusColor,#00F5EF));}"
            + "#tnSexGal .sg-count{font-size:.92em;opacity:.8;}"
            + "#tnSexGal .sg-ach{display:flex;flex-wrap:wrap;gap:.4em;margin:.45em 0 .55em;}"
            + "@media (max-width:560px){#tnSexGal .sg-badge{flex:1 1 40%;font-size:.8em;padding:.35em .5em;}#tnSexGal h2{font-size:1.1em;}}"
            + "#tnSexGal .sg-badge{flex:1 1 10em;padding:.45em .6em;border-radius:.45em;background:var(--foregroundColorB,#2C3649);border:1px solid var(--paleColor,#53677B);color:var(--textColor,#fff);font-size:.9em;opacity:.65;}"
            + "#tnSexGal .sg-badge b{display:block;font-size:1.02em;}"
            + "#tnSexGal .sg-badge.on{background:var(--highlightColor,#8D31B0);border-color:var(--cautionColor,#E8C815);color:var(--textColor,#fff);opacity:1;}"
            + "#tnSexGal .sg-badge.on b:before{content:'★ ';color:var(--cautionColor,#E8C815);}"
            + "#tnSexGal .sg-list{flex:1 1 auto;overflow-y:auto;padding:.7em .9em 2em;scrollbar-width:auto;scrollbar-color:var(--paleColor,#53677B) var(--foregroundColorB,#2C3649);}"
            + "#tnSexGal .sg-list::-webkit-scrollbar{width:14px;}#tnSexGal .sg-list::-webkit-scrollbar-thumb{background:var(--paleColor,#53677B);border-radius:7px;}#tnSexGal .sg-list::-webkit-scrollbar-track{background:var(--foregroundColorB,#2C3649);}"
            + "#tnSexGal .sg-group{margin:1em 0 .4em;font-weight:bold;color:var(--hyperlinkColor,#D982EF);font-size:1.05em;border-bottom:1px solid var(--paleColor,#53677B);padding-bottom:.2em;}"
            + "#tnSexGal .sg-card{background:var(--foregroundColorA,#333E52);border:1px solid var(--paleColor,#53677B);border-left:.3em solid var(--highlightColor,#8D31B0);border-radius:.45em;padding:.6em .75em;margin:.45em 0;}"
            + "#tnSexGal .sg-card.locked{border-left-color:var(--paleColor,#53677B);opacity:.82;}"
            + "#tnSexGal .sg-title{font-weight:bold;font-size:1.05em;color:var(--textColor,#fff);}"
            + "#tnSexGal .sg-card.locked .sg-title{opacity:.8;}"
            + "#tnSexGal .sg-meta{font-size:.86em;opacity:.75;margin:.15em 0 .3em;}"
            + "#tnSexGal .sg-tags{display:flex;flex-wrap:wrap;gap:.3em;margin:.25em 0;}"
            + "#tnSexGal .sg-tag{font-size:.78em;padding:.1em .5em;border-radius:1em;background:var(--foregroundColorB,#2C3649);color:var(--textColor,#fff);}"
            + "#tnSexGal .sg-sum{line-height:1.45;}"
            + "#tnSexGal .sg-open{line-height:1.45;opacity:.8;font-style:italic;margin-top:.3em;font-size:.94em;}"
            + "#tnSexGal .sg-hidden{color:var(--lowPriorityColor,#B793C4);font-style:italic;}"
            + "#tnSexGal .sg-reveal{min-height:2em !important;padding:0 .6em !important;font-size:.85em;margin-top:.3em;}"
            + "#tnSexGal .sg-seen{float:right;font-size:.8em;color:var(--passiveColor,#D982EF);}"
            + "#tnSexGal .sg-note{opacity:.8;padding:1em .2em;line-height:1.5;}"
            + "#tnSexGal .sg-more{display:block;margin:1em auto;}"
            + "#tnSexGal .sg-read{max-width:48em;margin:0 auto;}"
            + "#tnSexGal.sg-reading .sg-bar,#tnSexGal.sg-reading .sg-count,#tnSexGal.sg-reading .sg-ach,#tnSexGal.sg-reading .sg-top>.sg-row+.sg-bar~.sg-row{display:none;}"
            + "#tnSexGal .sg-read-head{display:flex;flex-wrap:wrap;gap:.45em;align-items:center;margin:.2em 0 .8em;}"
            + "#tnSexGal .sg-read-text{white-space:pre-wrap;line-height:1.6;font-size:1.02em;background:var(--foregroundColorA,#333E52);border:1px solid var(--paleColor,#53677B);border-radius:.5em;padding:.9em 1.1em;}"
            + "#tnSexGal .sg-read-text .sg-alts,#tnSexGal .sg-read-text .sg-page{white-space:normal;}"
            + "#tnSexGal select[data-sg=char]{max-width:100%;}"
            + "#tnSexGal .sg-who{display:flex;flex-wrap:wrap;gap:.4em;align-items:center;margin:.2em 0 .6em;}"
            + "#tnSexGal .sg-who-head{opacity:.8;font-size:.92em;}"
            + "#tnSexGal .sg-who button{min-height:2.2em;}"
            + "#tnSexGal .sg-who-n{opacity:.7;font-weight:normal;font-size:.85em;}"
            + "#tnSexGal .sg-char{display:flex;gap:.9em;align-items:center;background:var(--foregroundColorA,#333E52);border:1px solid var(--paleColor,#53677B);border-radius:.55em;padding:.6em .8em;margin:.3em 0 .6em;}"
            + "#tnSexGal .sg-portrait{flex:0 0 auto;width:7.5em;height:7.5em;border-radius:.5em;background:var(--foregroundColorB,#2C3649);border:1px solid var(--paleColor,#53677B);overflow:hidden;display:flex;align-items:flex-end;justify-content:center;}"
            + "#tnSexGal .sg-portrait img{width:100%;height:100%;object-fit:cover;object-position:top center;}"
            + "#tnSexGal .sg-portrait .sg-noimg{align-self:center;font-size:2.4em;color:var(--paleColor,#53677B);font-weight:bold;}"
            + "#tnSexGal .sg-char-name{font-weight:bold;font-size:1.25em;color:var(--hyperlinkColor,#D982EF);}"
            + "#tnSexGal .sg-char-sub{font-size:.9em;opacity:.8;margin:.2em 0 .45em;line-height:1.4;}"
            + "@media (max-width:560px){#tnSexGal .sg-portrait{width:5.5em;height:5.5em;}}"
            + ".tnSexToastBox{position:fixed;right:1em;bottom:1em;z-index:99999;display:flex;flex-direction:column;gap:.5em;max-width:min(24em,calc(100vw - 2em));pointer-events:none;}"
            + ".tnSexToast{pointer-events:auto;background:var(--foregroundColorB,#2C3649);color:var(--textColor,#fff);border:1px solid var(--paleColor,#53677B);border-left:.35em solid var(--highlightColor,#8D31B0);border-radius:.5em;padding:.6em .8em;box-shadow:0 .3em .9em var(--shadowColor,#202735);font-family:Lato,'Segoe UI',sans-serif;font-size:14px;animation:tnSexIn .25s ease-out;}"
            + ".tnSexToast.ach{border-left-color:var(--cautionColor,#E8C815);border-color:var(--cautionColor,#E8C815);}"
            + ".tnSexToast .t1{font-size:.8em;text-transform:uppercase;letter-spacing:.06em;color:var(--hyperlinkColor,#D982EF);}"
            + ".tnSexToast.ach .t1{color:var(--cautionColor,#E8C815);}"
            + ".tnSexToast .t2{font-weight:bold;font-size:1.05em;margin:.1em 0;}"
            + ".tnSexToast .t3{font-size:.88em;opacity:.8;}"
            + "@keyframes tnSexIn{from{opacity:0;transform:translateY(.6em);}to{opacity:1;transform:none;}}";
        var style = document.createElement("style");
        style.id = "tnSexGalStyle";
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ------------------------------------------------------------------ toasts
    function toastBox() {
        var box = document.querySelector(".tnSexToastBox");
        if (!box) {
            box = document.createElement("div");
            box.className = "tnSexToastBox";
            document.body.appendChild(box);
        }
        return box;
    }
    function toast(head, title, sub, isAch) {
        try {
            ensureStyle();
            var el = document.createElement("div");
            el.className = "tnSexToast" + (isAch ? " ach" : "");
            el.innerHTML = '<div class="t1">' + esc(head) + '</div><div class="t2">' + esc(title) + '</div>' + (sub ? '<div class="t3">' + esc(sub) + '</div>' : "");
            el.onclick = function () { el.remove(); };
            var box = toastBox();
            box.appendChild(el);
            // never more than three at once; achievements stay longest
            while (box.children.length > 3) {
                var drop = null;
                for (var i = 0; i < box.children.length; i++) if (!/\bach\b/.test(box.children[i].className)) { drop = box.children[i]; break; }
                (drop || box.firstChild).remove();
            }
            setTimeout(function () { if (el.parentNode) el.remove(); }, isAch ? 9000 : 4500);
        } catch (err) {}
    }
    function toastAchievement(a) {
        toast("Achievement unlocked", a.name, a.text, true);
    }

    // ------------------------------------------------------------------ full scene text (add-on)
    // TN_SexGalleryText_v3.0.js (optional, made by mods/tools/sex_scene_text_scan_v3.0.js) holds
    // the whole text of every scene, deflated in chunks of about 60 scenes. Only the chunk you
    // open is unpacked, and only the last two are kept unpacked. Each scene is a small program:
    //   "text" | [0, expr] text worked out from an expression | [1, cond, then, else] | [2] next page
    // Checks are expression trees that this reader works out against the game as it is now (your
    // Steele, the crew, the save's flags). It only looks things up and calls the read-only methods
    // the scanner let through; it never runs game code from the add-on. A check it can't work out
    // shows every version of that bit.
    var TEXT_FILE = "TN_SexGalleryText_v3.0.js";
    var textCache = [];   // [{ n, data }] newest last
    var textStats = { chunks: 0, ms: 0, scenes: 0, failed: 0 };
    function textPack() {
        var d = window.TN_SEX_GALLERY_TEXT;
        return d && d.index && d.chunks ? d : null;
    }
    function hasFullText(id) { var d = textPack(); return !!(d && Object.prototype.hasOwnProperty.call(d.index, id)); }

    // raw deflate (RFC 1951), small and synchronous, so it works on every WebView
    var LBASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
    var LEXT = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
    var DBASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
    var DEXT = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
    var CLORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
    function inflateRaw(src) {
        var out = new Uint8Array(Math.max(1024, src.length * 4)), op = 0;
        var pos = 0, bitbuf = 0, bitcnt = 0;
        function need(n) {
            if (op + n <= out.length) return;
            var o = new Uint8Array(Math.max(out.length * 2, op + n));
            o.set(out.subarray(0, op));
            out = o;
        }
        function bits(n) {
            while (bitcnt < n) {
                if (pos >= src.length) throw new Error("deflate data ends early");
                bitbuf |= src[pos++] << bitcnt;
                bitcnt += 8;
            }
            var v = bitbuf & ((1 << n) - 1);
            bitbuf >>>= n;
            bitcnt -= n;
            return v;
        }
        function table(lengths, n) {
            var count = new Uint16Array(16), offs = new Uint16Array(16), sym = new Uint16Array(n), i;
            for (i = 0; i < n; i++) count[lengths[i]]++;
            count[0] = 0;
            for (i = 1; i < 16; i++) offs[i] = offs[i - 1] + count[i - 1];
            for (i = 0; i < n; i++) if (lengths[i]) sym[offs[lengths[i]]++] = i;
            return { count: count, sym: sym };
        }
        function decode(h) {
            var code = 0, first = 0, index = 0;
            for (var len = 1; len < 16; len++) {
                code |= bits(1);
                var c = h.count[len];
                if (code - c < first) return h.sym[index + (code - first)];
                index += c; first += c; first <<= 1; code <<= 1;
            }
            throw new Error("bad deflate code");
        }
        var fixedL = null, fixedD = null;
        for (;;) {
            var last = bits(1), type = bits(2), i;
            if (type === 0) {
                bitbuf = 0; bitcnt = 0;
                var len = src[pos] | (src[pos + 1] << 8);
                pos += 4;
                need(len);
                out.set(src.subarray(pos, pos + len), op);
                op += len; pos += len;
            } else {
                var lt, dt;
                if (type === 1) {
                    if (!fixedL) {
                        var l = new Uint8Array(288);
                        for (i = 0; i < 144; i++) l[i] = 8;
                        for (; i < 256; i++) l[i] = 9;
                        for (; i < 280; i++) l[i] = 7;
                        for (; i < 288; i++) l[i] = 8;
                        fixedL = table(l, 288);
                        var d = new Uint8Array(30);
                        for (i = 0; i < 30; i++) d[i] = 5;
                        fixedD = table(d, 30);
                    }
                    lt = fixedL; dt = fixedD;
                } else if (type === 2) {
                    var nlen = bits(5) + 257, ndist = bits(5) + 1, ncode = bits(4) + 4;
                    var cl = new Uint8Array(19);
                    for (i = 0; i < ncode; i++) cl[CLORDER[i]] = bits(3);
                    var ct = table(cl, 19);
                    var lens = new Uint8Array(nlen + ndist);
                    for (i = 0; i < nlen + ndist;) {
                        var sym = decode(ct);
                        if (sym < 16) lens[i++] = sym;
                        else {
                            var rep = 0, val = 0;
                            if (sym === 16) { if (!i) throw new Error("bad deflate repeat"); val = lens[i - 1]; rep = 3 + bits(2); }
                            else if (sym === 17) rep = 3 + bits(3);
                            else rep = 11 + bits(7);
                            while (rep--) lens[i++] = val;
                        }
                    }
                    lt = table(lens.subarray(0, nlen), nlen);
                    dt = table(lens.subarray(nlen), ndist);
                } else throw new Error("bad deflate block");
                for (;;) {
                    var s = decode(lt);
                    if (s < 256) { need(1); out[op++] = s; }
                    else if (s === 256) break;
                    else {
                        s -= 257;
                        var n = LBASE[s] + bits(LEXT[s]);
                        var ds = decode(dt);
                        var dist = DBASE[ds] + bits(DEXT[ds]);
                        need(n);
                        for (var k = 0; k < n; k++) { out[op] = out[op - dist]; op++; }
                    }
                }
            }
            if (last) break;
        }
        return out.subarray(0, op);
    }
    function utf8(bytes) {
        if (typeof TextDecoder === "function") return new TextDecoder("utf-8").decode(bytes);
        var s = "";
        for (var i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
        return decodeURIComponent(escape(s));
    }
    function chunk(n) {
        for (var i = 0; i < textCache.length; i++) if (textCache[i].n === n) {
            var hit = textCache.splice(i, 1)[0];
            textCache.push(hit);
            return hit.data;
        }
        var d = textPack();
        if (!d || !d.chunks[n]) return null;
        var t0 = Date.now();
        var bin = atob(d.chunks[n]);
        var bytes = new Uint8Array(bin.length);
        for (var j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
        var data = JSON.parse(utf8(inflateRaw(bytes)));
        textStats.chunks++;
        textStats.ms += Date.now() - t0;
        textCache.push({ n: n, data: data });
        while (textCache.length > 2) textCache.shift();
        return data;
    }
    function sceneProgram(id) {
        var d = textPack();
        if (!d || !Object.prototype.hasOwnProperty.call(d.index, id)) return null;
        var c = chunk(d.index[id]);
        return c && c[id] || null;
    }

    // expression trees: ["l", v] ["i", name] ["m", obj, "prop"] ["M", obj, expr] ["c", callee, args]
    // ["u", op, x] ["b", op, a, b] ["L", op, a, b] ["?", c, a, b] ["t", quasis, exprs] ["a", items]
    var CANT = { cant: true };
    function ev(t) {
        if (!t) throw CANT;
        var a, b, o, i;
        switch (t[0]) {
            case "l": return t[1];
            case "i":
                if (!(t[1] in window)) throw CANT;
                return window[t[1]];
            case "m":
                o = ev(t[1]);
                if (o === null || o === undefined) throw CANT;
                return o[t[2]];
            case "M":
                o = ev(t[1]);
                if (o === null || o === undefined) throw CANT;
                return o[ev(t[2])];
            case "c": {
                var self, fn;
                if (t[1][0] === "m" || t[1][0] === "M") {
                    self = ev(t[1][1]);
                    if (self === null || self === undefined) throw CANT;
                    fn = self[t[1][0] === "m" ? t[1][2] : ev(t[1][2])];
                } else { self = undefined; fn = ev(t[1]); }
                if (typeof fn !== "function") throw CANT;
                var args = [];
                for (i = 0; i < t[2].length; i++) args.push(ev(t[2][i]));
                return fn.apply(self, args);
            }
            case "u":
                if (t[1] === "typeof") { try { return typeof ev(t[2]); } catch (err) { if (err === CANT) return "undefined"; throw err; } }
                a = ev(t[2]);
                switch (t[1]) { case "!": return !a; case "-": return -a; case "+": return +a; case "~": return ~a; case "void": return undefined; }
                throw CANT;
            case "b":
                a = ev(t[2]); b = ev(t[3]);
                switch (t[1]) {
                    case "==": return a == b; case "!=": return a != b; case "===": return a === b; case "!==": return a !== b;   // eslint-disable-line eqeqeq
                    case "<": return a < b; case ">": return a > b; case "<=": return a <= b; case ">=": return a >= b;
                    case "+": return a + b; case "-": return a - b; case "*": return a * b; case "/": return a / b; case "%": return a % b;
                    case "&": return a & b; case "|": return a | b; case "^": return a ^ b;
                    case "<<": return a << b; case ">>": return a >> b; case ">>>": return a >>> b;
                    case "in": return (b !== null && typeof b === "object") ? a in b : false;
                    case "**": return Math.pow(a, b);
                }
                throw CANT;
            case "L":
                a = ev(t[2]);
                if (t[1] === "&&") return a ? ev(t[3]) : a;
                if (t[1] === "||") return a ? a : ev(t[3]);
                if (t[1] === "??") return (a === null || a === undefined) ? ev(t[3]) : a;
                throw CANT;
            case "?": return ev(t[1]) ? ev(t[2]) : ev(t[3]);
            case "t": {
                var s = t[1][0] || "";
                for (i = 0; i < t[2].length; i++) s += String(ev(t[2][i])) + (t[1][i + 1] || "");
                return s;
            }
            case "a": { var arr = []; for (i = 0; i < t[1].length; i++) arr.push(ev(t[1][i])); return arr; }
        }
        throw CANT;
    }
    function tryEv(t) {
        if (!t) return CANT;
        try { return ev(t); } catch (err) { return CANT; }
    }

    function parseText(s) {
        if (!s) return "";
        try { if (typeof ui !== "undefined" && ui && typeof ui.parse === "function") return String(ui.parse(s)); } catch (err) {}
        // no parser (or it choked): show the text with parser tags tidied away
        return esc(s).replace(/\[pc\.name\]/gi, "Steele").replace(/\[[^\]]*\]/g, "…");
    }
    function inTag(s) { return s.lastIndexOf("[") > s.lastIndexOf("]"); }
    // the alternatives of a check we can't work out: [1, null, a, [[1, null, b, c]]] is a, b, c
    function choices(it) {
        var out = [it[2]];
        var rest = it[3];
        while (rest.length === 1 && Array.isArray(rest[0]) && rest[0][0] === 1 && !rest[0][1]) { out.push(rest[0][2]); rest = rest[0][3]; }
        out.push(rest);
        return out;
    }
    function plainLen(p) {
        var n = 0;
        for (var i = 0; i < p.length; i++) {
            var it = p[i];
            if (typeof it === "string") n += it.length;
            else if (it[0] === 2) return 1e9;
            else if (it[0] === 1) n += Math.max(plainLen(it[2]), plainLen(it[3]));
            else n += 8;
        }
        return n;
    }
    // Renders a scene program to HTML. pages: false = one long text with dividers.
    function renderProgram(prog) {
        var st = { html: [], run: "", unknown: 0, known: 0 };
        function flush() { if (st.run) { st.html.push(parseText(st.run)); st.run = ""; } }
        function sub(p) {
            var save = st.html, run = st.run;
            st.html = []; st.run = "";
            walk(p);
            flush();
            var h = st.html.join("");
            st.html = save; st.run = run;
            return h;
        }
        function walk(p) {
            for (var i = 0; i < p.length; i++) {
                var it = p[i];
                if (typeof it === "string") { st.run += it; continue; }
                if (it[0] === 0) {
                    var v = tryEv(it[1]);
                    if (v !== CANT && v !== null && v !== undefined && typeof v !== "object" && typeof v !== "function" && !/\bundefined\b|NaN|\[object /.test(String(v))) st.run += String(v);
                    else if (inTag(st.run)) st.run += "0";
                    else if (v === CANT) st.run += "…";
                    continue;
                }
                if (it[0] === 2) {
                    flush();
                    st.html.push('<div class="sg-page" style="text-align:center;opacity:.6;margin:1.2em 0;letter-spacing:.4em">~ ~ ~</div>');
                    continue;
                }
                var c = it[1] ? tryEv(it[1]) : CANT;
                if (c !== CANT) { st.known++; walk(c ? it[2] : it[3]); continue; }
                if (inTag(st.run)) { walk(it[2].length ? it[2] : it[3]); continue; }
                st.unknown++;
                var opts = choices(it);
                var short = true;
                for (var k = 0; k < opts.length; k++) if (plainLen(opts[k]) > 220) short = false;
                flush();
                if (short) {
                    var parts = [];
                    for (k = 0; k < opts.length; k++) { var h = sub(opts[k]); parts.push(h || "<i>(nothing)</i>"); }
                    st.html.push('<span class="sg-alt" title="The game picks one of these" style="border-bottom:1px dotted var(--paleColor,#53677B);color:var(--hyperlinkColor,#D982EF)">⟨' +
                        parts.join(' <b style="opacity:.6">|</b> ') + "⟩</span>");
                } else {
                    var box = '<div class="sg-alts" style="border:1px dashed var(--paleColor,#53677B);border-radius:.4em;padding:.4em .7em;margin:.6em 0">' +
                        '<div style="font-size:.8em;opacity:.7;margin-bottom:.3em">The game picks one of these ' + opts.length + " versions:</div>";
                    for (k = 0; k < opts.length; k++) {
                        var hh = sub(opts[k]);
                        box += '<div style="' + (k ? "border-top:1px solid var(--paleColor,#53677B);" : "") + 'padding:.35em 0"><b style="font-size:.8em;opacity:.75">Version ' + (k + 1) + ":</b> " + (hh || "<i>(nothing here)</i>") + "</div>";
                    }
                    st.html.push(box + "</div>");
                }
            }
        }
        walk(prog);
        flush();
        return { html: st.html.join(""), unknown: st.unknown, known: st.known };
    }
    function sceneHtml(id) {
        var p = null;
        try { p = sceneProgram(id); } catch (err) { textStats.failed++; debug("full text failed for " + id + ": " + err); return null; }
        if (!p) return null;
        textStats.scenes++;
        // Some read-only methods quietly create a flag with its default value the first time
        // they're asked (pippa's affection, ...). Put flags back exactly as they were, so reading
        // a scene never changes the save.
        var before = null;
        try {
            if (typeof flags !== "undefined" && flags) {
                before = {};
                for (var k in flags) if (Object.prototype.hasOwnProperty.call(flags, k)) before[k] = flags[k];
            }
        } catch (err) { before = null; }
        try { return renderProgram(p); }
        finally {
            if (before) {
                try {
                    for (var k2 in flags) if (Object.prototype.hasOwnProperty.call(flags, k2) && !Object.prototype.hasOwnProperty.call(before, k2)) delete flags[k2];
                    for (var k3 in before) if (flags[k3] !== before[k3]) flags[k3] = before[k3];
                } catch (err) {}
            }
        }
    }
    // The Flashback Visor's own recording of this scene, if it has one (what you actually saw)
    function livedHtml(id) {
        try { if (window.tnFbv && typeof window.tnFbv.galleryText === "function") return window.tnFbv.galleryText(id) || ""; } catch (err) {}
        return "";
    }
    function canRead(id, unlocked) {
        return hasFullText(id) && (unlocked || settings.readLocked);
    }

    // ------------------------------------------------------------------ gallery window
    var view = { q: "", place: "", show: "all", char: "", shown: PAGE, revealed: {}, reading: "", lived: false, listY: 0 };
    var keyHandler = null, backHandler = null;

    function closeGallery() {
        view.reading = "";
        var root = document.getElementById("tnSexGal");
        if (root) root.remove();
        if (keyHandler) document.removeEventListener("keydown", keyHandler, true);
        if (backHandler) document.removeEventListener("backbutton", backHandler, true);
        keyHandler = backHandler = null;
    }

    function queryWords() {
        var q = norm(view.q);
        return q ? q.split(" ") : [];
    }
    function hasAll(hay, words) {
        for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
        return true;
    }
    function filtered(cat, seen, save) {
        var words = queryWords();
        var out = [];
        for (var i = 0; i < cat.scenes.length; i++) {
            var s = cat.scenes[i];
            var isSeen = !!(seen[s.id] || save[s.id]);
            if (view.show === "seen" && !isSeen) continue;
            if (view.show === "unseen" && isSeen) continue;
            if (view.place && s.place !== view.place) continue;
            if (view.char && !(s.chars && s.chars.indexOf(view.char) >= 0)) continue;
            if (words.length) {
                var hay = s.hay + (isSeen || settings.spoilers || view.revealed[s.id] ? " " + s.haySum : "");
                if (!hasAll(hay, words)) continue;
            }
            out.push(s);
        }
        return out;
    }
    // characters whose name (or gallery name) has every word typed in the search box
    function matchingChars(cat) {
        var words = queryWords();
        if (!words.length || !cat) return [];
        var out = [];
        for (var i = 0; i < cat.chars.length; i++) if (hasAll(cat.chars[i].hay, words)) out.push(cat.chars[i]);
        // names that start with what was typed first
        var q = words.join(" ");
        out.sort(function (a, b) {
            var sa = norm(a.name).indexOf(q) === 0 ? 0 : 1, sb = norm(b.name).indexOf(q) === 0 ? 0 : 1;
            return (sa - sb) || a.name.localeCompare(b.name);
        });
        return out;
    }

    function cardHtml(s, seenCount, fromSave) {
        var unlocked = !!seenCount || !!fromSave;
        var open = unlocked || settings.spoilers || view.revealed[s.id];
        var html = '<div class="sg-card' + (unlocked ? "" : " locked") + '">';
        if (seenCount) html += '<span class="sg-seen">Seen ' + seenCount + (seenCount === 1 ? " time" : " times") + "</span>";
        else if (fromSave) html += '<span class="sg-seen" title="' + (fromSave === "shared"
            ? "Your save's flags show you played this scene or one that shares its counter."
            : "Your save's flags show you played this scene.") + '">Unlocked from your save</span>';
        else html += '<span class="sg-seen" style="color:var(--lowPriorityColor,#B793C4)">Not seen yet</span>';
        html += '<div class="sg-title">' + esc(s.title) + "</div>";
        var meta = [s.npc || "Unknown partner", s.place];
        if (s.author) meta.push("by " + s.author);
        html += '<div class="sg-meta">' + esc(meta.join(" · ")) + "</div>";
        if (s.tags && s.tags.length) {
            html += '<div class="sg-tags">';
            for (var i = 0; i < s.tags.length; i++) html += '<span class="sg-tag">' + esc(s.tags[i]) + "</span>";
            html += "</div>";
        }
        if (open) {
            html += '<div class="sg-sum">' + esc(s.summary) + "</div>";
            if (s.opening) {
                var o = String(s.opening);
                html += '<div class="sg-open">Starts: ' + (/^[“"]/.test(o) ? esc(o) : "“" + esc(o) + "”") + "</div>";
            }
        } else {
            html += '<div class="sg-hidden">Summary hidden until you see this scene.</div>';
            html += '<button type="button" class="sg-reveal" data-sg="reveal" data-id="' + esc(s.id) + '">Show summary</button>';
        }
        if (canRead(s.id, unlocked)) html += ' <button type="button" class="sg-reveal" data-sg="read" data-id="' + esc(s.id) + '">Read scene</button>';
        return html + "</div>";
    }

    function charCardHtml(cat, name, seen, save) {
        var c = cat.charByName[name] || { name: name, bust: "" };
        var total = 0, got = 0;
        for (var i = 0; i < cat.scenes.length; i++) {
            var s = cat.scenes[i];
            if (s.chars && s.chars.indexOf(name) >= 0) { total++; if (seen[s.id] || save[s.id]) got++; }
        }
        var src = portraitSrc(c.bust);
        var html = '<div class="sg-char"><div class="sg-portrait">';
        var letter = '<span class="sg-noimg">' + esc(String(c.name).charAt(0)) + "</span>";
        html += src ? '<img alt="' + esc(c.name) + '" src="' + esc(src) + '" onerror="this.outerHTML=this.getAttribute(\'data-fallback\')" data-fallback="' + esc(letter) + '">' : letter;
        html += '</div><div><div class="sg-char-name">' + esc(c.name) + "</div>";
        html += '<div class="sg-char-sub">' + (total ? (inGame() ? got + " of " + total + (total === 1 ? " scene" : " scenes") + " seen" : total + (total === 1 ? " scene" : " scenes")) : "No scenes in the list") +
            (c.gallery && c.gallery !== c.name ? " · Gallery name: " + esc(c.gallery) : "") + "</div>";
        html += '<button type="button" data-sg="allchars">All characters</button></div></div>';
        return html;
    }

    function charOptions(cat) {
        var opts = '<option value="">All characters</option>';
        var list = cat ? cat.chars : [];
        var found = false;
        for (var i = 0; i < list.length; i++) {
            var c = list[i];
            if (c.name === view.char) found = true;
            opts += '<option value="' + esc(c.name) + '"' + (view.char === c.name ? " selected" : "") + ">" + esc(c.name) + " (" + (c.scenes || 0) + ")</option>";
        }
        // a portrait from the game's Gallery with no scenes in the list still gets a name to show
        if (view.char && !found) opts += '<option value="' + esc(view.char) + '" selected>' + esc(view.char) + " (0)</option>";
        return opts;
    }

    function renderReader(root, list, cat) {
        var s = cat.byId[view.reading];
        if (!s) { view.reading = ""; root.classList.remove("sg-reading"); return false; }
        root.classList.add("sg-reading");
        var lived = livedHtml(s.id);
        var useLived = view.lived && !!lived;
        var t0 = Date.now();
        var r = useLived ? { html: lived, unknown: 0 } : sceneHtml(s.id);
        var ms = Date.now() - t0;
        var html = '<div class="sg-read"><div class="sg-read-head"><button type="button" data-sg="back">Back to the list</button>';
        if (lived) html += '<button type="button" data-sg="lived">' + (useLived ? "Show it for your Steele now" : "As you lived it (visor)") + "</button>";
        if (!useLived) html += '<button type="button" data-sg="reread">Read again</button>';
        html += "</div>";
        html += '<div class="sg-title">' + esc(s.title) + "</div>";
        var meta = [s.npc || "Unknown partner", s.place];
        if (s.author) meta.push("by " + s.author);
        html += '<div class="sg-meta">' + esc(meta.join(" · ")) + "</div>";
        if (!r) html += '<div class="sg-note">This scene’s text couldn’t be unpacked. Make sure <b>' + TEXT_FILE + "</b> and the scene list come from the same game version.</div>";
        else {
            html += '<div class="sg-note" style="font-size:.85em;padding:.2em 0 .7em">' + (useLived
                ? "The Flashback Visor’s recording: the scene exactly as it played for you."
                : "Written out for your Steele as they are now." + (r.unknown ? " Bits marked ⟨ | ⟩ or in a dashed box are where the game picks between versions in ways the gallery can’t work out." : "")) + "</div>";
            html += '<div class="sg-read-text">' + r.html + "</div>";
            html += '<div class="sg-read-head" style="margin-top:.9em"><button type="button" data-sg="back">Back to the list</button></div>';
        }
        list.innerHTML = html + "</div>";
        list.scrollTop = 0;
        debug("read " + s.id + " in " + ms + " ms" + (r ? " (" + r.unknown + " unknown checks)" : ""));
        return true;
    }

    function renderList(root) {
        var list = root.querySelector(".sg-list");
        var cat = loadCatalog();
        if (cat && view.reading && renderReader(root, list, cat)) return;
        root.classList.remove("sg-reading");
        if (!cat) {
            list.innerHTML = '<div class="sg-note">The scene list is missing. Put <b>' + SCENES_FILE + '</b> in your mods folder, add it to <b>enabled.txt</b>, and patch again.</div>';
            return;
        }
        var seen = readSeen();
        var save = readSaveUnlocks();
        var rows = filtered(cat, seen, save);
        var html = "";
        if (view.char) html += charCardHtml(cat, view.char, seen, save);
        else {
            var who = matchingChars(cat);
            if (who.length) {
                html += '<div class="sg-who"><span class="sg-who-head">Characters:</span>';
                for (var w = 0; w < who.length && w < 24; w++) {
                    html += '<button type="button" data-sg="pickchar" data-name="' + esc(who[w].name) + '">' + esc(who[w].name) + ' <span class="sg-who-n">' + (who[w].scenes || 0) + "</span></button>";
                }
                if (who.length > 24) html += '<span class="sg-who-head">and ' + (who.length - 24) + " more: type more of the name</span>";
                html += "</div>";
            }
        }
        if (!inGame()) html += '<div class="sg-note">No save is loaded, so nothing is marked as seen. Load a save to see its gallery.</div>';
        if (!rows.length) html += '<div class="sg-note">' + (view.char && !cat.charByName[view.char]
            ? "The scene list doesn’t have any sex scenes for " + esc(view.char) + "."
            : "No scenes match.") + "</div>";
        var lastGroup = null;
        var upto = Math.min(rows.length, view.shown);
        for (var i = 0; i < upto; i++) {
            var s = rows[i];
            var group = s.place + " — " + (s.npc || "Other scenes");
            if (group !== lastGroup) { html += '<div class="sg-group">' + esc(group) + "</div>"; lastGroup = group; }
            html += cardHtml(s, seen[s.id] || 0, save[s.id] || "");
        }
        if (rows.length > upto) html += '<button type="button" class="sg-more" data-sg="more">Show more (' + (rows.length - upto) + " left)</button>";
        var tp = textPack();
        html += '<div class="sg-note" style="font-size:.85em">Scene list: ' + cat.scenes.length + " scenes from TiTS " + esc(cat.data.game || "?") +
            ". Some scenes rule each other out, so 100% takes more than one playthrough’s worth of choices. Summaries are made by the scanner from each scene’s button, tooltip and text." +
            (tp ? " Full scene text: " + tp.count + " scenes (TiTS " + esc(tp.game || "?") + "), readable once unlocked" + (settings.readLocked ? " (locked ones too, it’s turned on in the mod menu)" : "") + "."
                : " Want to read whole scenes? Add <b>" + TEXT_FILE + "</b> (the full-text add-on).") + "</div>";
        list.innerHTML = html;
    }

    function renderTop(root) {
        var p = progress();
        var ach = readAch();
        root.querySelector(".sg-bar>div").style.width = Math.min(100, p.pct).toFixed(2) + "%";
        root.querySelector(".sg-count").textContent = (inGame() ? p.seen + " of " + p.total + " scenes seen (" + p.pct.toFixed(1) + "%)" +
            (p.fromSave ? ", " + p.fromSave + " of them unlocked from your save" : "") : p.total + " scenes in the game");
        var html = "";
        for (var i = 0; i < ACHIEVEMENTS.length; i++) {
            var a = ACHIEVEMENTS[i];
            var need = Math.ceil(p.total * a.pct / 100);
            html += '<div class="sg-badge' + (ach[a.id] ? " on" : "") + '" title="' + esc(a.text) + '"><b>' + esc(a.name) + "</b>" +
                (ach[a.id] ? "Unlocked" + (ach[a.id] > 1 ? " on day " + ach[a.id] : "") : a.pct + "%: " + Math.min(p.seen, need) + " / " + need) + "</div>";
        }
        root.querySelector(".sg-ach").innerHTML = html;
    }

    function openGallery(charName) {
        if (!modOn()) return false;
        if (typeof charName === "string") {
            // opened for one character (double-tap in the game's Gallery): show all of their scenes
            view.char = charName;
            view.place = "";
            view.q = "";
            view.show = "all";
            view.shown = PAGE;
        }
        wrapAll();
        ensureStyle();
        closeGallery();
        checkAchievements(true);
        var cat = loadCatalog();
        var root = document.createElement("div");
        root.id = "tnSexGal";
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-label", "Sex scene gallery");
        root.style.setProperty("--tnsg-size", String(settings.size || 1));
        var places = [];
        if (cat) {
            var seenP = {};
            for (var i = 0; i < cat.scenes.length; i++) if (!seenP[cat.scenes[i].place]) { seenP[cat.scenes[i].place] = 1; places.push(cat.scenes[i].place); }
            places.sort();
        }
        var opts = '<option value="">Everywhere</option>';
        for (var j = 0; j < places.length; j++) opts += '<option value="' + esc(places[j]) + '"' + (view.place === places[j] ? " selected" : "") + ">" + esc(places[j]) + "</option>";
        root.innerHTML = ''
            + '<div class="sg-top">'
            + '<div class="sg-row"><h2>Sex Scene Gallery</h2>'
            + '<button type="button" data-sg="smaller" title="Smaller text">A-</button>'
            + '<button type="button" data-sg="bigger" title="Bigger text">A+</button>'
            + '<button type="button" data-sg="close">Close</button></div>'
            + '<div class="sg-bar"><div style="width:0"></div></div>'
            + '<div class="sg-count"></div>'
            + '<div class="sg-ach"></div>'
            + '<div class="sg-row">'
            + '<input type="search" data-sg="q" placeholder="Search characters, places, acts..." aria-label="Search" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(view.q) + '">'
            + '<select data-sg="char" aria-label="Character">' + charOptions(cat) + "</select>"
            + '<select data-sg="place" aria-label="Place">' + opts + "</select>"
            + '<select data-sg="show" aria-label="Show">'
            + '<option value="all"' + (view.show === "all" ? " selected" : "") + ">All scenes</option>"
            + '<option value="seen"' + (view.show === "seen" ? " selected" : "") + ">Seen</option>"
            + '<option value="unseen"' + (view.show === "unseen" ? " selected" : "") + ">Not seen yet</option>"
            + "</select></div>"
            + "</div>"
            + '<div class="sg-list"></div>';
        document.body.appendChild(root);
        renderTop(root);
        renderList(root);

        var timer = null;
        root.querySelector("[data-sg=q]").addEventListener("input", function (ev) {
            view.q = ev.target.value;
            view.reading = "";
            view.shown = PAGE;
            clearTimeout(timer);
            timer = setTimeout(function () { renderList(root); }, 200);
        });
        root.querySelector("[data-sg=place]").addEventListener("change", function (ev) { view.place = ev.target.value; view.shown = PAGE; renderList(root); });
        root.querySelector("[data-sg=char]").addEventListener("change", function (ev) {
            view.char = ev.target.value; view.shown = PAGE; renderList(root); root.querySelector(".sg-list").scrollTop = 0;
        });
        root.querySelector("[data-sg=show]").addEventListener("change", function (ev) { view.show = ev.target.value; view.shown = PAGE; renderList(root); });
        root.addEventListener("click", function (ev) {
            var t = ev.target.closest ? ev.target.closest("[data-sg]") : null;
            if (!t) return;
            var act = t.getAttribute("data-sg");
            if (act === "close") closeGallery();
            else if (act === "pickchar") {
                // a character button under the search box: their portrait and all their scenes
                view.char = t.getAttribute("data-name") || "";
                view.q = ""; view.shown = PAGE;
                var box = root.querySelector("[data-sg=q]");
                if (box) box.value = "";
                var sel2 = root.querySelector("[data-sg=char]");
                if (sel2) {
                    var has = false;
                    for (var k = 0; k < sel2.options.length; k++) if (sel2.options[k].value === view.char) has = true;
                    if (!has) sel2.innerHTML = charOptions(loadCatalog());
                    sel2.value = view.char;
                }
                renderList(root);
                root.querySelector(".sg-list").scrollTop = 0;
            }
            else if (act === "allchars") {
                view.char = ""; view.shown = PAGE;
                var sel = root.querySelector("[data-sg=char]");
                if (sel) sel.value = "";
                renderList(root);
            }
            else if (act === "read") {
                view.listY = root.querySelector(".sg-list").scrollTop;
                view.reading = t.getAttribute("data-id") || "";
                view.lived = false;
                renderList(root);
            }
            else if (act === "back") {
                view.reading = "";
                renderList(root);
                root.querySelector(".sg-list").scrollTop = view.listY || 0;
            }
            else if (act === "lived") { view.lived = !view.lived; renderList(root); }
            else if (act === "reread") renderList(root);
            else if (act === "more") { view.shown += PAGE; var y = root.querySelector(".sg-list").scrollTop; renderList(root); root.querySelector(".sg-list").scrollTop = y; }
            else if (act === "reveal") { view.revealed[t.getAttribute("data-id")] = true; var y2 = root.querySelector(".sg-list").scrollTop; renderList(root); root.querySelector(".sg-list").scrollTop = y2; }
            else if (act === "bigger" || act === "smaller") {
                var size = (settings.size || 1) + (act === "bigger" ? 0.1 : -0.1);
                settings.size = Math.max(0.8, Math.min(1.8, Math.round(size * 10) / 10));
                saveSettings();
                root.style.setProperty("--tnsg-size", String(settings.size));
            }
        });
        function backOrClose() {
            if (view.reading) { view.reading = ""; renderList(root); root.querySelector(".sg-list").scrollTop = view.listY || 0; }
            else closeGallery();
        }
        keyHandler = function (ev) { if (ev.key === "Escape") { ev.stopPropagation(); ev.preventDefault(); backOrClose(); } };
        backHandler = function (ev) { ev.stopImmediatePropagation(); ev.preventDefault(); backOrClose(); };
        document.addEventListener("keydown", keyHandler, true);
        document.addEventListener("backbutton", backHandler, true);
        return true;
    }

    // ------------------------------------------------------------------ the game's character Gallery
    // Its portraits are <div id="idx:Name" class="listBust artGallery" data-header="Display Name">
    // and open that character's art on pointerup (React). A capture listener on window sees the
    // tap first: it holds a single tap back for DOUBLE_TAP_MS, then hands it to the game
    // unchanged. A second tap on the same portrait in that time opens the Sex Gallery instead.
    var tap = null;   // { el, timer, type, button, id, x, y }
    function portraitFrom(target) {
        var el = target && target.closest ? target.closest(".listBust.artGallery") : null;
        if (!el || !el.id || el.id.indexOf("idx:") !== 0) return null;
        return el;
    }
    function replayTap(t) {
        try {
            var init = { bubbles: true, cancelable: true, composed: true, pointerId: t.id, pointerType: t.type, isPrimary: true,
                button: t.button, buttons: 0, clientX: t.x, clientY: t.y };
            var ev = typeof PointerEvent === "function" ? new PointerEvent("pointerup", init) : new MouseEvent("pointerup", init);
            if (typeof PointerEvent !== "function") { try { Object.defineProperty(ev, "pointerType", { value: t.type }); } catch (err) {} }
            ev.__tnSexGalleryReplay = true;
            if (t.el.isConnected) t.el.dispatchEvent(ev);
        } catch (err) { debug("could not pass the tap on: " + err); }
    }
    function onPortraitUp(ev) {
        if (ev.__tnSexGalleryReplay) return;
        if (!modOn() || !loadCatalog()) return;
        if (ev.pointerType === "mouse" && ev.button !== 0) return;
        var el = portraitFrom(ev.target);
        if (!el) return;
        ev.stopImmediatePropagation();
        ev.stopPropagation();
        if (tap && tap.el === el) {
            // second tap: this character's sex scenes
            clearTimeout(tap.timer);
            tap = null;
            var name = el.getAttribute("data-header") || el.id.slice(4).replace(/_/g, " ");
            debug("double-tap on " + name + " in the character gallery");
            setTimeout(function () { openGallery(name); }, 0);
            return;
        }
        if (tap) { clearTimeout(tap.timer); replayTap(tap); }
        var t = { el: el, type: ev.pointerType || "mouse", button: ev.button || 0, id: ev.pointerId || 1, x: ev.clientX, y: ev.clientY };
        t.timer = setTimeout(function () { if (tap === t) tap = null; replayTap(t); }, DOUBLE_TAP_MS);
        tap = t;
    }
    function onPortraitDblClick(ev) {
        // pointerup already handled it; keep the browser from also selecting text or zooming
        if (portraitFrom(ev.target) && modOn()) ev.preventDefault();
    }
    var galleryHooked = false;
    function hookCharacterGallery() {
        if (galleryHooked) return;
        window.addEventListener("pointerup", onPortraitUp, true);
        window.addEventListener("dblclick", onPortraitDblClick, true);
        galleryHooked = true;
    }

    // ------------------------------------------------------------------ menu buttons
    var BUTTON = {
        id: "sex-gallery",
        order: 30,
        title: "Every sex scene in the game, and the ones you’ve seen in this save.",
        label: function () {
            if (!inGame()) return "Sex Gallery";
            var p = progress();
            return "Sex Gallery <span style=\"opacity:.8;font-weight:normal\">(" + p.pct.toFixed(0) + "%)</span>";
        },
        onClick: function () { openGallery(); }
    };
    var buttonAdded = false;
    function addButton() {
        if (buttonAdded || !modOn()) return;
        if (window.tnInfo && typeof window.tnInfo.addButton === "function") {
            window.tnInfo.addButton(BUTTON);
            buttonAdded = true;
        } else if (!addButton.queued) {
            // the Wiki Browser owns the Info section and hasn't loaded yet: queue it
            window.tnInfo = window.tnInfo || {};
            (window.tnInfo.pending = window.tnInfo.pending || []).push(BUTTON);
            addButton.queued = true;
            buttonAdded = true;
        }
    }
    function refreshButton() {
        try { if (window.tnInfo && typeof window.tnInfo.refresh === "function") window.tnInfo.refresh(); } catch (err) {}
    }

    function menuHtml() {
        var p = progress();
        var html = "A gallery of every sex scene in the game, with a summary of each, that fills in as you play. " +
            "Open it from <b>Sex Gallery</b> on the main menu, or with the button below. " +
            "In the game's <b>Gallery</b>, double-tap (or double-click) a character's portrait to see just their scenes.\n\n" +
            (inGame() ? "This save: <b>" + p.seen + " of " + p.total + "</b> scenes (" + p.pct.toFixed(1) + "%)." : "Scenes in the list: <b>" + p.total + "</b>. Load a save to see its progress.") +
            "\n\nAchievement pop-ups: <b>" + (settings.toasts ? "On" : "Off") + "</b>" +
            "\nNew scene pop-ups: <b>" + (settings.newSceneToasts ? "On" : "Off") + "</b>" +
            "\nShow summaries of scenes you haven't seen: <b>" + (settings.spoilers ? "On" : "Off") + "</b>" +
            "\nUnlock scenes your save's flags show you played: <b>" + (settings.saveUnlocks ? "On" : "Off") + "</b>" +
            "\nUnlock shared counters (a flag a few scenes share unlocks all of them): <b>" + (settings.sharedUnlocks ? "On" : "Off") + "</b>" +
            (textPack() ? "\n\nFull scene text add-on: <b>" + textPack().count + " scenes</b>. Tap <b>Read scene</b> on an unlocked scene." +
                "\nRead scenes you haven't unlocked yet: <b>" + (settings.readLocked ? "On" : "Off") + "</b>"
                : "\n\nFull scene text: not installed (add " + TEXT_FILE + " to read whole scenes).");
        html += '<button type="button" data-mod-act="open">Open the gallery</button>';
        html += '<button type="button" data-mod-act="toasts">' + (settings.toasts ? "Turn off" : "Turn on") + " achievement pop-ups</button>";
        html += '<button type="button" data-mod-act="newtoasts">' + (settings.newSceneToasts ? "Turn off" : "Turn on") + " new scene pop-ups</button>";
        html += '<button type="button" data-mod-act="spoilers">' + (settings.spoilers ? "Hide" : "Show") + " unseen summaries</button>";
        html += '<button type="button" data-mod-act="saveunlocks">' + (settings.saveUnlocks ? "Turn off" : "Turn on") + " unlocking from save flags</button>";
        html += '<button type="button" data-mod-act="shared">' + (settings.sharedUnlocks ? "Turn off" : "Turn on") + " shared counters</button>";
        if (textPack()) html += '<button type="button" data-mod-act="readlocked">' + (settings.readLocked ? "Turn off" : "Turn on") + " reading locked scenes</button>";
        return html;
    }
    function onMenuAct(act) {
        act = String(act || "");
        if (act === "open") { setTimeout(openGallery, 0); return false; }
        if (act === "toasts") settings.toasts = !settings.toasts;
        else if (act === "newtoasts") settings.newSceneToasts = !settings.newSceneToasts;
        else if (act === "spoilers") settings.spoilers = !settings.spoilers;
        else if (act === "saveunlocks") settings.saveUnlocks = !settings.saveUnlocks;
        else if (act === "shared") settings.sharedUnlocks = !settings.sharedUnlocks;
        else if (act === "readlocked") settings.readLocked = !settings.readLocked;
        else return false;
        saveSettings();
        if (act === "saveunlocks" || act === "shared") {
            knownFlags = null;
            try { syncSaveUnlocks(false); checkAchievements(true); refreshButton(); } catch (err) {}
            try { window.dispatchEvent(new CustomEvent("tnSexGalleryUnlocks")); } catch (err) {}
        }
        return true;
    }
    var registered = false;
    function registerMenu() {
        if (registered) return;
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return;
        window.registerModMenu({
            id: MOD_ID,
            name: "Sex Scene Gallery",
            author: "Techy-Nest",
            description: "A gallery of every sex scene with summaries, and achievements for filling it.",
            supportsToggle: true,
            getHtml: menuHtml,
            onAct: onMenuAct,
            onEnabledChange: function (next) { if (!next) closeGallery(); return true; }
        });
        registered = true;
    }

    // ------------------------------------------------------------------ start
    window.TnSexGallery = {
        version: VERSION,
        achievements: ACHIEVEMENTS.slice(),
        open: function (charName) { return openGallery(typeof charName === "string" ? charName : undefined); },
        characters: function () { var cat = loadCatalog(); return cat ? cat.chars.slice() : []; },
        portrait: function (name) { var cat = loadCatalog(); var c = cat && cat.charByName[name]; return c ? portraitSrc(c.bust) : ""; },
        close: closeGallery,
        progress: function () { var p = progress(); return { seen: p.seen, total: p.total, pct: p.pct, fromSave: p.fromSave }; },
        // For other mods (the Flashback Visor): the scenes this save's flags show were played,
        // as { id: "own" | "shared" }, following the gallery's settings. Each scene in
        // window.TN_SEX_GALLERY_SCENES.scenes lists its own flags in .uf and shared counters in .us.
        saveUnlocks: function () { return readSaveUnlocks(); },
        // every scene that counts as seen in this save: { id: { count, fromSave } }
        unlocked: function () {
            var out = {}, seen = readSeen(), save = readSaveUnlocks(), id;
            for (id in seen) out[id] = { count: seen[id], fromSave: "" };
            for (id in save) if (!out[id]) out[id] = { count: 0, fromSave: save[id] };
            return out;
        },
        scene: function (id) { var cat = loadCatalog(); return cat && cat.byId[id] || null; },
        // Full scene text add-on (TN_SexGalleryText_v3.0.js): is it there for this scene, and the
        // scene written out for the current Steele as HTML ({ html, unknown, known } or null).
        hasFullText: function (id) { return hasFullText(String(id || "")); },
        fullText: function (id) { return sceneHtml(String(id || "")); },
        // open the gallery straight on one scene's full text
        read: function (id) { if (!hasFullText(id)) return false; view.listY = 0; openGallery(); view.reading = String(id); view.lived = false; var r = document.getElementById("tnSexGal"); if (r) renderList(r); return true; },
        search: function (text) { var cat = loadCatalog(); if (!cat) return []; var old = view.q; view.q = String(text || ""); var r = filtered(cat, readSeen(), readSaveUnlocks()).map(function (x) { return x.id; }); var c = matchingChars(cat).map(function (x) { return x.name; }); view.q = old; return { scenes: r, characters: c }; },
        findScene: function (text) { return findScene(String(text || "")); },
        status: function () {
            var cat = loadCatalog();
            return {
                version: VERSION, enabled: modOn(), scenes: cat ? cat.scenes.length : 0, game: cat ? cat.data.game : "",
                mainMenu: !!(typeof ui !== "undefined" && ui && ui.generateMainMenuButtons && ui.generateMainMenuButtons.__tnSexGallery),
                characters: cat ? cat.chars.length : 0, galleryDoubleTap: galleryHooked,
                watching: { output: !!(window.output && window.output.__tnSexGallery), clearOutput: !!(window.clearOutput && window.clearOutput.__tnSexGallery), orgasm: orgasmWrapped },
                counts: stats, lastMatch: lastMatch, progress: this.progress(),
                saveUnlocks: { on: settings.saveUnlocks, shared: settings.sharedUnlocks, scenesWithFlags: cat ? cat.flagged.length : 0, unlockedNow: Object.keys(readSaveUnlocks()).length },
                fullText: textPack() ? { scenes: textPack().count, game: textPack().game, chunks: textPack().chunks.length, unpacked: textStats.chunks, unpackMs: textStats.ms, read: textStats.scenes, failed: textStats.failed, readLocked: settings.readLocked } : null
            };
        },
        // for testing: mark a scene by id as seen in this save
        markSeen: function (id) {
            var cat = loadCatalog();
            if (!cat || !cat.byId[id] || !inGame()) return false;
            var seen = readSeen();
            seen[id] = (seen[id] || 0) + 1;
            writeSeen(seen);
            checkAchievements(false);
            refreshButton();
            return true;
        }
    };

    var ticks = 0;
    function tick() {
        ticks++;
        try { wrapAll(); } catch (err) {}
        try { addButton(); } catch (err) {}
        try { registerMenu(); } catch (err) {}
        try { hookCharacterGallery(); } catch (err) {}
        // a save was loaded: unlock what its flags show (quietly) and catch up on achievements
        try { if (modOn() && inGame() && knownFlags !== flags && loadCatalog()) { syncSaveUnlocks(false); checkAchievements(true); refreshButton(); } } catch (err) {}
        // keep checking: the game can replace output/clearOutput while it starts up
        setTimeout(tick, ticks < 60 ? 500 : 3000);
    }
    tick();
})();
