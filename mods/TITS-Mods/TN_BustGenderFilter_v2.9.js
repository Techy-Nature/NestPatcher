/* Bust Gender Filter for Trials in Tainted Space (checked against 0.9.168).
   Hides NPC busts by the NPC's gender: Male (1), Female (2), Herm (3), plus
   optional Sexless and Unidentified groups. Each one is toggled on its own page in
   the Android Mod Menu. Your own (PC) bust is never hidden.

   Modv2.9: battle busts too. The fight screen draws each fighter's portrait with
   its own React component (solo and group layouts), which never goes through
   ui.getBustImages. The mod finds those two components when React first builds
   them and filters their bust list by that fighter's own genitals. A fighter with
   every bust hidden keeps an empty portrait box (name, bars and status stay).
   Ships are never hidden. "Battle busts" on the settings page can turn this off.

   An NPC's gender, first match wins ("By gender", the default since Modv2.9):
     a. A gender the game sets for them: a Force Male / Force Fem / Force It
        status, or the game's own gender text (nyrea swapped, etc.).
     b. Both a cock and a vagina = Herm.
     c. The pronouns the game uses for them: he = Male, she = Female.
     d. Genitals and chest: cock = Male, vagina = Female, neither = Female with
        a C cup or bigger, else Sexless.
   "By genitals only" is the old way: cock / vagina / both / neither.

   Which NPC a bust belongs to, first match wins:
     1. Your manual pick for that bust (Recent busts page).
     2. The creature currently drawing itself (creature.showAll).
     3. Anyone in the current fight whose bust matches.
     4. A saved character whose bust or character key matches, then a prefix match
        on "_" (SHELLY_PREG falls back to SHELLY).
   Anything still unknown counts as Unidentified.
   Settings are device-wide (localStorage), like the Mod Menu's own toggles. */
(function () {
    var MOD_ID = "TN_BustGenderFilter";
    var STORAGE_KEY = "tn.bustGenderFilter.v1";
    var GROUPS = [
        { key: "male", label: "Male", num: 1 },
        { key: "female", label: "Female", num: 2 },
        { key: "herm", label: "Herm", num: 3 },
        { key: "sexless", label: "Sexless", num: 4 },
        { key: "unknown", label: "Unidentified", num: 5 }
    ];
    var OVERRIDE_CYCLE = ["", "male", "female", "herm", "keep"];
    var PC_BUSTS = { PC: true, PC_NUDE: true };
    var RECENT_MAX = 10;

    var cfg = load();
    var recent = [];
    var contextCreature = null;
    var view = "main";
    var index = null;
    var indexBuilt = 0;

    function load() {
        var base = { hide: {}, overrides: {}, showCombat: false, mode: "gender" };
        try {
            var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
            if (saved && typeof saved === "object") {
                if (saved.hide && typeof saved.hide === "object") base.hide = saved.hide;
                if (saved.overrides && typeof saved.overrides === "object") base.overrides = saved.overrides;
                if (saved.showCombat === true) base.showCombat = true;
                if (saved.mode === "genitals") base.mode = "genitals";
            }
        } catch (err) { console.warn("[TN] Bust filter settings unreadable", err); }
        return base;
    }

    function save() {
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); }
        catch (err) { console.warn("[TN] Bust filter settings not saved", err); }
    }

    function active() {
        return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID);
    }

    function norm(id) {
        return String(id == null ? "" : id).toUpperCase().replace(/_NUDE$/, "");
    }

    function call(creature, name, args) {
        try {
            if (typeof creature[name] === "function") return creature[name].apply(creature, args || []);
        } catch (err) {}
        return undefined;
    }

    // The gender the game itself has set for this NPC, or "".
    function setGender(creature) {
        if (call(creature, "hasStatusEffect", ["Force It Gender"]) === true) return "sexless";
        if (call(creature, "hasStatusEffect", ["Force Fem Gender"]) === true) return "female";
        if (call(creature, "hasStatusEffect", ["Force Male Gender"]) === true) return "male";
        var text = call(creature, "genderTextOverride");
        text = String(text || "").replace(/\?+/g, "").toLowerCase();
        if (text === "male") return "male";
        if (text === "female") return "female";
        return "";
    }

    // he/she/it, as the game would write it for this NPC.
    function pronoun(creature) {
        if (creature.isPlural) return "";
        var p = call(creature, "getCombatPronoun", ["s"]);
        if (typeof p !== "string") p = call(creature, "mfn", ["he", "she", "it"]);
        return typeof p === "string" ? p.toLowerCase() : "";
    }

    // Returns { gender, why } or null when the creature can't be read.
    function genderInfo(creature) {
        if (!creature || typeof creature.hasCock !== "function") return null;
        var c = call(creature, "hasCock") === true;
        var v = call(creature, "hasVagina") === true;
        if (cfg.mode === "genitals") {
            return { gender: c && v ? "herm" : c ? "male" : v ? "female" : "sexless", why: "genitals" };
        }
        var set = setGender(creature);
        if (set) return { gender: set, why: "set gender" };
        if (c && v) return { gender: "herm", why: "genitals" };
        var p = pronoun(creature);
        if (p === "he") return { gender: "male", why: "pronouns" };
        if (p === "she") return { gender: "female", why: "pronouns" };
        if (c) return { gender: "male", why: "genitals" };
        if (v) return { gender: "female", why: "genitals" };
        var tits = call(creature, "biggestTitSize");
        if (typeof tits === "number" && tits >= 3) return { gender: "female", why: "chest" };
        return { gender: "sexless", why: "genitals + chest" };
    }

    function genderOf(creature) {
        var info = genderInfo(creature);
        return info ? info.gender : "";
    }

    function whyOf(creature) {
        var info = genderInfo(creature);
        return info ? info.why : "";
    }

    function bustOf(creature) {
        try {
            var b = creature.bustDisplay;
            if (Array.isArray(b)) b = b[0];
            return b ? norm(b) : "";
        } catch (err) { return ""; }
    }

    function characters() {
        try {
            var gs = window.game && window.game.gamestate;
            return (gs && gs.characters) || null;
        } catch (err) { return null; }
    }

    // Bust name -> character, rebuilt at most every 5 seconds.
    function getIndex() {
        var now = Date.now();
        if (index && now - indexBuilt < 5000) return index;
        index = {};
        indexBuilt = now;
        var chars = characters();
        if (!chars) return index;
        Object.keys(chars).forEach(function (key) {
            var ch = chars[key];
            if (!ch || typeof ch !== "object") return;
            var b = bustOf(ch);
            if (b && !index[b]) index[b] = ch;
            var k = norm(key);
            if (k && !index[k]) index[k] = ch;
        });
        return index;
    }

    function combatActors() {
        var list = [];
        try {
            if (typeof window.getHostileActors === "function") list = list.concat(window.getHostileActors() || []);
            var cm = window.CombatManager;
            if (cm && typeof cm.getFriendlyActors === "function") list = list.concat(cm.getFriendlyActors() || []);
        } catch (err) {}
        return list;
    }

    // Returns { gender, source }.
    function classify(id) {
        var b = norm(id);
        var pick = cfg.overrides[b];
        if (pick) return { gender: pick, source: "your pick" };
        if (contextCreature) {
            var g0 = genderOf(contextCreature);
            if (g0) return { gender: g0, source: "scene, " + whyOf(contextCreature) };
        }
        var actors = combatActors();
        for (var i = 0; i < actors.length; i++) {
            if (actors[i] && bustOf(actors[i]) === b) {
                var g1 = genderOf(actors[i]);
                if (g1) return { gender: g1, source: "combat, " + whyOf(actors[i]) };
            }
        }
        var idx = getIndex();
        if (idx[b]) {
            var g2 = genderOf(idx[b]);
            if (g2) return { gender: g2, source: "character, " + whyOf(idx[b]) };
        }
        var parts = b.split("_");
        for (var n = parts.length - 1; n > 0; n--) {
            var stem = parts.slice(0, n).join("_");
            if (idx[stem]) {
                var g3 = genderOf(idx[stem]);
                if (g3) return { gender: g3, source: "character (" + stem + "), " + whyOf(idx[stem]) };
            }
        }
        return { gender: "unknown", source: "" };
    }

    function remember(id, result, hidden) {
        var b = norm(id);
        for (var i = 0; i < recent.length; i++) {
            if (recent[i].id === b) { recent.splice(i, 1); break; }
        }
        recent.unshift({ id: b, gender: result.gender, source: result.source, hidden: hidden });
        if (recent.length > RECENT_MAX) recent.length = RECENT_MAX;
    }

    function keep(id) {
        if (typeof id !== "string" || id === "") return true;
        var b = norm(id);
        if (PC_BUSTS[b]) return true;
        var result = classify(id);
        var hidden = result.gender !== "keep" && !!cfg.hide[result.gender];
        remember(id, result, hidden);
        return !hidden;
    }

    function filterList(list) {
        if (!Array.isArray(list) || !active()) return list;
        var out = [];
        for (var i = 0; i < list.length; i++) {
            try { if (keep(list[i])) out.push(list[i]); }
            catch (err) { out.push(list[i]); }
        }
        return out;
    }

    function patchUi() {
        var ui = window.ui;
        if (!ui || typeof ui.getBustImages !== "function") return;
        if (!ui.getBustImages.__tnBustFilter) {
            var origGet = ui.getBustImages;
            var wrappedGet = function () {
                return filterList(origGet.apply(this, arguments));
            };
            wrappedGet.__tnBustFilter = true;
            ui.getBustImages = wrappedGet;
        }
        if (typeof ui.addBust === "function" && !ui.addBust.__tnBustFilter) {
            var origAdd = ui.addBust;
            var wrappedAdd = function () {
                var args = filterList(Array.prototype.slice.call(arguments));
                if (!args.length) return;
                return origAdd.apply(this, args);
            };
            wrappedAdd.__tnBustFilter = true;
            ui.addBust = wrappedAdd;
            // The game bound window.addBust to the original once at startup.
            window.addBust = wrappedAdd.bind(ui);
        }
    }

    // creature.showAll() draws that creature's own bust, so its genitals decide.
    function patchShowAll() {
        if (typeof window.pc === "undefined" || !window.pc) return;
        var p = Object.getPrototypeOf(window.pc);
        while (p && p !== Object.prototype) {
            if (Object.prototype.hasOwnProperty.call(p, "showAll")) break;
            p = Object.getPrototypeOf(p);
        }
        if (!p || p === Object.prototype || p.showAll.__tnBustFilter) return;
        var orig = p.showAll;
        var wrapped = function () {
            var prev = contextCreature;
            contextCreature = this === window.pc ? null : this;
            try { return orig.apply(this, arguments); }
            finally { contextCreature = prev; }
        };
        wrapped.__tnBustFilter = true;
        p.showAll = wrapped;
    }

    // ---- Battle busts ----
    // The fight screen's portrait components read their busts from a "busts" getter
    // (combatBustOverride, else bustDisplay). They aren't exported, so we spot them
    // as React creates them: a class whose prototype has both a "busts" and a
    // "cycleFilter" getter. Then that getter is wrapped once, for every portrait.
    var reactLib = null;
    var combatPatched = 0;

    function webpackRequire() {
        var chunks = window.webpackChunktits_html || self.webpackChunktits_html;
        if (!chunks || typeof chunks.push !== "function") return null;
        var req = null;
        try { chunks.push([["tn-bust-filter-" + Date.now()], {}, function (r) { req = r; }]); }
        catch (err) { return null; }
        return typeof req === "function" ? req : null;
    }

    function isReact(x) {
        return !!x && typeof x.createElement === "function" && typeof x.Component === "function" &&
            typeof x.cloneElement === "function";
    }

    function findReact() {
        if (isReact(window.React)) return window.React;
        var req = webpackRequire();
        if (!req) return null;
        try { var known = req(67294); if (isReact(known)) return known; } catch (err) {}
        var cache = req.c || {};
        var ids = Object.keys(cache);
        for (var i = 0; i < ids.length; i++) {
            try {
                var ex = cache[ids[i]] && cache[ids[i]].exports;
                if (isReact(ex)) return ex;
            } catch (err2) {}
        }
        return null;
    }

    function getterOf(proto, name) {
        var d = Object.getOwnPropertyDescriptor(proto, name);
        return d && typeof d.get === "function" ? d : null;
    }

    function filterCombat(list, creature) {
        if (!Array.isArray(list) || !list.length || !active() || cfg.showCombat) return list;
        if (!creature || creature === window.pc) return list;
        try { if (creature.isShip) return list; } catch (err) {}
        var prev = contextCreature;
        contextCreature = creature;
        var out;
        try { out = filterList(list); }
        finally { contextCreature = prev; }
        // null (not []) so the game also drops the Edit/Cycle bust buttons.
        return out.length ? out : null;
    }

    function inspectType(type) {
        try {
            Object.defineProperty(type, "__tnBustSeen", { value: true });
            var proto = type.prototype;
            if (!proto) return;
            var bustsDesc = getterOf(proto, "busts");
            if (!bustsDesc || !getterOf(proto, "cycleFilter") || bustsDesc.get.__tnBustFilter) return;
            var orig = bustsDesc.get;
            var wrapped = function () {
                var list = orig.call(this);
                try { return filterCombat(list, this.props && this.props.character); }
                catch (err) { return list; }
            };
            wrapped.__tnBustFilter = true;
            Object.defineProperty(proto, "busts", {
                configurable: true,
                enumerable: bustsDesc.enumerable,
                get: wrapped
            });
            combatPatched++;
        } catch (err) { console.warn("[TN] Bust filter: battle bust hook failed", err); }
    }

    function patchCombat() {
        if (!reactLib) reactLib = findReact();
        if (!reactLib || reactLib.createElement.__tnBustFilter) return;
        var origCreate = reactLib.createElement;
        var wrappedCreate = function (type) {
            if (typeof type === "function" && !type.__tnBustSeen) inspectType(type);
            return origCreate.apply(this, arguments);
        };
        wrappedCreate.__tnBustFilter = true;
        reactLib.createElement = wrappedCreate;
    }

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function groupLabel(key) {
        for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].key === key) return GROUPS[i].label;
        if (key === "keep") return "Never hide";
        return "Auto";
    }

    function mainHtml() {
        var html = (cfg.mode === "genitals"
            ? "Sorting <b>by genitals only</b>: a cock only is <b>Male</b>, a vagina only is <b>Female</b>, both is <b>Herm</b>, neither is <b>Sexless</b>. "
            : "Sorting <b>by gender</b>: a gender the game sets for the NPC comes first. If there isn't one, an NPC with both a cock and a vagina is <b>Herm</b>; " +
              "otherwise the pronouns the game uses decide (he = <b>Male</b>, she = <b>Female</b>), then genitals and chest size. " +
              "<b>Sexless</b> is an NPC set as an \"it\" or with no genitals and a small chest. ") +
            "<b>Unidentified</b> is a bust the mod could not match to any NPC (some generic or background busts). " +
            "Your own bust is never hidden. When every bust in a scene is hidden, the minimap shows instead.\n\n" +
            "Tap a button to switch that group between Shown and Hidden. Changes apply from the next bust the game draws.\n";
        for (var i = 0; i < GROUPS.length; i++) {
            var g = GROUPS[i];
            html += "\n" + g.num + ". " + g.label + ": <b>" + (cfg.hide[g.key] ? "Hidden" : "Shown") + "</b>";
        }
        html += "\n\nBattle busts (the portraits in a fight): <b>" + (cfg.showCombat ? "Always shown" : "Filtered too") + "</b>. " +
            "When they're filtered, a fighter whose bust is hidden keeps an empty portrait box. Ships are never hidden.";
        html += "\n\nIf a bust lands in the wrong group, open <b>Recent busts</b> and set it by hand.";
        for (var j = 0; j < GROUPS.length; j++) {
            var gg = GROUPS[j];
            html += '<button type="button" data-mod-act="toggle:' + gg.key + '">' +
                (cfg.hide[gg.key] ? "Show " : "Hide ") + gg.label + "</button>";
        }
        html += '<button type="button" data-mod-act="mode">' + (cfg.mode === "genitals" ? "Sort by gender" : "Sort by genitals only") + "</button>";
        html += '<button type="button" data-mod-act="combat">' + (cfg.showCombat ? "Filter battle busts too" : "Always show battle busts") + "</button>";
        html += '<button type="button" data-mod-act="recent">Recent busts</button>';
        html += '<button type="button" data-mod-act="showall">Show everything</button>';
        return html;
    }

    function recentHtml() {
        var html = "The last busts the game tried to draw, newest first. Tap one to set its group by hand: " +
            "Auto, then Male, Female, Herm, Never hide, then back to Auto. Your picks are kept on this device.\n";
        if (!recent.length) html += "\nNo NPC busts seen yet. Talk to someone first, then come back.";
        for (var i = 0; i < recent.length; i++) {
            var r = recent[i];
            var pick = cfg.overrides[r.id] || "";
            html += "\n" + (i + 1) + ". <b>" + esc(r.id) + "</b>: " + groupLabel(r.gender) +
                (r.source ? " (" + esc(r.source) + ")" : "") +
                (r.hidden ? ", hidden" : ", shown") +
                (pick ? " — your pick: " + groupLabel(pick) : "");
            html += '<button type="button" data-mod-act="cycle:' + esc(r.id) + '">' + (i + 1) + ". " + esc(r.id) + "</button>";
        }
        var picks = Object.keys(cfg.overrides).length;
        html += "\n\nSaved picks: " + picks + ".";
        if (picks) html += '<button type="button" data-mod-act="clearpicks">Clear all picks</button>';
        html += '<button type="button" data-mod-act="main">Settings</button>';
        return html;
    }

    function onAct(act) {
        act = String(act || "");
        if (act === "recent") { view = "recent"; return true; }
        if (act === "main") { view = "main"; return true; }
        if (act === "showall") { cfg.hide = {}; save(); return true; }
        if (act === "clearpicks") { cfg.overrides = {}; save(); return true; }
        if (act === "combat") { cfg.showCombat = !cfg.showCombat; save(); return true; }
        if (act === "mode") { cfg.mode = cfg.mode === "genitals" ? "gender" : "genitals"; save(); return true; }
        if (act.indexOf("toggle:") === 0) {
            var key = act.slice(7);
            cfg.hide[key] = !cfg.hide[key];
            if (!cfg.hide[key]) delete cfg.hide[key];
            save();
            return true;
        }
        if (act.indexOf("cycle:") === 0) {
            var id = act.slice(6);
            var cur = cfg.overrides[id] || "";
            var next = OVERRIDE_CYCLE[(OVERRIDE_CYCLE.indexOf(cur) + 1) % OVERRIDE_CYCLE.length];
            if (next) cfg.overrides[id] = next;
            else delete cfg.overrides[id];
            save();
            for (var i = 0; i < recent.length; i++) {
                if (recent[i].id === id) {
                    var res = classify(id);
                    recent[i].gender = res.gender;
                    recent[i].source = res.source;
                    recent[i].hidden = res.gender !== "keep" && !!cfg.hide[res.gender];
                }
            }
            return true;
        }
        return false;
    }

    function register() {
        if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return;
        if (window.registerModMenu.__tnBustFilter) return;
        window.registerModMenu({
            id: MOD_ID,
            name: "Bust Gender Filter",
            author: "Kitty",
            description: "Hide NPC busts by gender (male, female, herm, each on its own switch), in scenes and in battle.",
            supportsToggle: true,
            getHtml: function () { return view === "recent" ? recentHtml() : mainHtml(); },
            onAct: onAct
        });
        window.registerModMenu.__tnBustFilter = true;
    }

    window.tnBustFilter = {
        classify: classify,
        recent: function () { return recent.slice(); },
        settings: function () { return JSON.parse(JSON.stringify(cfg)); },
        battleHooks: function () { return combatPatched; }
    };

    function tick() {
        try { register(); } catch (err) {}
        try { patchUi(); } catch (err) {}
        try { patchShowAll(); } catch (err) {}
        try { patchCombat(); } catch (err) {}
    }

    setInterval(tick, 1000);
    tick();
})();
