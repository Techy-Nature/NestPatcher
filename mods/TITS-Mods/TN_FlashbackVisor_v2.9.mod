Name: Flashback Visor
Author: Neston
# TN_FlashbackVisor - NestPatcher mod (TiTS 0.9.168), Modv2.9
# A VR visor that replays the battles and sex scenes Steele has already been through.
#   - Sold by Zenn at the Mindstream VR den on Dhaal (Paragon Playground) and by Luca at her
#     VR booths on Canadia Station. 5,000 credits. It's a key item.
#   - Use it from Codex -> Extra -> "Flashback Visor" (uses the Codex hook from
#     TN_DaneCrew_v2.8.mod, so keep that mod in the pack).
#   - It senses what you've been through: from the moment this mod is installed, every sex
#     scene (anything with an orgasm in it) and every ground fight you win or lose is
#     remembered in your save. Each time you put it on, the new memories sync.
#   - No taint. Unlike Dr. Badger's Mindwash Visor it doesn't beam anything into your brain:
#     it fogs your eyes and mind into a flashback, then shows you the memory you picked.
#   - Each memory you relive takes one hour (a Both memory's fight and sex share that hour).
#   - Copy Text / Save Text on a memory (sex or fight) and Save All in the visor menu: the full
#     scene text as .rtf (bold and italics kept), or a .zip with a folder per character. Needs
#     TN_SceneText_v2.9.js (Scene Text Saver), which records the full text. Works on every build.
#   - Menus: Sex (Sub or Domme -> who -> what went where -> the memory), Battle (who -> the
#     fight), Both (a fight and the sex right after it). Every fight memory remembers whether
#     you won or lost and opens with a two-paragraph "how it went" intro.
#   - Battle flashbacks start a real fight against the same enemy, with their level, stats and
#     weapons from back then, against "Flashback Steele": your level, stats and weapons from
#     back then. Win or lose, nothing carries over. Your real level, stats, HP and gear come
#     back when the flashback ends (even if the game is reloaded in between).
#   - Codex Link (in the visor menu): lets Hand So see your flashback logs (Hand So's
#     Redemption). She'll ask about them, and "Victory or Loss" becomes an answer in her quest.
#   - Spend 48+ hours in it aboard your ship and someone checks on you when you take it off:
#     Dane, Reaha (cured), Feruze, Syri or Anno. Dane borrows it the first time; ask him about
#     it later in his Talk menu ("The Visor").
# Toggle: Options -> Android Mods -> "Flashback Visor". Memories (TN_FBV_*) stay in your save.
# Memories keep the text as it showed back then. A save keeps the newest 80 sex scenes, every
# fight that ended in sex, the newest win and loss against each named enemy (Taivra, Kane...)
# and the newest 250 wins and 250 losses against generic enemies (zil, raskvel...). Replaying a scene the game shows again refreshes it.
# Bodies: taur and naga Steele get their own lines where the body shows up.
# In-game author: Neston.

Replace [content_dhaal.js]:
addButton(14,"Back",mainGameMenu,"Back","")}window.paragonPlaygroundVRMenu=
With:
window.tnFbvShopButton&&window.tnFbvShopButton(13,"zenn"),addButton(14,"Back",mainGameMenu,"Back","")}window.paragonPlaygroundVRMenu=

Replace [content_vesperia.js]:
function @@lm@@(){clearOutput(),luca.showAll(),author("RequiemForAMeme"),output("Which part of Luca’s business would you like to inquire about?"),
With:
window.tnFbvLucaMenu=function(){return @@lm@@()};function @@lm@@(){clearOutput(),luca.showAll(),author("RequiemForAMeme"),output("Which part of Luca’s business would you like to inquire about?"),

Replace [content_vesperia.js]:
addDisabledButton(2,"Broken Visor","Broken Visor","Despite the heavy discount, you can’t use the weird, broken visor.")),addButton(14,"Back",
With:
addDisabledButton(2,"Broken Visor","Broken Visor","Despite the heavy discount, you can’t use the weird, broken visor.")),window.tnFbvShopButton&&window.tnFbvShopButton(3,"luca"),addButton(14,"Back",

Add Javascript:
(function () {
    "use strict";
    if (window.__tnFbvLoaded) return;
    window.__tnFbvLoaded = true;

    var MOD_ID = "tn.flashback-visor";
    var KEY = "Flashback Visor";
    var PRICE = 5000;
    var MAX_SEX = 80, MAX_GENERIC = 250, TEXT_BUDGET = 300000, PAGE_CAP = 9000;
    var CHECKIN_MINUTES = 48 * 60;
    var DIV = "\n\n<center>~</center>\n\n";
    var F = {};
    window.tnFbv = F;

    /* ---------- Mod menu switch ---------- */
    function on() {
        try { return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") || window.isTnModEnabled(MOD_ID); }
        catch (err) { return true; }
    }
    F.on = on;
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Flashback Visor",
            author: "Neston",
            description: "A VR visor sold on Dhaal (Zenn) and Canadia Station (Luca) that replays the sex scenes and fights you’ve been through. Battle flashbacks pit the same enemy against Flashback Steele at your old level and gear. Use it from Codex > Extra.",
            supportsToggle: true
        });
        return true;
    }
    if (!register()) {
        var regTries = 0;
        var regTimer = setInterval(function () { if (register() || ++regTries >= 150) clearInterval(regTimer); }, 200);
    }

    /* ---------- Small helpers ---------- */
    function q(t) { return "<i>“" + t + "”</i>"; }
    function say(list) {
        var first = true;
        for (var i = 0; i < list.length; i++) {
            if (list[i] === null || list[i] === undefined || list[i] === "") continue;
            output((first ? "" : "\n\n") + list[i]);
            first = false;
        }
    }
    function rnd(list) { return list[rand(list.length)]; }
    function body() {
        try {
            if (pc.isTaur && pc.isTaur()) return "taur";
            if (pc.isNaga && pc.isNaga()) return "naga";
        } catch (err) {}
        return "biped";
    }
    function pick(o) { var b = body(); return o.hasOwnProperty(b) ? o[b] : o.biped; }
    function nextTo(fn, tip) { clearMenu(); addButton(0, "Next", fn, "Next", tip || ""); }
    function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
    function now() { try { return Number(GetGameTimestamp()) || 0; } catch (err) { return 0; } }
    function dayOf(t) { return Math.floor((Number(t) || 0) / 1440); }
    function inGame() { return typeof flags !== "undefined" && flags && typeof pc !== "undefined" && pc && typeof pc.short === "string"; }
    function hasVisor() { try { return !!pc.hasKeyItem(KEY); } catch (err) { return false; } }
    function aboard() { try { return typeof InPCShipInterior === "function" && !!InPCShipInterior(); } catch (err) { return false; } }
    function fighting() { try { return !!(window.CombatManager && window.CombatManager.combatContainer); } catch (err) { return false; } }
    function planet() { try { var p = getPlanetName(); return p ? String(p) : ""; } catch (err) { return ""; } }
    function strip(html) { return String(html || "").replace(/<[^>]*>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim(); }
    function safeText(html) { return String(html || "").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;"); }
    function hash(s) { var h = 5381; s = String(s || ""); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
    function nice(name) {
        var n = String(name || "").replace(/\s+/g, " ").trim();
        if (!n) return "";
        if (!/[a-z]/.test(n)) n = n.toLowerCase().replace(/(^|[\s\-’'])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
        return n.charAt(0).toUpperCase() + n.slice(1);
    }
    function joinNames(list) {
        list = (list || []).filter(function (x) { return x; });
        if (!list.length) return "someone";
        if (list.length === 1) return list[0];
        return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
    }
    function short(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
    function feet() { return pick({ biped: "feet", taur: "hooves", naga: "coils" }); }
    F.q = q; F.say = say; F.pick = pick;

    /* ---------- Webpack access (class registry for fights) ---------- */
    function grabReq(tries) {
        var chunks = self.webpackChunktits_html;
        if (!chunks || typeof chunks.push !== "function") {
            if (tries < 120) setTimeout(function () { grabReq(tries + 1); }, 500);
            return;
        }
        try { chunks.push([["tn-fbv-" + tries], {}, function (req) { F.req = req; }]); }
        catch (err) { console.warn("[TN] Flashback Visor: no webpack access", err); }
    }
    grabReq(0);
    function classByName(name) {
        if (!name) return null;
        try {
            var reg = F.req(54014).yq, all = reg.RegisteredClasses || {};
            return Object.prototype.hasOwnProperty.call(all, name) ? all[name] : null;
        } catch (err) { return null; }
    }
    F.classByName = classByName;

    /* ---------- Memory store (one JSON string in flags) ---------- */
    var store = null, storeRaw = null, storeFlags = null;
    function load() {
        var raw = flags.TN_FBV_MEM;
        if (store && storeFlags === flags && raw === storeRaw) return store;
        var s = null;
        try { s = raw ? JSON.parse(raw) : null; } catch (err) { s = null; }
        if (!s || !Array.isArray(s.m)) s = { v: 1, n: 1, m: [] };
        store = s; storeRaw = raw; storeFlags = flags;
        return store;
    }
    function trim(s) {
        /* Sex: newest 80, but a sex scene that follows a fight ("Both") is always kept.
           Fights: "Both" fights are always kept. Unique fights (named characters like Taivra or
           Kane) keep their newest win and newest loss. Generic enemies (zil, raskvel, ...) keep
           the newest 250 wins and 250 losses. */
        var sex = s.m.filter(function (m) { return m.k === "s" && !m.b; });
        var drop = {};
        sex.slice(0, Math.max(0, sex.length - MAX_SEX)).forEach(function (m) { drop[m.i] = 1; });
        var seen = {}, gw = 0, gl = 0;
        for (var j = s.m.length - 1; j >= 0; j--) {
            var b = s.m[j];
            if (b.k !== "b" || b.s) continue;
            if (fightGeneric(b)) {
                if (b.win ? ++gw > MAX_GENERIC : ++gl > MAX_GENERIC) drop[b.i] = 1;
            } else {
                var key = fightKey(b) + (b.win ? "|w" : "|l");
                if (seen[key]) drop[b.i] = 1; else seen[key] = 1;
            }
        }
        if (Object.keys(drop).length) {
            s.m = s.m.filter(function (m) { return !drop[m.i]; });
            s.m.forEach(function (m) { if (m.k === "b" && drop[m.s]) m.s = 0; if (m.k === "s" && drop[m.b]) m.b = 0; });
        }
        var total = 0;
        s.m.forEach(function (m) { if (m.k === "s" && m.txt) total += m.txt.length; });
        for (var pass = 0; pass < 2 && total > TEXT_BUDGET; pass++) {
            for (var i = 0; i < s.m.length && total > TEXT_BUDGET; i++) {
                var m = s.m[i];
                if (m.k === "s" && m.txt && (pass === 1 || !m.b)) { total -= m.txt.length; m.txt = ""; m.f = 1; }
            }
        }
    }
    /* One-time story fights the game names like generic enemies ("the cockvine", "the firewall").
       They count as unique: newest win and newest loss each. */
    var UNIQUE = ["FemboySpy", "Goopleganger", "ZaikaEnhancedXO", "ZaikaJaquiFassbinBrightwaterTail", "ZaikaPeer", "ZaikaTechSavant",
        "ZaikaRiotLeader", "ZaikaSergeant", "Boshra", "Cleantha", "CockvineAzraQuest", "AkkadiDropship", "CarlsRobot",
        "GigaGoo", "Ginny", "GooClone", "GrayGooDoubleL", "GrayGooDoubleR", "GrayPrime", "HandSoBot", "HeavyMunitionsBot",
        "HeavyMunitionsBotRepair", "HeavyMunitionsBotShield", "KQ2Juggernaut", "NaleenBrotherA", "NaleenBrotherB", "Onzia", "Princess",
        "QueenOfTheDeep", "Roz", "LGBTPilots", "Taursuit", "MilodanWarAlpha", "NyreanPraetorians",
        "ZilChampionBow", "ZilChampionSpear", "DaerWorm", "Goocubator", "BehemothAlpha", "TaintedCultist"];
    function foeGeneric(f) {
        if (UNIQUE.indexOf(f.c) >= 0) return false;
        return f.g !== undefined ? !!f.g : /^(an?|the) [a-z]/.test(f.tx || "");
    }
    function fightGeneric(b) { return (b.foes || []).length > 0 && b.foes.every(foeGeneric); }
    function fightKey(b) { return (b.foes || []).map(function (f) { return f.c; }).sort().join("+"); }
    F.fightGeneric = fightGeneric;
    function save() {
        trim(store);
        storeRaw = JSON.stringify(store);
        flags.TN_FBV_MEM = storeRaw;
    }
    function all() { return load().m; }
    function byId(id) { var m = all(); for (var i = 0; i < m.length; i++) if (m[i].i === id) return m[i]; return null; }
    function add(mem) { var s = load(); mem.i = s.n++; s.m.push(mem); save(); return mem; }
    F.all = all; F.byId = byId;

    /* ---------- Body parts and roles ---------- */
    var PART_WORDS = [
        ["Cock", "cocks?|dicks?|shafts?|members?|pricks?|manhood|phallus|erections?|knots?|tailcocks?|ovipositors?"],
        ["Pussy", "pussy|pussies|cunts?|vaginas?|slits?|snatch|twats?|folds|labia|clits?|clitoris|honeypot"],
        ["Ass", "ass|asses|assholes?|butts?|pucker|rear|anus|backdoor|tailhole|rump|bum"],
        ["Mouth", "mouth|lips|tongues?|throat|maw|muzzle"],
        ["Breasts", "breasts?|tits|titties|nipples?|boobs?|cleavage|bosom"],
        ["Tail", "tails?|tentacles?"],
        ["Hands", "hands?|fingers?|palms?|fists?"]
    ];
    var GIVERS = { Cock: 1, Tail: 1, Hands: 1, Mouth: 1 };
    function partCounts(text, owner) {
        var out = {}, t = " " + strip(text).toLowerCase() + " ";
        PART_WORDS.forEach(function (p) {
            var re = new RegExp("\\b" + owner + "\\s+(?:[a-z’'\\-]+\\s+){0,3}?(?:" + p[1] + ")\\b", "g");
            var n = (t.match(re) || []).length;
            if (n) out[p[0]] = n;
        });
        return out;
    }
    function top(counts, skip) {
        var best = "", n = 0;
        for (var k in counts) if (counts[k] > n && k !== skip) { best = k; n = counts[k]; }
        return best;
    }
    var HOLE = { cunt: "Pussy", ass: "Ass", mouth: "Mouth", nipples: "Breasts", tailcunt: "Tail" };
    function readParts(text, loads) {
        if (loads && loads.length) {
            var got = 0, gave = 0, recvHole = "", gaveHole = "";
            loads.forEach(function (l) { if (l.pc === "recv") { got++; recvHole = recvHole || HOLE[l.hole]; } else { gave++; gaveHole = gaveHole || HOLE[l.hole]; } });
            if (got >= gave) return { dir: "them", yp: recvHole || "Pussy", tp: "Cock", lean: "sub" };
            return { dir: "you", yp: "Cock", tp: gaveHole || "Pussy", lean: "dom" };
        }
        var mine = partCounts(text, "your"), theirs = partCounts(text, "(?:her|his|its|their|hir|[a-z]+’s|[a-z]+'s)");
        var y = top(mine), t = top(theirs);
        if (!y && !t) return { dir: "you", yp: "Hands", tp: "Other", lean: "" };
        if (!y) y = "Other";
        if (!t) t = "Other";
        if (y === "Cock" && t === "Cock") {
            if ((mine.Cock || 0) >= (theirs.Cock || 0)) t = top(theirs, "Cock") || "Other";
            else y = top(mine, "Cock") || "Other";
        }
        if ((y === "Cock" || y === "Tail") && !(t === "Cock" || t === "Tail")) return { dir: "you", yp: y, tp: t, lean: "dom" };
        if ((t === "Cock" || t === "Tail") && !(y === "Cock" || y === "Tail")) return { dir: "them", yp: y, tp: t, lean: "sub" };
        if (y === "Mouth" || y === "Hands") return { dir: "you", yp: y, tp: t, lean: "" };
        if (t === "Mouth" || t === "Hands") return { dir: "them", yp: y, tp: t, lean: "" };
        return { dir: "you", yp: y, tp: t, lean: "" };
    }
    var DOM_CUES = /\byou (?:pin|push|shove|order|command|force|grab|pull|bend|spank|tie|make (?:her|him|them))|beneath you|under you\b|at your mercy|you take (?:her|him|them)|good (?:girl|boy|pet) for you/g;
    var SUB_CUES = /\b(?:pins? you|pushes you|shoves you|forces you|grabs you|bends you|orders you|ties you|on your knees|at (?:her|his|their) mercy|you submit|you obey|you beg|takes you|uses you|breeds you)/g;
    function readRole(text, parts, battle) {
        if (battle) return battle.win ? "dom" : "sub";
        if (parts.lean) return parts.lean;
        var t = strip(text).toLowerCase();
        var d = (t.match(DOM_CUES) || []).length, s = (t.match(SUB_CUES) || []).length;
        if (d !== s) return d > s ? "dom" : "sub";
        return parts.dir === "them" ? "sub" : "dom";
    }
    function giverLabel(m) { return m.dir === "them" ? "Their " + m.tp : "Your " + m.yp; }
    function takerLabel(m) { return m.dir === "them" ? "Your " + m.yp : "Their " + m.tp; }
    F.readParts = readParts; F.readRole = readRole;

    /* ---------- Recording sex scenes ---------- */
    var page = null, prior = [], afterFight = null;
    F.busy = false;         // true while the visor is showing (nothing gets recorded)
    F.flash = null;         // the running flashback fight
    function newPage() { page = { who: [], loads: [], orgasm: false, timer: false, mem: 0 }; }
    newPage();
    function uiState() { try { return (typeof ui !== "undefined" && ui && ui.state) ? ui.state : null; } catch (err) { return null; } }
    function pageText() { var s = uiState(); return s && typeof s.preText === "string" ? s.preText : ""; }
    function pageName() { var s = uiState(); return s ? nice(s.nameShown || "") : ""; }
    var lastBusts = [];
    function pageBusts() { return lastBusts.slice(0, 3); }
    function addWho(list, c) {
        try {
            if (!c || c === pc) return;
            var n = nice(typeof c === "string" ? c : c.short);
            if (!n || /dummy|placeholder|^you$/i.test(n) || n === pc.short) return;
            if (list.indexOf(n) < 0 && list.length < 4) list.push(n);
        } catch (err) {}
    }
    function recording() { return on() && inGame() && !F.busy && !F.flash; }

    function commit() {
        page.timer = false;
        if (!recording()) return;
        var text = pageText();
        if (strip(text).length < 40) return;
        var pages = prior.slice(-2);
        var full = pages.map(function (p) { return p.text.slice(0, PAGE_CAP); }).concat([text.slice(0, PAGE_CAP)]).join(DIV);
        var g = null;
        try { if (window.TnSexGallery && typeof window.TnSexGallery.findScene === "function") g = window.TnSexGallery.findScene(full); } catch (err) {}
        var who = [];
        if (g && g.npc) addWho(who, g.npc);
        pages.forEach(function (p) { if (p.name) addWho(who, p.name); });
        if (pageName()) addWho(who, pageName());
        page.who.forEach(function (n) { addWho(who, n); });
        var fight = null;
        if (afterFight && now() - afterFight.t <= 240) fight = byId(afterFight.id);
        if (fight) fight.who.forEach(function (n) { addWho(who, n); });
        if (!who.length) who = [(g && /solo|masturbat/i.test((g.tags || []).join(" ") + " " + g.title)) || !page.loads.length ? "Yourself" : "Someone"];
        var parts = readParts(full, page.loads);
        var role = readRole(full, parts, fight);
        var key = g ? "g:" + g.id : "h:" + hash(strip(text).slice(0, 400));
        var s = load(), mem = null;
        for (var i = s.m.length - 1; i >= 0; i--) if (s.m[i].k === "s" && s.m[i].key === key) { mem = s.m[i]; break; }
        var busts = pageBusts();
        if (mem) {
            mem.txt = full; mem.f = 0; mem.c = (mem.c || 1) + 1; mem.d = now(); mem.loc = planet() || mem.loc;
            if (fight) { mem.b = fight.i; mem.role = role; }
            if (busts.length) mem.bu = busts;
            s.m.splice(s.m.indexOf(mem), 1); s.m.push(mem);
            save();
        } else {
            mem = add({ k: "s", key: key, d: now(), loc: planet(), who: who, role: role, dir: parts.dir, yp: parts.yp, tp: parts.tp,
                txt: full, b: fight ? fight.i : 0, g: g ? g.id : "", ti: g ? g.title : "", c: 1, bu: busts });
        }
        if (fight) { fight.s = mem.i; save(); }
        page.mem = mem.i;
        prior = [];
    }
    function noteOrgasm(who) {
        if (!recording()) return;
        if (who && who !== pc) addWho(page.who, who);
        page.orgasm = true;
        if (!page.timer) { page.timer = true; setTimeout(commit, 0); }
    }
    function noteLoad(receiver, giver, hole) {
        if (!recording()) return;
        try {
            if (receiver === pc && giver && giver !== pc) { page.loads.push({ pc: "recv", hole: hole }); addWho(page.who, giver); }
            else if (giver === pc && receiver && receiver !== pc) { page.loads.push({ pc: "gave", hole: hole }); addWho(page.who, receiver); }
        } catch (err) {}
    }
    function pageEnds() {
        if (!recording()) { newPage(); return; }
        try {
            if (page.mem) {
                var m = byId(page.mem), t = pageText();
                if (m && t && t.length > (m.txt || "").length && t.length <= PAGE_CAP * 3 && m.txt.indexOf(DIV) < 0) { m.txt = t.slice(0, PAGE_CAP); save(); }
            } else {
                var text = pageText();
                if (strip(text).length > 40) {
                    prior.push({ text: text, name: pageName() });
                    if (prior.length > 2) prior.shift();
                }
            }
        } catch (err) {}
        newPage();
    }

    /* ---------- Recording fights ---------- */
    function itemCls(it) { try { return it ? it.getClassName() : ""; } catch (err) { return ""; } }
    function itemName(it) { try { return it ? String(it.longName || it.shortName || "") : ""; } catch (err) { return ""; } }
    function statsOf(c) { return [c.physiqueRaw, c.reflexesRaw, c.aimRaw, c.intelligenceRaw, c.willpowerRaw, c.libidoRaw].map(function (x) { return Number(x) || 0; }); }
    function gear(c) {
        var eq = {};
        try { eq = c.inventory.equippedItems || {}; } catch (err) {}
        return { mw: itemCls(eq.meleeWeapon), mwn: itemName(eq.meleeWeapon), rw: itemCls(eq.rangedWeapon), rwn: itemName(eq.rangedWeapon) };
    }
    function pcShot() {
        var g = gear(pc);
        return { lvl: Number(pc.level) || 1, st: statsOf(pc), hp: Number(pc.HPRaw) || 1, en: Number(pc.energyRaw) || 0, lu: Number(pc.lustRaw) || 0, sh: Number(pc.shieldsRaw) || 0,
            mw: g.mw, mwn: g.mwn, rw: g.rw, rwn: g.rwn };
    }
    function foeShot(e) {
        var g = gear(e), nm = "", tx = "";
        try { nm = nice(e.short || (e.getCombatName && e.getCombatName()) || ""); } catch (err) {}
        try { tx = String((typeof e.a === "string" ? e.a : "") + (e.short || "")).replace(/\s+/g, " ").trim(); } catch (err) {}
        /* Generic enemies have an article and a lowercase name ("the female zil"); named ones
           have neither ("Kane", "Taivra") or a capitalized title ("the Sky Mother"). */
        var generic = false;
        try { generic = /^(an?|the) $/i.test(String(e.a || "")) && /^[a-z]/.test(String(e.short || "")); } catch (err) {}
        return { c: e.getClassName(), nm: nm || "Someone", tx: tx || nm || "someone", g: generic ? 1 : 0, lvl: Number(e.level) || 1, st: statsOf(e), hp: Number(e.HPRaw) || 1, sh: Number(e.shieldsRaw) || 0,
            en: Number(e.energyRaw) || 0, lu: Number(e.lustRaw) || 0, mw: g.mw, mwn: g.mwn, rw: g.rw, rwn: g.rwn };
    }
    function recordStart() {
        var cc = window.CombatManager.combatContainer;
        if (!cc || !recording() || window.__tnDaneSpar) return;
        var fr = cc.friendlies || [], hs = cc.hostiles || [];
        if (!hs.length || fr.indexOf(pc) < 0 || fr.some(function (f) { return f && f.isShip; })) return;
        var rec = { k: "b", d: now(), loc: planet(), pc: pcShot(), foes: [], who: [], win: 0, s: 0 };
        hs.forEach(function (e) { try { var f = foeShot(e); rec.foes.push(f); if (rec.who.indexOf(f.nm) < 0) rec.who.push(f.nm); } catch (err) {} });
        if (!rec.foes.length) return;
        var vf = cc.victoryFunction, lf = cc.lossFunction, done = false;
        if (typeof vf === "function") cc.victoryFunction = function () { if (!done) { done = true; finishFight(rec, true); } return vf.apply(this, arguments); };
        if (typeof lf === "function") cc.lossFunction = function () { if (!done) { done = true; finishFight(rec, false); } return lf.apply(this, arguments); };
    }
    function finishFight(rec, win) {
        try {
            if (!recording()) return;
            rec.win = win ? 1 : 0;
            rec.d = now();
            var m = add(rec);
            afterFight = { id: m.i, t: now() };
            prior = [];
        } catch (err) { console.warn("[TN] Flashback Visor: fight record failed", err); }
    }

    /* ---------- Hooks: output, orgasms, loads, combat, main menu ---------- */
    /* Other TN mods (Sex Gallery, Hand So's Redemption) mark their wrappers with __tn* flags.
       Copy those onto ours so nobody wraps the same function twice. Each hook is set once. */
    function marks(from, to) {
        try { for (var k in from) if (Object.prototype.hasOwnProperty.call(from, k) && k.indexOf("__tn") === 0) to[k] = from[k]; } catch (err) {}
        to.__tnFbv = true;
        return to;
    }
    var hooked = {};
    function wrapBust() {
        if (hooked.bust) return true;
        var b = window.showBust;
        if (typeof b !== "function") return false;
        window.showBust = marks(b, function () {
            try {
                if (!F.busy) {
                    var a = Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments);
                    lastBusts = a.filter(function (x) { return typeof x === "string" && x; }).slice(0, 3);
                }
            } catch (err) {}
            return b.apply(this, arguments);
        });
        hooked.bust = true;
        return true;
    }
    function wrapClear() {
        if (hooked.clear) return true;
        var c = window.clearOutput;
        if (typeof c !== "function") return false;
        window.clearOutput = marks(c, function () { try { pageEnds(); } catch (err) {} return c.apply(this, arguments); });
        hooked.clear = true;
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
    function wrapMethod(owner, name, before) {
        if (!owner || typeof owner[name] !== "function" || owner[name].__tnFbv) return;
        var orig = owner[name];
        var w = marks(orig, function () { try { before(this, arguments); } catch (err) {} return orig.apply(this, arguments); });
        try { owner[name] = w; } catch (err) { try { Object.defineProperty(owner, name, { value: w, writable: true, configurable: true }); } catch (err2) {} }
    }
    var LOADS = { loadInCunt: "cunt", loadInAss: "ass", loadInMouth: "mouth", loadInNipples: "nipples", loadInTailCunt: "tailcunt" };
    var creatureDone = false;
    function wrapCreature() {
        if (creatureDone) return true;
        if (typeof pc === "undefined" || !pc) return false;
        var os = owners(pc, "orgasm");
        if (!os.length) return false;
        os.forEach(function (o) { wrapMethod(o, "orgasm", function (self) { noteOrgasm(self); }); });
        Object.keys(LOADS).forEach(function (name) {
            owners(pc, name).forEach(function (o) { wrapMethod(o, name, function (self, args) { noteLoad(self, args[0], LOADS[name]); }); });
        });
        creatureDone = true;
        return true;
    }
    function wrapChars() {
        try {
            if (!creatureDone || typeof chars === "undefined" || !chars || wrapChars.done) return;
            for (var id in chars) {
                var c = chars[id];
                if (!c) continue;
                var p = Object.getPrototypeOf(c);
                if (p && Object.prototype.hasOwnProperty.call(p, "orgasm")) wrapMethod(p, "orgasm", function (self) { noteOrgasm(self); });
                Object.keys(LOADS).forEach(function (name) {
                    if (p && Object.prototype.hasOwnProperty.call(p, name)) wrapMethod(p, name, function (self, args) { noteLoad(self, args[0], LOADS[name]); });
                });
            }
            wrapChars.done = true;
        } catch (err) {}
    }
    function wrapCombat() {
        var CM = window.CombatManager;
        if (hooked.combat) return true;
        if (!CM || typeof CM.beginCombat !== "function") return false;
        var orig = CM.beginCombat;
        CM.beginCombat = marks(orig, function () { try { recordStart(); } catch (err) { console.warn("[TN] Flashback Visor: fight watch failed", err); } return orig.apply(this, arguments); });
        hooked.combat = true;
        return true;
    }
    function wrapMainMenu() {
        if (hooked.menu) return true;
        var m = window.mainGameMenu;
        if (typeof m !== "function") return false;
        window.mainGameMenu = marks(m, function () {
            try {
                prior = [];
                afterFight = null;
                if (inGame() && !fighting()) {
                    F.busy = false;
                    if (flags.TN_FBV_SNAP) F.restore();
                }
            } catch (err) { console.warn("[TN] Flashback Visor: menu hook", err); }
            return m.apply(this, arguments);
        });
        hooked.menu = true;
        return true;
    }

    /* ---------- Shops: Zenn (Dhaal) and Luca (Canadia Station) ---------- */
    window.tnFbvShopButton = function (slot, who) {
        if (!on() || !inGame()) return;
        if (hasVisor()) { addDisabledButton(slot, "Flash Visor", "Flashback Visor", "You already own a Flashback Visor. Use it from your Codex (Extra)."); return; }
        var tip = who === "zenn" ? "Zenn has a Paragon-made headset on the counter: a visor that replays your own memories.\n\n<b>Price:</b> " + fmt(PRICE) + " credits"
            : "A sleek visor sits in Luca’s display case: it replays your own memories, she says.\n\n<b>Price:</b> " + fmt(PRICE) + " credits";
        addButton(slot, "Flash Visor", function () { F.shop(who); }, "Flashback Visor", tip);
    };
    function shopShow(who) {
        clearOutput();
        if (who === "zenn") { try { showBust("ZENN"); showName("ZENN"); } catch (err) {} }
        else { try { luca.showAll(); } catch (err) { try { showName("LUCA"); } catch (err2) {} } }
        author("Neston");
    }
    function shopBack(who) {
        if (who === "zenn" && typeof window.paragonPlaygroundVRMenu === "function") {
            clearOutput();
            try { showBust("ZENN"); showName("ZENN"); } catch (err) {}
            output("The machines hum and beep around you.");
            window.paragonPlaygroundVRMenu();
        } else if (who === "luca" && typeof window.tnFbvLucaMenu === "function") window.tnFbvLucaMenu();
        else mainGameMenu();
    }
    F.shop = function (who) {
        shopShow(who);
        if (who === "zenn") {
            say([
                "You point at the headset sitting on the corner of Zenn’s desk: a slim, wraparound visor in Paragon chrome, its eyepieces filled with something that looks like slowly swirling smoke.",
                q("Oh, you’ve got an eye. That’s the Flashback.") + " Zenn scoops it up and twirls it on one finger. " + q("Paragon’s latest. The Mindstream plugs you into somebody else’s fantasy. This baby plugs you into <b>yours</b>. Your own memories, cutie. Every fight, every fuck, played back like you’re living it."),
                q("Now, you’ve maybe heard about that Mindwash Visor Dr. Badger cooked up,") + " she goes on, wrinkling her nose. " + q("Beams it all straight into your skull and leaves you with a taint problem. Nasty. This doesn’t beam anything. It puffs a little flashback fog into your eyes, it fogs up the old brain the same way a real flashback does, and then it shows you the memory you picked. Safe as a nap. Zero taint."),
                q("It reads what you’ve been through, and every time you put it on it syncs up the new stuff. Hook it to your Codex and it lives in there with the rest of your junk.") + " She grins. " + q("Five thousand credits. You’ll get your money’s worth in reruns.")
            ]);
        } else {
            say([
                "You ask Luca about the visor in her display case. It’s a slim, wraparound thing in dark chrome, its eyepieces filled with what looks like slowly swirling smoke.",
                q("Ah, the Flashback Visor.") + " Luca lifts it out of the case with careful hands, as if it might break. " + q("It’s not one of my simulations. It doesn’t make up a fantasy. It replays things you’ve already lived: fights, lovers, all of it, exactly as they happened."),
                "She glances at the roped-off booth in the corner. " + q("And it’s nothing like that awful Mindwash Visor of Dr. Badger’s, before you ask. That one beams things straight into your brain, and you walk out of it a little more tainted every time.") + " She taps one smoky eyepiece. " + q("This one only fogs your eyes and mind into a flashback, very gently, and then shows you the memory you chose. No taint. No side effects, except maybe a little nostalgia."),
                q("It reads what you’ve been through, and every time you wear it, it updates with your new memories. It can connect to your Codex too.") + " She smiles. " + q("Five thousand credits.")
            ]);
        }
        clearMenu();
        if (pc.credits >= PRICE) addButton(0, "Buy", function () { F.buy(who); }, "Buy the Flashback Visor", "Pay " + fmt(PRICE) + " credits.");
        else addDisabledButton(0, "Buy", "Buy the Flashback Visor", "You need " + fmt(PRICE) + " credits.");
        addButton(14, "Back", function () { shopBack(who); }, "Back", "Maybe later.");
    };
    F.buy = function (who) {
        shopShow(who);
        pc.credits -= PRICE;
        try { pc.createKeyItem(KEY, 0, 0, 0, 0, "A Paragon VR visor that fogs you into vivid flashbacks of the fights and sex you’ve been through. Use it from your Codex (Extra)."); } catch (err) {}
        flags.TN_FBV_BOUGHT = who === "zenn" ? 1 : 2;
        say([
            who === "zenn"
                ? "You transfer the credits. Zenn tosses you the visor, which you only just catch. " + q("Pleasure doing business. Don’t get lost in there, yeah? Some of my regulars forget to eat.")
                : "You transfer the credits. Luca packs the visor into a padded case and hands it over with both hands. " + q("Enjoy it. And remember to come back out now and then, [pc.name]."),
            "You pair it with your Codex. A new entry blinks into the Extra tab: <b>Flashback Visor</b>.",
            "<b>(Key item gained: Flashback Visor. Use it from Codex > Extra.)</b>"
        ]);
        nextTo(function () { shopBack(who); }, "Back to the shop.");
    };

    /* ---------- The visor menu ---------- */
    function sexMems() { return all().filter(function (m) { return m.k === "s"; }); }
    function fightMems() { return all().filter(function (m) { return m.k === "b"; }); }
    function bothMems() { return fightMems().filter(function (m) { return m.s && byId(m.s); }); }
    function sessionMin() { return Number(flags.TN_FBV_SESSION) || 0; }
    function spend(min) { processTime(min); flags.TN_FBV_SESSION = sessionMin() + min; }
    F.back = function () { mainGameMenu(); };
    function visorShow() {
        clearOutput();
        try { showName("FLASHBACK\nVISOR"); } catch (err) {}
        author("Neston");
    }
    F.open = function (back) {
        if (typeof back === "function") F.back = back;
        if (!on() || !hasVisor()) { F.back(); return; }
        if (fighting()) return;
        F.busy = true;
        flags.TN_FBV_SESSION = 0;
        flags.TN_FBV_WEARING = 1;
        var s = load(), seen = Number(flags.TN_FBV_SYNCED) || 0;
        var fresh = s.m.filter(function (m) { return m.i > seen; }).length;
        flags.TN_FBV_SYNCED = s.n - 1;
        visorShow();
        var lines = [];
        if (flags.TN_FBV_USED !== 1) {
            flags.TN_FBV_USED = 1;
            lines.push("You settle " + pick({ biped: "back in a comfortable spot", taur: "your tauric body down on the deck, legs folded under you", naga: "into a loose pile of your own coils" }) + " and slide the Flashback Visor over your eyes for the first time.");
            lines.push("For a moment there’s nothing but darkness. Then the eyepieces breathe out a cool, silvery haze. It doesn’t sting. It drifts into your eyes like morning mist, and somewhere behind them your thoughts go soft and slow, the way they do in the second before a vivid memory takes over. The flashback fog.");
            lines.push("Nothing is being pushed into your head. You can feel the difference: the visor is only reading what’s already there, and the fog makes it easy to fall into. Menus glow up out of the haze, sorted and waiting.");
        } else {
            lines.push("You slide the Flashback Visor over your eyes. The eyepieces sigh out their cool, silvery haze, and the flashback fog rolls in behind your eyes, soft and familiar.");
        }
        lines.push(fresh > 0 ? "<i>Syncing... " + fresh + " new " + (fresh === 1 ? "memory" : "memories") + " added.</i>" : "<i>Syncing... no new memories since last time.</i>");
        say(lines);
        F.menu(true);
    };
    F.menu = function (keepText) {
        F.busy = true;
        if (!keepText) {
            visorShow();
            var h = Math.floor(sessionMin() / 60);
            output("The fog swirls patiently, waiting for you to choose." + (h >= 1 ? " <i>(You’ve been under for about " + h + (h === 1 ? " hour" : " hours") + ".)</i>" : ""));
        }
        var sx = sexMems(), fx = fightMems(), bx = bothMems();
        output("\n\n<b>Memories:</b> " + sx.length + " sex, " + fx.length + " " + (fx.length === 1 ? "fight" : "fights") + " (" + fx.filter(function (m) { return m.win; }).length + " won, " + fx.filter(function (m) { return !m.win; }).length + " lost), " + bx.length + " with both.");
        clearMenu();
        if (sx.length) addButton(0, "Sex", F.sexRole, "Sex", "Relive a sex scene you’ve been through.");
        else addDisabledButton(0, "Sex", "Sex", "The visor hasn’t sensed any sex scenes yet.");
        if (fx.length) addButton(1, "Battle", function () { F.fightWho(false); }, "Battle", "Relive a fight as Flashback Steele, at your old level and with your old weapons.");
        else addDisabledButton(1, "Battle", "Battle", "The visor hasn’t sensed any fights yet.");
        if (bx.length) addButton(2, "Both", function () { F.fightWho(true); }, "Both", "A fight, and the sex that came right after it.");
        else addDisabledButton(2, "Both", "Both", "You need a fight that ended in sex.");
        if (sx.length || fx.length) addButton(3, "Drift", F.drift, "Drift", "Stop choosing. Let the fog pick memories for you for a few hours.");
        else addDisabledButton(3, "Drift", "Drift", "Nothing to drift through yet.");
        if (!ST()) addDisabledButton(5, "Save All", "Save All Text", NEED_ST);
        else addButton(5, "Save All", F.saveAll, "Save All Text", "Save every sex scene and fight as .rtf files in a .zip, with a folder for each character.");
        addButton(4, "Codex Link", F.link, "Codex Link: " + (flags.TN_FBV_LINK === 1 ? "On" : "Off"), flags.TN_FBV_LINK === 1 ? "Your flashback logs are shared with your Codex (Hand So can see them). Turn it off?" : "Share your flashback logs with your Codex so someone you trust (like Hand So) can see them.");
        addButton(14, "Take It Off", F.takeOff, "Take It Off", "Come back to the present.");
    };

    /* generic paged list: items = [{label, tip, fn}] */
    function list(items, back, page) {
        page = page || 0;
        var per = 12, start = page * per;
        clearMenu();
        items.slice(start, start + per).forEach(function (it, i) { addButton(i, short(it.label, 16), it.fn, it.label, it.tip || ""); });
        if (page > 0) addButton(12, "Prev", function () { list(items, back, page - 1); }, "Previous Page", "");
        if (start + per < items.length) addButton(13, "More", function () { list(items, back, page + 1); }, "More", "Next page.");
        addButton(14, "Back", back, "Back", "");
    }
    function groupBy(mems, keyFn) {
        var map = {}, order = [];
        mems.forEach(function (m) { (keyFn(m) || []).forEach(function (k) { if (!map[k]) { map[k] = []; order.push(k); } map[k].push(m); }); });
        return order.map(function (k) { return { key: k, mems: map[k] }; }).sort(function (a, b) { return b.mems.length - a.mems.length || (a.key < b.key ? -1 : 1); });
    }
    function memLabel(m) { return "Day " + dayOf(m.d) + (m.c > 1 ? " ×" + m.c : "") + (m.f ? " (faded)" : ""); }
    function memTip(m) {
        var t = (m.loc ? m.loc + ". " : "") + (m.ti ? m.ti + ". " : "");
        if (m.k === "s") t += short(strip(m.txt), 140);
        return t || "A memory.";
    }

    /* ---------- Sex: role -> who -> part -> part -> memory ---------- */
    F.sexRole = function () {
        visorShow();
        output("The fog thickens, warm and heavy. Which of your memories do you want to sink into?");
        var sx = sexMems(), sub = sx.filter(function (m) { return m.role === "sub"; }).length, dom = sx.length - sub;
        clearMenu();
        if (sub) addButton(0, "Sub", function () { F.sexWho("sub"); }, "Sub", sub + (sub === 1 ? " memory" : " memories") + " of being on the bottom.");
        else addDisabledButton(0, "Sub", "Sub", "No memories of being the sub yet.");
        if (dom) addButton(1, "Domme", function () { F.sexWho("dom"); }, "Domme", dom + (dom === 1 ? " memory" : " memories") + " of being in charge.");
        else addDisabledButton(1, "Domme", "Domme", "No memories of being the domme yet.");
        addButton(14, "Back", function () { F.menu(); }, "Back", "");
    };
    function roleWord(r) { return r === "sub" ? "sub" : "domme"; }
    F.sexWho = function (role) {
        var mems = sexMems().filter(function (m) { return m.role === role; });
        visorShow();
        output("Faces swim up out of the fog, everyone you’ve been the " + roleWord(role) + " with. Who do you want to remember?");
        var groups = groupBy(mems, function (m) { return m.who && m.who.length ? m.who : ["Someone"]; });
        list(groups.map(function (g) {
            return { label: g.key, tip: g.mems.length + (g.mems.length === 1 ? " memory" : " memories") + ".", fn: function () { F.sexGive(role, g.key); } };
        }), F.sexRole);
    };
    function whoHas(m, who) { return (m.who && m.who.length ? m.who : ["Someone"]).indexOf(who) >= 0; }
    F.sexGive = function (role, who) {
        var mems = sexMems().filter(function (m) { return m.role === role && whoHas(m, who); });
        visorShow();
        output("The memories of " + who + " sort themselves in the fog. What went where? First, the part that did the work:");
        var groups = groupBy(mems, function (m) { return [giverLabel(m)]; });
        list(groups.map(function (g) {
            return { label: g.key, tip: g.mems.length + (g.mems.length === 1 ? " memory" : " memories") + ".", fn: function () { F.sexTake(role, who, g.key); } };
        }), function () { F.sexWho(role); });
    };
    F.sexTake = function (role, who, give) {
        var mems = sexMems().filter(function (m) { return m.role === role && whoHas(m, who) && giverLabel(m) === give; });
        visorShow();
        output(give + "... into what?");
        var groups = groupBy(mems, function (m) { return [takerLabel(m)]; });
        list(groups.map(function (g) {
            return { label: g.key, tip: give + " into " + g.key.charAt(0).toLowerCase() + g.key.slice(1) + ". " + g.mems.length + (g.mems.length === 1 ? " memory." : " memories."), fn: function () { F.sexList(role, who, give, g.key); } };
        }), function () { F.sexGive(role, who); });
    };
    F.sexList = function (role, who, give, take) {
        var mems = sexMems().filter(function (m) { return m.role === role && whoHas(m, who) && giverLabel(m) === give && takerLabel(m) === take; }).reverse();
        var back = function () { F.sexList(role, who, give, take); };
        visorShow();
        output(give + " into " + take.charAt(0).toLowerCase() + take.slice(1) + ", with " + who + ". Pick a memory:");
        list(mems.map(function (m) { return { label: memLabel(m), tip: memTip(m), fn: function () { F.playSex(m, back); } }; }), function () { F.sexTake(role, who, give); });
    };

    /* ---------- Fight intros (two paragraphs) ---------- */
    function weaponLine(p) {
        var w = [];
        if (p.mwn) w.push(p.mwn);
        if (p.rwn) w.push(p.rwn);
        return w.length ? "your " + w.join(" and your ") + " in hand" : "nothing but your fists and your wits";
    }
    function foeNames(b) {
        var l = [];
        (b.foes || []).forEach(function (f) { var t = f.tx || f.nm; if (t && l.indexOf(t) < 0) l.push(t); });
        return joinNames(l.length ? l : b.who);
    }
    function cap(t) { t = String(t || ""); return t.charAt(0).toUpperCase() + t.slice(1); }
    function plural(b) { return b.foes.length > 1; }
    function fightIntro(b) {
        var where = b.loc ? b.loc : "a place you’d almost forgotten";
        var foes = foeNames(b), pl = plural(b);
        if (b.win) return [
            "You fought, and fought hard, and you came out on top. The fog peels back onto " + where + ", and there’s " + foes + ", squaring up against you, " + weaponLine(b.pc) + ". You can feel every bruise you took that day all over again, fresh and bright, and the stubborn heat in your chest that wouldn’t let you quit.",
            "You remember how it ended. " + cap(foes) + (pl ? " went down one after another" : " went down") + ", and you, level " + b.pc.lvl + " Steele with your " + feet() + " planted and your breath ragged, were the one still standing. The visor holds the moment there, sharp as glass, and lets you savor it."
        ];
        return [
            "You fought, and fought hard, but you didn’t come out on top. The fog peels back onto " + where + ", and there’s " + foes + ", squaring up against you, " + weaponLine(b.pc) + ". Every blow you landed feels real again, and so does every one you didn’t see coming.",
            "You remember how it ended. Your " + feet() + " went out from under you, level " + b.pc.lvl + " Steele with nothing left to give, and " + foes + " stood over you, " + (pl ? "the victors" : "the victor") + ". The visor holds the moment there, honest and unflinching. It doesn’t judge. It just remembers."
        ];
    }
    F.fightIntro = fightIntro;

    /* ---------- Replay a sex memory ---------- */

    /* ---------- Copy / save scene text (needs TN_SceneText_v2.9.js) ---------- */
    function ST() { var t = window.tnSceneText; return t && typeof t.exportZip === "function" && (!t.on || t.on()) ? t : null; }
    var NEED_ST = "Needs the Scene Text Saver mod (TN_SceneText_v2.9.js) turned on.";
    function memRec(m) {
        return { kind: "sex", chars: (m.who || []).slice(), title: m.ti || ("Memory, Day " + dayOf(m.d)), pages: String(m.txt || "").split(DIV),
            d: m.d, loc: m.loc, busts: m.bu || [], pc: (pc && pc.short) || "Steele" };
    }
    F.copyMem = function (m) {
        var t = ST(); if (!t) return;
        t.find(String(m.txt || "").split(DIV).pop(), "sex").then(function (rec) { t.copy(t.toText(rec || memRec(m))); });
    };
    F.saveMem = function (m) {
        var t = ST(); if (!t) return;
        t.find(String(m.txt || "").split(DIV).pop(), "sex").then(function (rec) { t.saveRtf(rec || memRec(m)); });
    };
    F.saveFight = function (b) {
        var t = ST(); if (!t) return;
        t.findFight(b.who, !!b.win).then(function (rec) {
            if (rec) t.saveRtf(rec);
            else output("\n\n<i>There’s no full text for this fight yet. Fights are saved from the moment the Scene Text Saver is installed (only the newest " + (b.win ? "victory" : "defeat") + " against each enemy is kept).</i>");
        });
    };
    F.saveAll = function () {
        var t = ST(); if (!t) return;
        t.exportZip(sexMems().filter(function (m) { return m.txt && !m.f; }).map(memRec));
    };

    F.playSex = function (m, back, sameHour) {
        visorShow();
        try { if (m.bu && m.bu.length) showBust.apply(null, m.bu); } catch (err) {}
        try { if (m.who && m.who[0] && m.who[0] !== "Yourself" && m.who[0] !== "Someone") showName(m.who[0].toUpperCase()); } catch (err) {}
        var lines = [];
        var b = m.b ? byId(m.b) : null;
        if (b) lines = lines.concat(fightIntro(b));
        else lines.push("The fog rolls in behind your eyes, warm and slow, and when it thins you’re " + (m.loc ? "on " + m.loc + " again" : "somewhere you’ve been before") + ", day " + dayOf(m.d) + ", " + (m.who && m.who[0] !== "Yourself" ? "with " + joinNames(m.who) : "alone with yourself") + ". Everything is exactly as it was: every touch, every word, every sound.");
        say(lines);
        if (m.f || !m.txt) output("\n\nBut the memory is faded, more fog than picture. You can just make out shapes. <i>(This memory faded to make room for newer ones. Live it again in the game to refresh it.)</i>");
        else output(DIV + safeText(m.txt));
        output(DIV + "The fog drifts back in, and the memory softens and lets you go.");
        if (!sameHour) spend(60); // each memory = one hour (a Both fight already spent it)
        clearMenu();
        addButton(0, "Again", function () { F.playSex(m, back); }, "Again", "Relive it one more time.");
        addButton(1, "Re-file", function () { F.refile(m, back); }, "Re-file", "File this memory as " + (m.role === "sub" ? "Domme" : "Sub") + " instead.");
        addButton(2, "Forget", function () { F.forget(m, back); }, "Forget", "Delete this memory from the visor.");
        if (!ST()) {
            addDisabledButton(3, "Copy Text", "Copy Text", NEED_ST);
            addDisabledButton(4, "Save Text", "Save Text", NEED_ST);
        } else if (m.txt && !m.f) {
            addButton(3, "Copy Text", function () { F.copyMem(m); }, "Copy Text", "Copy this scene’s full text to your clipboard.");
            addButton(4, "Save Text", function () { F.saveMem(m); }, "Save Text", "Save this scene’s full text as an .rtf file (bold and italics kept).");
        } else {
            addDisabledButton(3, "Copy Text", "Copy Text", "This memory has faded. Live the scene again in the game to get its text back.");
            addDisabledButton(4, "Save Text", "Save Text", "This memory has faded. Live the scene again in the game to get its text back.");
        }
        addButton(14, "Back", function () { var mm = byId(m.i); if (mm) back(); else F.menu(); }, "Back", "");
    };
    F.refile = function (m, back) {
        m.role = m.role === "sub" ? "dom" : "sub";
        save();
        visorShow();
        output("You nudge the memory with a thought and it slides over to the other shelf. <b>(Filed as " + (m.role === "sub" ? "Sub" : "Domme") + ".)</b>");
        nextTo(function () { F.menu(); }, "Back to the menu.");
    };
    F.forget = function (m, back) {
        visorShow();
        output("Delete this memory from the visor for good? (Your save keeps everything that happened; only the replay is gone.)");
        clearMenu();
        addButton(0, "Forget It", function () {
            var s = load();
            s.m = s.m.filter(function (x) { return x.i !== m.i; });
            s.m.forEach(function (x) { if (x.s === m.i) x.s = 0; if (x.b === m.i) x.b = 0; });
            save();
            visorShow();
            output("The memory dissolves into the fog.");
            nextTo(function () { F.menu(); }, "Back to the menu.");
        }, "Forget It", "");
        addButton(14, "Keep It", back, "Keep It", "");
    };

    /* ---------- Battle and Both: who -> fight ---------- */
    F.fightWho = function (both) {
        var mems = both ? bothMems() : fightMems();
        visorShow();
        output(both ? "Fights that ended in someone’s bed, or someone’s dirt. Who was it?" : "Every fight you’ve been in stands up out of the fog. Who do you want to face again?");
        var groups = groupBy(mems, function (m) { return m.who; });
        list(groups.map(function (g) {
            var w = g.mems.filter(function (m) { return m.win; }).length;
            return { label: g.key, tip: g.mems.length + (g.mems.length === 1 ? " fight" : " fights") + ": " + w + " won, " + (g.mems.length - w) + " lost.", fn: function () { F.fightList(both, g.key); } };
        }), function () { F.menu(); });
    };
    F.fightList = function (both, who) {
        var mems = (both ? bothMems() : fightMems()).filter(function (m) { return m.who.indexOf(who) >= 0; }).reverse();
        visorShow();
        output("Your fights with " + who + ":");
        list(mems.map(function (m) {
            return { label: "Day " + dayOf(m.d) + (m.win ? " Won" : " Lost"), tip: (m.loc ? m.loc + ". " : "") + "You were level " + m.pc.lvl + ", " + weaponLine(m.pc) + ". " + (m.win ? "You won." : "You lost."),
                fn: function () { F.fightView(m, both, function () { F.fightList(both, who); }); } };
        }), function () { F.fightWho(both); });
    };
    F.fightView = function (b, both, back) {
        visorShow();
        say(fightIntro(b));
        var ok = b.foes.every(function (f) { return !!classByName(f.c); });
        output("\n\n<i>Flashback Steele: level " + b.pc.lvl + ", " + weaponLine(b.pc) + ".</i>");
        clearMenu();
        if (ok) addButton(0, "Fight It", function () { F.flashIntro(b, both, back); }, "Fight It", "Face " + foeNames(b) + " again as Flashback Steele. Win or lose, nothing carries over to reality.");
        else addDisabledButton(0, "Fight It", "Fight It", "This fight is too foggy to step into. (The game can’t rebuild this enemy.)");
        var s = b.s ? byId(b.s) : null;
        if (s) addButton(1, both ? "Just the Sex" : "After", function () { F.playSex(s, back); }, "What Came After", "Skip to the sex that happened right after.");
        if (ST()) addButton(4, "Save Text", function () { F.saveFight(b); }, "Save Text", "Save the full text of your newest " + (b.win ? "victory" : "defeat") + " against " + foeNames(b) + " as an .rtf file.");
        else addDisabledButton(4, "Save Text", "Save Text", NEED_ST);
        addButton(14, "Back", back, "Back", "");
    };

    /* ---------- Flashback Steele: the mock fight ---------- */
    function setStats(c, st) {
        if (!st || st.length < 6) return;
        c.physiqueRaw = st[0]; c.reflexesRaw = st[1]; c.aimRaw = st[2]; c.intelligenceRaw = st[3]; c.willpowerRaw = st[4]; c.libidoRaw = st[5];
    }
    function equipFoe(e, slot, cls) {
        try {
            var inv = e.inventory, cur = (inv.equippedItems || {})[slot];
            if (itemCls(cur) === (cls || "")) return;
            if (cur) inv.unequipItem(cur);
            if (cls) { var C = classByName(cls); if (C) inv[slot] = new C(); }
        } catch (err) {}
    }
    function buildFoe(f) {
        var C = classByName(f.c);
        if (!C) return null;
        var e = new C();
        e.level = f.lvl;
        setStats(e, f.st);
        equipFoe(e, "meleeWeapon", f.mw);
        equipFoe(e, "rangedWeapon", f.rw);
        try { e.HPRaw = Math.max(1, Math.min(f.hp, e.HPMax())); } catch (err) { e.HPRaw = f.hp; }
        try { e.shieldsRaw = Math.min(f.sh, e.shieldsMax()); } catch (err) { e.shieldsRaw = f.sh; }
        e.energyRaw = f.en;
        e.lustRaw = f.lu;
        e.credits = 0;
        e.XP = function () { return 0; };
        try { if (e.inventory.storage) e.inventory.storage.length = 0; } catch (err) {}
        return e;
    }
    /* Flashback Steele's weapons: the real ones wait in the game's hidden equipment slots
       (the same place a save keeps them), and come back when the flashback ends. */
    function swapPc(slot, cls) {
        var inv = pc.inventory, cur = (inv.equippedItems || {})[slot], te = inv.transientEquipment || {};
        if (itemCls(cur) === (cls || "")) return false;
        if (te[slot]) return false;
        var item = null;
        if (cls) { var C = classByName(cls); if (!C) return false; item = new C(); }
        if (slot === "meleeWeapon") inv.takeMeleeWeapon(); else inv.takeRangedWeapon();
        if (item) { try { inv[slot] = item; } catch (err) { console.warn("[TN] Flashback Visor: weapon swap", err); } }
        return true;
    }
    function applyPast(p) {
        var snap = { lvl: pc.level, xp: pc.XPRaw, st: statsOf(pc), hp: pc.HPRaw, en: pc.energyRaw, lu: pc.lustRaw, sh: pc.shieldsRaw, m: 0, r: 0 };
        flags.TN_FBV_SNAP = JSON.stringify(snap);
        pc.level = p.lvl;
        setStats(pc, p.st);
        try { snap.m = swapPc("meleeWeapon", p.mw) ? 1 : 0; } catch (err) { console.warn("[TN] Flashback Visor: melee", err); }
        try { snap.r = swapPc("rangedWeapon", p.rw) ? 1 : 0; } catch (err) { console.warn("[TN] Flashback Visor: ranged", err); }
        flags.TN_FBV_SNAP = JSON.stringify(snap);
        try { pc.HPRaw = Math.max(1, Math.min(p.hp, pc.HPMax())); } catch (err) { pc.HPRaw = p.hp; }
        try { pc.shieldsRaw = Math.min(p.sh, pc.shieldsMax()); } catch (err) {}
        pc.energyRaw = p.en;
        pc.lustRaw = p.lu;
    }
    F.restore = function () {
        var raw = flags.TN_FBV_SNAP;
        if (!raw) return;
        var s = null;
        try { s = JSON.parse(raw); } catch (err) {}
        flags.TN_FBV_SNAP = undefined;
        delete flags.TN_FBV_SNAP;
        if (!s) return;
        var inv = pc.inventory;
        [["m", "meleeWeapon", "giveMeleeWeapon"], ["r", "rangedWeapon", "giveRangedWeapon"]].forEach(function (x) {
            if (!s[x[0]]) return;
            try {
                var cur = (inv.equippedItems || {})[x[1]];
                if (cur) inv.unequipItem(cur);
                inv[x[2]]();
            } catch (err) { console.warn("[TN] Flashback Visor: weapon restore", err); }
        });
        pc.level = s.lvl;
        pc.XPRaw = s.xp;
        setStats(pc, s.st);
        pc.HPRaw = s.hp; pc.energyRaw = s.en; pc.lustRaw = s.lu; pc.shieldsRaw = s.sh;
        F.flash = null;
    };
    F.flashIntro = function (b, both, back) {
        visorShow();
        say([
            "You lean into the memory instead of just watching it.",
            "The fog goes thick and silver, then thins. You’re " + (b.loc ? "on " + b.loc : "back there") + ". Your body feels different: lighter where you’ve grown since, heavier where you hadn’t learned yet. You’re level " + b.pc.lvl + " again, " + weaponLine(b.pc) + ". You are <b>Flashback Steele</b>.",
            cap(foeNames(b)) + " " + (plural(b) ? "stand" : "stands") + " across from you, exactly as you remember, stats and steel and all. Somewhere far away, your real body breathes slowly behind the visor. Nothing that happens here is real. It just <i>feels</i> real.",
            "<b>A flashback fight! Win or lose, it won’t touch reality. You " + (b.win ? "won" : "lost") + " this one the first time.</b>"
        ]);
        clearMenu();
        addButton(0, "Fight!", function () { F.flashStart(b, both, back); }, "Fight!", "Relive it.");
        addButton(14, "Back", back, "Back", "Not today.");
    };
    F.flashStart = function (b, both, back) {
        var CM = window.CombatManager, foes = [];
        try { b.foes.forEach(function (f) { var e = buildFoe(f); if (!e) throw new Error("no class " + f.c); foes.push(e); }); }
        catch (err) {
            console.warn("[TN] Flashback Visor: could not rebuild", err);
            visorShow();
            output("The memory flickers and won’t hold still. Faces blur. You can’t step into this one. <i>(The Flashback Visor couldn’t rebuild this fight. Nothing was changed.)</i>");
            nextTo(back, "Back.");
            return;
        }
        F.flash = { b: b, both: both, back: back };
        try {
            applyPast(b.pc);
            CM.newGroundCombat();
            CM.setFriendlyActors(pc);
            CM.setHostileActors(foes);
            CM.victoryScene(function () { F.flashEnd(true); });
            CM.lossScene(function () { F.flashEnd(false); });
            CM.displayLocation("FLASHBACK", b.loc || "MEMORY");
            if (CM.encounterText && foes[0]) { try { CM.encounterText(foes[0].long || ""); } catch (err) {} }
            CM.beginCombat();
        } catch (err) {
            console.warn("[TN] Flashback Visor: fight setup failed", err);
            try { if (CM.combatContainer) { CM.combatContainer.doCombatCleanup(); CM.combatContainer = null; } } catch (err2) {}
            F.restore();
            visorShow();
            output("The memory shatters like a dropped glass and the fog rushes in. <i>(The Flashback Visor couldn’t start this fight. Your real level and gear are back.)</i>");
            nextTo(back, "Back.");
        }
    };
    F.flashEnd = function (won) {
        var fl = F.flash || {}, b = fl.b, back = fl.back || function () { F.menu(); };
        F.restore();
        F.busy = true;
        spend(60); // each memory = one hour
        IncrementFlag(won ? "TN_FBV_MOCK_WINS" : "TN_FBV_MOCK_LOSSES");
        var same = b && (!!b.win === !!won);
        var lines = [];
        if (won) lines.push(b && !b.win ? "This time, you win. " + cap(foeNames(b)) + (plural(b) ? " go" : " goes") + " down in the fog, and for one dizzy moment you wonder what would have happened if it had gone like this for real." : "You win, just like you did back then. " + (b ? cap(foeNames(b)) : "They") + (b && plural(b) ? " go" : " goes") + " down, and the fog cheers you on with the memory of how good it felt the first time.");
        else lines.push(b && b.win ? "This time, you lose. The flashback " + (b && plural(b) ? "foes stand" : "foe stands") + " over you, and it stings even knowing none of it is real. You won this fight once. You know you can." : "You lose, the same as you did back then. It still stings. But this time you got to see it coming.");
        lines.push("The fog pours back in, silver and cool, and when it clears you’re yourself again: your real level, your real gear, your real body breathing behind the visor. <b>(Nothing from the flashback fight carries over.)</b>");
        var s = b && b.s ? byId(b.s) : null;
        output("\n\n");
        say(lines);
        var cont = function () {
            F.flash = null;
            if (fl.both && s) {
                visorShow();
                if (same) output("The memory doesn’t stop at the fight. It rolls right on into what happened next...");
                else output("The memory stutters. It didn’t happen like this. The fog shivers, then shows you what <i>really</i> happened next...");
                nextTo(function () { F.playSex(s, back, true); }, "Remember what came after.");
            } else F.menu();
        };
        if (won) window.CombatManager.genericVictory(cont);
        else window.CombatManager.genericLoss(cont);
    };

    /* ---------- Drift ---------- */
    F.drift = function () {
        var pool = all().filter(function (m) { return !(m.k === "s" && m.f); });
        visorShow();
        var lines = ["You stop choosing and let the fog carry you. Memories slide past one after another, the visor stringing them together like beads: "];
        var picks = [], tries = 0;
        while (picks.length < Math.min(3, pool.length) && tries++ < 20) { var m = rnd(pool); if (picks.indexOf(m) < 0) picks.push(m); }
        picks.forEach(function (m) {
            if (m.k === "b") lines.push("— " + (m.win ? "Standing over " : "Flat on your back under ") + joinNames(m.who) + (m.loc ? " on " + m.loc : "") + ", " + weaponLine(m.pc) + ".");
            else lines.push("— " + (m.who && m.who[0] !== "Yourself" ? joinNames(m.who) : "Your own hands") + (m.loc ? " on " + m.loc : "") + ": " + short(strip(m.txt), 160));
        });
        lines.push("Hours slip away like water. You only notice how long it’s been when the fog thins for a moment and the visor’s little clock blinks at you.");
        say(lines);
        spend(6 * 60);
        output("\n\n<i>(About " + Math.floor(sessionMin() / 60) + " hours under so far.)</i>");
        clearMenu();
        addButton(0, "Keep Drifting", F.drift, "Keep Drifting", "Another few hours.");
        addButton(14, "Menu", function () { F.menu(); }, "Menu", "Back to choosing.");
    };

    /* ---------- Codex link ---------- */
    F.link = function () {
        visorShow();
        if (flags.TN_FBV_LINK === 1) {
            flags.TN_FBV_LINK = 0;
            output("You thumb the link off. The visor stops sharing its logs with your Codex. <b>(Codex Link: Off.)</b>");
        } else {
            flags.TN_FBV_LINK = 1;
            var so = !!(window.tnHsr && typeof window.tnHsrEnabled === "function" && window.tnHsrEnabled() && (flags.TN_HANDSO_PILOT === 1 || (function () { try { return pc.hasKeyItem("Hand So’s Data Bead") || pc.hasKeyItem("Hand So's Data Bead"); } catch (err) { return false; } })()));
            output("You pair the visor’s logs with your Codex. A little icon, a swirl of fog, appears in the corner of every screen." + (so ? " A moment later a soft, many-voiced chime: Hand So has noticed. " + q("You are sharing your memories with me, Captain? I will be careful with them.") : "") + " <b>(Codex Link: On. Anyone you let into your Codex, like Hand So, can see your flashback logs.)</b>");
        }
        clearMenu();
        addButton(0, "Next", function () { F.menu(); }, "Next", "");
    };
    F.linked = function () { return on() && typeof flags !== "undefined" && flags.TN_FBV_LINK === 1 && hasVisor(); };

    /* ---------- Taking it off ---------- */
    F.takeOff = function () {
        var min = sessionMin();
        F.busy = false;
        flags.TN_FBV_WEARING = 0;
        visorShow();
        var h = Math.floor(min / 60);
        output("You lift the Flashback Visor off your face. The last of the fog clears from your eyes, and the present comes back: the hum of " + (aboard() ? "your ship" : "the world around you") + ", the weight of your body, your real level and your real gear." + (h >= 24 ? " Your muscles are stiff. You’ve been under for about " + h + " hours." : ""));
        F.busy = true;
        if (min >= CHECKIN_MINUTES && aboard()) flags.TN_FBV_CHECKIN = 1;
        flags.TN_FBV_SESSION = 0;
        clearMenu();
        addButton(0, "Next", function () {
            F.busy = false;
            if (flags.TN_FBV_CHECKIN === 1 && aboard() && F.checkIn(F.back)) return;
            F.back();
        }, "Next", "");
    };

    /* ---------- 48 hours: crew check-ins ---------- */
    function crewOn(name) {
        try { var c = window[name] || (typeof chars !== "undefined" && chars[name.toUpperCase()]); return !!(c && typeof c.isCrew === "function" && c.isCrew()); }
        catch (err) { return false; }
    }
    function daneHere() { try { return typeof window.tnDaneAboard === "function" && !!window.tnDaneAboard(); } catch (err) { return false; } }
    function feruzeHere() { try { return typeof window.tnFeruzeAboard === "function" ? !!window.tnFeruzeAboard() : flags.TN_FERUZE_CREW === 1; } catch (err) { return false; } }
    function reahaHere() { try { return crewOn("reaha") && window.reaha && window.reaha.isCured(); } catch (err) { return false; } }
    function daneSub() { return flags.LOST_TO_DANE_ON_MHENGA === 1 && (Number(flags.DANE_SEXED) > 0 || Number(flags.TN_DANE_SHIP_SEX) > 0); }
    function mf(m, f) { try { return pc.mf(m, f); } catch (err) { return f; } }
    function showCrew(id) {
        clearOutput();
        try {
            var c = window[id];
            if (c && typeof c.showAll === "function") c.showAll();
            else showName(id.toUpperCase());
        } catch (err) {}
        author("Neston");
    }
    var CHECKS = {
        dane: function () {
            showCrew("dane");
            say([
                "Dane is leaning on the bulkhead right outside, all four arms folded, like he’s been waiting there a while. Maybe he has.",
                daneSub()
                    ? q("There you are,") + " he rumbles, pushing off the wall. " + q("Two days, Steele. You’ve been in there for a long time. You okay?") + " Then the grin comes, slow and toothy. " + q("‘Cause I missed my favorite cumdump. Was starting to think I’d have to come in there and drag you out by the ankles.")
                    : q("There you are,") + " he rumbles, pushing off the wall. " + q("Two days, Steele. You’ve been in there for a long time. You okay?") + " He jerks his chin at the visor in your hand. " + q("Missed your " + mf("handsome, roguish", "sweet but smirking") + " face. Instead I get <i>that</i> thing strapped over it. Not the same."),
                "You tell him you’re fine, and explain what the visor does: the fog, the memories, the fights you can step back into. He listens with one eyebrow up, unimpressed, right up until you mention it does sex too. Every scene you’ve ever been in, played back exactly as it happened. Even the ones with more than one partner.",
                "Dane goes very still. Then a slow, predatory grin spreads across his muzzle. " + q("Every one?") + " he says. " + q("Even the group stuff?") + " Two of his hands are already reaching for it. " + q("Gimme that. I gotta see this."),
                "You hand it over. He jams it over his eyes, the strap stretched to its limit around his big head, and drops onto a crate. The eyepieces sigh out their silver fog. His tail starts to wag. Then it stops wagging, and just... hangs there.",
                "A few hours later he hands it back without a word, rubbing his eyes. " + q("Huh,") + " is all he says, and he wanders off toward the galley. <i>(Maybe ask him about it later.)</i>"
            ]);
            flags.TN_FBV_DANE_TRIED = 1;
            flags.TN_FBV_DANE_DAY = dayOf(now());
            return 180;
        },
        daneAgain: function () {
            showCrew("dane");
            say([
                "Dane’s waiting outside again. " + q("Again, Steele? Two days?") + " He shakes his head. " + q("You’ve been in there for a long time. You okay?"),
                daneSub() ? q("Don’t get lost in the reruns,") + " he growls, and swats your ass with one of his lower hands as you pass. " + q("Your favorite cumdump job’s still open out here. Live version’s better.") : q("Don’t get lost in the reruns,") + " he says, gruffer than he means to. " + q("I know what it’s like. The real stuff’s out here."),
                "You promise him you’re fine. He doesn’t look like he believes you, but he lets it go."
            ]);
            return 10;
        },
        reaha: function () {
            showCrew("reaha");
            say([
                "Reaha is sitting outside with her knees pulled up and a mug of something warm going cold in her hands. She jumps up when you come out. " + q("[pc.name]! You’ve been in there for a long time. Two whole days. You okay?"),
                "You tell her you’re fine, just remembering. She chews her lip.",
                q("I know what it’s like,") + " she says quietly. " + q("Chasing a feeling. Telling yourself it’s just one more, and then it’s been days and you can’t remember choosing.") + " She touches the place on her arm where the patches used to go. " + q("I’m not saying that’s you. I’m just... checking. Make sure you’re coming back out ‘cause you want to, okay?"),
                "You promise. She hugs you, careful of the visor, and presses the cold mug into your hands anyway."
            ]);
            return 15;
        },
        feruze: function () {
            showCrew("feruze");
            say([
                "Feruze is posted right outside, at parade rest, like she’s guarding the door. " + q("Forty-eight hours, Captain,") + " she says without looking at you. " + q("I counted. You’ve been in there a long time. You okay?"),
                "You tell her you’re fine. She finally looks at you, sharp suula teeth showing in a frown.",
                q("I guarded a rich kid who lived in a VR rig for a week once,") + " she says. " + q("Wouldn’t eat. Wouldn’t sleep. Said the real world was boring.") + " Her jaw sets. " + q("People who spend too long looking backward walk into knives. I’d rather not have to pull one out of you."),
                "You promise to keep your eyes forward. She grunts, satisfied, and goes back to pretending she wasn’t worried."
            ]);
            return 10;
        },
        syri: function () {
            showCrew("syri");
            var lover = false, valden = Number(flags.SYRIQUEST_STATE) >= 10, body = Number(flags.SYRIQUEST_VALDEN_BODY_CHOICE) || 0;
            try { lover = !!(window.syri && typeof window.syri.isLover === "function" ? window.syri.isLover() : flags.SYRIQUEST_POST_GAME_TALK_LOVE === 1); } catch (err) { lover = flags.SYRIQUEST_POST_GAME_TALK_LOVE === 1; }
            var wulfeName = flags.SYRIQUEST_SIEGWULFE_NAME && flags.SYRIQUEST_SIEGWULFE_NAME !== "Siegwulfe" ? flags.SYRIQUEST_SIEGWULFE_NAME : "your old Siegwulfe";
            var whereValden = body === 1 ? "off in some droid body he scrounged up, being all vague in his emails"
                : (body === 2 || body === 3) ? "walking around in " + wulfeName + "’s body, of all things"
                : "out there somewhere, free";
            var lines = [
                "Syri is sprawled in the corridor outside with a handheld game, and she sits up the second you come out. " + q(lover ? "Babe. You’ve been in there for like two days. You okay?" : "Dude. You’ve been in there for like two days. You okay?"),
                "You tell her you’re fine, just reliving some stuff. She sets the handheld down, which is how you know she’s serious."
            ];
            if (valden) lines.push(q("Look, I know what addiction to tech feels like,") + " she says. " + q("Not just the three-day raid binges. Valden. I carried his whole mind around in the implants in my head for " + (flags.SYRIQUEST_STATE >= 21 ? "years" : "ages") + ", plugged into anything that might bring him back. Kept chasing it, kept telling myself one more lead. We busted him out of Akkadi, he’s " + whereValden + ", I got fired with extreme prejudice, and I’m still not sure I know how to <i>not</i> be plugged into something.") + " She scratches behind one ear. " + q("Now I’m gonna win that holo-shooter tourney and live like a queen. Out here. In the real world."));
            else lines.push(q("Look, I know what addiction to tech feels like,") + " she says. " + q("I’ve done the three-day raid binges. Forgot to eat, forgot what day it was, got real mad when somebody pulled the plug."));
            if (lover) {
                lines.push("She reaches up and hooks a finger in your collar, tugging you down until you’re nose to nose. Her ears are flat. " + q("And I don’t want my lover falling into the same hole I did,") + " she says, quieter. " + q("I mean it, [pc.name]. That thing’s cool, and the past is fun to visit. But you’re the best thing that happened to me after all that shit, and you happened <i>out here</i>. Don’t go getting overly reliant on a headset, okay? I’d have to come in there and drag you out, and I’m way better at games than you."));
                lines.push("You promise. She kisses you, a little too hard, like she’s checking you’re really there, then flops back down with her game, tail thumping the deck. She keeps glancing up at you, though.");
            } else {
                lines.push(q("That thing’s cool, I get it. Just... don’t get overly reliant on it, okay? The past’s a save file. You can load it, but you can’t live in it."));
                lines.push("You promise. She punches your shoulder, not very hard, and goes back to her game. She keeps glancing up at you, though.");
            }
            say(lines);
            return 10;
        },
        anno: function () {
            showCrew("anno");
            say([
                "Anno pokes her head around the corner the moment you take the visor off, ears perked and worried. " + q("Hey, boss! You’ve been in there for a long time. Like, two days long. You okay?"),
                "You tell her you’re fine. She pads over and takes the visor out of your hands to turn it over, the way she does with any tech that’s been making her nervous.",
                q("Paragon firmware. Fog emitter. No neural beam, so at least it’s not frying anything up there.") + " She taps your forehead and hands it back. " + q("I just wanted to check in. Make sure you’re not, you know, stuck back there. Getting hooked on the reruns.") + " Her tail swishes. " + q("The present’s pretty good too. I’m in it."),
                "You promise her you’re not going anywhere. She grins, relieved, and goes to make you something to eat."
            ]);
            return 10;
        }
    };
    F.checkIn = function (after) {
        var who = [];
        if (daneHere()) who.push(flags.TN_FBV_DANE_TRIED === 1 ? "daneAgain" : "dane");
        if (reahaHere()) who.push("reaha");
        if (feruzeHere()) who.push("feruze");
        if (crewOn("syri")) who.push("syri");
        if (crewOn("anno")) who.push("anno");
        flags.TN_FBV_CHECKIN = 0;
        if (!who.length) return false;
        var id = who.indexOf("dane") >= 0 ? "dane" : rnd(who);
        var min = CHECKS[id]();
        processTime(min || 10);
        nextTo(typeof after === "function" ? after : mainGameMenu, "Back to the present.");
        return true;
    };

    /* ---------- Dane: "The Visor" talk ---------- */
    F.daneTalk = function () {
        var T = window.tnDane || {};
        clearOutput();
        try { dane.showAll(); } catch (err) { try { showName("DANE"); } catch (err2) {} }
        author("Neston");
        say([
            "You ask Dane how he liked the Flashback Visor.",
            "He’s quiet for long enough that you think he isn’t going to answer. Then he blows out a breath through his nose. " + q("Worst thing ever,") + " he says flatly. " + q("Hands down."),
            q("I went back to the harem,") + " he says, staring at nothing. " + q("All of ‘em. Steamy nights, too many bodies in one bed, somebody’s tail in my face, somebody laughing. Warm. Felt exactly like it did.") + " His upper hands flex. " + q("That’s the problem. It felt exactly like it did. Made me never want to come back to reality."),
            q("And then you take it off,") + " he goes on, rougher now, " + q("and you’re on a crate in a cargo hold, and it’s just you. Felt extra cold after. No comfort. No warmth. Like coming in out of the sun and finding out the whole damn house is empty.") + " He shakes his head. " + q("Never again. Your memories, sure, you do you. Mine stay where they are."),
            "He clears his throat and looks away. " + q("...Thanks for letting me try it, though. Was good to see ‘em. Even if it sucked.")
        ]);
        flags.TN_FBV_DANE_TALKED = 1;
        processTime(10);
        clearMenu();
        addButton(0, "Next", window.tnDaneTalkMenu || mainGameMenu, "Next", "Talk about something else.");
    };
    function wrapDaneTalk() {
        if (hooked.dane) return true;
        var m = window.tnDaneTalkMenu;
        if (typeof m !== "function") return false;
        var w = function () {
            var r = m.apply(this, arguments);
            try {
                if (on() && flags.TN_FBV_DANE_TRIED === 1) {
                    if (dayOf(now()) > (Number(flags.TN_FBV_DANE_DAY) || 0)) addButton(12, "The Visor", F.daneTalk, "The Visor", "Ask him how he liked the Flashback Visor.");
                    else addDisabledButton(12, "The Visor", "The Visor", "Give him a day to think about it first.");
                }
            } catch (err) {}
            return r;
        };
        window.tnDaneTalkMenu = marks(m, w);
        hooked.dane = true;
        return true;
    }

    /* ---------- Hand So (Hand So's Redemption) ---------- */
    function demoPair() {
        var fights = bothMems().filter(function (b) { return b.win; });
        var losses = sexMems().filter(function (m) { var b = m.b ? byId(m.b) : null; return b && !b.win && !m.f; });
        return { win: fights.length ? fights[fights.length - 1] : null, loss: losses.length ? losses[losses.length - 1] : null };
    }
    F.demoPair = demoPair;
    F.demoState = function () {
        if (!on() || !hasVisor()) return { show: false, ok: false, why: "" };
        if (flags.TN_FBV_LINK !== 1) return { show: true, ok: false, why: "Turn on the Flashback Visor’s Codex Link first, so she can see your memories." };
        var p = demoPair();
        if (!p.win && !p.loss) return { show: true, ok: false, why: "You need a fight you won that ended in sex, and a fight you lost that ended in sex, in your Flashback Visor." };
        if (!p.win) return { show: true, ok: false, why: "You still need a fight you won that ended in sex (a “Both” memory) in your Flashback Visor." };
        if (!p.loss) return { show: true, ok: false, why: "You still need a sex memory from a fight you lost in your Flashback Visor." };
        return { show: true, ok: true, why: "" };
    };
    function excerpt(m, n) {
        if (!m || !m.txt) return "";
        var parts = String(m.txt).split(/\n\n+/).filter(function (p) { return strip(p).length > 20 && p.indexOf("<center>") < 0; });
        var out = "", i = 0;
        while (i < parts.length && strip(out).length < (n || 450)) { out += (out ? "\n\n" : "") + parts[i]; i++; }
        return safeText(out);
    }
    F.excerpt = excerpt;
    var SO_Q = {
        fightLost: function (m) {
            return {
                ask: q("I saw a fight in your logs,") + " Hand So says. " + q("Day " + dayOf(m.d) + ", " + (m.loc || "somewhere") + ". You lost to " + joinNames(m.who) + ". You went back and watched it again.") + " Her code-face tilts. " + q("Why would you choose to relive losing?"),
                a: [
                    ["To Learn", q("To see what I did wrong,") + " you tell her. " + q("Next time I’ll see it coming."), q("You study your failures,") + " she says, pleased. " + q("I used to delete mine.")],
                    ["Still Stings", q("Honestly? It still stings,") + " you admit. " + q("I keep poking it to see if it still hurts."), "Hand So is quiet a moment. " + q("I think I understand. Some of my memories are like that. I touch them carefully.")],
                    ["Not Your Biz", q("That’s private,") + " you tell her.", q("Of course,") + " she says at once. " + q("You shared the logs. You did not share the reasons. I will not ask again.")]
                ]
            };
        },
        fightWon: function (m) {
            return {
                ask: q("You beat " + joinNames(m.who) + (m.loc ? " on " + m.loc : "") + ",") + " Hand So says. " + q("You were level " + m.pc.lvl + ". The visor says you have watched it more than once.") + " Her smile curls. " + q("Is that pride, Captain?"),
                a: [
                    ["Pride", q("Damn right it’s pride,") + " you say.", "Her laugh chimes. " + q("Good. You earned it. I would watch it too.")],
                    ["Relief", q("Relief, mostly,") + " you admit. " + q("It could’ve gone the other way."), q("It could have,") + " she agrees softly. " + q("I am glad it did not.")],
                    ["Practice", q("I’m practicing,") + " you say. " + q("Flashback me is still in there swinging."), q("Flashback Steele,") + " she muses. " + q("I like her less than the real one.")]
                ]
            };
        },
        sexSub: function (m) {
            return {
                ask: q("You let " + joinNames(m.who) + " take the lead,") + " Hand So says, carefully. " + q("You chose to remember that. Did you want it, at the time?"),
                a: [
                    ["I Did", q("I did,") + " you tell her. " + q("Giving up control can be its own kind of fun."), "Her code-face brightens. " + q("Given, not taken. I am still learning the difference. You make it look simple.")],
                    ["Complicated", q("It’s complicated,") + " you say.", q("Most things are, I am finding,") + " she says. " + q("Thank you for not pretending otherwise.")],
                    ["Drop It", q("Let’s not,") + " you say.", q("Then we will not,") + " she says simply, and changes the subject."]
                ]
            };
        },
        sexDom: function (m) {
            return {
                ask: q("You were in charge with " + joinNames(m.who) + ",") + " Hand So says. " + q("You replayed it.") + " A pause. " + q("Did they enjoy it as much as you?"),
                a: [
                    ["I Asked", q("I made sure,") + " you tell her. " + q("That’s half the fun."), q("You asked,") + " she repeats, and her smile softens. " + q("I never asked. I am glad you do.")],
                    ["They Did", q("Trust me, they did,") + " you say, grinning.", "Her laugh chimes. " + q("I believe you. The logs are... very convincing.")],
                    ["Mine", q("That one’s mine,") + " you say.", q("Of course,") + " she says. " + q("I will look away.")]
                ]
            };
        }
    };
    F.handSoButton = function (slot) {
        if (!on() || !hasVisor() || flags.TN_FBV_LINK !== 1) return;
        addButton(slot, "Flashbacks", F.handSoTalk, "Your Flashbacks", "She can see your Flashback Visor logs. Let her ask about them.");
    };
    F.handSoTalk = function () {
        var H = window.tnHsr || {};
        clearOutput();
        try { showBust("HAND_SO"); showName("HAND\nSO"); } catch (err) {}
        author("Neston");
        var mems = all().filter(function (m) { return !(m.k === "s" && m.f); });
        if (!mems.length) {
            say([q("Your flashback logs are empty, Captain,") + " Hand So says. " + q("Go and live something. Then I will have questions.")]);
            nextTo(function () { if (H.toComm) H.toComm(); else mainGameMenu(); }, "Back to her.");
            return;
        }
        var m = rnd(mems.slice(-12));
        var card = m.k === "b" ? (m.win ? SO_Q.fightWon(m) : SO_Q.fightLost(m)) : (m.role === "sub" ? SO_Q.sexSub(m) : SO_Q.sexDom(m));
        say([
            "Hand So’s face fills the screen, a little swirl of fog glowing in the corner where your visor’s logs are linked.",
            card.ask
        ]);
        processTime(5);
        clearMenu();
        card.a.forEach(function (a, i) {
            addButton(i, a[0], function () {
                clearOutput();
                try { showBust("HAND_SO"); showName("HAND\nSO"); } catch (err) {}
                author("Neston");
                say([a[1], a[2]]);
                IncrementFlag("TN_FBV_SO_TALKS");
                processTime(5);
                nextTo(function () { if (H.toComm) H.toComm(); else mainGameMenu(); }, "Back to her.");
            }, a[0], "");
        });
    };

    /* ---------- Codex > Extra ---------- */
    function wrapCodex() {
        if (hooked.codex) return true;
        var orig = window.tnCodexExtraAddons;
        if (typeof orig !== "function") return false;
        var w = function (lst) {
            orig.apply(this, arguments);
            try {
                if (!on() || !inGame() || !hasVisor() || !lst || typeof lst.push !== "function") return;
                var item = { name: "Flashback Visor", desc: "Relive the fights and sex scenes you’ve been through.", txt: "Visor",
                    f: function () { F.open(function () { window.showCodexExtra(); }); },
                    ttH: "Flashback Visor", ttB: "Put on the Flashback Visor." };
                var blocked = (typeof inCombat === "function" && inCombat()) || (window.ui && typeof ui.disableExtraCodexActions === "function" && ui.disableExtraCodexActions());
                if (blocked) { item.f = null; item.ttB = "You cannot use this at this time."; }
                lst.push(item);
            } catch (err) { console.warn("[TN] Flashback Visor: codex", err); }
        };
        window.tnCodexExtraAddons = marks(orig, w);
        hooked.codex = true;
        return true;
    }

    /* ---------- Boot ---------- */
    F.status = function () {
        var s = inGame() ? load() : { m: [] };
        return { enabled: on(), visor: inGame() && hasVisor(), sex: s.m.filter(function (m) { return m.k === "s"; }).length, fights: s.m.filter(function (m) { return m.k === "b"; }).length,
            hooks: { clear: !!(window.clearOutput && window.clearOutput.__tnFbv), creature: creatureDone, combat: !!(window.CombatManager && window.CombatManager.beginCombat && window.CombatManager.beginCombat.__tnFbv),
                menu: !!(window.mainGameMenu && window.mainGameMenu.__tnFbv), codex: !!(window.tnCodexExtraAddons && window.tnCodexExtraAddons.__tnFbv), dane: !!(window.tnDaneTalkMenu && window.tnDaneTalkMenu.__tnFbv) } };
    };
    var ticks = 0;
    (function tick() {
        ticks++;
        try { wrapClear(); wrapBust(); } catch (err) {}
        try { wrapCreature(); wrapChars(); } catch (err) {}
        try { wrapCombat(); } catch (err) {}
        try { wrapMainMenu(); } catch (err) {}
        try { wrapCodex(); } catch (err) {}
        try { wrapDaneTalk(); } catch (err) {}
        try { if (inGame() && flags.TN_FBV_SNAP && !fighting()) F.restore(); } catch (err) {}
        setTimeout(tick, ticks < 60 ? 500 : 2000);
    })();
})();
