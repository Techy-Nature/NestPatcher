/* TN Haptics Plus for Trials in Tainted Space (Modv3.0, checked against 0.9.168).
   More control over the game's own buttplug.io haptics (Options > Haptics).

   - Max intensity, Manual: a cap on the header vibrate button. The game's own
     "Vibration Intensity" still sets the level; this mod never lets it go higher.
   - Max intensity, Auto: a cap for Auto mode. The game normally sets 50% for a nude
     bust and 100% for an orgasm, with no way to turn them down.
   - Ramp-up (Manual and Auto, each 0 to 10 seconds): the buzz climbs smoothly to its
     level instead of jumping straight there. Going down is always instant.
   - Orgasm length: Auto mode's orgasm buzz can end after 5 to 30 seconds and drop
     back to the level from before, instead of lasting until you leave the scene.
   - Triggers: pick which game events start Auto mode, each with its own level:
       1. A nude bust is shown (any nude bust, NPC busts only, or off).
       2. An orgasm in a sex scene (a nude bust was shown since the last room menu).
       3. An orgasm outside a scene (items, transformatives, etc.).
       4. An orgasm in a fight.
   - Test and Stop now buttons on the settings page.

   Settings are on the "Haptics Plus" page of Android Mods (Android) or TN Mod Settings
   (desktop). They are device-wide (localStorage), like the game's own haptics options.
   This mod sends nothing anywhere. It only changes the levels the game already sends
   to your own buttplug.io server (Intiface Central on this device or your network). */
(function () {
    "use strict";
    if (window.tnHapticsPlus) return;

    var MOD_ID = "TN_HapticsPlus";
    var STORAGE_KEY = "tn.hapticsPlus.v1";
    var STEP_MS = 200;          // ramp step: 5 commands a second is gentle on the server
    var MODE_AUTO = 2;          // the game's haptics modes: Off 0, Manual 1, Auto 2
    var MODE_OFF = 0;
    var GROUND_COMBAT = 8;      // ui.state.mainElement in a fight (read from the game when it can)
    var GAME_NUDE = 0.5;        // the levels the game asks for in Auto mode
    var GAME_ORGASM = 1;
    var RAMP_STEPS = [0, 1, 2, 3, 4, 5, 6, 8, 10];
    var ORGASM_STEPS = [0, 5, 10, 15, 20, 30];
    var NUDE_MODES = ["any", "npc", "off"];

    var DEFAULTS = {
        manualCap: 100,
        autoCap: 100,
        manualRamp: 3,
        autoRamp: 3,
        orgasmSecs: 0,
        nude: "any", nudeLevel: 50,
        sceneOrgasm: true, sceneOrgasmLevel: 100,
        otherOrgasm: true, otherOrgasmLevel: 100,
        fightOrgasm: true, fightOrgasmLevel: 100
    };

    var cfg = load();
    var view = "main";
    var H = null;               // the game's haptics controller
    var orig = {};
    var hooked = false;

    // What the mod is doing right now.
    var state = {
        source: "",             // "manual", "auto" or "test": who started the current buzz
        target: 0,              // level the current ramp is heading to (0..1)
        rampToken: 0,
        rampTimer: null,
        orgasmTimer: null,
        orgasmUntil: 0,
        baseLevel: 0,           // level to fall back to after an orgasm burst
        nudeSeen: false,        // a nude bust was shown since the last room menu
        lastBust: null,
        lastBustAt: 0,
        lastEvent: "none yet"
    };

    function clampInt(v, lo, hi, dflt) {
        v = Math.round(Number(v));
        if (!isFinite(v)) return dflt;
        return Math.min(hi, Math.max(lo, v));
    }

    function load() {
        var c = JSON.parse(JSON.stringify(DEFAULTS));
        try {
            var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
            if (saved && typeof saved === "object") {
                Object.keys(DEFAULTS).forEach(function (k) {
                    if (!(k in saved)) return;
                    var d = DEFAULTS[k];
                    if (typeof d === "boolean") c[k] = saved[k] === true;
                    else if (typeof d === "number") c[k] = clampInt(saved[k], 0, 100, d);
                    else if (k === "nude" && NUDE_MODES.indexOf(saved[k]) >= 0) c[k] = saved[k];
                });
            }
        } catch (err) { console.warn("[TN] Haptics Plus settings unreadable", err); }
        c.manualCap = Math.max(5, c.manualCap);
        c.autoCap = Math.max(5, c.autoCap);
        c.manualRamp = Math.min(10, c.manualRamp);
        c.autoRamp = Math.min(10, c.autoRamp);
        c.orgasmSecs = Math.min(60, c.orgasmSecs);
        return c;
    }

    function save() {
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); }
        catch (err) { console.warn("[TN] Haptics Plus settings not saved", err); }
    }

    function active() {
        return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") ||
            window.isTnModEnabled(MOD_ID);
    }

    function log(msg) {
        try { if (typeof window.tnDebugLog === "function") window.tnDebugLog("Haptics Plus: " + msg); } catch (err) {}
    }

    function mode() {
        try { return H ? H.mode : MODE_OFF; } catch (err) { return MODE_OFF; }
    }

    function capFor(source) {
        return (source === "manual" ? cfg.manualCap : cfg.autoCap) / 100;
    }

    function clamp01(v) { return Math.min(1, Math.max(0, Number(v) || 0)); }

    // ---------- ramping ----------

    function cancelRamp() {
        state.rampToken++;
        if (state.rampTimer) clearTimeout(state.rampTimer);
        state.rampTimer = null;
    }

    function cancelOrgasm() {
        if (state.orgasmTimer) clearTimeout(state.orgasmTimer);
        state.orgasmTimer = null;
        state.orgasmUntil = 0;
    }

    function current() {
        return H && H._vibrating ? clamp01(H._currentIntensity) : 0;
    }

    // Climb from the current level to `target` (0..1) over `secs` seconds.
    // Lower targets are set at once. Every step goes through the capped setVibrating.
    function rampTo(target, secs, source) {
        cancelRamp();
        target = Math.min(clamp01(target), capFor(source));
        state.source = source;
        state.target = target;
        var token = state.rampToken;
        var from = current();
        if (!(secs > 0) || target <= from + 0.005) {
            return H.setVibrating(true, target).catch(function () {});
        }
        var start = Date.now();
        var dur = secs * 1000;
        return new Promise(function (resolve) {
            function step() {
                if (token !== state.rampToken) return resolve(false);
                var t = Math.min(1, (Date.now() - start) / dur);
                var level = Math.round((from + (target - from) * t) * 100) / 100;
                if (level < 0.01) level = 0.01;
                H.setVibrating(true, level).catch(function () {}).then(function () {
                    if (token !== state.rampToken) return resolve(false);
                    if (t >= 1 || !H._vibrating) { state.rampTimer = null; return resolve(true); }
                    state.rampTimer = setTimeout(step, STEP_MS);
                });
            }
            step();
        });
    }

    function stopAll(reason) {
        cancelRamp();
        cancelOrgasm();
        state.source = "";
        state.target = 0;
        state.baseLevel = 0;
        if (reason) state.lastEvent = reason;
        if (!H) return Promise.resolve();
        return orig.setVibrating.call(H, false).catch(function () {});
    }

    // ---------- what started an Auto buzz ----------

    function flatten(args, out) {
        for (var i = 0; i < args.length; i++) {
            var a = args[i];
            if (Array.isArray(a)) flatten(a, out);
            else if (typeof a === "string") out.push(a);
        }
        return out;
    }

    function noteBust(args) {
        state.lastBust = flatten(args, []);
        state.lastBustAt = Date.now();
    }

    // "npc", "pc" (only your own nude bust) or "unknown".
    function nudeKind() {
        if (!state.lastBust || Date.now() - state.lastBustAt > 250) return "unknown";
        var nude = state.lastBust.filter(function (b) { return /nude/i.test(b); });
        if (!nude.length) return "unknown";
        return nude.every(function (b) { return /^PC(_|$)/i.test(b); }) ? "pc" : "npc";
    }

    function inFight() {
        try { if (window.ui && window.ui.state && window.ui.state.mainElement === GROUND_COMBAT) return true; } catch (err) {}
        return window.inCombat === true;
    }

    // Returns { label, level (0..1) } or null when this trigger is switched off.
    function classify(level) {
        if (level === GAME_NUDE) {
            var kind = nudeKind();
            if (kind !== "pc") state.nudeSeen = true;
            if (cfg.nude === "off") return { label: "nude bust (trigger off)", off: true };
            if (cfg.nude === "npc" && kind === "pc") return { label: "your own nude bust (NPC only)", off: true };
            return { label: kind === "pc" ? "your nude bust" : "nude bust", level: cfg.nudeLevel / 100 };
        }
        if (level === GAME_ORGASM) {
            if (inFight()) return cfg.fightOrgasm ? { label: "orgasm in a fight", level: cfg.fightOrgasmLevel / 100, orgasm: true } :
                { label: "orgasm in a fight (trigger off)", off: true };
            if (state.nudeSeen) return cfg.sceneOrgasm ? { label: "orgasm in a sex scene", level: cfg.sceneOrgasmLevel / 100, orgasm: true } :
                { label: "orgasm in a sex scene (trigger off)", off: true };
            return cfg.otherOrgasm ? { label: "orgasm outside a scene", level: cfg.otherOrgasmLevel / 100, orgasm: true } :
                { label: "orgasm outside a scene (trigger off)", off: true };
        }
        // Anything else (another mod, a future game version): treat as its own level.
        return { label: "game asked for " + Math.round(level * 100) + "%", level: clamp01(level) };
    }

    // ---------- replacements for the game's controller methods ----------

    function setVibratingCapped(on, level) {
        if (!active()) return orig.setVibrating.apply(this, arguments);
        if (!on) {
            cancelRamp();
            cancelOrgasm();
            state.source = "";
            return orig.setVibrating.call(this, false);
        }
        var source = state.source || (mode() === MODE_AUTO ? "auto" : "manual");
        if (level == null) {
            // The game re-sends "on" after an options change. Keep the mod's level.
            level = state.source && state.target ? state.target : this.intensity;
        }
        level = Math.min(clamp01(level), capFor(source));
        return orig.setVibrating.call(this, true, level);
    }

    function toggle() {
        if (!active()) return orig.toggle.apply(this, arguments);
        if (this._vibrating || state.rampTimer) return stopAll("you stopped it");
        cancelOrgasm();
        state.lastEvent = "you started it";
        return rampTo(this.intensity, cfg.manualRamp, "manual");
    }

    function autoVibrate(level) {
        if (!active()) return orig.autoVibrate.apply(this, arguments);
        var trig = classify(level);
        if (this.mode !== MODE_AUTO || !this.available) return;
        if (trig.off) { state.lastEvent = trig.label; return; }
        var target = Math.min(trig.level, capFor("auto"));
        if (state.orgasmUntil && !trig.orgasm) {
            // An orgasm burst is running: remember this level for afterwards.
            state.baseLevel = target;
            return;
        }
        if (state.source === "auto" && Math.abs(state.target - target) < 0.005 && (this._vibrating || state.rampTimer)) return;
        state.lastEvent = trig.label + " (" + Math.round(target * 100) + "%)";
        log(state.lastEvent);
        if (trig.orgasm) {
            var wasAuto = state.source === "auto" && (this._vibrating || state.rampTimer);
            state.baseLevel = !wasAuto ? 0 : state.orgasmUntil ? state.baseLevel : state.target;
            startOrgasmTimer();
        } else {
            state.baseLevel = target;
        }
        rampTo(target, cfg.autoRamp, "auto");
    }

    function startOrgasmTimer() {
        cancelOrgasm();
        if (!(cfg.orgasmSecs > 0)) return;
        state.orgasmUntil = Date.now() + cfg.orgasmSecs * 1000;
        state.orgasmTimer = setTimeout(function () {
            state.orgasmTimer = null;
            state.orgasmUntil = 0;
            if (!H || state.source !== "auto") return;
            if (state.baseLevel > 0.005) {
                state.lastEvent = "orgasm over, back to " + Math.round(state.baseLevel * 100) + "%";
                rampTo(state.baseLevel, 0, "auto");
            } else {
                stopAll("orgasm over, stopped");
            }
        }, cfg.orgasmSecs * 1000);
    }

    function autoStop() {
        // The game calls this from the room menu: the scene is over.
        state.nudeSeen = false;
        if (!active()) return orig.autoStop.apply(this, arguments);
        if (this.mode !== MODE_AUTO) return;
        if (this._vibrating || state.rampTimer) stopAll("scene over, stopped");
    }

    function stopWrapped() {
        cancelRamp();
        cancelOrgasm();
        state.source = "";
        return orig.stop.apply(this, arguments);
    }

    function wrapBust(owner, key) {
        var fn = owner && owner[key];
        if (typeof fn !== "function" || fn.__tnHaptics) return;
        var w = function () {
            try { noteBust(Array.prototype.slice.call(arguments)); } catch (err) {}
            return fn.apply(this, arguments);
        };
        w.__tnHaptics = true;
        owner[key] = w;
    }

    function install(req) {
        if (hooked) return true;
        var mod = req(21599);
        var ctl = mod && mod.ej;
        if (!ctl || typeof ctl.setVibrating !== "function" || typeof ctl.autoVibrate !== "function") return false;
        try {
            var screens = req(47349);
            if (screens && screens.gO && typeof screens.gO.GROUND_COMBAT === "number") GROUND_COMBAT = screens.gO.GROUND_COMBAT;
        } catch (err) {}
        try {
            var opts = req(77231);
            if (opts && opts.yO && typeof opts.yO.Auto === "number") { MODE_AUTO = opts.yO.Auto; MODE_OFF = opts.yO.Off; }
        } catch (err) {}
        H = ctl;
        ["setVibrating", "toggle", "autoVibrate", "autoStop", "stop"].forEach(function (k) { orig[k] = ctl[k]; });
        // Own properties on the one controller object shadow its class methods.
        ctl.setVibrating = setVibratingCapped;
        ctl.toggle = toggle;
        ctl.autoVibrate = autoVibrate;
        ctl.autoStop = autoStop;
        ctl.stop = stopWrapped;
        hooked = true;
        log("hooked the game's haptics controller");
        return true;
    }

    function boot(tries) {
        var chunks = self.webpackChunktits_html;
        if (!chunks || typeof chunks.push !== "function") {
            if (tries < 120) setTimeout(function () { boot(tries + 1); }, 500);
            return;
        }
        try {
            chunks.push([["tn-hapticsplus-" + tries], {}, function (req) {
                var ok = false;
                try { ok = install(req); } catch (err) { console.warn("[TN] Haptics Plus hook failed", err); }
                if (!ok && tries < 40) setTimeout(function () { boot(tries + 1); }, 1000);
            }]);
        } catch (err) {}
    }

    // ---------- settings page ----------

    function pct(v) { return v + "%"; }
    function secs(v) { return v > 0 ? v + " s" : "off"; }
    function nudeLabel() { return cfg.nude === "any" ? "Any nude bust" : cfg.nude === "npc" ? "NPC nude busts only" : "Off"; }
    function onOff(v) { return v ? "On" : "Off"; }

    function statusLine() {
        if (!H) return "Waiting for the game's haptics to load.";
        var opts = (window.game && window.game.gameOptions) || {};
        if (opts.hapticsEnabled !== true) return "The game's Haptic Devices option is <b>Off</b> (Options > Haptics).";
        var m = mode();
        var name = m === MODE_AUTO ? "Auto" : m === MODE_OFF ? "Off" : "Manual";
        var devs = 0;
        try { devs = H.devices.length; } catch (err) {}
        return "Game mode: <b>" + name + "</b>. Devices found: <b>" + devs + "</b>" +
            (H.connected ? "" : " (no buttplug.io server connected)") + ". " +
            (H._vibrating ? "Buzzing at <b>" + Math.round(current() * 100) + "%</b>" +
                (state.rampTimer ? ", ramping to " + Math.round(state.target * 100) + "%" : "") + "." : "Not buzzing.") +
            "\nLast Auto event: " + state.lastEvent + ".";
    }

    function mainHtml() {
        var gameLevel = 50;
        try { gameLevel = Math.round(H.intensity * 100); } catch (err) {}
        var html = statusLine() + "\n\n";
        html += "<b>Max intensity, Manual:</b> " + pct(cfg.manualCap) +
            " (the game's own Vibration Intensity is " + gameLevel + "%, so the header button buzzes at " +
            Math.min(gameLevel, cfg.manualCap) + "%)\n";
        html += "<b>Max intensity, Auto:</b> " + pct(cfg.autoCap) + " (no trigger goes above this)\n";
        html += "<b>Ramp-up, Manual:</b> " + secs(cfg.manualRamp) + "\n";
        html += "<b>Ramp-up, Auto:</b> " + secs(cfg.autoRamp) + "\n";
        html += "<b>Orgasm buzz lasts:</b> " + (cfg.orgasmSecs > 0 ? cfg.orgasmSecs + " s, then back to the level before" : "until the scene ends (game default)") + "\n\n";
        html += "Ramp-up climbs smoothly to the level instead of jumping there; going down is always instant. " +
            "Pick which game events start Auto mode, and how hard, under <b>Triggers</b>.";
        html += '<button type="button" data-mod-act="manualCap:-5">Manual max −5%</button>';
        html += '<button type="button" data-mod-act="manualCap:5">Manual max +5%</button>';
        html += '<button type="button" data-mod-act="autoCap:-5">Auto max −5%</button>';
        html += '<button type="button" data-mod-act="autoCap:5">Auto max +5%</button>';
        html += '<button type="button" data-mod-act="ramp:manual">Manual ramp: ' + secs(cfg.manualRamp) + '</button>';
        html += '<button type="button" data-mod-act="ramp:auto">Auto ramp: ' + secs(cfg.autoRamp) + '</button>';
        html += '<button type="button" data-mod-act="orgasm">Orgasm: ' + (cfg.orgasmSecs > 0 ? cfg.orgasmSecs + " s" : "scene") + '</button>';
        html += '<button type="button" data-mod-act="view:triggers">Triggers</button>';
        html += '<button type="button" data-mod-act="test">Test Auto (5 s)</button>';
        html += '<button type="button" data-mod-act="stop">Stop now</button>';
        html += '<button type="button" data-mod-act="refresh">Refresh</button>';
        return html;
    }

    function triggersHtml() {
        var html = "Which game events start the buzz in <b>Auto</b> mode, and how hard. " +
            "Every level is still held under Auto max (" + pct(cfg.autoCap) + ").\n";
        html += "\n1. <b>Nude bust shown</b>: " + nudeLabel() + ", " + pct(cfg.nudeLevel) + " (game: 50%)";
        html += "\n2. <b>Orgasm in a sex scene</b>: " + onOff(cfg.sceneOrgasm) + ", " + pct(cfg.sceneOrgasmLevel) + " (game: 100%)";
        html += "\n3. <b>Orgasm outside a scene</b> (items, transformatives): " + onOff(cfg.otherOrgasm) + ", " + pct(cfg.otherOrgasmLevel) + " (game: 100%)";
        html += "\n4. <b>Orgasm in a fight</b>: " + onOff(cfg.fightOrgasm) + ", " + pct(cfg.fightOrgasmLevel) + " (game: 100%)";
        html += "\n\nAn orgasm counts as \"in a sex scene\" when a nude NPC bust was shown since the last room menu. " +
            "\"NPC nude busts only\" ignores your own nude bust (the appearance screen, some items).";
        html += '<button type="button" data-mod-act="nude">1. Nude bust: ' + nudeLabel() + '</button>';
        html += '<button type="button" data-mod-act="level:nudeLevel:-5">1. Level −5%</button>';
        html += '<button type="button" data-mod-act="level:nudeLevel:5">1. Level +5%</button>';
        html += '<button type="button" data-mod-act="flip:sceneOrgasm">2. Scene orgasm: ' + onOff(cfg.sceneOrgasm) + '</button>';
        html += '<button type="button" data-mod-act="level:sceneOrgasmLevel:-5">2. Level −5%</button>';
        html += '<button type="button" data-mod-act="level:sceneOrgasmLevel:5">2. Level +5%</button>';
        html += '<button type="button" data-mod-act="flip:otherOrgasm">3. Other orgasm: ' + onOff(cfg.otherOrgasm) + '</button>';
        html += '<button type="button" data-mod-act="level:otherOrgasmLevel:-5">3. Level −5%</button>';
        html += '<button type="button" data-mod-act="level:otherOrgasmLevel:5">3. Level +5%</button>';
        html += '<button type="button" data-mod-act="flip:fightOrgasm">4. Fight orgasm: ' + onOff(cfg.fightOrgasm) + '</button>';
        html += '<button type="button" data-mod-act="level:fightOrgasmLevel:-5">4. Level −5%</button>';
        html += '<button type="button" data-mod-act="level:fightOrgasmLevel:5">4. Level +5%</button>';
        html += '<button type="button" data-mod-act="view:main">Haptics settings</button>';
        return html;
    }

    function nextIn(list, v) {
        var i = list.indexOf(v);
        return list[(i + 1) % list.length];
    }

    function test() {
        if (!H || !H.available) {
            state.lastEvent = "test skipped: no device (check Options > Haptics)";
            return;
        }
        cancelOrgasm();
        state.lastEvent = "test at " + cfg.autoCap + "%";
        rampTo(1, cfg.autoRamp, "test");
        var token = state.rampToken;
        setTimeout(function () {
            if (state.source === "test" && state.rampToken === token) stopAll("test done");
        }, (cfg.autoRamp + 5) * 1000);
    }

    function onAct(act) {
        act = String(act || "");
        var parts = act.split(":");
        switch (parts[0]) {
            case "view": view = parts[1] === "triggers" ? "triggers" : "main"; return true;
            case "refresh": return true;
            case "manualCap":
            case "autoCap":
                cfg[parts[0]] = clampInt(cfg[parts[0]] + Number(parts[1]), 5, 100, 100);
                break;
            case "ramp":
                var key = parts[1] === "manual" ? "manualRamp" : "autoRamp";
                cfg[key] = nextIn(RAMP_STEPS, cfg[key]);
                if (cfg[key] === undefined) cfg[key] = 0;
                break;
            case "orgasm":
                cfg.orgasmSecs = nextIn(ORGASM_STEPS, cfg.orgasmSecs);
                if (cfg.orgasmSecs === undefined) cfg.orgasmSecs = 0;
                break;
            case "nude": cfg.nude = nextIn(NUDE_MODES, cfg.nude) || "any"; break;
            case "flip": if (typeof DEFAULTS[parts[1]] === "boolean") cfg[parts[1]] = !cfg[parts[1]]; break;
            case "level":
                if (typeof DEFAULTS[parts[1]] === "number") cfg[parts[1]] = clampInt(cfg[parts[1]] + Number(parts[2]), 5, 100, 50);
                break;
            case "test": test(); return true;
            case "stop": stopAll("you pressed Stop now"); return true;
            default: return false;
        }
        save();
        // A lower cap takes effect at once.
        if (H && H._vibrating && state.source) {
            var cap = capFor(state.source);
            if (current() > cap + 0.005) { cancelRamp(); state.target = cap; H.setVibrating(true, cap).catch(function () {}); }
        }
        return true;
    }

    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return;
        if (window.registerModMenu.__tnHapticsPlus) return;
        window.registerModMenu({
            id: MOD_ID,
            name: "Haptics Plus",
            author: "TN",
            description: "Intensity caps, ramp-up and trigger choices for the game's buttplug.io haptics (Options > Haptics).",
            supportsToggle: true,
            getHtml: function () { return view === "triggers" ? triggersHtml() : mainHtml(); },
            onAct: onAct
        });
        window.registerModMenu.__tnHapticsPlus = true;
    }

    function tick() {
        try { register(); } catch (err) {}
        try { wrapBust(window, "showBust"); } catch (err) {}
        try { if (window.ui) wrapBust(window.ui, "showBust"); } catch (err) {}
    }

    window.tnHapticsPlus = {
        settings: function () { return JSON.parse(JSON.stringify(cfg)); },
        state: function () {
            return { hooked: hooked, source: state.source, target: state.target, ramping: !!state.rampTimer,
                orgasmUntil: state.orgasmUntil, baseLevel: state.baseLevel, nudeSeen: state.nudeSeen,
                lastEvent: state.lastEvent, level: current() };
        },
        act: onAct,
        stop: function () { return stopAll("stopped from console"); },
        _install: install
    };

    boot(0);
    setInterval(tick, 1000);
    tick();
})();
