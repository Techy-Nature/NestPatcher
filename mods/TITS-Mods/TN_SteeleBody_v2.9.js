/*
 * TN_SteeleBody_v2.9.js - "Steele's Body in Sex Scenes" (NestPatcher runtime helper, TiTS 0.9.168), Modv2.9
 * Author: Neston
 *
 * Shared flavor text for our own sex scenes, so Steele's body actually shows up in them.
 * Used by Roo Crew, Bianca Extras, Shelly Cure Quest, Steph Irson and Shekka's Eggs
 * whenever Steele's cock is inside a woman's pussy.
 *
 *   - Prehensile cock (the game's FLAG_PREHENSILE on that cock, e.g. kangaroo, tentacle and
 *     some cockvine cocks): Steele steers it on purpose, finding her g-spot and her clit(s).
 *     The text follows how many clits she has: none (g-spot only), one, two, or more.
 *   - Tentacle-lined cock (the game's own test: a suula/siren or anemone cock, or the
 *     STINGER_TIPPED / STINGER_BASED flags) plus any suula part on Steele (half-suula
 *     mother, or a suula face, ears, eyes, arms, legs, tail or wings, or the cock itself):
 *     the tentacles on the cock and at its base pump suula aphrodisiac venom into her, and
 *     her pleasure doubles.
 *   - Tentacle-lined cock with no suula in Steele: the tentacles still wriggle, no doubling.
 *   - Biped, taur and naga versions. Steele is always "you", so no pronouns are needed.
 *
 * Other mods call: window.tnSteeleSex.vag({ who, npc, clits, cock, mode, venom })
 *   who   - her name ("Roo"). npc - her creature object (clits read from it), or
 *   clits - a number. cock - Steele's cock index (default 0).
 *   mode  - "thrust" (Steele moves), "ride" (she's on top) or "still" (cock-warming).
 *   venom - false to leave the venom out, "short" when the scene already describes it.
 * Returns one paragraph of text with [pc.*] parser tags, or "" when nothing applies.
 * The text never uses "/", "{" or "}" (Roo's scene markup splits on them).
 *
 * The game's own scenes: every creature's loadInCunt (the game calls it when Steele cums in
 *   her pussy, ~330 scenes) is wrapped, and Steele's body gets one "looking back" paragraph at the
 *   end of that page: Azra, Feruze, zil, myr, terratch slavers, vanae maidens and everyone else.
 *
 * Toggles: Options -> Android Mods -> "Steele's Body in Sex Scenes" (off = nothing at all) and
 *   "Steele's Body: Game Scenes" (off = only our own mods' scenes).
 * No .mod needles: nothing in the game bundles is replaced.
 */
(function () {
    "use strict";
    if (window.__tnSteeleBodyLoaded) return;
    window.__tnSteeleBodyLoaded = true;

    var MOD_ID = "tn.steele-body";

    /* ---------- Mod menu switch ---------- */
    function on() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Steele's Body in Sex Scenes",
            author: "Neston",
            description: "Adds lines to our mods' sex scenes (Roo, Bianca, Shelly, Steph, Shekka) for Steele's own body: a prehensile cock seeks out her g-spot and clits on purpose, and a tentacle-lined cock on a Steele with suula in them pumps suula aphrodisiac venom into her, doubling her pleasure. Biped, taur and naga versions.",
            supportsToggle: true
        });
        return true;
    }
    if (!register()) {
        var regTries = 0;
        var regTimer = setInterval(function () { if (register() || ++regTries >= 150) clearInterval(regTimer); }, 200);
    }

    /* ---------- Helpers ---------- */
    function safe(f, d) { try { return f(); } catch (err) { return d; } }
    function G(name, fallback) { return safe(function () { var v = GLOBAL[name]; return v === undefined ? fallback : v; }, fallback); }
    function pick(list) { return list[safe(function () { return rand(list.length); }, Math.floor(Math.random() * list.length))]; }
    var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
    function word(n) { return WORDS[n] || String(n); }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    // Flag and type numbers from TiTS 0.9.168 (GLOBAL); the fallbacks match that build.
    function F_PREHENSILE() { return G("FLAG_PREHENSILE", 2); }
    function F_STINGER_BASED() { return G("FLAG_STINGER_BASED", 28); }
    function F_STINGER_TIPPED() { return G("FLAG_STINGER_TIPPED", 29); }
    function T_SIREN() { return G("TYPE_SIREN", 20); }
    function T_ANEMONE() { return G("TYPE_ANEMONE", 22); }

    function bodyType() { return safe(function () { return pc.isTaur() ? "taur" : pc.isNaga() ? "naga" : "biped"; }, "biped"); }
    function cockOk(ci) { return safe(function () { return pc.hasCock() && ci >= 0 && ci < pc.cocks.length; }, false); }
    function cockFlag(ci, f) { return safe(function () { return pc.hasCockFlag(f, ci); }, false); }
    function cockType(ci) { return safe(function () { return pc.cocks[ci].cType; }, -1); }

    function prehensile(ci) { return cockOk(ci) && cockFlag(ci, F_PREHENSILE()); }
    // Same test the game uses before its own cock-stinger lines.
    function tentacles(ci) {
        if (!cockOk(ci)) return null;
        var t = cockType(ci), alien = t === T_SIREN() || t === T_ANEMONE();
        var tip = alien || cockFlag(ci, F_STINGER_TIPPED());
        var base = alien || cockFlag(ci, F_STINGER_BASED());
        return (tip || base) ? { tip: tip, base: base } : null;
    }
    // Any suula in Steele: a suula mother, or a suula body part.
    function suulaParts(ci) {
        var parts = [];
        var siren = T_SIREN();
        if (safe(function () { return /suula/i.test(String(pc.originalRace)); }, false)) parts.push("blood");
        ["faceType", "earType", "eyeType", "armType", "legType", "tailType", "wingType"].forEach(function (k) {
            if (safe(function () { return pc[k] === siren; }, false)) parts.push(k);
        });
        if (cockOk(ci) && cockType(ci) === siren) parts.push("cock");
        return parts;
    }
    function clitCount(o) {
        if (typeof o.clits === "number" && o.clits >= 0) return Math.floor(o.clits);
        var n = safe(function () { return o.npc.vaginas[0].clits; }, undefined);
        return (typeof n === "number" && n >= 0) ? Math.floor(n) : 1;
    }

    /* ---------- Text ---------- */
    // Where Steele is, so taur and naga Steeles read right.
    function lead(b, mode, who) {
        if (mode === "still") return "";
        if (mode === "ride") return pick([
            cap(who) + " might be the one riding, but you’re the one steering. ",
            "She’s on top, setting the pace, but inside her you’re in charge. "
        ]);
        if (b === "taur") return pick([
            "You can’t see a thing under your barrel, and you don’t need to. ",
            "Hidden beneath your barrel, you work by feel alone. "
        ]);
        if (b === "naga") return pick([
            "Your coils hold her right where you want her, and that leaves you free to concentrate. ",
            "With your coils doing the holding, you can focus on what’s happening inside her. "
        ]);
        return "";
    }

    function prehensileText(o, ci, b) {
        var who = o.who || "she";
        var cock = "[pc.cockNounSimple " + ci + "]";
        var head = "[pc.cockHead " + ci + "]";
        var n = clitCount(o);
        var still = o.mode === "still";
        var t = still
            ? "Even resting inside her, your prehensile " + cock + " won’t keep still. It curls lazily until " + head + " settles against the rough, swollen patch of her g-spot, and it rubs slow, sleepy circles there"
            : lead(b, o.mode, who) + pick([
                "Your prehensile " + cock + " doesn’t just slide in and out. It curls and flexes inside her, " + head + " questing along her front wall until it finds the rough, swollen patch of her g-spot",
                "You don’t leave it to luck. Your prehensile " + cock + " bends inside her like a crooked finger, feeling its way along her walls until " + head + " finds the rough, swollen patch of her g-spot"
            ]);
        if (n <= 0) {
            t += still
                ? ". " + cap(who) + " has no clit to tease, so your cock gives that spot all its attention, and she sighs and wriggles back against you."
                : ", and it stays there on purpose. With no clit to share the attention, your cock gives that one spot everything: every stroke drags across it, and every time it does, " + who + "’s breath stutters.";
        } else if (n === 1) {
            t += still
                ? ". Now and then it arches the other way to nudge at her clit from the inside, just to hear her hum."
                : ". You keep it there on purpose, pressing with every stroke, and when " + who + " starts to shake you arch it the other way so your shaft grinds against her clit on every slide in. G-spot, clit, g-spot, clit: you play her like you wrote the instructions.";
        } else if (n === 2) {
            t += still
                ? ". Every so often it twitches toward one of her two clits, then the other, so she never knows which one is next."
                : ". Then it goes looking for her two clits. The curve of your shaft rubs one while the tip flicks the other, and then you switch, back and forth, so neither one ever goes ignored. " + cap(who) + " can’t keep up with where the pleasure’s coming from next.";
        } else {
            t += still
                ? ". Now and then it stirs to tease one of her " + word(n) + " clits, never the same one twice in a row."
                : ". Then it goes hunting for all " + word(n) + " of her clits. It finds them one by one, coiling to rub one with your shaft while the tip strokes the next, working its way around and starting again, until " + who + " is a babbling, twitching mess.";
        }
        if (!still) t += " " + pick([
            "None of it is an accident. You read every gasp and every squeeze and move your cock to wherever she needs it most.",
            "It isn’t luck. You feel every flutter of her walls, and you put your cock exactly where it makes her lose her mind.",
            "You’re doing it on purpose, and she knows it. Every time she clenches, you give her more of the same."
        ]);
        return t;
    }

    function tentacleWhere(tc, ci) {
        if (tc.tip && tc.base) return "the tentacles crowning your [pc.cockHead " + ci + "] and ringing your base";
        if (tc.tip) return "the tentacles crowning your [pc.cockHead " + ci + "]";
        return "the tentacles ringing the base of your [pc.cockNounSimple " + ci + "]";
    }

    function venomText(o, ci, b, tc, parts, hadLead) {
        var who = o.who || "she";
        var where = tentacleWhere(tc, ci);
        var blood = parts.indexOf("blood") >= 0
            ? pick(["your mother’s suula blood", "the suula blood you got from your mother"])
            : "the suula in you";
        var opener = hadLead || o.mode === "still" ? "" : lead(b, o.mode, who);
        if (o.venom === "short") {
            return opener + "And because of " + blood + ", the venom from your tentacles is the real thing: it doesn’t just make her wet, it <b>doubles</b> everything she feels. " + cap(who) + " gasps as every stroke starts landing twice as hard.";
        }
        if (o.mode === "still") {
            return "Your tentacles stay busy too. Every little twitch of " + where + " stings her with another drop of suula venom, and thanks to " + blood + " it’s potent stuff; her pleasure doubles from every tiny shift, and soon even lying still has her purring and squirming against you.";
        }
        var t = opener + (hadLead
            ? pick([
                "Then " + where + " join in. They squirm against her with every thrust, and every time they brush her, they sting, pumping suula aphrodisiac venom into her.",
                "And " + where + " aren’t idle. They wriggle against her flesh with every stroke, stinging as they go, injecting her with suula aphrodisiac venom."
            ])
            : cap(where) + " are busy too. They squirm against her with every stroke, and every time they brush her, they sting, pumping suula aphrodisiac venom into her.");
        t += " " + pick([
            "Thanks to " + blood + ", it’s the real thing, and it hits her fast: her pleasure doubles. Every stroke lands twice as hard, every nerve lights up twice over, and " + who + " stops being able to tell one wave from the next.",
            "With " + blood + " behind it, the venom is every bit as strong as a full suula’s. Her pleasure doubles; she flushes from her face to her chest, her pussy floods around you, and " + who + " cries out like you’re fucking her twice at once."
        ]);
        if (b === "naga") t += " Your coils hold her through every shiver.";
        else if (b === "taur") t += " Beneath your barrel, she bucks back against you for more.";
        return t;
    }

    function tentacleOnlyText(o, ci, b, tc, hadLead) {
        var who = o.who || "she";
        var opener = hadLead || o.mode === "still" ? "" : lead(b, o.mode, who);
        if (o.mode === "still") return "Every so often " + tentacleWhere(tc, ci) + " ripple against her, just enough to make " + who + " shiver.";
        return opener + "Meanwhile, " + tentacleWhere(tc, ci) + " wriggle against her walls, tickling and caressing with every stroke, and their mild sting leaves " + who + " flushed and twitching.";
    }

    /* ---------- "after" mode: told looking back, for the game's own scenes ---------- */
    // The hook below fires when Steele cums in her (the game's loadInCunt), so these lines
    // describe what Steele's body was doing the whole time instead of a single moment.
    function afterPre(o, ci, b) {
        var who = o.who || "she";
        var cock = "[pc.cockNounSimple " + ci + "]";
        var where = b === "taur" ? ", hidden beneath your barrel," : b === "naga" ? ", with your coils holding her still," : "";
        var t = "It wasn’t only your thrusts that got " + who + " there. Your prehensile " + cock + where + " spent the whole time working inside her, curling and flexing until [pc.cockHead " + ci + "] found the rough, swollen patch of her g-spot, and you kept it there on purpose";
        var n = clitCount(o);
        if (n <= 0) t += ". With no clit to share the attention, that one spot got everything you had.";
        else if (n === 1) t += ". Whenever she started to shake, you arched it the other way to grind your shaft against her clit, then back again, playing her like you wrote the instructions.";
        else if (n === 2) t += ". Then it found both of her clits, rubbing one with the curve of your shaft while the tip flicked the other, so neither one ever went ignored.";
        else t += ". Then it hunted down all " + word(n) + " of her clits, one after another, until she was babbling.";
        return t;
    }
    function afterVenom(o, ci, tc, parts, hadPre) {
        var who = o.who || "she";
        var blood = parts.indexOf("blood") >= 0 ? "your mother’s suula blood" : "the suula in you";
        var t = (hadPre ? "And all the while, " : "All the while, ") + tentacleWhere(tc, ci) + " were stinging her, pumping suula aphrodisiac venom into her with every stroke. Thanks to " + blood + ", it’s the real thing: every bit of pleasure hit " + who + " twice over, and she’s still twitching through the doubled aftershocks.";
        if (o.suulaPartner) t += " Being suula herself doesn’t make her immune. If anything, she knows exactly what that sting means, and she melts into it.";
        return t;
    }
    function afterTentacle(o, ci) {
        return "The whole way through, " + tentacleWhere(o.tc, ci) + " wriggled and teased against her walls, and their mild sting left " + (o.who || "her") + " flushed and twitching.";
    }

    /* ---------- Public ---------- */
    var API = window.tnSteeleSex = {};
    API.enabled = on;
    API.info = function (ci) {
        ci = typeof ci === "number" ? ci : 0;
        return { prehensile: prehensile(ci), tentacles: tentacles(ci), suula: suulaParts(ci), body: bodyType() };
    };
    API.vag = function (o) {
        try {
            o = o || {};
            if (!on()) return "";
            var ci = typeof o.cock === "number" && o.cock >= 0 ? o.cock : 0;
            if (!cockOk(ci)) return "";
            var b = bodyType();
            var out = [];
            var hasPre = prehensile(ci);
            if (o.mode === "after") {
                if (hasPre) out.push(afterPre(o, ci, b));
                var tca = tentacles(ci);
                if (tca && o.venom !== false) {
                    var pa = suulaParts(ci);
                    if (pa.length) out.push(afterVenom(o, ci, tca, pa, hasPre));
                    else { o.tc = tca; out.push(afterTentacle(o, ci)); }
                }
                return out.join(" ");
            }
            if (hasPre) out.push(prehensileText(o, ci, b));
            var tc = tentacles(ci);
            if (tc && o.venom !== false) {
                var parts = suulaParts(ci);
                if (parts.length) out.push(venomText(o, ci, b, tc, parts, hasPre));
                else if (o.venom !== "short") out.push(tentacleOnlyText(o, ci, b, tc, hasPre));
            }
            var text = out.join(" ");
            if (text) lastOwn = Date.now();
            return text;
        } catch (err) {
            return "";
        }
    };
    var lastOwn = 0;   // when one of our own scenes last printed a line (the game hook stays quiet then)
    // Same, with a paragraph break before it ("" stays "").
    API.para = function (o) { var t = API.vag(o); return t ? "\n\n" + t : ""; };
    /* ---------- The game's own scenes ----------
       Every vanilla scene where Steele cums in a woman's pussy calls her loadInCunt(pc)
       (about 330 calls: Azra, Feruze, zil, myr, terratch slavers, vanae maidens and the rest).
       We wrap loadInCunt on every creature class the game registers (and on the named NPCs in
       chars), and when it fires with Steele's cock we add one "looking back" paragraph to the
       end of that page. One paragraph per partner per scene; never on our own mods' scenes. */
    var GAME_ID = "tn.steele-body-game";
    function gameOn() {
        if (!on()) return false;
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(GAME_ID); }
        catch (err) { return true; }
    }
    function registerGame() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: GAME_ID,
            name: "Steele's Body: Game Scenes",
            author: "Neston",
            description: "The same prehensile-cock and suula-venom lines in the game's own scenes: any time you cum inside a woman (Azra, Feruze, zil, myr, terratch, vanae and everyone else), a paragraph is added at the end of the scene. Needs \"Steele's Body in Sex Scenes\" on.",
            supportsToggle: true
        });
        return true;
    }
    if (!registerGame()) {
        var regGameTries = 0;
        var regGameTimer = setInterval(function () { if (registerGame() || ++regGameTries >= 150) clearInterval(regGameTimer); }, 200);
    }

    var busy = false;
    var lastHit = { who: null, at: 0 };
    function isPc(c) { return safe(function () { return c === pc || c.getClassName() === "PlayerCharacter"; }, false); }
    function partnerName(c) {
        var short = safe(function () { return String(c.short || ""); }, "");
        if (!short) return "her";
        var a = safe(function () { return String(c.a || ""); }, "");
        return a ? "the " + short : short;
    }
    function isWoman(c) {
        if (!safe(function () { return c.hasVagina(); }, false)) return false;
        return safe(function () { return c.mf("he", "she") === "she"; }, true);
    }
    function onCum(target, from) {
        if (!gameOn() || !isPc(from) || isPc(target)) return;
        if (!isWoman(target) || !safe(function () { return pc.hasCock(); }, false)) return;
        var t = Date.now();
        if (t - lastOwn < 10000) return;                                    // one of our mods' scenes already did it
        if (lastHit.who === target && t - lastHit.at < 10000) return;        // the same scene calling it twice
        var ci = safe(function () { return pc.cockThatFits(target.vaginalCapacity(0)); }, 0);
        if (typeof ci !== "number" || ci < 0) ci = 0;
        var text = API.vag({
            mode: "after",
            who: partnerName(target),
            npc: target,
            cock: ci,
            suulaPartner: safe(function () { return /suula/i.test(String(target.originalRace)); }, false)
        });
        if (!text) return;
        lastHit = { who: target, at: t };
        // After the scene function returns, so the paragraph lands at the end of the page.
        // Never mid-fight: combat text goes to a different panel.
        setTimeout(function () {
            if (safe(function () { return window.inCombat(); }, false)) return;
            try { output("\n\n" + text); } catch (err) {}
        }, 0);
    }
    function wrapOn(holder) {
        var f = holder && holder.loadInCunt;
        if (typeof f !== "function" || f.__tnSteeleBody) return;
        var w = function (from) {
            var outer = !busy;
            busy = true;
            try { return f.apply(this, arguments); }
            finally {
                if (outer) {
                    busy = false;
                    var self = this;
                    try { onCum(self, from); } catch (err) {}
                }
            }
        };
        // Keep other mods' markers (Shekka's Eggs, Flashback Visor) so they don't wrap it again.
        for (var key in f) if (Object.prototype.hasOwnProperty.call(f, key)) { try { w[key] = f[key]; } catch (err) {} }
        w.__tnSteeleBody = true;
        try { holder.loadInCunt = w; } catch (err) { try { Object.defineProperty(holder, "loadInCunt", { value: w, writable: true, configurable: true }); } catch (err2) {} }
    }
    function wrapClass(C) {
        var p = safe(function () { return C.prototype; }, null);
        while (p && p !== Object.prototype) {
            if (Object.prototype.hasOwnProperty.call(p, "loadInCunt")) wrapOn(p);
            p = Object.getPrototypeOf(p);
        }
    }
    var registry = null;
    function scan() {
        if (registry && registry.RegisteredClasses) {
            var all = registry.RegisteredClasses;
            for (var k in all) if (Object.prototype.hasOwnProperty.call(all, k)) wrapClass(all[k]);
        }
        // Named NPCs whose loadInCunt another mod replaced on the object itself (e.g. Shekka's Eggs).
        safe(function () {
            for (var id in chars) if (chars[id] && Object.prototype.hasOwnProperty.call(chars[id], "loadInCunt")) wrapOn(chars[id]);
        });
    }
    function install(req) {
        var mod = req(54014);
        registry = mod && mod.yq;
        if (!registry || !registry.RegisteredClasses) return false;
        // Classes from areas loaded later get wrapped as they register.
        if (typeof registry.registerClass === "function" && !registry.registerClass.__tnSteeleBody) {
            var reg = registry.registerClass;
            var rw = function (name, C) { var r = reg.apply(this, arguments); try { wrapClass(C); } catch (err) {} return r; };
            rw.__tnSteeleBody = true;
            registry.registerClass = rw;
        }
        scan();
        setInterval(scan, 5000);
        return true;
    }
    function boot(tries) {
        var chunks = self.webpackChunktits_html;
        if (!chunks || typeof chunks.push !== "function") {
            if (tries < 120) setTimeout(function () { boot(tries + 1); }, 500);
            return;
        }
        try {
            chunks.push([["tn-steelebody-" + tries], {}, function (req) {
                var ok = false;
                try { ok = install(req); } catch (err) {}
                if (!ok && tries < 40) setTimeout(function () { boot(tries + 1); }, 1000);
            }]);
        } catch (err) {}
    }
    boot(0);
    API.hookReady = function () { return !!registry; };
})();
