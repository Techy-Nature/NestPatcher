/*
 * TN_SaveFixer_v2.8.js - Save Fixer for the TN mod pack (TiTS 0.9.168), Modv2.8
 * ---------------------------------------------------------------------------
 * Loading a save slot used to hang on "Loading your save from slot N..." whenever
 * something went wrong, because the game only catches load errors for Load From File.
 * This mod catches them for save slots too, and tries to fix the save in this order:
 *   1. Migrate. If the save names an item, character or other object the game
 *      doesn't know, the fixer looks for the name a mod uses for it now (old Kitty
 *      names -> TN names, a changed capital letter, a version number in the name,
 *      or an entry in RENAMED below) and loads the save with the new name.
 *   2. Wait. If nothing matches, it keeps retrying for a minute, because a mod may
 *      still be starting up and add its items a few seconds late.
 *   3. Only then it asks whether to load the save without that mod's pieces.
 *      Afterwards it lists what it renamed or left out. Save to a NEW slot, so the
 *      original stays untouched in case you want it back after fixing the mod.
 *   - A slot that is still "Loading..." after a minute gets a dialog with a Close
 *     button instead of hanging forever.
 *   - Other errors (a mod failing on the first screen after loading) are shown with
 *     the mod's error text, so they can be reported.
 * Toggle: Options -> Android Mods -> "Save Fixer" (on by default).
 * Uses the 0.9.168 webpack module 54014 (save registry), unchanged since 0.9.166.
 * In-game author: Techy-Nest.
 */
(function () {
    "use strict";
    if (window.__tnSaveFixerInstalled) return;
    window.__tnSaveFixerInstalled = true;

    var MOD_ID = "tn.savefixer";
    var WAIT_MS = 60000;    // how long to keep retrying before asking to leave a mod out
    var RETRY_MS = 5000;    // retry interval during that minute
    var SLOT_HANG_MS = 60000;

    // Old name -> current name, for renames the automatic matching can't guess.
    // Add a line here whenever a mod changes a class name.
    var RENAMED = {
    };

    // Which mod each class name belongs to, so the question can name the mod.
    var MOD_OF = {
        Chimerune: "Chimerune", Draconilum: "Draconilum", Gryphonix: "Gryphonix",
        Drakongaru: "Drakongaru", DrakoHornitol: "DrakoHornitol", DragoHornitol: "DragoHornitol",
        QuadWingPop: "Quad-Wing Pop", QuadBatPop: "Quad-Bat Pop", QuadDracoPop: "Quad-Draco Pop",
        Virine: "Virine", Lerris: "Virine",
        TnHoloChastityBelt: "Holo-Lock Chastity", TnHoloChastityCage: "Holo-Lock Chastity",
        TnHoloboard: "Anno's Holoboard",
        StephIrson: "Steph Irson", StellaDAmore: "Stella", Zheniya: "Zheniya",
        OverqueenYsolte: "Overqueen Recruit"
    };

    function enabled() {
        try {
            if (window.tnModMenuActive === true && typeof window.isTnModEnabled === "function") return window.isTnModEnabled(MOD_ID);
        } catch (err) {}
        return true;
    }
    function log(msg) {
        try { console.warn("[TN Save Fixer] " + msg); } catch (err) {}
        try { if (typeof window.tnDebugLog === "function") window.tnDebugLog("Save Fixer: " + msg); } catch (err2) {}
    }
    function esc(text) {
        return String(text == null ? "" : text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function errText(err) {
        if (!err) return "Unknown error";
        var m = err.message || String(err);
        return m.length > 400 ? m.slice(0, 400) + "..." : m;
    }
    function unmutate() { try { if (typeof window.SetGamestateMutation === "function") window.SetGamestateMutation(false); } catch (err) {} }

    var registry = null;

    // ---- The game names the one class it can't find: "Unable to find classInstance with name X".
    function missingName(err) {
        var m = /Unable to find classInstance with name ([^\s"'<]+)/.exec(errText(err));
        return m ? m[1] : null;
    }
    function known() {
        try { return (registry && registry.RegisteredClasses) || {}; } catch (err) { return {}; }
    }
    function isKnown(name) { return Object.prototype.hasOwnProperty.call(known(), name); }
    function modOf(name) { return MOD_OF[name] || MOD_OF[name.replace(/^Kitty/, "Tn")] || null; }

    // ---- Step 1: find the name a mod uses now for an old class name.
    function squash(name) {
        return String(name).toLowerCase().replace(/[^a-z0-9]/g, "")
            .replace(/^(kitty|tn)/, "").replace(/v\d+$/, "");
    }
    function migrateName(old) {
        if (RENAMED[old] && isKnown(RENAMED[old])) return RENAMED[old];
        var tries = [old.replace(/^Kitty/, "Tn"), old.replace(/^kitty/, "tn"), old.replace(/^KITTY_/, "TN_"),
            old.replace(/^Kitty/, ""), "Tn" + old];
        for (var i = 0; i < tries.length; i++) if (tries[i] !== old && isKnown(tries[i])) return tries[i];
        // Same name apart from capitals, punctuation, a Kitty/TN prefix or a version number;
        // only used when exactly one current class matches.
        var key = squash(old), hits = [];
        if (key.length < 3) return null;
        Object.keys(known()).forEach(function (k) { if (k !== old && squash(k) === key) hits.push(k); });
        return hits.length === 1 ? hits[0] : null;
    }

    function where(path) { return path.length ? path.join(" > ") : "save"; }
    // Walks the save once: renames classInstance values found in `renames`, and leaves out
    // every object whose classInstance is in `drop` (array entries removed, object keys deleted).
    function rework(node, renames, drop) {
        var changed = [], dropped = [];
        (function walk(obj, path) {
            if (!obj || typeof obj !== "object") return;
            if (!Array.isArray(obj) && typeof obj.classInstance === "string" && Object.prototype.hasOwnProperty.call(renames, obj.classInstance)) {
                changed.push({ name: obj.classInstance + " -> " + renames[obj.classInstance], path: where(path) });
                obj.classInstance = renames[obj.classInstance];
            }
            function bad(v) { return v && typeof v === "object" && !Array.isArray(v) && typeof v.classInstance === "string" && drop.indexOf(v.classInstance) >= 0; }
            if (Array.isArray(obj)) {
                for (var i = obj.length - 1; i >= 0; i--) {
                    if (bad(obj[i])) { dropped.push({ name: obj[i].classInstance, path: where(path) }); obj.splice(i, 1); }
                    else walk(obj[i], path);
                }
                return;
            }
            Object.keys(obj).forEach(function (k) {
                if (bad(obj[k])) { dropped.push({ name: obj[k].classInstance, path: where(path.concat(k)) }); delete obj[k]; }
                else walk(obj[k], path.concat(k));
            });
        })(node, []);
        return { changed: changed, dropped: dropped };
    }
    function listHtml(found) {
        var seen = {}, rows = [];
        found.forEach(function (x) {
            var key = x.name + " @ " + x.path;
            seen[key] = (seen[key] || 0) + 1;
        });
        Object.keys(seen).slice(0, 12).forEach(function (k) { rows.push("<li>" + esc(k) + (seen[k] > 1 ? " (x" + seen[k] + ")" : "") + "</li>"); });
        if (Object.keys(seen).length > 12) rows.push("<li>...and " + (Object.keys(seen).length - 12) + " more</li>");
        return "<ul>" + rows.join("") + "</ul>";
    }
    function countOf(raw, name) {
        try { return rework(JSON.parse(raw), {}, [name]).dropped; } catch (err) { return []; }
    }

    // ---- Dialogs
    var dialogType = null;
    function show(title, body, buttons) {
        try { window.showDialog(dialogType, title, body, buttons); }
        catch (err) { log("couldn't show a dialog: " + errText(err)); }
    }
    function close() { try { window.removeDialog(); } catch (err) {} unmutate(); }

    function failed(err, raw, done, actual, stage) {
        log("load failed (" + stage + "): " + errText(err));
        var name = stage === "read" && raw ? missingName(err) : null;
        if (name && countOf(raw, name).length) { new Repair(raw, done, actual).run(); return; }
        var body = "<b>This save hit an error while loading.</b><br/><br/><code>" + esc(errText(err)) + "</code><br/><br/>";
        if (stage === "after") {
            body += "The save itself loaded, but a mod failed while drawing the first screen. Try <b>Close</b> and then move one room; if that works, keep playing. Please report the error text above (Options -> Android Mods -> Debug Mode -> TN DEBUG has the full log).";
        } else {
            body += "There's nothing the Save Fixer can safely change or leave out. Please report the error text above. Load From File with an exported copy may still work.";
        }
        show("Save Didn't Load", body, [{ txt: "Close", f: close }]);
    }

    // ---- Steps 1-3: migrate, wait a minute, then ask before leaving anything out.
    function Repair(raw, done, actual) {
        this.raw = raw; this.done = done; this.actual = actual;
        this.renames = {}; this.drop = []; this.started = Date.now(); this.timer = null; this.cancelled = false;
    }
    Repair.prototype.cancel = function () {
        this.cancelled = true;
        if (this.timer) clearTimeout(this.timer);
        close();
    };
    // One load attempt with the current renames and leave-outs. Returns
    // {ok:true, result} or {stuck:name} or {err, stage}.
    Repair.prototype.attempt = function () {
        for (var round = 0; round < 40; round++) {
            var save;
            try { save = JSON.parse(this.raw); } catch (err) { return { err: err, stage: "repair" }; }
            var result = rework(save, this.renames, this.drop);
            var loadedOk = false, laterErr = null, done = this.done;
            var after = function () {
                loadedOk = true;
                var r;
                try { r = done.apply(this, arguments); } catch (e3) { laterErr = e3; }
                return r;
            };
            try { this.actual(save, after); }
            catch (err) {
                var name = missingName(err);
                if (loadedOk || !name) return { err: err, stage: loadedOk ? "after" : "repair" };
                var now = migrateName(name);
                if (now && !this.renames[name]) { this.renames[name] = now; log("migrating " + name + " -> " + now); continue; }
                return { stuck: name };
            }
            if (laterErr) return { err: laterErr, stage: "after" };
            return { ok: true, result: result };
        }
        return { err: new Error("Too many unknown names in this save"), stage: "repair" };
    };
    Repair.prototype.run = function () {
        if (this.cancelled) return;
        var self = this, r = this.attempt();
        if (r.ok) { this.finish(r.result); return; }
        if (r.err) { failed(r.err, null, this.done, this.actual, r.stage); return; }
        var name = r.stuck, mod = modOf(name), left = WAIT_MS - (Date.now() - this.started);
        if (left > 0) {
            // Step 2: a mod may still be starting up; keep retrying for the rest of the minute.
            show("Repairing Save",
                "<b>This save holds " + esc(name) + "</b>" + (mod ? " from <b>" + esc(mod) + "</b>" : "") +
                ", which the game doesn't recognise yet. " +
                (Object.keys(this.renames).length ? "Old names updated so far: " + esc(Object.keys(this.renames).length) + ". " : "") +
                "No match under a newer name, so the Save Fixer is giving the mods a minute to finish loading and retrying every few seconds." +
                "<br/><br/>About " + Math.ceil(left / 1000) + " seconds left. Nothing has been left out of the save.",
                [{ txt: "Stop", f: function () { self.cancel(); } }]);
            this.timer = setTimeout(function () { self.run(); }, Math.min(RETRY_MS, left));
            return;
        }
        // Step 3: it's still stuck after a minute, so ask.
        var pieces = countOf(this.raw, name);
        show("Save Still Won't Load",
            "<b>After a minute, the game still doesn't recognise " + esc(name) + "</b>" +
            (mod ? ", which comes from <b>" + esc(mod) + "</b>. That mod is most likely off, renamed or didn't patch." : ". The mod it came from is most likely off, renamed or didn't patch.") +
            listHtml(pieces) +
            "<b>Load Without It</b> leaves " + (mod ? esc(mod) + "'s" : "those") + " pieces out of this load and keeps everything else. " +
            "Then save to a <b>new</b> slot, so this one stays as it is for when the mod works again.",
            [{ txt: "Load Without It", f: function () { self.drop.push(name); self.run(); } },
             { txt: "Wait Longer", f: function () { self.started = Date.now(); self.run(); } },
             { txt: "Close", f: function () { self.cancel(); } }]);
    };
    Repair.prototype.finish = function (result) {
        log("repaired: " + result.changed.length + " renamed, " + result.dropped.length + " left out");
        var body = "<b>Loaded.</b>";
        if (result.changed.length) body += " These were updated to the names the mods use now:" + listHtml(result.changed);
        if (result.dropped.length) body += " These were left out because the game didn't recognise them:" + listHtml(result.dropped);
        body += "<b>Save to a new slot now.</b>" + (result.dropped.length ? " The old slot still has the left-out pieces, if you get the mod working again." : "");
        setTimeout(function () { show("Save Repaired", body, [{ txt: "OK", f: close }]); }, 50);
    };

    // ---- Hook the slot loader
    function install(req) {
        var mod = req(54014);
        registry = mod && mod.yq;
        if (!registry || typeof registry.loadFromSlot_Actual !== "function") { log("save registry not found; Save Fixer is off"); return; }
        if (registry.loadFromSlot_Actual.__tnSaveFixer) return;
        var actual = registry.loadFromSlot_Actual;
        var wrapped = function (save, done) {
            var self = this;
            if (!enabled()) return actual.apply(self, arguments);
            reached = true;
            try { dialogType = window.ui && window.ui.state ? window.ui.state.modalType : dialogType; } catch (e0) {}
            var raw = null;
            try { raw = JSON.stringify(save); } catch (e1) {}   // loadSaveObject edits the object, so keep a copy
            var stage = "read";
            var guarded = function () {
                stage = "after";
                return done.apply(this, arguments);
            };
            try { return actual.call(self, save, guarded); }
            catch (err) {
                failed(err, raw, done, function (s, d) { return actual.call(self, s, d); }, stage);
            }
        };
        wrapped.__tnSaveFixer = true;
        registry.loadFromSlot_Actual = wrapped;

        // Errors before that point (an unreadable or corrupt slot) end up as a rejected promise,
        // and a slot that never finishes reading gets a Close button after a minute.
        var reached = false;
        var fromSlot = registry.loadFromSlot;
        if (typeof fromSlot === "function" && !fromSlot.__tnSaveFixer) {
            var ws = function () {
                if (!enabled()) return fromSlot.apply(this, arguments);
                reached = false;
                var settled = false;
                try { dialogType = window.ui && window.ui.state ? window.ui.state.modalType : dialogType; } catch (e0) {}
                var hang = setTimeout(function () {
                    if (settled || reached) return;
                    log("slot still loading after a minute");
                    show("Still Loading",
                        "<b>This save slot hasn't finished reading after a minute.</b><br/><br/>On a slow device it can take a while, so you can keep waiting. " +
                        "If it never finishes, <b>Close</b> this, then try Load From File with an exported copy, or re-save into the slot from a save that works.",
                        [{ txt: "Keep Waiting", f: function () { try { window.removeDialog(); } catch (e) {} } }, { txt: "Close", f: close }]);
                }, SLOT_HANG_MS);
                var p = fromSlot.apply(this, arguments);
                if (p && typeof p.then === "function") {
                    return p.then(function (v) { settled = true; clearTimeout(hang); return v; }, function (err) {
                        settled = true; clearTimeout(hang);
                        try { dialogType = window.ui && window.ui.state ? window.ui.state.modalType : dialogType; } catch (e0) {}
                        failed(err, null, null, null, "slot");
                    });
                }
                settled = true; clearTimeout(hang);
                return p;
            };
            ws.__tnSaveFixer = true;
            registry.loadFromSlot = ws;
        }
        log("ready");
    }

    function boot(tries) {
        var chunks = self.webpackChunktits_html;
        if (!chunks || typeof chunks.push !== "function") {
            if (tries < 120) setTimeout(function () { boot(tries + 1); }, 500);
            return;
        }
        try {
            chunks.push([["tn-savefixer-" + tries], {}, function (req) {
                try { install(req); }
                catch (err) {
                    log("install failed: " + errText(err));
                    if (tries < 20) setTimeout(function () { boot(tries + 1); }, 1000);
                }
            }]);
        } catch (err) { log("no webpack access: " + errText(err)); }
    }
    boot(0);

    // ---- Mod menu entry
    function register(tries) {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") {
            if (tries < 120) setTimeout(function () { register(tries + 1); }, 500);
            return;
        }
        window.registerModMenu({
            id: MOD_ID,
            name: "Save Fixer",
            author: "Techy-Nest",
            description: "If a save slot fails to load, shows the error instead of hanging on \"Loading...\". Saves with old item or character names are updated to the names the mods use now; only if that still fails after a minute does it ask to load without that mod's pieces.",
            supportsToggle: true
        });
    }
    register(0);
})();
