/*
 * TN_SceneText_v2.9.js - "Scene Text Saver" (NestPatcher runtime mod, TiTS 0.9.168), Modv2.9
 * Author: Neston
 *
 * Records the FULL text of every sex scene and every ground fight Steele goes through, page by
 * page (bold and italics included), and exports it:
 *   - one scene as an .rtf file (bold and italics come through), or as plain text to the clipboard
 *   - every scene of the current save as a .zip: one folder per character, one .rtf per scene,
 *     each named after the button that led into it ("Azra/Shower Sex.rtf", "Shekka/Missionary.rtf").
 *     Fights are "Victory.rtf" / "Defeat.rtf" in the enemy's folder (newest of each); sex that
 *     follows a fight is its own file (the button you picked, or "Victory Sex" / "Defeat Sex").
 *   - On Linux, each character folder gets their nude portrait (the artist you picked in the
 *     game's Gallery) as its folder image, through a .directory file (KDE Dolphin and other file
 *     managers that read .directory files; GNOME Files ignores them).
 * The buttons live in the Flashback Visor (TN_FlashbackVisor_v2.9.mod): Copy Text / Save Text on a
 * memory, and Save All in the visor menu. Other mods can call window.tnSceneText.
 *
 * Where the text lives: the device's own browser storage (IndexedDB), kept per save (a
 * TN_SCENETEXT_ID flag tells saves apart); the same scene seen again replaces its older copy.
 * A copy also rides inside the save itself: flags.TN_SCENETEXT_PACK holds every scene compressed
 * (deflate, like a zip) as a Base64 string, so moving a save to another device (slots, Save To
 * File, cloud) brings its scenes along; they're added back when the save is loaded there. The
 * same code can be copied out of the visor (Scene Backup) and pasted in on another device.
 * Recording starts when this mod is installed.
 *
 * How a scene is found: every button press is remembered with its label, every page of text is
 * kept until the game returns to the main menu, and the pages around each orgasm become a scene.
 * The scene starts at the page the last real button (not Next/Continue) led to and ends when a
 * page offers a full menu again (4+ buttons, like a character's talk menu; that page isn't
 * included) or the game goes back to the main menu.
 * Works on every build: Android (the game's own save window), Windows, Linux and Mac (download).
 */
(function () {
    "use strict";
    if (window.__tnSceneTextInstalled) return;
    window.__tnSceneTextInstalled = true;

    var MOD_ID = "tn-scene-text";
    var S = {};
    window.tnSceneText = S;
    var LOG_MAX = 120;          // pages kept while waiting for the main menu
    var PAGE_MAX = 60000;       // characters per page (a page is rarely over 10k)
    var CONT = /^(next|continue|next\s*>+|>+|more|\.\.\.|keep going|go on|finish|onward|proceed)$/i;

    /* ---------- Mod menu switch ---------- */
    function on() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }
    S.on = on;
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Scene Text Saver",
            author: "Neston",
            description: "Keeps the full text of every sex scene and fight (with bold and italics) on this device, so the Flashback Visor can copy it or save it as .rtf files, or a .zip with a folder per character.",
            supportsToggle: true
        });
        return true;
    }
    if (!register()) {
        var regTries = 0;
        var regTimer = setInterval(function () { if (register() || ++regTries >= 150) clearInterval(regTimer); }, 200);
    }

    /* ---------- Small helpers ---------- */
    function inGame() { return typeof flags !== "undefined" && flags && typeof pc !== "undefined" && pc && typeof pc.short === "string"; }
    function now() { try { return Number(GetGameTimestamp()) || 0; } catch (err) { return 0; } }
    function dayOf(t) { return Math.floor((Number(t) || 0) / 1440); }
    function planet() { try { var p = getPlanetName(); return p ? String(p) : ""; } catch (err) { return ""; } }
    function strip(html) { return String(html || "").replace(/<[^>]*>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim(); }
    function nice(name) {
        var n = String(name || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        if (!n) return "";
        if (!/[a-z]/.test(n)) n = n.toLowerCase();
        return n.replace(/(^|[\s\-])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
    }
    function uiState() { try { return (typeof ui !== "undefined" && ui && ui.state) ? ui.state : null; } catch (err) { return null; } }
    function pageHtml() { var s = uiState(); return s && typeof s.preText === "string" ? s.preText : ""; }
    function pageName() { var s = uiState(); return s ? String(s.nameShown || "").replace(/\s+/g, " ").trim() : ""; }
    function liveButtons() {
        var s = uiState(), n = 0;
        try { (s && s.buttons || []).forEach(function (b) { if (b && !b.disabled) n++; }); } catch (err) {}
        return n;
    }
    function paused() { var v = window.tnFbv; return !!(v && (v.busy || v.flash)); }
    function recording() { return on() && inGame() && !paused(); }
    function pcName() { try { return String(pc.short || "Steele"); } catch (err) { return "Steele"; } }
    function saveId() {
        if (!inGame()) return "";
        if (!flags.TN_SCENETEXT_ID) flags.TN_SCENETEXT_ID = "s" + Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36);
        return String(flags.TN_SCENETEXT_ID);
    }
    function marks(from, to) {
        try { for (var k in from) if (Object.prototype.hasOwnProperty.call(from, k) && k.indexOf("__tn") === 0) to[k] = from[k]; } catch (err) {}
        to.__tnSceneText = true;
        return to;
    }

    /* ---------- Storage (IndexedDB, falls back to memory) ---------- */
    var DB_NAME = "tnSceneText", STORE = "scenes", dbp = null, mem = {};
    function db() {
        if (dbp) return dbp;
        dbp = new Promise(function (res) {
            try {
                var rq = window.indexedDB.open(DB_NAME, 1);
                rq.onupgradeneeded = function () {
                    var d = rq.result;
                    if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "id" }).createIndex("save", "save", { unique: false });
                };
                rq.onsuccess = function () { res(rq.result); };
                rq.onerror = function () { res(null); };
            } catch (err) { res(null); }
        });
        return dbp;
    }
    function put(rec) {
        mem[rec.id] = rec;
        return db().then(function (d) {
            if (!d) return;
            return new Promise(function (res) {
                try { var tx = d.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(rec); tx.oncomplete = res; tx.onerror = res; tx.onabort = res; }
                catch (err) { res(); }
            });
        });
    }
    S.all = function (sid) {
        sid = sid || saveId();
        return db().then(function (d) {
            var fromMem = Object.keys(mem).map(function (k) { return mem[k]; }).filter(function (r) { return r.save === sid; });
            if (!d) return fromMem;
            return new Promise(function (res) {
                try {
                    var rq = d.transaction(STORE, "readonly").objectStore(STORE).index("save").getAll(sid);
                    rq.onsuccess = function () {
                        var byId = {};
                        (rq.result || []).concat(fromMem).forEach(function (r) { if (!byId[r.id] || (r.upd || 0) >= (byId[r.id].upd || 0)) byId[r.id] = r; });
                        res(Object.keys(byId).map(function (k) { return byId[k]; }));
                    };
                    rq.onerror = function () { res(fromMem); };
                } catch (err) { res(fromMem); }
            });
        });
    };

    /* ---------- Watching buttons, pages, orgasms and fights ---------- */
    var pending = "";                  // label of the button just pressed
    var log = [];                      // finished pages since the last main menu
    var cur = newPage("");
    var span = { fight: null };
    var lastBusts = [];
    function newPage(btn) { return { btn: btn, html: "", name: "", busts: [], who: [], org: false, btns: 0 }; }
    function addWho(list, c) {
        try {
            if (!c || (typeof pc !== "undefined" && c === pc)) return;
            var n = nice(typeof c === "string" ? c : c.short);
            if (!n || /dummy|placeholder|^you$|^steele$/i.test(n) || n === nice(pcName())) return;
            if (list.indexOf(n) < 0 && list.length < 5) list.push(n);
        } catch (err) {}
    }
    function closePage() {
        cur.html = pageHtml().slice(0, PAGE_MAX);
        cur.name = pageName();
        cur.btns = liveButtons();
        if (!cur.busts.length) cur.busts = lastBusts.slice();
        if (strip(cur.html).length || cur.org) log.push(cur);
        if (log.length > LOG_MAX) {
            var cut = log.length - LOG_MAX;
            log.splice(0, cut);
            if (span.fight) { span.fight.start -= cut; span.fight.result -= cut; if (span.fight.start < 0) span.fight = null; }
        }
    }
    function onClear() {
        if (!recording()) { pending = ""; return; }
        closePage();
        cur = newPage(pending);
        pending = "";
    }
    function wrapFn(label, f) {
        if (typeof f !== "function" || f.__tnSceneBtn) return f;
        var w = function () { try { pending = String(label || ""); } catch (err) {} return f.apply(this, arguments); };
        w.__tnSceneBtn = true;
        return w;
    }
    function noteOrgasm(who) {
        if (!recording()) return;
        cur.org = true;
        addWho(cur.who, who);
    }
    function fightStart() {
        var CM = window.CombatManager, cc = CM && CM.combatContainer;
        if (!cc || !recording() || window.__tnDaneSpar) return;
        var fr = cc.friendlies || [], hs = cc.hostiles || [];
        if (!hs.length || fr.indexOf(pc) < 0 || fr.some(function (f) { return f && f.isShip; })) return;
        // Pages before this fight (an earlier scene) are finished: save them first.
        if (log.length) { var keep = cur; flush(true); cur = keep; }
        var who = [];
        hs.forEach(function (e) { addWho(who, e); });
        var fight = { start: log.length, result: -1, win: null, who: who.length ? who : ["Unknown Enemy"] };
        span.fight = fight;
        var vf = cc.victoryFunction, lf = cc.lossFunction, done = false;
        if (typeof vf === "function") cc.victoryFunction = function () { if (!done) { done = true; fight.win = true; fight.result = log.length + 1; } return vf.apply(this, arguments); };
        if (typeof lf === "function") cc.lossFunction = function () { if (!done) { done = true; fight.win = false; fight.result = log.length + 1; } return lf.apply(this, arguments); };
    }
    function onMainMenu() {
        if (!recording()) { log = []; span.fight = null; cur = newPage(""); return; }
        flush(false);
    }

    /* ---------- Cutting the page log into scenes ---------- */
    function sceneTitle(p) { return String(p && p.btn || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(); }
    function isCont(p) { var t = sceneTitle(p); return !t || CONT.test(t); }
    function flush(beforeFight) {
        try {
            var pages = log.slice();
            if (!beforeFight) { var c = cur; closePage(); pages = log.slice(); cur = c; }
            var fight = span.fight;
            log = []; span.fight = null; if (!beforeFight) cur = newPage("");
            if (!pages.length || !inGame()) return;
            var sid = saveId(), scenes = [], lastEnd = -1, low = 0;
            var resStart = fight && fight.win !== null && fight.result >= 0 ? Math.min(fight.result, pages.length - 1) : -1;
            for (var o = 0; o < pages.length; o++) {
                if (!pages[o].org) continue;
                if (o <= lastEnd) { pages[o].who.forEach(function (n) { addWho(scenes[scenes.length - 1].who, n); }); continue; }
                low = lastEnd + 1;
                if (resStart >= 0 && o >= resStart) low = Math.max(low, resStart);
                var s = o;
                while (s > low && isCont(pages[s])) s--;
                var e = o;
                while (e + 1 < pages.length && pages[e].btns <= 3 && pages[e + 1].btns <= 3) e++;
                var title = sceneTitle(pages[s]);
                if (isCont(pages[s])) title = resStart >= 0 && s >= resStart ? (fight.win ? "Victory Sex" : "Defeat Sex") : "";
                var who = [];
                for (var i = s; i <= e; i++) pages[i].who.forEach(function (n) { addWho(who, n); });
                scenes.push({ s: s, e: e, title: title, who: who });
                lastEnd = e;
            }
            var stamp = now(), loc = planet();
            if (fight && fight.win !== null) {
                var fEnd = pages.length - 1;
                scenes.forEach(function (sc) { if (sc.s > fight.start && sc.s - 1 < fEnd) fEnd = sc.s - 1; });
                var fPages = pages.slice(Math.max(0, fight.start), fEnd + 1);
                if (fPages.length) store({ save: sid, kind: "fight", chars: fight.who, title: fight.win ? "Victory" : "Defeat", pages: fPages, d: stamp, loc: loc, gid: "" });
            }
            scenes.forEach(function (sc) {
                var pg = pages.slice(sc.s, sc.e + 1);
                var full = pg.map(function (p) { return p.html; }).join("\n");
                var g = null;
                try { if (window.TnSexGallery && typeof window.TnSexGallery.findScene === "function") g = window.TnSexGallery.findScene(full); } catch (err) {}
                var who = [];
                if (g && Array.isArray(g.chars)) g.chars.forEach(function (n) { addWho(who, n); });
                if (g && g.npc) addWho(who, g.npc);
                sc.who.forEach(function (n) { addWho(who, n); });
                if (!who.length) pg.forEach(function (p) { if (p.name) addWho(who, p.name.replace(/\s*(feeding|\.\.\.).*$/i, "")); });
                if (!who.length && fight) fight.who.forEach(function (n) { addWho(who, n); });
                var title = sc.title || (g && g.title) || pg[0].name || "Sex Scene";
                if (!who.length) who = [pcName() + " (Solo)"];
                store({ save: sid, kind: "sex", chars: who, title: title, pages: pg, d: stamp, loc: loc, gid: g ? String(g.id) : "" });
            });
        } catch (err) { console.warn("[TN] Scene Text Saver: flush failed", err); }
    }
    function store(o) {
        var chars = o.chars.slice().sort();
        var busts = [];
        o.pages.forEach(function (p) { (p.busts || []).forEach(function (b) { if (busts.indexOf(b) < 0) busts.push(b); }); });
        var rec = {
            id: o.save + "|" + o.kind + "|" + chars.join("+") + "|" + o.title + "|" + (o.gid || ""),
            save: o.save, pc: pcName(), kind: o.kind, chars: chars, title: o.title,
            pages: o.pages.map(function (p) { return p.html; }), busts: busts.slice(0, 8),
            d: o.d, loc: o.loc, gid: o.gid || "", upd: Date.now()
        };
        S.last = rec;
        put(rec).then(schedulePack);
        return rec;
    }

    /* ---------- Hooks (each set once; other TN mods' markers are kept) ---------- */
    var hooked = {};
    function wrapButtons() {
        if (hooked.btn) return true;
        if (typeof ui === "undefined" || !ui || typeof ui.addButton !== "function" || typeof window.addButton !== "function") return false;
        var uiAdd = ui.addButton;
        ui.addButton = marks(uiAdd, function (i, t, f) { var a = Array.prototype.slice.call(arguments); a[2] = wrapFn(t, f); return uiAdd.apply(this, a); });
        var winAdd = window.addButton;
        window.addButton = marks(winAdd, function (i, t, f) { var a = Array.prototype.slice.call(arguments); a[2] = wrapFn(t, f); return winAdd.apply(this, a); });
        if (typeof ui.addButtonObj === "function") {
            var objAdd = ui.addButtonObj;
            ui.addButtonObj = marks(objAdd, function (o) {
                try { if (o && typeof o.f === "function") o.f = wrapFn(o.text, o.f); if (o && typeof o.func === "function") o.func = wrapFn(o.title || o.text, o.func); } catch (err) {}
                return objAdd.apply(this, arguments);
            });
        }
        hooked.btn = true;
        return true;
    }
    function wrapClear() {
        if (hooked.clear) return true;
        var c = window.clearOutput;
        if (typeof c !== "function") return false;
        window.clearOutput = marks(c, function () { try { onClear(); } catch (err) {} return c.apply(this, arguments); });
        hooked.clear = true;
        return true;
    }
    function wrapBust() {
        if (hooked.bust) return true;
        var b = window.showBust;
        if (typeof b !== "function") return false;
        window.showBust = marks(b, function () {
            try {
                if (!paused()) {
                    var a = Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments);
                    lastBusts = a.filter(function (x) { return typeof x === "string" && x; }).slice(0, 4);
                    cur.busts = lastBusts.slice();
                }
            } catch (err) {}
            return b.apply(this, arguments);
        });
        hooked.bust = true;
        return true;
    }
    function owners(obj, name) {
        var proto = Object.getPrototypeOf(obj), out = [];
        while (proto && proto !== Object.prototype) {
            if (Object.prototype.hasOwnProperty.call(proto, name) && typeof proto[name] === "function") out.push(proto);
            proto = Object.getPrototypeOf(proto);
        }
        return out;
    }
    function wrapOrgasm(owner) {
        if (!owner || typeof owner.orgasm !== "function" || owner.orgasm.__tnSceneText) return;
        var orig = owner.orgasm;
        var w = marks(orig, function () { try { noteOrgasm(this); } catch (err) {} return orig.apply(this, arguments); });
        try { owner.orgasm = w; } catch (err) { try { Object.defineProperty(owner, "orgasm", { value: w, writable: true, configurable: true }); } catch (err2) {} }
    }
    function wrapCreature() {
        if (hooked.creature) return true;
        if (typeof pc === "undefined" || !pc) return false;
        var os = owners(pc, "orgasm");
        if (!os.length) return false;
        os.forEach(wrapOrgasm);
        hooked.creature = true;
        return true;
    }
    function wrapChars() {
        try {
            if (!hooked.creature || hooked.chars || typeof chars === "undefined" || !chars) return;
            for (var id in chars) { var c = chars[id]; if (c) owners(c, "orgasm").forEach(wrapOrgasm); }
            hooked.chars = true;
        } catch (err) {}
    }
    function wrapCombat() {
        if (hooked.combat) return true;
        var CM = window.CombatManager;
        if (!CM || typeof CM.beginCombat !== "function") return false;
        var orig = CM.beginCombat;
        CM.beginCombat = marks(orig, function () { try { fightStart(); } catch (err) { console.warn("[TN] Scene Text Saver: fight watch failed", err); } return orig.apply(this, arguments); });
        hooked.combat = true;
        return true;
    }
    function wrapMainMenu() {
        if (hooked.menu) return true;
        var m = window.mainGameMenu;
        if (typeof m !== "function") return false;
        window.mainGameMenu = marks(m, function () { try { onMainMenu(); } catch (err) {} return m.apply(this, arguments); });
        hooked.menu = true;
        return true;
    }
    /* ---------- Copy inside the save (moves with the save to other devices) ----------
       flags.TN_SCENETEXT_PACK = "d:" + Base64 of the scenes, compressed the way a zip is
       (deflate), or "j:" + Base64 of plain JSON where the browser can't compress. The game's
       own save keeps it like any other flag, so Save To File / slots / other devices carry it.
       When a save with a pack is loaded on a device that's missing some of its scenes, they're
       added back to that device's storage. Newest scenes win if the pack gets too big. */
    var PACK_MAX = 8 * 1024 * 1024;      // characters of Base64 kept in the save
    function b64(bytes) {
        var out = "", CH = 0x8000;
        for (var i = 0; i < bytes.length; i += CH) out += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
        return btoa(out);
    }
    function unb64(str) {
        var bin = atob(str), a = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
        return a;
    }
    function streamBytes(bytes, Kind, mode) {
        var cs = new Kind(mode);
        var w = cs.writable.getWriter(); w.write(bytes); w.close();
        return new Response(cs.readable).arrayBuffer().then(function (b) { return new Uint8Array(b); });
    }
    function canZip() { return typeof CompressionStream === "function" && typeof DecompressionStream === "function" && typeof Response === "function"; }
    S.encode = function (recs) {
        var bytes = utf8(JSON.stringify({ v: 1, r: recs }));
        if (!canZip()) return Promise.resolve("j:" + b64(bytes));
        return streamBytes(bytes, CompressionStream, "deflate-raw").then(function (z) { return "d:" + b64(z); }, function () { return "j:" + b64(bytes); });
    };
    S.decode = function (code) {
        code = String(code || "").replace(/\s+/g, "");
        var kind = code.slice(0, 2), body = code.slice(2);
        var bytes;
        try { bytes = unb64(body); } catch (err) { return Promise.reject(new Error("not a scene backup code")); }
        var p = kind === "d:" ? (canZip() ? streamBytes(bytes, DecompressionStream, "deflate-raw") : Promise.reject(new Error("this device can't unpack compressed scenes")))
            : kind === "j:" ? Promise.resolve(bytes) : Promise.reject(new Error("not a scene backup code"));
        return p.then(function (b) {
            var txt = typeof TextDecoder !== "undefined" ? new TextDecoder().decode(b) : decodeURIComponent(escape(String.fromCharCode.apply(null, b)));
            var o = JSON.parse(txt);
            if (!o || !Array.isArray(o.r)) throw new Error("not a scene backup code");
            return o.r;
        });
    };
    var packTimer = false, packing = null;
    function schedulePack() {
        if (packTimer) return;
        packTimer = true;
        setTimeout(function () { packTimer = false; S.pack(); }, 0);
    }
    S.pack = function () {
        if (!inGame()) return Promise.resolve(null);
        var sid = saveId(), f = flags;
        packing = S.all(sid).then(function (list) {
            list.sort(function (a, b) { return (b.upd || 0) - (a.upd || 0); });
            function tryPack(n) {
                return S.encode(list.slice(0, n)).then(function (code) {
                    if (code.length > PACK_MAX && n > 1) return tryPack(Math.floor(n * 0.8));
                    return { code: code, n: n };
                });
            }
            return list.length ? tryPack(list.length) : { code: "", n: 0 };
        }).then(function (res) {
            // Only write if the same save is still loaded.
            if (inGame() && flags === f && String(flags.TN_SCENETEXT_ID) === sid) {
                if (res.code) { flags.TN_SCENETEXT_PACK = res.code; flags.TN_SCENETEXT_PACKN = res.n; }
                importedCode = res.code;
            }
            return res;
        }).catch(function (err) { console.warn("[TN] Scene Text Saver: pack failed", err); return null; });
        return packing;
    };
    // Adds scenes from a backup code (the save's own, or one pasted in) to this device.
    S.importCode = function (code, sid) {
        sid = sid || saveId();
        return S.decode(code).then(function (recs) {
            return S.all(sid).then(function (have) {
                var byId = {};
                have.forEach(function (r) { byId[r.id] = r; });
                var add = recs.filter(function (r) { return r && typeof r.id === "string" && r.id.indexOf("|") > 0 && Array.isArray(r.pages); }).map(function (r) {
                    var c = {}; for (var k in r) c[k] = r[k];
                    c.save = sid; c.id = sid + r.id.slice(r.id.indexOf("|"));
                    return c;
                }).filter(function (r) { return !byId[r.id] || (r.upd || 0) > (byId[r.id].upd || 0); });
                return Promise.all(add.map(put)).then(function () { return add.length; });
            });
        });
    };
    var importedCode = null, importing = false;
    function checkImport() {
        if (!inGame() || importing) return;
        var code = flags.TN_SCENETEXT_PACK;
        if (!code || code === importedCode) return;
        importing = true;
        var sid = saveId();
        S.importCode(code, sid).then(function (n) {
            importedCode = code;
            importing = false;
            if (n) console.log("[TN] Scene Text Saver: " + n + " scenes came back from this save.");
        }, function (err) { importedCode = code; importing = false; console.warn("[TN] Scene Text Saver: couldn't read the save's scenes", err); });
    }
    // A dark box to paste a backup code into (for moving scenes without moving the save).
    S.pasteBox = function (done) {
        try {
            var old = document.getElementById("tnScenePasteBox"); if (old) old.remove();
            var wrap = document.createElement("div");
            wrap.id = "tnScenePasteBox";
            wrap.style.cssText = "position:fixed;left:5%;top:8%;width:90%;height:80%;z-index:99999;background:var(--backgroundColor,#3D5174);border:1px solid var(--paleColor,#53677B);border-radius:10px;padding:10px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;color:#eee;font-size:15px;";
            var tip = document.createElement("div");
            tip.textContent = "Paste a scene backup code (it starts with d: or j:), then tap Add Scenes.";
            var ta = document.createElement("textarea");
            ta.style.cssText = "flex:1;width:100%;background:var(--foregroundColorB,#2C3649);color:var(--textColor,#fff);font-size:13px;border:1px solid var(--paleColor,#53677B);border-radius:6px;padding:8px;box-sizing:border-box;";
            var row = document.createElement("div"); row.style.cssText = "display:flex;gap:8px;";
            function mk(t, f) { var b = document.createElement("button"); b.textContent = t; b.style.cssText = "flex:1;padding:10px;font-size:16px;border-radius:8px;background:var(--foregroundColorA,#333E52);color:var(--textColor,#fff);border:1px solid var(--paleColor,#53677B);"; b.onclick = f; row.appendChild(b); }
            mk("Add Scenes", function () {
                var code = ta.value; wrap.remove();
                S.importCode(code).then(function (n) { S.pack(); done(n, null); }, function (err) { done(0, err); });
            });
            mk("Cancel", function () { wrap.remove(); done(-1, null); });
            wrap.appendChild(tip); wrap.appendChild(ta); wrap.appendChild(row); document.body.appendChild(wrap);
            ta.focus();
            return true;
        } catch (err) { return false; }
    };
    S.packInfo = function () {
        var code = inGame() ? String(flags.TN_SCENETEXT_PACK || "") : "";
        return { code: code, scenes: inGame() ? Number(flags.TN_SCENETEXT_PACKN) || 0 : 0, kb: Math.round(code.length / 1024) };
    };

    var ticks = 0;
    (function tick() {
        ticks++;
        try { wrapButtons(); wrapClear(); wrapBust(); wrapCreature(); wrapChars(); wrapCombat(); wrapMainMenu(); } catch (err) {}
        try { checkImport(); } catch (err) {}
        setTimeout(tick, ticks < 60 ? 500 : 3000);
    })();
    S.put = put;
    S.status = function () { return { hooks: JSON.parse(JSON.stringify(hooked)), pages: log.length, fight: !!span.fight, save: inGame() ? saveId() : "" }; };
    S.flushNow = function () { flush(false); };

    /* ---------- Text formats ---------- */
    var ENT = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: "\u00a0", rsquo: "\u2019", lsquo: "\u2018", rdquo: "\u201d", ldquo: "\u201c", mdash: "\u2014", ndash: "\u2013", hellip: "\u2026" };
    function decode(t) {
        return String(t).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function (m, e) {
            if (e.charAt(0) === "#") { var n = e.charAt(1).toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); try { return String.fromCodePoint(n); } catch (err) { return m; } }
            return Object.prototype.hasOwnProperty.call(ENT, e.toLowerCase()) ? ENT[e.toLowerCase()] : m;
        });
    }
    function plain(html) {
        return decode(String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li)>/gi, "\n").replace(/<[^>]*>/g, ""))
            .replace(/\u00a0/g, " ").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    }
    function rtfEsc(text) {
        var out = "";
        for (var i = 0; i < text.length; i++) {
            var ch = text.charAt(i), code = text.charCodeAt(i);
            if (ch === "\\" || ch === "{" || ch === "}") out += "\\" + ch;
            else if (ch === "\n") out += "\\par\n";
            else if (ch === "\t") out += "\\tab ";
            else if (code > 126) out += "\\u" + (code > 32767 ? code - 65536 : code) + "?";
            else if (code >= 32) out += ch;
        }
        return out;
    }
    function htmlToRtf(html) {
        var out = "", stack = [], re = /<\s*(\/?)\s*([a-z0-9]+)[^>]*>|([^<]+)|(<)/gi, m;
        var MAP = { b: "\\b ", strong: "\\b ", i: "\\i ", em: "\\i ", u: "\\ul " };
        html = String(html || "").replace(/\r/g, "");
        while ((m = re.exec(html))) {
            if (m[3] !== undefined || m[4] !== undefined) { out += rtfEsc(decode(m[3] !== undefined ? m[3] : m[4])); continue; }
            var close = m[1] === "/", tag = m[2].toLowerCase();
            if (MAP[tag]) {
                if (!close) { out += "{" + MAP[tag]; stack.push(tag); }
                else { var at = stack.lastIndexOf(tag); if (at >= 0) { while (stack.length > at) { stack.pop(); out += "}"; } } }
            } else if (tag === "br") out += "\\line\n";
            else if ((tag === "p" || tag === "div" || tag === "li") && close) out += "\\par\n";
        }
        while (stack.length) { stack.pop(); out += "}"; }
        return out;
    }
    function header(rec) {
        var lines = [];
        lines.push((rec.kind === "fight" ? "Fight: " : "With: ") + rec.chars.join(", "));
        lines.push("Day " + dayOf(rec.d) + (rec.loc ? ", " + rec.loc : "") + (rec.pc ? " \u2014 " + rec.pc : ""));
        return lines;
    }
    S.toRtf = function (rec) {
        var body = (rec.pages || []).map(htmlToRtf).join("\\par\n{\\qc ~\\par}\n");
        return "{\\rtf1\\ansi\\ansicpg1252\\deff0\\uc1{\\fonttbl{\\f0\\froman Georgia;}}\n\\viewkind4\\f0\\fs24\\sa120\n" +
            "{\\fs32\\b " + rtfEsc(rec.title) + "\\par}\n{\\i " + rtfEsc(header(rec).join("\n")) + "\\par}\n\\par\n" + body + "\n}";
    };
    S.toText = function (rec) {
        return rec.title + "\n" + header(rec).join("\n") + "\n\n" + (rec.pages || []).map(plain).join("\n\n~\n\n");
    };

    /* ---------- Zip (stored, no compression; UTF-8 names) ---------- */
    var CRC = null;
    function crc32(bytes) {
        if (!CRC) { CRC = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
        var crc = 0xFFFFFFFF;
        for (var i = 0; i < bytes.length; i++) crc = CRC[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }
    function utf8(s) {
        if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(s);
        var b = unescape(encodeURIComponent(s)), a = new Uint8Array(b.length);
        for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
        return a;
    }
    function makeZip(files) {
        var parts = [], central = [], offset = 0, d = new Date();
        var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
        var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
        files.forEach(function (f) {
            var name = utf8(f.name), data = f.dir ? new Uint8Array(0) : (typeof f.data === "string" ? utf8(f.data) : f.data);
            var crc = crc32(data), lh = new DataView(new ArrayBuffer(30));
            lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
            lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true);
            lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
            parts.push(new Uint8Array(lh.buffer), name, data);
            var ch = new DataView(new ArrayBuffer(46));
            ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 0x031E, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
            ch.setUint16(10, 0, true); ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true);
            ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true);
            ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true);
            ch.setUint32(38, f.dir ? ((0x41ED << 16) | 0x10) >>> 0 : (0x81A4 << 16) >>> 0, true); ch.setUint32(42, offset, true);
            central.push(new Uint8Array(ch.buffer), name);
            offset += 30 + name.length + data.length;
        });
        var size = 0;
        central.forEach(function (c) { size += c.length; });
        var end = new DataView(new ArrayBuffer(22));
        end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
        end.setUint32(12, size, true); end.setUint32(16, offset, true);
        return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: "application/zip" });
    }
    S.makeZip = makeZip; S.crc32 = crc32;

    /* ---------- Portraits for Linux folder images ---------- */
    var gameModules = {};
    function gameModule(id) {
        if (Object.prototype.hasOwnProperty.call(gameModules, id)) return gameModules[id];
        var mod = null;
        try {
            var chunks = window.webpackChunktits_html || self.webpackChunktits_html;
            if (chunks && typeof chunks.push === "function") {
                var req = null;
                chunks.push([["tn-scene-text-" + id + "-" + Date.now()], {}, function (r) { req = r; }]);
                if (typeof req === "function") mod = req(id);
            }
        } catch (err) { mod = null; }
        if (mod) gameModules[id] = mod;
        return mod;
    }
    function fixPath(p) { p = String(p || "").replace(/\\/g, "/"); return !p || /^(\.\/|\/|data:|https?:|blob:|file:)/i.test(p) ? p : "./" + p; }
    function bustSrc(bust) {
        // Same lookup the game uses: a custom portrait first, then the artist you chose in the Gallery.
        var low = String(bust).toLowerCase();
        try { if (flags.artistOverrides && flags.artistOverrides[low] === "custom" && flags.pathOverrides && flags.pathOverrides[low] && flags.pathOverrides[low].x1) return flags.pathOverrides[low].x1; } catch (err) {}
        try { var m = gameModule(94083); if (m && typeof m.rs === "function") { var e = m.rs(bust); if (e && e.paths && e.paths.x1) return fixPath(e.paths.x1); } } catch (err) {}
        try {
            var list = gameModule(37127); list = list && (Array.isArray(list) ? list : list.default);
            if (Array.isArray(list)) for (var i = 0; i < list.length; i++) if (list[i] && list[i].name === bust && list[i].paths && list[i].paths.x1) return fixPath(list[i].paths.x1);
        } catch (err) {}
        return "";
    }
    function letters(s) { return String(s || "").toLowerCase().replace(/[^a-z]/g, ""); }
    function bustBase(b) { return String(b).replace(/_(NUDE|PREG|AROUSED|ERECT|NUDE_ERECT|NUDE_PREG|NUDE_PREG_AROUSED|HARDLIGHT|ALT|[0-9]+)+$/i, ""); }
    function portraitFor(name, recs) {
        var want = letters(name.replace(/\s*\(.*\)$/, "")), cand = [];
        recs.forEach(function (r) { (r.busts || []).forEach(function (b) { if (cand.indexOf(b) < 0) cand.push(b); }); });
        var match = cand.filter(function (b) { var l = letters(bustBase(b)); return l && want && (l === want || l.indexOf(want) === 0 || want.indexOf(l) === 0); });
        if (!match.length && cand.length && recs.every(function (r) { return r.chars.length === 1; })) match = [cand[0]];
        if (!match.length) match = [String(name).toUpperCase().replace(/[^A-Z0-9]+/g, "_")];
        var tries = [];
        match.forEach(function (b) { if (/_NUDE/i.test(b)) tries.push(b); });
        match.forEach(function (b) { tries.push(bustBase(b) + "_NUDE"); });
        match.forEach(function (b) { tries.push(b); tries.push(bustBase(b)); });
        for (var i = 0; i < tries.length; i++) { var src = bustSrc(tries[i]); if (src) return src; }
        return "";
    }
    function readImage(src) {
        // fetch, then XHR (file:// on desktop), then a canvas copy as PNG. Any that works is fine.
        function viaFetch() { return fetch(src).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }); }
        function viaXhr() {
            return new Promise(function (res, rej) {
                try { var x = new XMLHttpRequest(); x.open("GET", src, true); x.responseType = "arraybuffer"; x.onload = function () { if (x.response && x.response.byteLength) res(x.response); else rej(); }; x.onerror = rej; x.send(); }
                catch (err) { rej(err); }
            });
        }
        function viaCanvas() {
            return new Promise(function (res, rej) {
                var img = new Image();
                img.onload = function () {
                    try {
                        var c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
                        c.getContext("2d").drawImage(img, 0, 0);
                        c.toBlob(function (b) { if (!b) return rej(); b.arrayBuffer ? b.arrayBuffer().then(res, rej) : rej(); }, "image/png");
                    } catch (err) { rej(err); }
                };
                img.onerror = rej; img.src = src;
            });
        }
        var ext = (String(src).split("?")[0].match(/\.(png|webp|jpe?g|gif)$/i) || [, "png"])[1].toLowerCase();
        return viaFetch().then(function (b) { return { data: new Uint8Array(b), ext: ext }; })
            .catch(function () { return viaXhr().then(function (b) { return { data: new Uint8Array(b), ext: ext }; }); })
            .catch(function () { return viaCanvas().then(function (b) { return { data: new Uint8Array(b), ext: "png" }; }); })
            .catch(function () { return null; });
    }
    function isLinux() {
        try { var ua = navigator.userAgent || "", pf = navigator.platform || ""; return /linux/i.test(ua + " " + pf) && !/android|cros/i.test(ua); } catch (err) { return false; }
    }
    S.isLinux = isLinux;

    /* ---------- Saving files ---------- */
    function cleanName(s) {
        s = String(s || "").replace(/<[^>]*>/g, "").replace(/[\\\/:*?"<>|\u0000-\u001f]+/g, "").replace(/\s+/g, " ").trim().replace(/^\.+|\.+$/g, "");
        return (s || "Untitled").slice(0, 80);
    }
    S.cleanName = cleanName;
    function note(msg) { try { output("\n\n<i>" + msg + "</i>"); } catch (err) {} }
    function download(blob, name) {
        try {
            var url = (window.URL || window.webkitURL).createObjectURL(blob);
            var a = document.createElement("a");
            a.style.display = "none"; a.href = url; a.download = name;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { try { (window.URL || window.webkitURL).revokeObjectURL(url); } catch (err) {} }, 120000);
            return true;
        } catch (err) { return false; }
    }
    S.saveBlob = function (blob, name) {
        // The game's own Save To File route (cordova saveDialog) where it exists, else a download.
        var sd = null;
        try { sd = window.cordova && window.cordova.plugins && window.cordova.plugins.saveDialog; } catch (err) {}
        return new Promise(function (res) {
            function plainDl() {
                if (download(blob, name)) { note("Saved " + name + " (check your Downloads folder if no save window opened)."); res(true); }
                else { note("Saving didn’t work here."); res(false); }
            }
            if (sd && typeof sd.saveFile === "function") {
                try {
                    sd.saveFile(blob, name).then(function (where) { note("Saved " + (where ? "to " + where : name) + "."); res(true); },
                        function (err) { if (/cancel/i.test(String(err && (err.message || err)))) { note("Save cancelled."); res(false); } else plainDl(); });
                    return;
                } catch (err) {}
            }
            plainDl();
        });
    };
    S.saveRtf = function (rec) { return S.saveBlob(new Blob([S.toRtf(rec)], { type: "application/rtf" }), cleanName(rec.title) + ".rtf"); };

    function execCopy(text) {
        try {
            var ta = document.createElement("textarea");
            ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
            document.body.appendChild(ta); ta.select();
            try { ta.setSelectionRange(0, text.length); } catch (err) {}
            var ok = document.execCommand && document.execCommand("copy");
            ta.remove();
            return !!ok;
        } catch (err) { return false; }
    }
    function manualCopy(text) {
        try {
            var old = document.getElementById("tnSceneCopyBox"); if (old) old.remove();
            var wrap = document.createElement("div");
            wrap.id = "tnSceneCopyBox";
            wrap.style.cssText = "position:fixed;left:5%;top:8%;width:90%;height:80%;z-index:99999;background:var(--backgroundColor,#3D5174);border:1px solid var(--paleColor,#53677B);border-radius:10px;padding:10px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;";
            var ta = document.createElement("textarea");
            ta.value = text; ta.readOnly = true;
            ta.style.cssText = "flex:1;width:100%;background:var(--foregroundColorB,#2C3649);color:var(--textColor,#fff);font-size:14px;border:1px solid var(--paleColor,#53677B);border-radius:6px;padding:8px;box-sizing:border-box;";
            var btn = document.createElement("button");
            btn.textContent = "Close";
            btn.style.cssText = "padding:10px;font-size:16px;border-radius:8px;background:var(--foregroundColorA,#333E52);color:var(--textColor,#fff);border:1px solid var(--paleColor,#53677B);";
            btn.onclick = function () { wrap.remove(); };
            wrap.appendChild(ta); wrap.appendChild(btn); document.body.appendChild(wrap);
            ta.focus(); ta.select();
            return true;
        } catch (err) { return false; }
    }
    S.copy = function (text) {
        var good = "Copied the scene text. Paste it anywhere you like.";
        if (execCopy(text)) { note(good); return; }
        var done = false;
        function last() {
            if (done) return; done = true;
            if (manualCopy(text)) note("Your device blocked copying, so the text is open in a box. Select it and copy it from there.");
            else note("Copying didn’t work here. Try Save Text instead.");
        }
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () { if (!done) { done = true; note(good); } }, last);
                setTimeout(last, 2000);
                return;
            }
        } catch (err) {}
        last();
    };

    /* ---------- Finding a scene, and the full zip ---------- */
    // Finds the full recording that holds a piece of text (a Flashback Visor memory's last page).
    S.find = function (html, kind) {
        var probe = strip(html).slice(-200);
        return S.all().then(function (list) {
            list = list.filter(function (r) { return !kind || r.kind === kind; }).sort(function (a, b) { return (b.upd || 0) - (a.upd || 0); });
            if (!probe) return null;
            for (var i = 0; i < list.length; i++) if (strip(list[i].pages.join(" ")).indexOf(probe) >= 0) return list[i];
            return null;
        });
    };
    S.findFight = function (names, win) {
        var key = (names || []).map(function (n) { return nice(n); }).sort().join("+").toLowerCase();
        return S.all().then(function (list) {
            return list.filter(function (r) { return r.kind === "fight" && r.chars.join("+").toLowerCase() === key && r.title === (win ? "Victory" : "Defeat"); })
                .sort(function (a, b) { return (b.upd || 0) - (a.upd || 0); })[0] || null;
        });
    };
    // extra: [{chars, title, pages, d, loc, kind}] for scenes from before this mod (the visor's own memories).
    S.exportZip = function (extra) {
        var who = cleanName(pcName());
        note("Packing your scenes...");
        return S.all().then(function (list) {
            list = list.concat((extra || []).filter(function (x) {
                var probe = strip((x.pages || []).slice(-1).join(" ")).slice(-200);
                return probe && !list.some(function (r) { return strip(r.pages.join(" ")).indexOf(probe) >= 0; });
            }).map(function (x) { return { kind: x.kind || "sex", chars: x.chars, title: x.title, pages: x.pages, d: x.d, loc: x.loc, pc: pcName(), busts: x.busts || [], upd: 0 }; }));
            if (!list.length) { note("No scenes recorded yet. Scenes are saved from the moment the Scene Text Saver is installed."); return false; }
            var folders = {};
            list.sort(function (a, b) { return (a.d || 0) - (b.d || 0); }).forEach(function (r) {
                r.chars.forEach(function (c) { var f = cleanName(c); (folders[f] = folders[f] || []).push(r); });
            });
            var names = Object.keys(folders).sort(function (a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; });
            var linux = isLinux(), files = [], icons = [];
            names.forEach(function (f) {
                files.push({ name: f + "/", dir: true });
                var used = {};
                folders[f].forEach(function (r) {
                    var base = cleanName(r.title), n = base, k = 2;
                    while (used[n.toLowerCase()]) n = base + " (" + (k++) + ")";
                    used[n.toLowerCase()] = 1;
                    files.push({ name: f + "/" + n + ".rtf", data: S.toRtf(r) });
                });
                if (linux) icons.push(f);
            });
            var pics = icons.map(function (f) {
                var src = portraitFor(f, folders[f]);
                return src ? readImage(src).then(function (img) {
                    if (!img || !img.data.length) return;
                    files.push({ name: f + "/.folder." + img.ext, data: img.data });
                    files.push({ name: f + "/.directory", data: "[Desktop Entry]\nIcon=./.folder." + img.ext + "\n" });
                }) : Promise.resolve();
            });
            return Promise.all(pics).then(function () {
                var count = list.length;
                return S.saveBlob(makeZip(files), "TiTS_Scenes_" + who.replace(/\s+/g, "_") + ".zip").then(function (ok) {
                    if (ok) note(count + " scenes in " + names.length + " folders.");
                    return ok;
                });
            });
        });
    };
})();
