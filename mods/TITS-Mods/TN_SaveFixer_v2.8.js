/*
 * TN_SaveFixer_v2.8.js - Save Fixer for the TN mod pack (TiTS 0.9.168), Modv2.8
 * ---------------------------------------------------------------------------
 * Loading a save slot used to hang on "Loading your save from slot N..." whenever
 * something went wrong, because the game only catches load errors for Load From File.
 * This mod catches them for save slots too:
 *   - Instead of hanging, the game shows "Save Didn't Load" with the actual error.
 *   - If the save holds an item, character or other object the game doesn't know
 *     (usually from a mod that was removed, renamed or failed to patch), it offers
 *     "Repair & Load": those pieces are left out and the rest of the save loads.
 *     Afterwards it lists what was left out. Save to a NEW slot first, so the
 *     original stays untouched in case you want it back after fixing the mod.
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
    function where(path) { return path.length ? path.join(" > ") : "save"; }
    // Walks the save and leaves out every object whose classInstance is in `names`
    // (array entries are removed, object keys deleted). Returns [{name, path}].
    function strip(node, names) {
        var found = [];
        function bad(v) { return v && typeof v === "object" && !Array.isArray(v) && typeof v.classInstance === "string" && names.indexOf(v.classInstance) >= 0; }
        (function walk(obj, path) {
            if (!obj || typeof obj !== "object") return;
            if (Array.isArray(obj)) {
                for (var i = obj.length - 1; i >= 0; i--) {
                    if (bad(obj[i])) { found.push({ name: obj[i].classInstance, path: where(path) }); obj.splice(i, 1); }
                    else walk(obj[i], path);
                }
                return;
            }
            Object.keys(obj).forEach(function (k) {
                if (bad(obj[k])) { found.push({ name: obj[k].classInstance, path: where(path.concat(k)) }); delete obj[k]; }
                else walk(obj[k], path.concat(k));
            });
        })(node, []);
        return found;
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
        var found = [];
        if (name) { try { found = strip(JSON.parse(raw), [name]); } catch (e2) {} }
        var fixable = found.length > 0;
        var body = "<b>This save hit an error while loading.</b><br/><br/><code>" + esc(errText(err)) + "</code><br/><br/>";
        var buttons = [];
        if (fixable) {
            body += "It holds <b>" + esc(name) + "</b>, which the game doesn't recognise, most likely from a mod that's off, renamed or didn't patch:" + listHtml(found) +
                "<b>Repair &amp; Load</b> leaves those out and loads the rest. Then save to a <b>new</b> slot, so this one stays as it is.";
            buttons.push({ txt: "Repair & Load", f: function () { repair(raw, done, actual); } });
        } else if (stage === "after") {
            body += "The save itself loaded, but a mod failed while drawing the first screen. Try <b>Close</b> and then move one room; if that works, keep playing. Please report the error text above (Options -> Android Mods -> Debug Mode -> TN DEBUG has the full log).";
        } else {
            body += "There's nothing the Save Fixer can safely leave out. Please report the error text above. Load From File with an exported copy may still work.";
        }
        buttons.push({ txt: "Close", f: close });
        show("Save Didn't Load", body, buttons);
    }

    function repair(raw, done, actual) {
        // Leave out the class the game named, try again, and repeat if it names another one.
        var names = [], removed = [], lastErr = null;
        for (var round = 0; round < 25; round++) {
            var save;
            try { save = JSON.parse(raw); } catch (err) { failed(err, null, done, actual, "repair"); return; }
            removed = strip(save, names);
            var loadedOk = false, laterErr = null;
            var after = function () {
                loadedOk = true;
                var r;
                try { r = done.apply(this, arguments); } catch (e3) { laterErr = e3; }
                return r;
            };
            try { actual(save, after); }
            catch (err) {
                lastErr = err;
                var name = missingName(err);
                if (!loadedOk && name && names.indexOf(name) < 0) { names.push(name); continue; }
                failed(err, null, done, actual, loadedOk ? "after" : "repair");
                return;
            }
            log("repair left out " + removed.length + " piece(s): " + names.join(", "));
            if (laterErr) { failed(laterErr, null, done, actual, "after"); return; }
            setTimeout(function () {
                show("Save Repaired",
                    "<b>Loaded.</b> These were left out because the game didn't recognise them:" + listHtml(removed) +
                    "<b>Save to a new slot now.</b> The old slot still has them, if you get the mod working again.",
                    [{ txt: "OK", f: close }]);
            }, 50);
            return;
        }
        failed(lastErr, null, done, actual, "repair");
    }

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

        // Errors before that point (an unreadable or corrupt slot) end up as a rejected promise.
        var fromSlot = registry.loadFromSlot;
        if (typeof fromSlot === "function" && !fromSlot.__tnSaveFixer) {
            var ws = function () {
                var p = fromSlot.apply(this, arguments);
                if (p && typeof p.catch === "function" && enabled()) {
                    return p.catch(function (err) {
                        try { dialogType = window.ui && window.ui.state ? window.ui.state.modalType : dialogType; } catch (e0) {}
                        failed(err, null, null, null, "slot");
                    });
                }
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
            description: "If a save slot fails to load, shows the error instead of hanging on \"Loading...\", and offers Repair & Load when the save holds items or characters the game doesn't recognise.",
            supportsToggle: true
        });
    }
    register(0);
})();
