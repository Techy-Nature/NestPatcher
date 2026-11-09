/*
 * TN_SteelePronouns_v2.9.js - NestPatcher runtime mod (TiTS 0.9.168), Modv2.9
 * Author: Neston
 *
 * Picks the pronouns other characters use for Steele from Steele's femininity:
 *   femininity  1-30  -> he / him / his
 *   femininity 31-60  -> they / them / their
 *   femininity 61+    -> she / her / hers
 *
 * How it works:
 * - Every third-person pronoun for Steele ([pc.heShe], [pc.himHer], [pc.hisHer],
 *   [pc.hisHers] and the game's own pc.mf("he","she") style calls) goes through
 *   PlayerCharacter.mfn(). This mod wraps mfn() for the player only, and only for
 *   pronoun and title pairs. Everything else mf() decides (descriptions, daddy/mommy)
 *   is left to the game. Titles follow the same ranges: sir/ma'am -> "mir" and
 *   mister/miss -> "mir", Mr./Ms. -> "Mx.", man/woman -> "person",
 *   guy/girl -> "enby" in the they range. Each title can be changed in the mod menu.
 * - "they" needs plural verbs. Each "they" this mod hands out carries an invisible
 *   marker (U+2063). After the game's parser finishes a block of text, the mod fixes
 *   the verb next to each marked "they" (is -> are, was -> were, wants -> want,
 *   he's got -> they've got, "Is he...?" -> "Are they...?") and removes the markers.
 *   An NPC's own "they" has no marker, so it is never touched.
 * - The game's "Force Male/Female/It Gender" effects still win when they are on.
 *
 * Settings: Android Mods / TN Mod Settings -> "Steele Pronouns".
 * Saved in localStorage (tn.steelePronouns.v1), so they apply to every save.
 * No .mod needles: nothing in the game bundles is replaced.
 */
(function () {
    "use strict";
    if (window.__tnSteelePronounsLoaded) return;
    window.__tnSteelePronounsLoaded = true;

    var MOD_ID = "tn.steele-pronouns";
    var STORE = "tn.steelePronouns.v1";
    var MARK = "⁣";
    var SP = window.tnSteelePronouns = {};

    /* ---------- Settings ---------- */
    var DEFAULTS = { mode: "ranges", mascMax: 30, femMin: 61, reflexive: "themself" };
    // Neutral titles for the they range. Players can change each one in the mod menu.
    var TITLES = [
        { key: "sir", label: "Sir / Ma’am", def: "mir" },
        { key: "mister", label: "Mister / Miss", def: "mir" },
        { key: "mr", label: "Mr. / Ms.", def: "Mx" },
        { key: "man", label: "Man / Woman", def: "person" },
        { key: "guy", label: "Guy / Girl", def: "enby" }
    ];
    function cleanTitle(v) {
        return String(v == null ? "" : v).replace(/[<>\[\]{}"\\]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
    }
    var cfg = load();

    function load() {
        var c = {};
        for (var k in DEFAULTS) c[k] = DEFAULTS[k];
        c.titles = {};
        TITLES.forEach(function (t) { c.titles[t.key] = t.def; });
        try {
            var raw = window.localStorage && window.localStorage.getItem(STORE);
            if (raw) {
                var o = JSON.parse(raw);
                if (o && typeof o === "object") {
                    if (["ranges", "middle", "always", "off"].indexOf(o.mode) >= 0) c.mode = o.mode;
                    if (typeof o.mascMax === "number") c.mascMax = o.mascMax;
                    if (typeof o.femMin === "number") c.femMin = o.femMin;
                    if (o.reflexive === "themselves" || o.reflexive === "themself") c.reflexive = o.reflexive;
                    if (o.titles && typeof o.titles === "object") {
                        TITLES.forEach(function (t) { var v = cleanTitle(o.titles[t.key]); if (v) c.titles[t.key] = v; });
                    }
                }
            }
        } catch (err) {}
        clampCfg(c);
        return c;
    }
    function clampCfg(c) {
        c.mascMax = Math.max(0, Math.min(99, Math.round(c.mascMax)));
        c.femMin = Math.max(1, Math.min(100, Math.round(c.femMin)));
        if (c.femMin <= c.mascMax) c.femMin = c.mascMax + 1;
    }
    function save() {
        clampCfg(cfg);
        try { if (window.localStorage) window.localStorage.setItem(STORE, JSON.stringify(cfg)); } catch (err) {}
    }
    SP.config = function () { return JSON.parse(JSON.stringify(cfg)); };

    /* ---------- Mod menu switch ---------- */
    function on() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }

    /* ---------- Which pronouns ---------- */
    // Returns "m", "f", "n" (they) or null (let the game decide).
    function pick(pc) {
        if (!on() || cfg.mode === "off") return null;
        if (cfg.mode === "always") return "n";
        var fem = Number(pc && pc.femininity);
        if (!isFinite(fem)) return null;
        if (fem > cfg.mascMax && fem < cfg.femMin) return "n";
        if (cfg.mode === "middle") return null;
        return fem <= cfg.mascMax ? "m" : "f";
    }
    SP.pick = function () { return window.pc ? pick(window.pc) : null; };

    // Pronoun pairs the game passes to mf()/mfn(), keyed "masc|fem" in lower case.
    var PAIRS = {
        "he|she": "they",
        "him|her": "them",
        "his|her": "their",
        "his|hers": "theirs",
        "himself|herself": "@refl",
        "he is|she is": "they are",
        "he was|she was": "they were",
        "he has|she has": "they have",
        "he's|she's": "they're",
        "he’s|she’s": "they’re",
        // Titles: "@t:<key>" uses the player's word for that title (defaults in TITLES).
        "sir|ma’am": "@t:sir", "sir|ma'am": "@t:sir", "sir|madam": "@t:sir", "sir|madame": "@t:sir",
        "sir|miss": "@t:sir", "sir|missy": "@t:sir",
        "mister|miss": "@t:mister", "mister|missy": "@t:mister", "mister|missus": "@t:mister", "mister|misses": "@t:mister",
        "mr.|ms.": "@t:mr", "mr|ms": "@t:mr", "mr.|miss": "@t:mr", "mr|miss": "@t:mr", "mr.|miss.": "@t:mr",
        "mr.|mrs.": "@t:mr", "mr|mrs": "@t:mr", "mr.|mizz": "@t:mr",
        "man|woman": "@t:man", "man|lady": "@t:man", "man|gal": "@t:man",
        "guy|girl": "@t:guy"
    };
    function titleFor(key, a) {
        var t = cfg.titles[key];
        if (!t) for (var i = 0; i < TITLES.length; i++) if (TITLES[i].key === key) t = TITLES[i].def;
        // "Mr." -> "Mx.": keep the game's full stop.
        if (/\.$/.test(a) && !/\.$/.test(t)) t += ".";
        if (!/\.$/.test(a)) t = t.replace(/\.$/, "");
        var upper = a.charAt(0) !== a.charAt(0).toLowerCase();
        if (upper) t = t.charAt(0).toUpperCase() + t.slice(1);
        else if (t.length < 2 || t.charAt(1) === t.charAt(1).toLowerCase()) t = t.charAt(0).toLowerCase() + t.slice(1);
        return t;
    }
    function theyFor(a, b) {
        if (typeof a !== "string" || typeof b !== "string") return null;
        var t = PAIRS[a.toLowerCase() + "|" + b.toLowerCase()];
        if (!t) return null;
        if (t.indexOf("@t:") === 0) return titleFor(t.slice(3), a);
        if (t === "@refl") t = cfg.reflexive;
        if (a.charAt(0) !== a.charAt(0).toLowerCase()) t = t.charAt(0).toUpperCase() + t.slice(1);
        if (t === "they" || t === "They") t += MARK;   // subject form: verb gets fixed later
        return t;
    }
    SP.theyFor = theyFor;

    function forcedGender(pc) {
        try {
            return pc.hasStatusEffect("Force Fem Gender") || pc.hasStatusEffect("Force Male Gender") || pc.hasStatusEffect("Force It Gender");
        } catch (err) { return false; }
    }

    function patchPlayer() {
        var pc = window.pc;
        if (!pc || typeof pc.getClassName !== "function" || pc.getClassName() !== "PlayerCharacter") return false;
        var proto = Object.getPrototypeOf(pc);
        if (!proto || typeof proto.mfn !== "function") return false;
        if (proto.mfn.__tnSteelePronouns) return true;
        var base = proto.mfn;
        var wrapped = function (m, f, n, ignoreForce) {
            try {
                if (this.getClassName() === "PlayerCharacter" && typeof m === "string" && typeof f === "string"
                    && PAIRS.hasOwnProperty(m.toLowerCase() + "|" + f.toLowerCase())
                    && (ignoreForce || !forcedGender(this))) {
                    var p = pick(this);
                    if (p === "m") return m;
                    if (p === "f") return f;
                    if (p === "n") return theyFor(m, f);
                }
            } catch (err) { console.warn("[TN] Steele Pronouns", err); }
            return base.apply(this, arguments);
        };
        wrapped.__tnSteelePronouns = true;
        wrapped.__tnBase = base;
        proto.mfn = wrapped;
        return true;
    }

    /* ---------- Verb agreement for "they" ---------- */
    var ADVERBS = ("really just still actually already probably even never always also only certainly clearly obviously "
        + "definitely seriously totally sure kinda sorta truly finally usually sometimes often rarely barely hardly simply "
        + "apparently surely mostly merely almost nearly quickly slowly then now so too clearly especially genuinely honestly "
        + "literally merely suddenly immediately instantly eagerly happily gladly quietly gently softly").split(" ");
    var ADV = {};
    ADVERBS.forEach(function (w) { ADV[w] = true; });

    var IRREGULAR = {
        "is": "are", "was": "were", "has": "have", "does": "do", "goes": "go",
        "isn’t": "aren’t", "isn't": "aren't", "wasn’t": "weren’t", "wasn't": "weren't",
        "hasn’t": "haven’t", "hasn't": "haven't", "doesn’t": "don’t", "doesn't": "don't",
        "aches": "ache", "caches": "cache", "dies": "die", "lies": "lie", "ties": "tie", "vies": "vie"
    };
    var NOT_VERBS = ("this thus plus us yes less unless perhaps always sometimes afterwards towards besides as its whereas his hers "
        + "ours yours theirs nevertheless regardless across upwards downwards backwards sideways anyways nowadays alas "
        + "is was has does nervous anxious famous curious serious gorgeous").split(" ");
    var NOTV = {};
    NOT_VERBS.forEach(function (w) { NOTV[w] = true; });

    function keepCase(src, out) {
        if (src === src.toUpperCase() && src.length > 1) return out.toUpperCase();
        if (src.charAt(0) !== src.charAt(0).toLowerCase()) return out.charAt(0).toUpperCase() + out.slice(1);
        return out;
    }

    // Third-person singular verb -> plural form. Returns null if the word should stay.
    function plural(word) {
        var w = word.toLowerCase();
        if (IRREGULAR.hasOwnProperty(w)) return keepCase(word, IRREGULAR[w]);
        if (NOTV[w] || ADV[w]) return null;
        if (!/^[a-z]+s$/.test(w) || w.length < 3) return null;
        if (/(ss|us|is|ous)$/.test(w)) return null;
        var out;
        if (/[^aeiou]ies$/.test(w) && w.length > 4) out = w.slice(0, -3) + "y";
        else if (/(sses|shes|ches|xes|zzes|oes)$/.test(w)) out = w.slice(0, -2);
        else out = w.slice(0, -1);
        return keepCase(word, out);
    }
    SP.plural = plural;

    var INVERT = {
        "is": "are", "was": "were", "does": "do", "has": "have",
        "isn’t": "aren’t", "isn't": "aren't", "wasn’t": "weren’t", "wasn't": "weren't",
        "doesn’t": "don’t", "doesn't": "don't", "hasn’t": "haven’t", "hasn't": "haven't"
    };
    // "he's" + one of these is always "has": "he's got" -> "they've got".
    var HAVE_NEXT = {};
    ("got gotten been had won come seen learned become grown known shown taught bought brought found heard "
        + "fought gone through").split(" ").forEach(function (w) { HAVE_NEXT[w] = 1; });
    delete HAVE_NEXT.through; delete HAVE_NEXT.gone;
    // "he's" + one of these is "has" only when an object follows: "he's given me" vs "he's given to".
    var HAVE_IF_OBJ = {};
    ("done made told given left taken bent kept put sent spent lost felt thought caught held paid broken chosen "
        + "forgotten written stolen eaten").split(" ").forEach(function (w) { HAVE_IF_OBJ[w] = 1; });
    var OBJECTS = {};
    ("me you us him her them it a an the my your his their our its that this these those some such so everything "
        + "something anything nothing all").split(" ").forEach(function (w) { OBJECTS[w] = 1; });
    function hasForm(word, rest) {
        var w = word.toLowerCase();
        if (HAVE_NEXT[w]) return true;
        if (HAVE_IF_OBJ[w] || /[a-z]ed$/.test(w)) {
            var n = /^\s+([A-Za-z]+)/.exec(rest);
            return !!(n && OBJECTS[n[1].toLowerCase()]);
        }
        return false;
    }

    var RE_INVERT = new RegExp("(^|[^A-Za-z’'])(Is|is|Was|was|Does|does|Has|has|Isn[’']t|isn[’']t|Wasn[’']t|wasn[’']t|Doesn[’']t|doesn[’']t|Hasn[’']t|hasn[’']t)(\\s+)(they|They|THEY)" + MARK, "g");
    var RE_WORD = /^(\s+)([A-Za-z]+(?:[’'][A-Za-z]+)?)/;

    // Fix the verb after one marked "they". `rest` is the text right after the marker.
    // Returns the replacement for the start of `rest`.
    function fixAfter(rest) {
        var contr = /^([’'])[sS](?![A-Za-z])/.exec(rest);
        var pos = contr ? contr[0].length : 0;
        var built = "";
        for (var i = 0; i < 3; i++) {
            var m = RE_WORD.exec(rest.slice(pos));
            if (!m) break;
            var word = m[2];
            if (ADV[word.toLowerCase()] && i < 2) {
                built += m[0];
                pos += m[0].length;
                continue;
            }
            if (contr) {
                var c = hasForm(word, rest.slice(pos + m[0].length)) ? "ve" : "re";
                return contr[1] + c + built + m[0] + rest.slice(pos + m[0].length);
            }
            var p = plural(word);
            return built + m[1] + (p || word) + rest.slice(pos + m[0].length);
        }
        if (contr) return contr[1] + "re" + rest.slice(contr[0].length);
        return rest;
    }

    function fixText(text) {
        if (typeof text !== "string" || text.indexOf(MARK) < 0) return text;
        // "Is he ...?" -> "Are they ...?"
        text = text.replace(RE_INVERT, function (all, pre, verb, sp, they) {
            var v = INVERT[verb.toLowerCase()];
            return pre + (v ? keepCase(verb, v) : verb) + sp + they + MARK;
        });
        // "he is", "he really wants", "he's got": work from the last marker back,
        // so each fix only rewrites text after its own marker.
        var parts = text.split(MARK);
        for (var k = parts.length - 1; k >= 1; k--) {
            if (/(?:^|[^A-Za-z])(they|They|THEY)$/.test(parts[k - 1])) parts[k] = fixAfter(parts[k]);
        }
        return parts.join("");
    }
    SP.fixText = fixText;

    function patchParser() {
        var parser = window.parser;
        if (!parser) return false;
        var proto = Object.getPrototypeOf(parser);
        if (!proto || typeof proto.parse !== "function") return false;
        if (proto.parse.__tnSteelePronouns) return true;
        var base = proto.parse;
        var depth = 0;   // the parser calls itself for nested tags; fix only the outermost result
        var wrapped = function () {
            var out;
            depth++;
            try { out = base.apply(this, arguments); }
            finally { depth--; }
            if (depth === 0 && typeof out === "string" && out.indexOf(MARK) >= 0) {
                try { out = fixText(out); } catch (err) { console.warn("[TN] Steele Pronouns verb fix", err); out = out.split(MARK).join(""); }
            }
            return out;
        };
        wrapped.__tnSteelePronouns = true;
        wrapped.__tnBase = base;
        proto.parse = wrapped;
        return true;
    }

    /* ---------- Mod menu ---------- */
    function nowLine() {
        var pc = window.pc;
        if (!pc || typeof pc.getClassName !== "function" || pc.getClassName() !== "PlayerCharacter") return "";
        var p = pick(pc);
        var who = p === "m" ? "he / him / his" : p === "f" ? "she / her / hers" : p === "n" ? "they / them / their" : "the game's own choice";
        return "\n\nSteele's femininity is <b>" + Math.round(Number(pc.femininity) || 0) + "</b>, so people call Steele <b>" + who + "</b>.";
    }
    var MODE_TEXT = {
        ranges: "Femininity ranges (he / they / she)",
        middle: "Only the middle range is they (the game picks he or she otherwise)",
        always: "Always they / them",
        off: "Off (the game decides)"
    };

    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Steele Pronouns",
            author: "Neston",
            description: "Other characters call Steele he, they or she based on femininity (1-30 he, 31-60 they, 61+ she). Verbs after \"they\" are fixed to match; sir/ma’am becomes mir and Mr./Ms. becomes Mx., man/woman becomes person and guy/girl becomes enby (all editable).",
            supportsToggle: true,
            getHtml: function () {
                var h = "Pick how other characters refer to Steele: he/she/they, plus neutral titles in the they range.";
                h += "\n\nMode: <b>" + MODE_TEXT[cfg.mode] + "</b>";
                h += "\nHe / him up to femininity <b>" + cfg.mascMax + "</b>, she / her from <b>" + cfg.femMin + "</b>, they / them in between.";
                h += "\nReflexive: <b>" + cfg.reflexive + "</b>";
                h += nowLine();
                h += '<button type="button" data-mod-act="mode:ranges">Femininity ranges</button>';
                h += '<button type="button" data-mod-act="mode:middle">Middle range only</button>';
                h += '<button type="button" data-mod-act="mode:always">Always they</button>';
                h += '<button type="button" data-mod-act="mode:off">Off</button>';
                h += '<button type="button" data-mod-act="masc:-5">He up to -5</button>';
                h += '<button type="button" data-mod-act="masc:5">He up to +5</button>';
                h += '<button type="button" data-mod-act="fem:-5">She from -5</button>';
                h += '<button type="button" data-mod-act="fem:5">She from +5</button>';
                h += '<button type="button" data-mod-act="refl">Use ' + (cfg.reflexive === "themself" ? "themselves" : "themself") + '</button>';
                h += '<button type="button" data-mod-act="reset">Reset to 30 / 61</button>';
                h += "\n\n<b>Neutral titles</b> (used in the they range). Type a word and tap outside the box to save it.";
                TITLES.forEach(function (t) {
                    h += '<label style="display:block;margin:6px 0">' + t.label + ' → '
                        + '<input type="text" data-tn-pron-title="' + t.key + '" maxlength="24" value="' + cfg.titles[t.key].replace(/&/g, "&amp;")
                        + '" style="width:9em"></label>';
                });
                h += '<button type="button" data-mod-act="titles-reset">Reset titles</button>';
                return h;
            },
            onBind: function (root) {
                if (!root || !root.querySelectorAll) return;
                var boxes = root.querySelectorAll("[data-tn-pron-title]");
                Array.prototype.forEach.call(boxes, function (box) {
                    var key = box.getAttribute("data-tn-pron-title");
                    function commit() {
                        var v = cleanTitle(box.value), def = "";
                        TITLES.forEach(function (t) { if (t.key === key) def = t.def; });
                        cfg.titles[key] = v || def;
                        box.value = cfg.titles[key];
                        save();
                    }
                    // Keep typing from reaching the game's keyboard shortcuts.
                    ["keydown", "keyup", "keypress"].forEach(function (ev) {
                        box.addEventListener(ev, function (e) {
                            e.stopPropagation();
                            if (ev === "keydown" && e.key === "Enter") { commit(); box.blur(); }
                        });
                    });
                    box.addEventListener("change", commit);
                    box.addEventListener("blur", commit);
                });
            },
            onAct: function (act) {
                var a = String(act || "").split(":");
                if (a[0] === "mode" && MODE_TEXT[a[1]]) cfg.mode = a[1];
                else if (a[0] === "masc") { cfg.mascMax += Number(a[1]) || 0; if (cfg.femMin <= cfg.mascMax) cfg.femMin = cfg.mascMax + 1; }
                else if (a[0] === "fem") { cfg.femMin += Number(a[1]) || 0; if (cfg.femMin <= cfg.mascMax) cfg.mascMax = cfg.femMin - 1; }
                else if (a[0] === "refl") cfg.reflexive = cfg.reflexive === "themself" ? "themselves" : "themself";
                else if (a[0] === "reset") { cfg.mascMax = DEFAULTS.mascMax; cfg.femMin = DEFAULTS.femMin; }
                else if (a[0] === "titles-reset") TITLES.forEach(function (t) { cfg.titles[t.key] = t.def; });
                else return false;
                save();
                return true;
            }
        });
        return true;
    }

    /* ---------- Boot ---------- */
    if (!register()) {
        var regTries = 0;
        var regTimer = setInterval(function () { if (register() || ++regTries >= 150) clearInterval(regTimer); }, 200);
    }
    // window.pc is created when a game starts or loads; the class stays the same after that.
    var bootTries = 0;
    (function boot() {
        var a = patchParser(), b = patchPlayer();
        if (a && b) return;
        if (++bootTries < 1800) setTimeout(boot, 500);
    })();
})();
