/* TN Tease Restore for Trials in Tainted Space (v1.0, checked against 0.9.169).
   Gives the player's Tease attacks back the strength they had in the older (Flash) TiTS.

   0.9.168 and 0.9.169 have exactly the same tease code. The weakening happened when
   the game moved from Flash to HTML. Compared with the Flash formula (TiTS 0.7.189):

   1. Classic hit chance (on by default)
      Flash: the enemy resisted only if  willpower/2 + d20 + 1  beat
             your level x 2.5 x likes bonus + 10 + practice/10 + sexiness + pheromones.
      Now:   you miss if  teaseSkill/2 + d20 + small bonuses  is below  willpower/2 + 10,
             where teaseSkill is your libido, capped at 5 x (level + 2).
      With this on, a tease that the new roll misses gets the old roll too, and lands
      if the old roll lands. It can only help, never hurt. Lust-immune foes stay immune.

   2. Practice damage (on by default)
      Flash: base damage was 10 x (1 + practice/100), so each body part you'd teased
             with 100 times hit twice as hard at the base (+10).
      Now:   the game still counts TIMES_BUTT_TEASED and the rest (0 to 100 each) but
             never uses the number. This adds practice/10 back to the base damage.

   3. Ignore enemy lust defense (on by default)
      Flash: the line that took the enemy's lust defense off a tease was switched off.
      Now:   every tease loses the enemy's lust defense, which grows with their level,
             willpower and resolve. This skips it for your own teases only. Enemies'
             teases on you, and every other kind of lust damage, are unchanged.

   Settings: Options > Android Mods / TN Mod Settings > "Tease Restore". Each part has
   its own switch, saved on this device. On Android the whole mod also has the menu's
   on/off switch.
   Needs TN_TeaseRestore_v1.0.mod (it adds the three hooks to the game's combat code).
   Console: tnTeaseRestore.settings(), tnTeaseRestore.set("hit"|"practice"|"lustDef", true|false). */
(function () {
    "use strict";
    if (window.tnTeaseRestore) return;

    var MOD_ID = "TN_TeaseRestore";
    var STORE = "tn.teaseRestore.v1";
    var PARTS = {
        hit: { name: "Classic hit chance", short: "Hit chance", tip: "A miss gets the old Flash roll too (level x 2.5 + sexiness + practice), and lands if that roll lands." },
        practice: { name: "Practice damage", short: "Practice", tip: "Each body part's tease practice (up to 100) adds up to +10 base damage again." },
        lustDef: { name: "Ignore enemy lust defense", short: "No lust defense", tip: "Your teases skip the enemy's lust defense, as in the Flash game." }
    };
    var DEFAULTS = { hit: true, practice: true, lustDef: true };

    // Which tease is running right now. Set by the applyTeaseDamage wrapper below.
    var ctx = null;

    function P(fn, dflt) { try { var v = fn(); return v === undefined ? dflt : v; } catch (err) { return dflt; } }

    function load() {
        var out = { hit: DEFAULTS.hit, practice: DEFAULTS.practice, lustDef: DEFAULTS.lustDef };
        try {
            var saved = JSON.parse(window.localStorage.getItem(STORE) || "{}");
            Object.keys(DEFAULTS).forEach(function (k) { if (typeof saved[k] === "boolean") out[k] = saved[k]; });
        } catch (err) {}
        return out;
    }
    var settings = load();
    function save() { try { window.localStorage.setItem(STORE, JSON.stringify(settings)); } catch (err) {} }

    function modOn() {
        return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") ||
            window.isTnModEnabled(MOD_ID) !== false;
    }
    function partOn(key) { return modOn() && settings[key] === true; }
    function isPlayer(c) { return !!c && P(function () { return c.getClassName() === "PlayerCharacter"; }, false); }
    function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
    function rand(n) { return typeof window.rand === "function" ? window.rand(n) : Math.floor(Math.random() * n); }

    // Practice for this tease, 0 to 100, as the game passes it to applyTeaseDamage.
    function practice() { return ctx ? Math.max(0, Math.min(100, num(ctx.count))) : 0; }

    // ---------------------------------------------------------------------------
    // Hook 1: the hit roll. miss(...) is the game's own check (true = resisted).
    // ---------------------------------------------------------------------------
    function teaseMiss(miss, attacker, target, factor, accuracy) {
        var resisted = miss(attacker, target, factor, accuracy);
        if (!resisted || !partOn("hit") || !isPlayer(attacker)) return resisted;
        try {
            if (target.isLustImmune) return true;
            var bonus = 0;
            if (P(function () { return attacker.hasPheromones(true); }, false)) bonus += num(P(function () { return attacker.pheromoneLevel(true); }, 0));
            if (ctx && ctx.type === "SQUIRT") bonus += 2;
            if (P(function () { return attacker.hasStatusEffect("Sweet Tooth"); }, false)) bonus += 1;
            var f = Math.max(0, Math.min(2, num(factor) || 1));
            var defend = num(target.willpower()) / 2 + rand(20) + 1;
            var attack = num(attacker.level) * 2.5 * f + 10 + practice() / 10 + num(attacker.sexiness()) + bonus;
            if (ctx) ctx.classicHit = defend <= attack;
            return defend > attack;
        } catch (err) {
            console.warn("[TN TeaseRestore] hit roll", err);
            return resisted;
        }
    }

    // ---------------------------------------------------------------------------
    // Hook 2: base damage, before the game's multipliers and caps.
    // ---------------------------------------------------------------------------
    function teaseBase(base, attacker) {
        if (!partOn("practice") || !isPlayer(attacker) || !ctx) return base;
        return base + practice() / 10;
    }

    // ---------------------------------------------------------------------------
    // Hook 3: lust defense, inside the game's shared lust damage code. Only the
    // first lust hit on this tease's target, during one of your teases, skips it.
    // ---------------------------------------------------------------------------
    function teaseLustDef(def, target) {
        if (!ctx || ctx.defUsed || target !== ctx.target || !partOn("lustDef")) return def;
        ctx.defUsed = true;
        return 0;
    }

    window.tnTeaseMiss = teaseMiss;
    window.tnTeaseBase = teaseBase;
    window.tnTeaseLustDef = teaseLustDef;

    // ---------------------------------------------------------------------------
    // Wrap window.applyTeaseDamage so the hooks know the tease's practice count,
    // type and target. Every player tease calls it through window.
    // ---------------------------------------------------------------------------
    var wrapped = false;
    function wrap() {
        var orig = window.applyTeaseDamage;
        if (typeof orig !== "function") return false;
        if (orig.__tnTeaseRestore) return true;
        var fn = function (attacker, target, count, type) {
            var prev = ctx;
            ctx = isPlayer(attacker) ? { attacker: attacker, target: target, count: count, type: type, defUsed: false } : null;
            try { return orig.apply(this, arguments); }
            finally { ctx = prev; }
        };
        fn.__tnTeaseRestore = true;
        fn.__tnOriginal = orig;
        window.applyTeaseDamage = fn;
        wrapped = true;
        return true;
    }
    (function waitForGame(tries) {
        if (wrap()) return;
        if (tries < 240) setTimeout(function () { waitForGame(tries + 1); }, 500);
        else console.warn("[TN TeaseRestore] applyTeaseDamage not found; the mod stays off.");
    })(0);

    // ---------------------------------------------------------------------------
    // Mod menu
    // ---------------------------------------------------------------------------
    function pageHtml() {
        var html = "Brings Tease back to its old Flash-game strength. Each part has its own switch. Changes take effect on your next tease.";
        Object.keys(PARTS).forEach(function (k) {
            html += "\n\n<b>" + PARTS[k].name + ": " + (settings[k] ? "On" : "Off") + "</b>\n" + PARTS[k].tip;
        });
        Object.keys(PARTS).forEach(function (k) {
            html += '<button type="button" data-mod-act="' + k + '">' + PARTS[k].short + ": " + (settings[k] ? "On" : "Off") + "</button>";
        });
        return html;
    }
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Tease Restore",
            author: "TN",
            description: "Tease hits as hard as it did in the Flash game: the old hit chance, practice damage, and no enemy lust defense on your teases.",
            supportsToggle: true,
            getHtml: pageHtml,
            onAct: function (act) {
                if (!PARTS[act]) return false;
                settings[act] = !settings[act];
                save();
                return true;
            }
        });
        return true;
    }
    (function waitForModMenu(tries) {
        if (register()) return;
        if (window.tnModMenuActive === false && tries >= 6) return;
        if (tries < 240) setTimeout(function () { waitForModMenu(tries + 1); }, 500);
    })(0);

    window.tnTeaseRestore = {
        settings: function () { return { hit: settings.hit, practice: settings.practice, lustDef: settings.lustDef, active: modOn(), wrapped: wrapped }; },
        set: function (key, on) {
            if (!PARTS[key]) return false;
            settings[key] = !!on;
            save();
            return settings[key];
        },
        _miss: teaseMiss,
        _base: teaseBase,
        _lustDef: teaseLustDef,
        _ctx: function () { return ctx; }
    };
})();
