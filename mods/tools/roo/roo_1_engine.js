    /* ================= 1. Engine: state, text renderer, helpers ================= */
    var MOD_ID = "tn-roo-crew";
    var PRICE = 50000;            // William: "{50,000/###??}" credits
    var UNLOCK_CREDITS = 250000;  // William: 250,000-500,000 overall winnings, plus her panties
    var HOLD_MIN = 336 * 60;      // Plutus holds her for two weeks
    var EAR_PRICE = 1000, LACTAID_PRICE = 5000;
    var OC_COOLDOWN = 12 * 60, OC_OFFLINE = 120;
    var H = {};                   // public handles for debugging: window.tnRoo
    window.tnRoo = H;

    function modOn() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }
    function ready() { return typeof flags !== "undefined" && typeof pc !== "undefined" && pc && typeof GetGameTimestamp === "function"; }
    function now() { return GetGameTimestamp(); }
    function rnd(n) { return Math.floor(Math.random() * n); }
    function pick(a) { return a[rnd(a.length)]; }
    function inc(k, by) { flags[k] = (flags[k] || 0) + (by || 1); return flags[k]; }

    /* ---------- Roo's state ---------- */
    // TN_ROO_STATE: 1 held in Plutus' office, 2 aboard, 3 in her Tavros apartment, 4 sold (gone), 5 stayed with her family
    function state() { return ready() ? flags.TN_ROO_STATE : undefined; }
    function aboard() { return ready() && modOn() && flags.TN_ROO_STATE === 2; }
    function slave() { return flags.TN_ROO_SLAVE === 1; }
    function free() { return !slave(); }
    function hired() { return flags.TN_ROO_HIRED === 1; }
    function settled() { return flags.TN_ROO_7DAY === 1; }
    function collar() { return slave() || flags.TN_ROO_COLLAR === 1; }
    function ears() { return flags.TN_ROO_EARS === "cat" ? "cat" : "bunny"; }
    function vibesIn() { return flags.TN_ROO_VIBES_IN !== 0; }
    function vibesOffline() { return flags.TN_ROO_OC_TS !== undefined && now() < flags.TN_ROO_OC_TS + OC_OFFLINE; }
    function vibes() { tick(); return (vibesIn() && !vibesOffline()) ? (flags.TN_ROO_VIBES || 0) : 0; }
    function vibesOn() { return vibes() > 0; }
    function canMasturbate() { return free() || flags.TN_ROO_NO_MASTURBATE !== 1; }
    function lust() { tick(); return Math.round(flags.TN_ROO_LUST || 0); }
    function lustLvl() { var l = lust(); return l < 34 ? 0 : (l < 67 ? 1 : 2); }
    function highLust() { return lustLvl() === 2; }
    function milky() { tick(); return (flags.TN_ROO_MILK || 0) > 0; }
    // 0 jacket (full dealer outfit), 1 skirt, 2 shirt, 3 panties, 4 nude, 5 Steele Tech uniform
    function clothes() { return milky() ? 4 : (flags.TN_ROO_CLOTHES || 0); }
    function chestExposed() { var c = clothes(); return c === 3 || c === 4; }
    function crotchExposed() { return clothes() === 4; }
    function steele() { return clothes() === 5; }
    function days() { return flags.TN_ROO_RECRUIT_TS === undefined ? 0 : Math.floor((now() - flags.TN_ROO_RECRUIT_TS) / 1440); }

    function addLust(n) { tick(); flags.TN_ROO_LUST = Math.max(0, Math.min(100, (flags.TN_ROO_LUST || 0) + n)); }
    function setLust(n) { tick(); flags.TN_ROO_LUST = Math.max(0, Math.min(100, n)); }
    function rooCums(times) { inc("TN_ROO_ORGASMS", times || 1); setLust(Math.max(0, lust() - 60)); }
    function drainMilk(pct) { if ((flags.TN_ROO_MILK || 0) > 0) { flags.TN_ROO_MILK = Math.max(0, flags.TN_ROO_MILK - pct); if (flags.TN_ROO_MILK <= 0) flags.TN_ROO_MILK_EMPTY_TS = now(); } }

    /* Lust and milk move with time. Libido 40 = about one point an hour; vibrators multiply it. */
    function tick() {
        if (!ready() || (flags.TN_ROO_STATE !== 2 && flags.TN_ROO_STATE !== 3)) return;
        var t = now(), last = flags.TN_ROO_TICK_TS;
        flags.TN_ROO_TICK_TS = t;
        if (last === undefined || t <= last) return;
        var hrs = (t - last) / 60;
        var mult = 1;
        if (vibesIn() && !(flags.TN_ROO_OC_TS !== undefined && t < flags.TN_ROO_OC_TS + OC_OFFLINE)) mult = [1, 1.5, 2, 3][flags.TN_ROO_VIBES || 0] || 1;
        var l = (flags.TN_ROO_LUST || 0) + hrs * mult;
        if (l >= 100 && (free() || flags.TN_ROO_NO_MASTURBATE !== 1)) { l = 12; inc("TN_ROO_SELF_RELIEF"); }
        flags.TN_ROO_LUST = Math.min(100, l);
        if ((flags.TN_ROO_MILK || 0) > 0) {
            flags.TN_ROO_MILK = Math.max(0, flags.TN_ROO_MILK - hrs * (100 / 72));
            if (flags.TN_ROO_MILK <= 0) flags.TN_ROO_MILK_EMPTY_TS = t;
        }
    }

    /* ---------- Who she is in the UI ---------- */
    function bust() {
        if (steele()) return "ROO";
        return ["ROO", "ROO_SKIRT", "ROO_SHIRT", "ROO_PANTIES", "ROO_NUDE"][clothes()] || "ROO";
    }
    function showRoo(nude) {
        if (typeof clearBust === "function") clearBust();
        if (typeof showBust === "function") showBust(nude ? "ROO_NUDE" : bust());
        if (typeof showName === "function") showName("Roo");
    }
    function showPlutus() {
        if (typeof clearBust === "function") clearBust();
        if (typeof showName === "function") showName("Plutus");
    }
    function byWilliam() { if (typeof author === "function") author("William"); }
    function byUs() { if (typeof author === "function") author("Techy-Nest"); }

    /* ---------- PC helpers ---------- */
    function persona() {
        try {
            if (pc.isBimbo()) return "bimbo";
            if (pc.isBro()) return "bro";
            if (pc.isNice()) return "kind";
            if (pc.isMischievous()) return "misch";
        } catch (err) {}
        return "hard";
    }
    function body() {
        try { if (pc.isTaur()) return "taur"; if (pc.isNaga()) return "naga"; } catch (err) {}
        return "biped";
    }
    function hasCock() { try { return pc.hasCock(); } catch (e) { return false; } }
    function hasPussy() { try { return pc.hasVagina(); } catch (e) { return false; } }
    function hasGenitals() { return hasCock() || hasPussy(); }
    function pcLust(n) { try { pc.lust(n); } catch (e) {} }
    function pcCum() { try { pc.orgasm(); } catch (e) {} }
    function pcLustMin() { try { pc.lust(-1000); } catch (e) {} }
    function cockCount() { try { return pc.cockTotal(); } catch (e) { return hasCock() ? 1 : 0; } }
    function vagCount() { try { return pc.vaginaTotal(); } catch (e) { return hasPussy() ? 1 : 0; } }
    function credits() { return pc.credits || 0; }
    function silly() { try { return isSillyModeEnabled(); } catch (e) { return false; } }
    function onShip() { try { return InShipInterior(); } catch (e) { return false; } }
    function isFem() { try { return pc.isFemale() || (pc.mf && pc.mf("m", "f") === "f"); } catch (e) { return false; } }
    function lib() { try { return pc.libido(); } catch (e) { return 50; } }
    function crewOthers() {
        var n = 0;
        try { for (var id in chars) { var c = chars[id]; if (c && c.isCrew && c.isCrew()) n++; } } catch (e) {}
        return n;
    }
    function crewHas(id) { try { return !!(chars[id] && chars[id].isCrew && chars[id].isCrew()); } catch (e) { return false; } }
    function crewSpace() {
        if (flags.INFINITE_CREW !== undefined) return true;
        try { if (typeof crew === "function" && pc_ship && pc_ship.crewCapacity) return crew(true, false) < pc_ship.crewCapacity(); } catch (e) {}
        return true;
    }
    function invFind(cls) {
        try { var s = pc.inventory.storage || []; for (var i = 0; i < s.length; i++) if (s[i] && s[i].getClassName && s[i].getClassName() === cls) return i; } catch (e) {}
        return -1;
    }
    function invTake(cls) {
        var i = invFind(cls); if (i < 0) return false;
        var s = pc.inventory.storage;
        if ((s[i].quantity || 1) > 1) s[i].quantity--; else s.splice(i, 1);
        return true;
    }

    /* ---------- [roo.x] tags ---------- */
    function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
    function pcTitle(capital) {
        var t = flags.TN_ROO_PCTITLE;
        if (t) return capital ? cap(t) : t;
        return slave() ? "[pc.Master]" : "[pc.name]";
    }
    function rooTitle() { return flags.TN_ROO_ROOTITLE || "Roo"; }
    function rooTags(s) {
        return s
            .replace(/\[roo\.(pcTitle|playerTitle)\]/g, function () { return pcTitle(false); })
            .replace(/\[roo\.(PcTitle|PlayerTitle)\]/g, function () { return pcTitle(true); })
            .replace(/\[pc\.rooTitle\]/g, function () { return rooTitle(); })
            .replace(/\[pc\.RooTitle\]/g, function () { return cap(rooTitle()); })
            .replace(/\[roo\.ears\]/g, function () { return ears() === "cat" ? "fluffy cat ears" : "floppy bunny ears"; })
            .replace(/\[roo\.Ears\]/g, function () { return ears() === "cat" ? "Fluffy cat ears" : "Floppy bunny ears"; })
            .replace(/\[roo\.ear\]/g, function () { return ears() === "cat" ? "fluffy cat ear" : "floppy bunny ear"; })
            .replace(/\[roo\.Ear\]/g, function () { return ears() === "cat" ? "Fluffy cat ear" : "Floppy bunny ear"; })
            .replace(/\[goo\.name\]/g, function () { try { return chars.GOO.short || "Nova"; } catch (e) { return "Nova"; } });
    }

    /* ---------- {key: a / b} markup (William's doc style, also used for our own scenes) ---------- */
    var CTX = {};   // per-scene switches: first, usedCock, ...
    function personaIs(key) {
        var k = key.toLowerCase().replace(/^pc/, "");
        var set = [], rest = k, TOK = [["bimbo", "bimbo"], ["bim", "bimbo"], ["bro", "bro"], ["kind", "kind"], ["kin", "kind"], ["misch", "misch"], ["mis", "misch"], ["hard", "hard"], ["har", "hard"]];
        while (rest.length) {
            var hit = null;
            for (var i = 0; i < TOK.length; i++) if (rest.indexOf(TOK[i][0]) === 0) { hit = TOK[i]; break; }
            if (!hit) return null;
            if (set.indexOf(hit[1]) < 0) set.push(hit[1]);
            rest = rest.slice(hit[0].length);
        }
        return set.length ? set : null;
    }
    var K = {};     // filled in roo_2 (key -> predicate)
    function keyTrue(key) {
        var k = key.replace(/\s+/g, "");
        if (/^else$/i.test(k)) return true;
        if (K.hasOwnProperty(k)) return !!K[k]();
        var lk = k.toLowerCase();
        for (var name in K) if (K.hasOwnProperty(name) && name.toLowerCase() === lk) return !!K[name]();
        if (CTX.hasOwnProperty(k)) return !!CTX[k];
        if (CTX.hasOwnProperty(lk)) return !!CTX[lk];
        var set = personaIs(k);
        if (set) return set.indexOf(persona()) >= 0;
        if (window.console) console.warn("[TN Roo] unknown text key: " + key);
        return false;
    }

    function splitAlts(inner) {
        var parts = [], d = 0, cur = "", i = 0;
        while (i < inner.length) {
            var ch = inner.charAt(i);
            if (ch === "{") d++;
            if (ch === "}") d--;
            if (ch === "<") { var e = inner.indexOf(">", i); if (e > 0) { cur += inner.slice(i, e + 1); i = e + 1; continue; } }
            if (ch === "/" && d === 0) { parts.push(cur); cur = ""; i++; continue; }
            cur += ch; i++;
        }
        parts.push(cur);
        var KEYRX = /^\s*([A-Za-z][A-Za-z0-9,&+]*(?:\s?[<>]\s?=?\s?[0-9]+)?|[0-9]+|[0-9]{2}:[0-9]{2}\s?-\s?[0-9]{2}:[0-9]{2})\s*:([\s\S]*)$/;
        return parts.map(function (p) {
            var m = p.match(KEYRX);
            if (m && !/^\s*\[/.test(p)) { var b = m[2]; if (b.charAt(0) === " ") b = b.slice(1); return { k: m[1], t: b }; }
            return { k: null, t: p };
        });
    }

    var NK = {};    // keyless {a/b} rules, filled in roo_2: NK["line|first alt"] or NK["first alt"] -> index
    function keyless(alts, line) {
        var sig = alts[0].t.trim();
        var f = NK[line + "|" + sig] || NK[sig];
        if (f) return f(alts);
        var all = alts.map(function (a) { return a.t.toLowerCase(); }).join("|");
        if (alts.length === 2 && /master|slave|servant|owner|bought|order/.test(alts[0].t.toLowerCase())) return slave() ? 0 : 1;
        if (/huskar/.test(all)) { var hu = (typeof anno !== "undefined" && anno.isHuskar && anno.isHuskar()); for (var i = 0; i < alts.length; i++) if ((alts[i].t.indexOf("huskar") >= 0) === hu) return i; }
        if (/bunny|floppy/.test(alts[0].t.toLowerCase()) && alts.length === 2) return ears() === "bunny" ? 0 : 1;
        if (/cat/.test(alts[0].t.toLowerCase()) && /bunny/.test(all) && alts.length === 2) return ears() === "cat" ? 0 : 1;
        if (alts.length === 1) return -1;
        return 0;
    }

    function pickAlt(alts, line) {
        if (alts.every(function (a) { return a.k === null; })) return keyless(alts, line);
        if (alts[0].k === null) {            // {default / key: override / ...}
            for (var j = 1; j < alts.length; j++) if (alts[j].k !== null && keyTrue(alts[j].k)) return j;
            return 0;
        }
        var k0 = alts[0].k.replace(/\s+/g, "");
        if (/^rand/i.test(k0) || /^[0-9]+$/.test(k0)) return rnd(alts.length);
        if (/^[0-9]{2}(:|$)/.test(k0)) { // time-of-day email subject
            for (var t = 0; t < alts.length; t++) {
                var m = (alts[t].k || "").match(/^(\d{2}):?(\d{2})?\s?-\s?(\d{2})/);
                if (m && hours >= +m[1] && hours <= +m[3]) return t;
            }
            return alts.length - 1;
        }
        var set = personaIs(k0);
        if (set && set.length > 1 && set.length === alts.length && alts.slice(1).every(function (a) { return a.k === null; }))
            return set.indexOf(persona()) >= 0 ? set.indexOf(persona()) : alts.length - 1;
        for (var i = 0; i < alts.length; i++) {
            if (alts[i].k === null) return i;          // unkeyed after a keyed one = else
            if (keyTrue(alts[i].k)) return i;
        }
        return -1;
    }

    function render(s, line) {
        var out = "", i = 0;
        while (i < s.length) {
            var c = s.charAt(i);
            if (c !== "{") { out += c; i++; continue; }
            var d = 0, j = i;
            for (; j < s.length; j++) { if (s.charAt(j) === "{") d++; else if (s.charAt(j) === "}") { d--; if (d === 0) break; } }
            if (j >= s.length) { out += c; i++; continue; }
            var alts = splitAlts(s.slice(i + 1, j));
            var w = pickAlt(alts, line);
            if (w >= 0 && alts[w]) out += render(alts[w].t, line);
            i = j + 1;
        }
        return out;
    }
    function txt(s, line) { return rooTags(render(s, line || 0)).replace(/  +/g, " ").replace(/ ([,.!?])/g, "$1"); }

    /* ---------- William's doc ---------- */
    var ROWS = {}, LINES = [];
    for (var di = 0; di < DOC.length; di++) { ROWS[DOC[di][0]] = DOC[di]; LINES.push(DOC[di][0]); }
    var COND = {};  // doc line of a "// condition" -> predicate (filled in roo_2+)
    function M() { return true; }

    /* Render doc lines a..b. Condition lines with a COND entry switch paragraphs on/off; other notes are skipped. */
    function docText(a, b, skip) {
        var on = true, out = [];
        for (var i = 0; i < LINES.length; i++) {
            var n = LINES[i];
            if (n < a) continue;
            if (n > b) break;
            var r = ROWS[n];
            if (r[1] === 1) { if (COND[n]) on = !!COND[n](); continue; }
            if (!on || (skip && skip.indexOf(n) >= 0)) continue;
            var t = txt(r[2], n);
            if (t.trim()) out.push(t.trim());
        }
        return out;
    }
    function doc(a, b, skip, cont) {
        var p = docText(a, b, skip);
        for (var i = 0; i < p.length; i++) output(((i === 0 && !cont) ? "" : "\n\n") + p[i]);
    }
    function para(n) { var r = ROWS[n]; return r ? txt(r[2], n) : ""; }
    /* Our own paragraphs, same markup. */
    function say(list, cont) {
        var k = 0;
        for (var i = 0; i < list.length; i++) {
            if (list[i] === null || list[i] === undefined || list[i] === "") continue;
            var t = txt(list[i], 0).trim();
            if (!t) continue;
            output(((k === 0 && !cont) ? "" : "\n\n") + t);
            k++;
        }
    }
    function scene(nude) { clearOutput(); showRoo(nude); byWilliam(); CTX = {}; }
    function ourScene(nude) { clearOutput(); showRoo(nude); byUs(); CTX = {}; }
    function next(fn, label, tip) { clearMenu(); addButton(0, label || "Next", fn, label || "Next", tip || ""); }
    function btn(slot, label, fn, ok, tipOn, tipOff) {
        if (ok) addButton(slot, label, fn, label, tipOn || "");
        else addDisabledButton(slot, label, label, tipOff || "");
    }
    function timePass(a, b) { processTime(b ? a + rnd(b - a + 1) : a); }
