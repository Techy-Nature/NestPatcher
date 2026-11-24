/* TN Femme Former for Trials in Tainted Space (Modv3.0, checked against 0.9.168).
   A TamaniCorp machine in the spirit of the Dong Designer and the Muff Modeler, but for the
   chest AND the pussy at once. It is shaped like the Egg Trainer: a long, padded pink bench.
   Steele lies on it stomach-first, two cups seal around the breasts, and a padded saddle with
   a probe works below.

   - Found: on Tarkus, on the Oil Sea Beach three rooms south of the Polluted Beach (room 230),
     like the Dong Designer. Take it, then install it on your ship.
   - Bought: a booth in the TamaniCorp shop on Tavros, where Lerris works (next to the Muff
     Modeler stand), for 50,500 credits. It's the only TamaniCorp shop in the game.
   - Install it: use it from your inventory while aboard your ship. Uninstall it from its own menu.
   - Use it: Masturbate > Installed on your ship, like the Muff Modeler.
   - Chest, for each breast row: cup size (flat up to the game's biggest cup) and nipple type.
     You can also add one breast row (up to three rows).
   - Nipples (all rows): length, nipples per breast and color.
   - Pussy, for each vagina: type (25 kinds), wetness, minimum looseness, clits and color,
     plus clit size. You can also grow a new pussy (up to three).
   - Plan any mix of changes, then press Start: one session does them all.
   - The game's own locks still apply (Goo Crotch, Gel Body, The Treatment and so on).
   - Item: TnFemmeFormer ("FemmeF."), a gadget you carry and install.
   - Flags: TN_FEMME_FORMER (2 = installed), TN_FEMME_FORMER_FOUND (0 = found on Tarkus and left,
     1 = taken), TN_FEMME_FORMER_BOUGHT (how many bought), TN_FEMME_FORMER_USES (times used),
     TN_FEMME_FORMER_BOOTH (seen the booth), TN_FEMME_FORMER_TUTORIAL (heard the tutorial).

   Needs TN_FemmeFormer_v3.0.mod (the Tarkus find, the booth button, the Installed menu and the Stats line).
   Toggle: Android Mods / TN Mod Settings > "Femme Former". */
(function () {
    "use strict";
    if (window.tnFemmeFormer) return;

    var MOD_ID = "TN_FemmeFormer";
    var NAME = "Femme Former";
    var PRICE = 50500;
    var MAX_ROWS = 3;          // breast rows the machine will grow up to
    var MAX_CUP = 198;         // the game's biggest named cup
    var MAX_PUSSIES = 3;       // the game's own limit

    // Vagina catalog: [GLOBAL key, button, tooltip].
    var PUSSY_TYPES = [
        ["TYPE_HUMAN", "Human", "A classic terran pussy: neat, pink and dependable."],
        ["TYPE_KUITAN", "Kui-tan", "A cute, soft tanuki pussy."],
        ["TYPE_LEITHAN", "Leithan", "A big, roomy leithan pussy that puffs up when you’re excited."],
        ["TYPE_GRYVAIN", "Gryvain", "A gryvain pussy, lined with extra clits inside."],
        ["TYPE_SIREN", "Suula", "A suula pussy, ringed with aphrodisiac stingers."],
        ["TYPE_EQUINE", "Equine", "A puffy, swollen mare’s pussy, made for the biggest insertions."],
        ["TYPE_CANINE", "Canine", "A canine pussy, shaped to take a knot."],
        ["TYPE_FELINE", "Feline", "A tight, discreet feline pussy."],
        ["TYPE_VULPINE", "Vulpine", "A vixen’s pussy, a little neater than a canine one."],
        ["TYPE_SHARK", "Shark", "A shark’s pussy with big, smooth lips."],
        ["TYPE_DEER", "Deer", "A small, unassuming cervine pussy."],
        ["TYPE_SWINE", "Swine", "A sow’s pussy: tight, but deep."],
        ["TYPE_AVIAN", "Avian", "A simple avian pussy, much like a cloaca."],
        ["TYPE_SAURMORIAN", "Saurmorian", "A strong, muscular saurmorian pussy."],
        ["TYPE_BEE", "Bee", "A zil pussy that smells faintly of honey."],
        ["TYPE_LAPINARA", "Lapinara", "A sleek, smooth lapinara pussy."],
        ["TYPE_VANAE", "Vanae", "An exotic vanae pussy."],
        ["TYPE_KORGONNE", "Korgonne", "A compact korgonne pussy that still takes a knot."],
        ["TYPE_FROSTWYRM", "Frostwyrm", "A huge, powerful frostwyrm pussy."],
        ["TYPE_NAGA", "Naga", "A naga pussy, tucked away behind a genital slit."],
        ["TYPE_FLOWER", "Flower", "A velvety, fragrant flower in place of a pussy."],
        ["TYPE_MOUTHGINA", "Mouthgina", "A pussy that is half mouth, lips and all."],
        ["TYPE_ANEMONE", "Anemone", "An anemone pussy, fringed with aphrodisiac tendrils."],
        ["TYPE_GABILANI", "Gabilani", "A petite gabilani pussy that stretches far more than it looks."],
        ["TYPE_NYREA", "Nyrea", "A nyrea pussy with thick, gripping inner walls."]
    ];
    var NIPPLE_TYPES = [
        ["NIPPLE_TYPE_NORMAL", "Normal", "Ordinary nipples.", "normal nipples"],
        ["NIPPLE_TYPE_FLAT", "Flat", "Flat nipples that barely rise from the areola.", "flat nipples"],
        ["NIPPLE_TYPE_INVERTED", "Inverted", "Shy nipples that hide inside until you’re aroused.", "inverted nipples"],
        ["NIPPLE_TYPE_LIPPLES", "Lipples", "Plump, kissable lips in place of nipples.", "lipples"],
        ["NIPPLE_TYPE_FUCKABLE", "Fuckable", "Nipples that open into tight, fuckable passages.", "fuckable nipples"],
        ["NIPPLE_TYPE_DICK", "Dick", "Nipples that hide cocks, ready to slide out when you’re turned on.", "dick-nipples"],
        ["NIPPLE_TYPE_TENTACLED", "Tentacled", "Nipples that hide wriggling tentacles.", "tentacle nipples"]
    ];
    var COLORS = ["pink", "peach", "rosy", "red", "crimson", "brown", "black", "purple", "blue", "teal", "green", "gold", "silver"];
    var WETNESS = ["Dry", "Damp", "Moist", "Wet", "Slick", "Drooling"];
    var LOOSENESS = ["", "Virgin-Tight", "Tight", "Loose", "Gaping", "Gaping-Wide"];

    // ---------------------------------------------------------------------------
    // Small helpers
    // ---------------------------------------------------------------------------
    function active() {
        return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") ||
            window.isTnModEnabled(MOD_ID);
    }
    function P(fn, dflt) { try { var v = fn(); return v === undefined ? dflt : v; } catch (err) { return dflt; } }
    function G(key) { return P(function () { return window.GLOBAL[key]; }, undefined); }
    function pcx() { return window.pc; }
    function flags() { return window.flags; }
    function cap(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
    function plural(n, one, many) { return n === 1 ? one : many; }
    function cupName(r) { return r <= 0 ? "flat" : P(function () { return pcx().breastCup(0, r); }, String(r)); }
    function inches(n) { return (Math.round(n * 10) / 10) + " in"; }
    function nth(i) { return ["first", "second", "third", "fourth", "fifth"][i] || ("#" + (i + 1)); }
    function typeName(key) {
        for (var i = 0; i < PUSSY_TYPES.length; i++) if (G(PUSSY_TYPES[i][0]) === key) return PUSSY_TYPES[i][1];
        return P(function () { return window.GLOBAL.TYPE_NAMES[key]; }, "alien");
    }
    function nippleName(key) {
        for (var i = 0; i < NIPPLE_TYPES.length; i++) if (G(NIPPLE_TYPES[i][0]) === key) return NIPPLE_TYPES[i][1];
        return "Unusual";
    }
    function nipplePhrase(key) {
        for (var i = 0; i < NIPPLE_TYPES.length; i++) if (G(NIPPLE_TYPES[i][0]) === key) return NIPPLE_TYPES[i][3];
        return "unusual nipples";
    }
    function goo() { return P(function () { return pcx().hasStatusEffect("Goo Crotch"); }, false); }
    function head() {
        try { window.author("Neston"); } catch (err) {}
        try { window.showName(NAME); } catch (err) {}
    }
    function installed() { return active() && P(function () { return flags().TN_FEMME_FORMER === 2; }, false); }

    // ---------------------------------------------------------------------------
    // The plan: what the next session will change. Nothing is applied until Start.
    // ---------------------------------------------------------------------------
    var plan = null;
    function freshPlan() { return { rows: {}, vags: {}, addRow: false, addPussy: false, nipLen: null, nipPer: null, nipColor: null, clitLen: null }; }
    function getPlan() { if (!plan) plan = freshPlan(); return plan; }
    function rowCount() { return P(function () { return pcx().breastRows.length; }, 0); }
    function vagCount() { return P(function () { return pcx().vaginas.length; }, 0); }
    function plannedRows() { return rowCount() + (getPlan().addRow ? 1 : 0); }
    function plannedVags() { return vagCount() + (getPlan().addPussy ? 1 : 0); }

    // What a row or pussy is now (a planned new one copies the last row / starts as a plain human pussy).
    function baseRow(i) {
        var pc = pcx(), n = rowCount();
        var src = pc.breastRows[i < n ? i : n - 1];
        return {
            rating: src ? Math.round(P(function () { return src.breastRating(); }, src.breastRatingRaw || 0)) : 0,
            nipType: src ? src.nippleType : G("NIPPLE_TYPE_NORMAL")
        };
    }
    function baseVag(i) {
        var v = pcx().vaginas[i];
        if (!v) return { type: G("TYPE_HUMAN"), wet: 1, loose: 1, clits: 1, color: "pink", isNew: true };
        return { type: v.type, wet: v.wetnessRaw, loose: v.minLooseness, clits: v.clits, color: v.vaginaColor, isNew: false };
    }
    function row(i) {
        var b = baseRow(i), p = getPlan().rows[i] || {};
        return { rating: p.rating !== undefined ? p.rating : b.rating, nipType: p.nipType !== undefined ? p.nipType : b.nipType };
    }
    function vag(i) {
        var b = baseVag(i), p = getPlan().vags[i] || {}, out = {};
        for (var k in b) out[k] = p[k] !== undefined ? p[k] : b[k];
        return out;
    }
    function setRow(i, key, val) {
        var p = getPlan();
        p.rows[i] = p.rows[i] || {};
        if (val === baseRow(i)[key] && i < rowCount()) delete p.rows[i][key]; else p.rows[i][key] = val;
    }
    function setVag(i, key, val) {
        var p = getPlan();
        p.vags[i] = p.vags[i] || {};
        if (val === baseVag(i)[key] && i < vagCount()) delete p.vags[i][key]; else p.vags[i][key] = val;
    }
    function nip() {
        var pc = pcx(), p = getPlan();
        return {
            len: p.nipLen !== null ? p.nipLen : pc.nippleLengthRatio,
            per: p.nipPer !== null ? p.nipPer : pc.nipplesPerBreast,
            color: p.nipColor !== null ? p.nipColor : pc.nippleColor,
            clitLen: p.clitLen !== null ? p.clitLen : pc.clitLength
        };
    }

    function chestChanges() {
        var p = getPlan(), n = rowCount(), list = [];
        if (p.addRow) list.push("Grow a new row of " + cupName(row(n).rating) + (row(n).rating > 0 ? " breasts" : " nipples") + " (" + nipplePhrase(row(n).nipType) + ")");
        for (var i = 0; i < n; i++) {
            var b = baseRow(i), r = row(i);
            if (r.rating !== b.rating) list.push("Row " + (i + 1) + ": " + cupName(b.rating) + " → <b>" + cupName(r.rating) + "</b>");
            if (r.nipType !== b.nipType) list.push("Row " + (i + 1) + " nipples: " + nippleName(b.nipType) + " → <b>" + nippleName(r.nipType) + "</b>");
        }
        var pc = pcx();
        if (p.nipLen !== null && p.nipLen !== pc.nippleLengthRatio) list.push("Nipple length: " + pc.nippleLengthRatio + "× → <b>" + p.nipLen + "×</b>");
        if (p.nipPer !== null && p.nipPer !== pc.nipplesPerBreast) list.push("Nipples per breast: " + pc.nipplesPerBreast + " → <b>" + p.nipPer + "</b>");
        if (p.nipColor !== null && p.nipColor !== pc.nippleColor) list.push("Nipple color: " + pc.nippleColor + " → <b>" + p.nipColor + "</b>");
        return list;
    }
    function pussyChanges() {
        var p = getPlan(), n = vagCount(), list = [], pc = pcx();
        if (p.addPussy) {
            var v = vag(n);
            list.push("Grow a new " + v.color + " " + typeName(v.type).toLowerCase() + " pussy");
        }
        for (var i = 0; i < n; i++) {
            var b = baseVag(i), c = vag(i), lbl = "Pussy " + (i + 1);
            if (c.type !== b.type) list.push(lbl + ": " + typeName(b.type) + " → <b>" + typeName(c.type) + "</b>");
            if (c.wet !== b.wet) list.push(lbl + " wetness: " + WETNESS[Math.min(b.wet, 5)] + " → <b>" + WETNESS[c.wet] + "</b>");
            if (c.loose !== b.loose) list.push(lbl + " tightness: " + (LOOSENESS[b.loose] || b.loose) + " → <b>" + LOOSENESS[c.loose] + "</b>");
            if (c.clits !== b.clits) list.push(lbl + " clits: " + b.clits + " → <b>" + c.clits + "</b>");
            if (c.color !== b.color) list.push(lbl + " color: " + b.color + " → <b>" + c.color + "</b>");
        }
        if (p.clitLen !== null && p.clitLen !== pc.clitLength) list.push("Clit size: " + inches(pc.clitLength) + " → <b>" + inches(p.clitLen) + "</b>");
        return list;
    }

    // ---------------------------------------------------------------------------
    // The item: a boxed Femme Former you carry back to your ship and install,
    // like the Dong Designer. Registered with the game at start-up.
    // ---------------------------------------------------------------------------
    var ITEM_CLASS = "TnFemmeFormer";
    function itemClass() { return window.TnFemmeFormerItem || null; }
    function newItem() { var C = itemClass(); return C ? new C() : null; }
    function carried() {
        var C = itemClass();
        return C ? P(function () { return pcx().inventory.itemQuantity(C); }, 0) : 0;
    }
    function onShip() { return P(function () { return window.InShipInterior(); }, false); }

    function defineItem(req) {
        var Base = req(95164).Jo, registry = req(54014).yq, names = req(18366).g, text = req(69289).m;
        var g = window.GLOBAL;
        class TnFemmeFormer extends Base {
            constructor() {
                super();
                this.stackSize = 1;
                this.type = g.GADGET;
                this.shortName = "FemmeF.";
                this.longName = "TamaniCorp Femme Former";
                names.addFullName(this.shortName, text.toTitleCase(this.longName));
                this.description = "a boxed TamaniCorp Femme Former";
                this.tooltip = "A long, padded TamaniCorp bench in glossy pink vinyl, folded up for carrying. Lie on it stomach-first, let its two cups seal around your breasts, and it can reshape your chest and your pussy in a single session.\n\nIt needs real power, so it only works once it’s installed on your ship. Use it from your inventory while you’re aboard to install it.";
                names.addTooltip(this.shortName, this.tooltip);
                this.basePrice = PRICE;
                this.addFlag(g.NOT_CONSUMED_BY_DEFAULT);
                this.customIcon = "misc_toy";
            }
            getClassName() { return ITEM_CLASS; }
            static getClassName() { return ITEM_CLASS; }
            static show() { head(); }
            useFunction(target) {
                if (!target || P(function () { return target.getClassName(); }, "") !== "PlayerCharacter") {
                    window.clearOutput();
                    window.output((target && target.capitalA ? target.capitalA + target.short : "They") + " looks at the box and shakes " + P(function () { return target.mfn("his", "her", "its"); }, "their") + " head.");
                    return false;
                }
                install(this);
                return false;
            }
        }
        registry.registerClass(ITEM_CLASS, TnFemmeFormer);
        window.TnFemmeFormerItem = TnFemmeFormer;
    }
    (function registerItem(tries) {
        var chunks = window.webpackChunktits_html || (typeof self !== "undefined" ? self.webpackChunktits_html : null);
        if (!chunks || typeof chunks.push !== "function" || !window.GLOBAL) {
            if (tries < 120) setTimeout(function () { registerItem(tries + 1); }, 500);
            return;
        }
        chunks.push([["tn-femme-former-" + tries], {}, function (req) {
            try { defineItem(req); }
            catch (err) {
                try { console.warn("[TN] Femme Former item couldn't register", err); } catch (e) {}
                if (tries < 20) setTimeout(function () { registerItem(tries + 1); }, 1000);
            }
        }]);
    })(0);

    function install(item) {
        window.clearOutput();
        head();
        var pc = pcx(), f = flags();
        if (installed()) {
            window.output("You already have a Femme Former plugged in on your ship. One is plenty. Maybe sell this one instead?");
            window.clearMenu();
            window.addButton(0, "Next", window.mainGameMenu);
            return;
        }
        if (!onShip()) {
            window.output("The Femme Former needs a proper power port, and there isn’t one around here. You’ll have to take it back to your ship and install it there.");
            window.clearMenu();
            window.addButton(0, "Next", window.mainGameMenu);
            return;
        }
        window.output(window.blockHeader("Installing..."));
        window.output("You drag the folded-up Femme Former into a quiet corner of your ship with a good power port and plenty of room around it. You’re going to be lying face-down on this thing, after all, so it had better not be wedged anywhere awkward.");
        window.output("\n\nIt unfolds with a series of satisfying clicks: first the long, padded bench, then the headrest, then the hip saddle with its little hatch. The two clear cups swing out on their arms last and hover over their padded cut-outs. You plug it in and press the power stud.");
        window.output("\n\nThe pink vinyl warms under your hand, and a holoscreen flickers to life above the headrest, running a self-check. The cups flex, the saddle rises and sinks, and a cheerful chime announces that everything is in working order.");
        window.output("\n\n(<i>The TamaniCorp Femme Former has been removed from your inventory and <b>installed</b>.</i>)");
        window.output("\n(<i>You can use it from <b>Masturbate > Installed</b> anywhere on your ship.</i>)");
        window.processTime(8);
        f.TN_FEMME_FORMER = 2;
        try { pc.inventory.removeItemByClass(itemClass()); } catch (err) { try { pc.inventory.removeItem(item); } catch (e) {} }
        window.clearMenu();
        window.addButton(0, "Next", window.mainGameMenu);
    }

    function uninstall() {
        window.clearOutput();
        head();
        window.output(window.blockHeader("Uninstalling..."));
        window.output("You unplug the Femme Former and fold it back up, cups and all, until it’s a long, padded pink box you can carry.");
        window.output("\n\n<b>You no longer have the Femme Former installed!</b>");
        window.processTime(12);
        plan = null;
        delete flags().TN_FEMME_FORMER;
        window.output("\n\n");
        var it = newItem();
        if (it) window.quickLoot(it);
        else { window.clearMenu(); window.addButton(0, "Next", window.mainGameMenu); }
    }

    // ---------------------------------------------------------------------------
    // Found on Tarkus: Oil Sea Beach, three rooms south of the Polluted Beach (room 230)
    // ---------------------------------------------------------------------------
    function tarkusBox(slot) {
        if (!active() || !itemClass()) return false;
        var f = flags();
        if (f.TN_FEMME_FORMER_FOUND === undefined) {
            window.output("\n\nHalf-buried in the oily sand, something long and pink catches your eye: a padded box about the size of a massage table, its glossy vinyl streaked with grime but otherwise intact. Do you take a closer look?");
            window.addButton(slot || 0, "Pink Box", investigate, "Pink Box", "Take a closer look at the long, pink box in the sand.");
            return true;
        }
        if (f.TN_FEMME_FORMER_FOUND === 0) {
            window.output("\n\nThe TamaniCorp Femme Former is still lying in the sand where you left it. You could take it if you have room for it.");
            window.addButton(slot || 0, "Take It", take, "Take the Femme Former", "Haul the Femme Former back with you.");
            return true;
        }
        return false;
    }

    function investigate() {
        window.clearOutput();
        head();
        window.output("You pick your way over to it and brush the worst of the oily grit away. Glowing letters along the side spell out <b>TamaniCorp Femme Former</b>, with a little logo of a curvy silhouette. You know the name from TamaniCorp’s ads: the fancy machine that sculpts your chest and your pussy in one session. They cost a fortune, even in the core.");
        window.output("\n\nUp close, it looks like a fancier cousin of TamaniCorp’s Egg Trainer: a long, padded bench you’d lie on stomach-first, with two clear, bell-shaped cups folded under the chest and a contoured hip saddle further down, its probe tucked away behind a sealed hatch. The seals have kept the Oil Sea’s muck out, and the gauges all read fine, apart from the power.");
        window.output("\n\nHow something this expensive ended up washed up on Tarkus is anyone’s guess. All you’d have to do is drag it back to your ship and plug it in.");
        window.output("\n\nDo you take it?");
        window.processTime(2);
        flags().TN_FEMME_FORMER_FOUND = 0;
        window.clearMenu();
        window.addButton(0, "Take It", take, "Take It", "Haul the Femme Former back with you.");
        window.addButton(1, "Leave It", window.mainGameMenu, "Leave It", "Leave it here for now. You can come back for it.");
    }

    function take() {
        var before = carried();
        flags().TN_FEMME_FORMER_FOUND = 1;
        var it = newItem();
        if (!it) { flags().TN_FEMME_FORMER_FOUND = 0; window.mainGameMenu(); return; }
        window.itemCollect(function () {
            if (carried() > before) { window.mainGameMenu(); return; }
            window.clearOutput();
            head();
            window.output("You don’t have room for it, so you leave the Femme Former where it is for now.");
            flags().TN_FEMME_FORMER_FOUND = 0;
            window.clearMenu();
            window.addButton(0, "Next", window.mainGameMenu);
        }, [it], true);
    }

    // ---------------------------------------------------------------------------
    // Booth in Lerris's shop (the TamaniCorp shop on Tavros)
    // ---------------------------------------------------------------------------
    function boothButton(slot) {
        if (!active() || !itemClass()) return false;
        window.output("\n\nNear the back of the shop, a TamaniCorp booth glows pink under a sign reading <b>Femme Former</b>.");
        window.addButton(slot, "Femme Former", booth, NAME, "A TamaniCorp booth advertising a machine that reshapes breasts and pussies in one go.");
        return true;
    }

    function booth() {
        window.clearOutput();
        head();
        var f = flags(), pc = pcx();
        if (f.TN_FEMME_FORMER_BOOTH === undefined) {
            window.output("The booth is tucked between two shelves of mods, all pink lights and gold trim. On its platform sits a long, padded box, about the size of a massage table, upholstered in glossy pink vinyl and stamped with the TamaniCorp logo at either end. If you didn’t know better, you’d take it for a fancier cousin of TamaniCorp’s Egg Trainer.");
            window.output("\n\nTwo clear, bell-shaped cups hang from articulated arms near the head of the bench, hovering over a pair of padded cut-outs. Further down, a contoured saddle with a curved groove sits where your hips would go, a slim, rounded probe tucked politely inside a hatch.");
            window.output("\n\nAs you step closer, a hologram flickers to life above the bench: a curvy hardlight woman in a TamaniCorp lab coat that’s missing most of its buttons. She clasps her hands, which only squeezes her cleavage up further.");
            window.output("\n\n<i>“Hi there, valued customer! Why visit two machines when one will do? The TamaniCorp <b>Femme Former</b> is the first home unit to sculpt your chest <b>and</b> your pussy in a single, relaxing session! Just lie down on your tummy, let our patented SoftSeal cups hug your breasts, and leave the rest to our microsurgeons!”</i>");
            window.output("\n\nShe climbs onto the bench to demonstrate, lying face-down with her hips nestled into the saddle. The cups descend and seal around her breasts with a soft <i>whump</i>, and she lets out an entirely unnecessary moan.");
            window.output("\n\n<i>“Cup sizes from flat to fantastic! Nipples of every shape! Twenty-five premium pussy profiles, from terran to frostwyrm, with wetness, tightness, clits and colors to match! You can even grow a new row of breasts or a brand new pussy. Plan your look on the screen, press start, and enjoy!”</i>");
            f.TN_FEMME_FORMER_BOOTH = 1;
        } else {
            window.output("You wander back to the Femme Former booth. The hardlight saleswoman pops up on cue, lounging across the pink bench with her chin propped in her hands.");
            window.output("\n\n<i>“Welcome back! Ready to treat your body to the TamaniCorp Femme Former?”</i>");
        }
        window.output("\n\nA little price tag floats beside her: <b>" + PRICE.toLocaleString() + " credits</b>, boxed and ready to install on your ship.");
        if (!pc.hasVagina() && !pc.hasBreasts()) window.output(" It would be a big change for you, but it can grow both breasts and a pussy if you want them.");
        window.processTime(2);
        window.clearMenu();
        if (installed()) window.addDisabledButton(0, "Buy", "Buy the Femme Former", "You already have one installed on your ship.");
        else if (carried() > 0) window.addDisabledButton(0, "Buy", "Buy the Femme Former", "You’re already carrying one. Install it on your ship.");
        else if (pc.credits >= PRICE) window.addButton(0, "Buy", buy, "Buy the Femme Former", "Buy a boxed Femme Former to install on your ship.\n\nPrice: " + PRICE.toLocaleString() + " credits.");
        else window.addDisabledButton(0, "Buy", "Buy the Femme Former", "You don’t have " + PRICE.toLocaleString() + " credits.");
        window.addButton(14, "Back", window.mainGameMenu, "Back", "Leave the booth.");
    }

    function buy() {
        window.clearOutput();
        head();
        var pc = pcx(), f = flags();
        var it = newItem();
        if (!it) { window.mainGameMenu(); return; }
        var before = carried();
        pc.credits -= PRICE;
        window.output("You tap the holographic Buy button. Confetti made of light rains over the bench, and a jingle plays far too loudly for a shop this size.");
        window.output("\n\n<i>“Congratulations, [pc.name] Steele! Here’s your brand new TamaniCorp Femme Former!”</i> A hatch in the platform slides open and a long, pink box folds itself up out of it, cups tucked away and a carrying handle popping out of one end. <i>“Just plug it in somewhere on your ship and enjoy. Thank you for choosing TamaniCorp!”</i>");
        window.output("\n\nYour codex pings with the receipt a second later: <b>" + PRICE.toLocaleString() + " credits</b>.");
        window.output("\n\n(<i>To install it, use it from your inventory while you’re aboard your ship.</i>)\n\n");
        window.processTime(5);
        window.itemCollect(function () {
            if (carried() > before) {
                f.TN_FEMME_FORMER_BOUGHT = (f.TN_FEMME_FORMER_BOUGHT || 0) + 1;
                window.mainGameMenu();
                return;
            }
            pc.credits += PRICE;
            window.clearOutput();
            head();
            window.output("You don’t have room to carry it. The hologram pouts, refunds your <b>" + PRICE.toLocaleString() + " credits</b> and folds the Femme Former back into the platform.");
            window.clearMenu();
            window.addButton(0, "Next", window.mainGameMenu);
        }, [it], true);
    }

    function installedBlurb() {
        if (!installed()) return;
        window.output("\n\nYour Femme Former rests against the wall, its pink vinyl gleaming and its cups folded up neatly, ready whenever you are.");
    }

    function statsLine() {
        var f = P(function () { return flags(); }, null);
        if (!f) return "";
        var parts = [];
        if (f.TN_FEMME_FORMER_FOUND === 0) parts.push("Found");
        else if (f.TN_FEMME_FORMER_FOUND === 1) parts.push("Found and Taken");
        if (f.TN_FEMME_FORMER_BOUGHT) parts.push("Bought: " + f.TN_FEMME_FORMER_BOUGHT);
        if (f.TN_FEMME_FORMER === 2) parts.push("Installed");
        if (f.TN_FEMME_FORMER_USES) parts.push("Times Used: " + f.TN_FEMME_FORMER_USES);
        return parts.join(", ");
    }

    // ---------------------------------------------------------------------------
    // The machine
    // ---------------------------------------------------------------------------
    function menu() {
        window.clearOutput();
        head();
        var f = flags();
        if (f.TN_FEMME_FORMER_TUTORIAL === undefined) { tutorial(); return; }
        mainScreen();
    }

    function tutorial() {
        var f = flags();
        window.output("You power up your new Femme Former for the first time. The bench hums, its pink padding warming up under your palm, and a holoscreen unfolds above the headrest.");
        window.output("\n\nThe same hardlight saleswoman from the shop appears beside it, now in a much smaller, much tighter TamaniCorp uniform. <i>“Welcome to your Femme Former! Here’s how it works. Pick <b>Chest</b> to plan your breasts, <b>Nipples</b> for your nipples, and <b>Pussy</b> for everything below the belt. When you’re happy, press <b>Start</b>, lie down on your tummy and relax! One session does everything you planned.”</i>");
        window.output("\n\n<i>“And remember: TamaniCorp is not responsible for any sudden urges to try out your new body. Have fun!”</i> She winks and fizzles out.");
        f.TN_FEMME_FORMER_TUTORIAL = 1;
        window.processTime(3);
        window.clearMenu();
        window.addButton(0, "Next", mainScreen);
    }

    function mainScreen() {
        window.clearOutput();
        head();
        var pc = pcx();
        window.output("The Femme Former’s holoscreen glows above its pink bench. ");
        window.output("<i>“Welcome back to your Femme Former! Plan your new look, then press Start.”</i>");
        window.output("\n\n" + window.blockHeader("Current Plan"));
        var c = chestChanges(), v = pussyChanges();
        if (!c.length && !v.length) window.output("\nNothing planned yet.");
        else {
            if (c.length) window.output("\n<u>Chest</u>\n" + c.join("\n"));
            if (v.length) window.output((c.length ? "\n\n" : "\n") + "<u>Pussy</u>\n" + v.join("\n"));
        }
        window.clearMenu();
        window.addButton(0, "Chest", chestMenu, "Chest", "Plan cup sizes and nipple types, or grow a new breast row.");
        if (rowCount() > 0) window.addButton(1, "Nipples", nippleMenu, "Nipples", "Plan nipple length, nipples per breast and nipple color.");
        else window.addDisabledButton(1, "Nipples", "Nipples", "You don’t have any breast rows.");
        if (goo()) window.addDisabledButton(2, "Pussy", "Pussy", "The Femme Former can’t get a grip on a gooey crotch.");
        else window.addButton(2, "Pussy", pussyMenu, "Pussy", vagCount() ? "Plan your pussy’s type, wetness, tightness, clits and color, or grow another one." : "Grow a brand new pussy.");
        if (c.length || v.length) window.addButton(5, "Start", start, "Start", "Lie down and let the Femme Former do everything you planned.");
        else window.addDisabledButton(5, "Start", "Start", "Plan at least one change first.");
        if (c.length || v.length) window.addButton(6, "Clear Plan", function () { plan = freshPlan(); mainScreen(); }, "Clear Plan", "Forget everything you’ve planned.");
        if (onShip()) window.addButton(13, "Uninstall", uninstall, "Uninstall", "Unplug the Femme Former and put it in your inventory.");
        window.addButton(14, "Leave", function () { plan = null; window.mainGameMenu(); }, "Leave", "Turn the machine off. Your plan is forgotten.");
    }

    // ----- Chest ------------------------------------------------------------------
    function chestMenu() {
        window.clearOutput();
        head();
        var n = rowCount(), p = getPlan(), total = plannedRows();
        window.output("<i>“Chest mode! Which row would you like to shape?”</i>\n");
        window.clearMenu();
        var slot = 0;
        for (var i = 0; i < total; i++) {
            (function (i) {
                var r = row(i), isNew = i >= n;
                window.output("\n<b>Row #" + (i + 1) + (isNew ? " (new)" : "") + ":</b> " + cap(cupName(r.rating)) + (r.rating > 0 ? "" : " chest") + ", " + nipplePhrase(r.nipType));
                window.addButton(slot++, "Row #" + (i + 1), function () { rowMenu(i); }, "Row #" + (i + 1), "Shape your " + nth(i) + " row.");
            })(i);
        }
        if (p.addRow) window.addButton(10, "No New Row", function () { p.addRow = false; delete p.rows[n]; chestMenu(); }, "No New Row", "Don’t grow a new breast row after all.");
        else if (n === 0) window.addDisabledButton(10, "Add Row", "Add Row", "You don’t have a chest the machine can work with.");
        else if (n >= MAX_ROWS) window.addDisabledButton(10, "Add Row", "Add Row", "The Femme Former only handles up to " + MAX_ROWS + " rows.");
        else window.addButton(10, "Add Row", function () { p.addRow = true; chestMenu(); }, "Add Row", "Grow a new breast row below your others. It starts out like your bottom row.");
        window.addButton(14, "Back", mainScreen);
    }

    function rowMenu(i) {
        window.clearOutput();
        head();
        var b = baseRow(i), r = row(i), isNew = i >= rowCount();
        window.output("<i>“Row #" + (i + 1) + " selected.”</i>");
        window.output("\n\n" + window.blockHeader("Row #" + (i + 1) + (isNew ? " (new)" : "")));
        window.output("\n<b>Cup Size:</b> " + cap(cupName(b.rating)) + (r.rating !== b.rating ? " → <b>" + cap(cupName(r.rating)) + "</b>" : ""));
        window.output("\n<b>Nipples:</b> " + nippleName(b.nipType) + (r.nipType !== b.nipType ? " → <b>" + nippleName(r.nipType) + "</b>" : ""));
        window.clearMenu();
        window.addButton(0, "Cup Size", function () { cupMenu(i); }, "Cup Size", "Pick a new cup size for this row.");
        window.addButton(1, "Nipple Type", function () { nipTypeMenu(i); }, "Nipple Type", "Pick a new nipple type for this row.");
        window.addButton(14, "Back", chestMenu);
    }

    function cupMenu(i) {
        window.clearOutput();
        head();
        var b = baseRow(i), r = row(i), pc = pcx(), isNew = i >= rowCount();
        window.output("<i>“Please adjust the cup size.”</i>");
        window.output("\n\n<b>Row #" + (i + 1) + ":</b> " + cap(cupName(b.rating)) + (r.rating !== b.rating ? " → <b>" + cap(cupName(r.rating)) + "</b>" : ""));
        window.clearMenu();
        var steps = [[-10, "-10 Cups"], [-5, "-5 Cups"], [-1, "-1 Cup"], [1, "+1 Cup"], [5, "+5 Cups"], [10, "+10 Cups"]];
        var slot = 0;
        steps.forEach(function (s) {
            var to = Math.max(0, Math.min(MAX_CUP, r.rating + s[0]));
            if (to === r.rating) window.addDisabledButton(slot++, s[1], s[1], s[0] < 0 ? "It can’t go any smaller." : "It can’t go any bigger.");
            else if (!isNew && !pc.breastRatingUnlocked(i, to)) window.addDisabledButton(slot++, s[1], s[1], pc.breastRatingLockedMessage());
            else window.addButton(slot++, s[1], function () { setRow(i, "rating", to); cupMenu(i); }, s[1], "Make this row " + cupName(to) + ".");
        });
        if (r.rating === 0) window.addDisabledButton(6, "Flat", "Flat", "This row is already planned flat.");
        else if (!isNew && !pc.breastRatingUnlocked(i, 0)) window.addDisabledButton(6, "Flat", "Flat", pc.breastRatingLockedMessage());
        else window.addButton(6, "Flat", function () { setRow(i, "rating", 0); cupMenu(i); }, "Flat", "Make this row completely flat.");
        if (r.rating !== b.rating) window.addButton(7, "Reset", function () { setRow(i, "rating", b.rating); cupMenu(i); }, "Reset", "Keep this row’s size as it is.");
        window.addButton(14, "Back", function () { rowMenu(i); });
    }

    function nipTypeMenu(i) {
        window.clearOutput();
        head();
        var b = baseRow(i), r = row(i), pc = pcx();
        window.output("<i>“Please select a nipple type.”</i>");
        window.output("\n\n<b>Row #" + (i + 1) + " nipples:</b> " + nippleName(b.nipType) + (r.nipType !== b.nipType ? " → <b>" + nippleName(r.nipType) + "</b>" : ""));
        window.clearMenu();
        var slot = 0;
        NIPPLE_TYPES.forEach(function (t) {
            var key = G(t[0]);
            if (key === undefined) return;
            if (key === r.nipType) window.addDisabledButton(slot++, t[1], t[1], "Already selected.");
            else if (!pc.nippleTypeUnlocked(Math.min(i, rowCount() - 1), key)) window.addDisabledButton(slot++, t[1], t[1], pc.nippleTypeLockedMessage());
            else window.addButton(slot++, t[1], function () { setRow(i, "nipType", key); rowMenu(i); }, t[1], t[2]);
        });
        window.addButton(14, "Back", function () { rowMenu(i); });
    }

    // ----- Nipples (all rows) ------------------------------------------------------
    function nippleMenu() {
        window.clearOutput();
        head();
        var pc = pcx(), now = nip();
        window.output("<i>“Nipple mode! These settings apply to every row.”</i>");
        window.output("\n\n" + window.blockHeader("Nipples"));
        window.output("\n<b>Length:</b> " + pc.nippleLengthRatio + "×" + (now.len !== pc.nippleLengthRatio ? " → <b>" + now.len + "×</b>" : ""));
        window.output("\n<b>Per Breast:</b> " + pc.nipplesPerBreast + (now.per !== pc.nipplesPerBreast ? " → <b>" + now.per + "</b>" : ""));
        window.output("\n<b>Color:</b> " + pc.nippleColor + (now.color !== pc.nippleColor ? " → <b>" + now.color + "</b>" : ""));
        window.clearMenu();
        var p = getPlan();
        function setLen(v) { v = Math.round(Math.max(0.5, Math.min(10, v)) * 10) / 10; p.nipLen = v === pc.nippleLengthRatio ? null : v; nippleMenu(); }
        if (now.len > 0.5) window.addButton(0, "Shorter", function () { setLen(now.len - 0.5); }, "Shorter", "Make your nipples shorter.");
        else window.addDisabledButton(0, "Shorter", "Shorter", "They can’t get any shorter.");
        if (now.len < 10) window.addButton(1, "Longer", function () { setLen(now.len + 0.5); }, "Longer", "Make your nipples longer.");
        else window.addDisabledButton(1, "Longer", "Longer", "They can’t get any longer.");
        function setPer(v) { p.nipPer = v === pc.nipplesPerBreast ? null : v; nippleMenu(); }
        if (now.per > 1 && pc.nipplesPerBreastUnlocked(now.per - 1)) window.addButton(2, "Fewer", function () { setPer(now.per - 1); }, "Fewer", "One fewer nipple on each breast.");
        else window.addDisabledButton(2, "Fewer", "Fewer", now.per <= 1 ? "Each breast needs at least one nipple." : pc.nipplesPerBreastLockedMessage());
        if (now.per < 4 && pc.nipplesPerBreastUnlocked(now.per + 1)) window.addButton(3, "More", function () { setPer(now.per + 1); }, "More", "One more nipple on each breast.");
        else window.addDisabledButton(3, "More", "More", now.per >= 4 ? "The cups can’t fit more than four per breast." : pc.nipplesPerBreastLockedMessage());
        window.addButton(4, "Color", function () { colorMenu("nipples"); }, "Color", "Pick a new nipple color.");
        window.addButton(14, "Back", mainScreen);
    }

    function colorMenu(which, i) {
        window.clearOutput();
        head();
        window.output("<i>“Please select a color.”</i>");
        window.clearMenu();
        var cur = which === "nipples" ? nip().color : vag(i).color;
        COLORS.forEach(function (c, slot) {
            if (c === cur) window.addDisabledButton(slot, cap(c), cap(c), "Already selected.");
            else window.addButton(slot, cap(c), function () {
                if (which === "nipples") { var pc = pcx(), p = getPlan(); p.nipColor = c === pc.nippleColor ? null : c; nippleMenu(); }
                else { setVag(i, "color", c); vagMenu(i); }
            }, cap(c), "Make " + (which === "nipples" ? "your nipples" : "this pussy") + " " + c + ".");
        });
        window.addButton(14, "Back", function () { if (which === "nipples") nippleMenu(); else vagMenu(i); });
    }

    // ----- Pussy --------------------------------------------------------------------
    function pussyMenu() {
        window.clearOutput();
        head();
        var pc = pcx(), n = vagCount(), p = getPlan(), total = plannedVags(), now = nip();
        window.output("<i>“Pussy mode! Which pussy would you like to shape?”</i>\n");
        window.clearMenu();
        for (var i = 0; i < total; i++) {
            (function (i) {
                var v = vag(i);
                window.output("\n<b>#" + (i + 1) + (i >= n ? " (new)" : "") + ":</b> " + cap(v.color) + " " + typeName(v.type).toLowerCase() + " pussy, " + WETNESS[Math.min(v.wet, 5)].toLowerCase() + ", " + v.clits + " " + plural(v.clits, "clit", "clits"));
                window.addButton(i, "#" + (i + 1), function () { vagMenu(i); }, "Pussy #" + (i + 1), "Shape your " + nth(i) + " pussy.");
            })(i);
        }
        if (total > 0) {
            window.output("\n<b>Clit size:</b> " + inches(pc.clitLength) + (now.clitLen !== pc.clitLength ? " → <b>" + inches(now.clitLen) + "</b>" : ""));
            if (pc.clitLengthUnlocked(now.clitLen)) window.addButton(5, "Clit Size", clitMenu, "Clit Size", "Plan a new clit size (for all your clits).");
            else window.addDisabledButton(5, "Clit Size", "Clit Size", pc.clitLengthLockedMessage());
        }
        if (p.addPussy) window.addButton(10, "No New Pussy", function () { p.addPussy = false; delete p.vags[n]; pussyMenu(); }, "No New Pussy", "Don’t grow a new pussy after all.");
        else if (n >= MAX_PUSSIES || !pc.createVaginaUnlocked()) window.addDisabledButton(10, "Add Pussy", "Add Pussy", n >= MAX_PUSSIES ? "You can’t fit another pussy." : pc.createVaginaLockedMessage());
        else window.addButton(10, "Add Pussy", function () { p.addPussy = true; vagMenu(n); }, "Add Pussy", "Grow " + (n ? "another" : "a") + " pussy. You can pick its type and the rest next.");
        window.addButton(14, "Back", mainScreen);
    }

    function vagMenu(i) {
        window.clearOutput();
        head();
        var b = baseVag(i), v = vag(i);
        function line(lbl, a, c) { window.output("\n<b>" + lbl + ":</b> " + a + (a !== c ? " → <b>" + c + "</b>" : "")); }
        window.output("<i>“Pussy #" + (i + 1) + " selected.”</i>");
        window.output("\n\n" + window.blockHeader("Pussy #" + (i + 1) + (b.isNew ? " (new)" : "")));
        line("Type", typeName(b.type), typeName(v.type));
        line("Wetness", WETNESS[Math.min(b.wet, 5)], WETNESS[Math.min(v.wet, 5)]);
        line("Tightness", LOOSENESS[b.loose] || String(b.loose), LOOSENESS[v.loose] || String(v.loose));
        line("Clits", String(b.clits), String(v.clits));
        line("Color", cap(b.color), cap(v.color));
        window.clearMenu();
        window.addButton(0, "Type", function () { typeMenu(i, 0); }, "Type", "Pick a new kind of pussy.");
        window.addButton(1, "Wetness", function () { pickMenu(i, "wet"); }, "Wetness", "How wet this pussy gets.");
        window.addButton(2, "Tightness", function () { pickMenu(i, "loose"); }, "Tightness", "How tight this pussy stays, at its tightest.");
        window.addButton(3, "Clits", function () { pickMenu(i, "clits"); }, "Clits", "How many clits this pussy has.");
        window.addButton(4, "Color", function () { colorMenu("pussy", i); }, "Color", "Pick a new color for this pussy.");
        window.addButton(14, "Back", pussyMenu);
    }

    function typeMenu(i, page) {
        window.clearOutput();
        head();
        var pc = pcx(), v = vag(i), isNew = i >= vagCount();
        var types = PUSSY_TYPES.filter(function (t) { return G(t[0]) !== undefined; });
        var per = 12, pages = Math.ceil(types.length / per);
        window.output("<i>“Catalog loaded, page " + (page + 1) + " of " + pages + ". Please select a pussy type.”</i>");
        window.output("\n\n<b>Pussy #" + (i + 1) + ":</b> " + typeName(v.type));
        window.clearMenu();
        types.slice(page * per, page * per + per).forEach(function (t, slot) {
            var key = G(t[0]);
            if (key === v.type) window.addDisabledButton(slot, t[1], t[1], "Already selected.");
            else if (!isNew && !pc.vaginaTypeUnlocked(i, key)) window.addDisabledButton(slot, t[1], t[1], pc.vaginaTypeLockedMessage());
            else window.addButton(slot, t[1], function () { setVag(i, "type", key); vagMenu(i); }, t[1], t[2]);
        });
        if (page > 0) window.addButton(12, "Prev Page", function () { typeMenu(i, page - 1); });
        if (page < pages - 1) window.addButton(13, "Next Page", function () { typeMenu(i, page + 1); });
        window.addButton(14, "Back", function () { vagMenu(i); });
    }

    function pickMenu(i, key) {
        window.clearOutput();
        head();
        var pc = pcx(), v = vag(i), isNew = i >= vagCount();
        var opts, label, check, lockMsg;
        if (key === "wet") { label = "wetness"; opts = [0, 1, 2, 3, 4, 5].map(function (n) { return [n, WETNESS[n]]; }); check = function (n) { return isNew || pc.wetnessUnlocked(i, n); }; lockMsg = function () { return pc.wetnessLockedMessage(); }; }
        else if (key === "loose") { label = "tightness"; opts = [1, 2, 3, 4, 5].map(function (n) { return [n, LOOSENESS[n]]; }); check = function (n) { return isNew || pc.loosenessUnlocked(i, n); }; lockMsg = function () { return pc.loosenessLockedMessage(); }; }
        else { label = "clit count"; opts = [1, 2, 3, 4].map(function (n) { return [n, n + " " + plural(n, "Clit", "Clits")]; }); check = function (n) { return isNew || pc.clitsUnlocked(i, n); }; lockMsg = function () { return pc.clitsLockedMessage(); }; }
        window.output("<i>“Please select the " + label + ".”</i>");
        window.clearMenu();
        opts.forEach(function (o, slot) {
            if (o[0] === v[key]) window.addDisabledButton(slot, o[1], o[1], "Already selected.");
            else if (!check(o[0])) window.addDisabledButton(slot, o[1], o[1], lockMsg());
            else window.addButton(slot, o[1], function () { setVag(i, key, o[0]); vagMenu(i); }, o[1], "Set this pussy’s " + label + " to " + o[1].toLowerCase() + ".");
        });
        window.addButton(14, "Back", function () { vagMenu(i); });
    }

    function clitMenu() {
        window.clearOutput();
        head();
        var pc = pcx(), now = nip(), p = getPlan();
        window.output("<i>“Please adjust your clit size.”</i>\n\n<b>Clit size:</b> " + inches(pc.clitLength) + (now.clitLen !== pc.clitLength ? " → <b>" + inches(now.clitLen) + "</b>" : ""));
        window.clearMenu();
        [[-1, "-1 in"], [-0.25, "-¼ in"], [0.25, "+¼ in"], [1, "+1 in"]].forEach(function (s, slot) {
            var to = Math.round(Math.max(0.25, Math.min(12, now.clitLen + s[0])) * 100) / 100;
            if (to === now.clitLen) window.addDisabledButton(slot, s[1], s[1], s[0] < 0 ? "It can’t get any smaller." : "It can’t get any bigger.");
            else window.addButton(slot, s[1], function () { p.clitLen = to === pc.clitLength ? null : to; clitMenu(); }, s[1], "Make your clit " + inches(to) + ".");
        });
        window.addButton(14, "Back", pussyMenu);
    }

    // ---------------------------------------------------------------------------
    // The session
    // ---------------------------------------------------------------------------
    function start() {
        window.clearOutput();
        head();
        var pc = pcx();
        var doChest = chestChanges().length > 0, doPussy = pussyChanges().length > 0;
        var taur = P(function () { return pc.isTaur(); }, false), naga = P(function () { return pc.isNaga(); }, false);
        var chestless = rowCount() === 0 || P(function () { return !pc.hasBreasts(); }, true);

        window.output("You press <b>Start</b>. <i>“Session confirmed! Please lie down on your tummy and relax,”</i> the Femme Former chirps, and its bench hums as the padding warms and softens under your hand.");
        window.output("\n\nYou strip off your gear and climb on");
        if (taur) window.output(", the bench lengthening and splitting at the rear so a padded cradle can slide out under your tauric body. You settle your front half face-down on the main pad while the cradle hugs your belly and flanks");
        else if (naga) window.output(", laying yourself out face-down along it. A padded tray slides out from its foot to take the rest of your [pc.tail], letting you stretch out comfortably");
        else window.output(", lowering yourself face-down onto the warm vinyl and fitting your face into the cushioned headrest");
        window.output(". Straps you hadn’t noticed glide over your back and gently snug you into place.");

        if (doChest) {
            window.output("\n\nUnder your chest, the two padded panels slide apart. The clear cups rise from below on their arms and settle around " + (chestless ? "your [pc.nipples]" : "your [pc.breasts]") + ", then seal with a soft, airtight <i>whump</i>. The rims pulse, warm and slick with gel, and a gentle suction tugs " + (chestless ? "your chest" : "each breast") + " down into its cup until you’re hanging in their hold, [pc.nipples] stiffening against the plastic.");
            window.output(" Thin nozzles inside the cups mist something cool over your skin, and a moment later a tingling heat sinks deep into you: microsurgeons going to work.");
        }
        if (doPussy) {
            if (!vagCount()) window.output("\n\nBelow, the saddle under your hips rises and presses snugly against your bare groin. A warm, rounded pad massages a spot between your [pc.thighs] in slow circles, and something under your skin begins to tingle and <i>open</i>. The tingling blooms into slick, brand-new folds, and the slim probe slides out of its hatch to ease into your new pussy for the very first time, humming softly as it sinks in.");
            else window.output("\n\nBelow, the saddle under your hips rises to meet you. The slim probe slides out of its hatch, slicked with warm gel, and nuzzles against your [pc.vagina] before easing inside. It settles in deep, vibrating softly, while a cushioned pad presses up against your [pc.clit].");
        }

        window.output("\n\n<i>“Sculpting in progress! Please enjoy the complimentary stimulation,”</i> the machine sings.");
        if (doChest && doPussy) window.output(" The cups and the probe start working in rhythm, suction pulling at your chest each time the probe thrusts and hums inside you, until you can’t tell which end of you is making you moan.");
        else if (doChest) window.output(" The cups begin to pulse, suction rising and falling in a slow, kneading rhythm, and little rollers inside them circle your [pc.nipples] until you’re squirming against the straps.");
        else window.output(" The probe begins to thrust in slow, deep strokes, buzzing harder each time it bottoms out, and the pad grinds against you in time until your [pc.hips] are rocking against the saddle.");
        window.output(" You feel the changes as they happen, flesh shifting and reshaping under the machine’s touch, each new sensation fizzing straight to your brain.");
        window.output("\n\nYou don’t last long. The Femme Former seems to know exactly when you’re close, and it speeds up right at the edge. You cry out into the headrest as you cum, ");
        if (doPussy && vagCount()) window.output("[pc.girlCum] gushing around the probe and soaking the saddle");
        else if (doChest) window.output("your chest throbbing in the cups as they milk every last shiver out of you");
        else window.output("your whole body shaking in the straps");
        window.output(". The machine eases you down through it with slow, soothing pulses before everything stops.");
        window.output("\n\n<i>“Session complete! Thank you for choosing TamaniCorp.”</i> The cups let go with a wet pop, the saddle sinks away, and the straps slide back into the bench. You lie there for a minute catching your breath, then climb off to look at yourself.");

        var results = apply();
        if (results.length) window.output("\n\n" + results.join("\n"));
        try { window.IncrementFlag("TN_FEMME_FORMER_USES"); } catch (err) { flags().TN_FEMME_FORMER_USES = (flags().TN_FEMME_FORMER_USES || 0) + 1; }
        window.processTime(30);
        try { pc.orgasm(); } catch (err) {}
        plan = null;
        window.clearMenu();
        window.addButton(0, "Next", window.mainGameMenu);
    }

    // Do the planned changes, checking each lock again. Returns the result lines.
    function apply() {
        var pc = pcx(), p = getPlan(), out = [];
        var n = rowCount();

        // New breast row first, so its plan index (n) is valid.
        if (p.addRow && n > 0 && n < MAX_ROWS) {
            var nr = row(n);
            if (pc.createBreastRow()) {
                var R = pc.breastRows[n];
                R.breastRatingRaw = nr.rating;
                R.nippleType = nr.nipType;
                out.push("<b>You now have a new row of " + (nr.rating > 0 ? cupName(nr.rating) + " breasts" : "flat nipples") + " below your others!</b>");
            }
        }
        for (var i = 0; i < n; i++) {
            var b = baseRow(i), r = row(i), Row = pc.breastRows[i];
            if (r.rating !== b.rating) {
                if (pc.breastRatingUnlocked(i, r.rating)) {
                    Row.breastRatingRaw = Math.max(0, (Row.breastRatingRaw || 0) + (r.rating - b.rating));
                    out.push("<b>Your " + nth(i) + " row of breasts is now " + (r.rating > 0 ? cupName(r.rating) : "completely flat") + ".</b>");
                } else out.push(pc.breastRatingLockedMessage());
            }
            if (r.nipType !== b.nipType) {
                if (pc.nippleTypeUnlocked(i, r.nipType)) {
                    Row.nippleType = r.nipType;
                    out.push("<b>Your " + nth(i) + " row now has " + nipplePhrase(r.nipType) + ".</b>");
                } else out.push(pc.nippleTypeLockedMessage());
            }
        }
        if (p.nipLen !== null && p.nipLen !== pc.nippleLengthRatio) {
            if (pc.nippleLengthRatioUnlocked(p.nipLen)) {
                var longer = p.nipLen > pc.nippleLengthRatio;
                pc.nippleLengthRatio = p.nipLen;
                out.push("<b>Your nipples are " + (longer ? "longer" : "shorter") + " now.</b>");
            } else out.push(pc.nippleLengthRatioLockedMessage());
        }
        if (p.nipPer !== null && p.nipPer !== pc.nipplesPerBreast) {
            if (pc.nipplesPerBreastUnlocked(p.nipPer)) {
                pc.nipplesPerBreast = p.nipPer;
                out.push("<b>Each breast now has " + p.nipPer + " " + plural(p.nipPer, "nipple", "nipples") + ".</b>");
            } else out.push(pc.nipplesPerBreastLockedMessage());
        }
        if (p.nipColor !== null && p.nipColor !== pc.nippleColor) {
            pc.nippleColor = p.nipColor;
            out.push("<b>Your nipples are " + p.nipColor + " now.</b>");
        }

        // Pussies: change the ones you have, then grow the new one.
        var vn = vagCount(), lockedLine = false;
        function locked() { if (!lockedLine) { out.push(pc.vaginaTypeLockedMessage()); lockedLine = true; } }
        for (var j = 0; j < vn; j++) {
            var vb = baseVag(j), vc = vag(j), V = pc.vaginas[j];
            var changed = false;
            if (vc.type !== vb.type) {
                if (pc.vaginaTypeUnlocked(j, vc.type)) {
                    pc.shiftVagina(j, vc.type);
                    changed = true;
                    out.push("<b>Your " + nth(j) + " pussy is now " + aOrAn(typeName(vc.type).toLowerCase()) + " " + typeName(vc.type).toLowerCase() + " pussy.</b>");
                } else locked();
            }
            if (vc.wet !== vb.wet) { if (pc.wetnessUnlocked(j, vc.wet)) { V.wetnessRaw = vc.wet; changed = true; } else locked(); }
            if (vc.loose !== vb.loose) {
                if (pc.loosenessUnlocked(j, vc.loose)) {
                    V.minLooseness = vc.loose;
                    if (V.loosenessRaw < vc.loose || vc.loose < vb.loose) V.loosenessRaw = vc.loose;
                    changed = true;
                } else locked();
            }
            if (vc.clits !== vb.clits) { if (pc.clitsUnlocked(j, vc.clits)) { V.clits = vc.clits; changed = true; } else locked(); }
            // A type change gives the pussy that type's own color, unless you planned one.
            if (vc.color !== vb.color) { V.vaginaColor = vc.color; changed = true; }
            if (changed && vc.type === vb.type) out.push("<b>Your " + nth(j) + " pussy is now " + vagSummary(j) + ".</b>");
            else if (changed) out.push("<b>It’s " + vagSummary(j) + ".</b>");
        }
        if (p.addPussy && vn < MAX_PUSSIES && pc.createVaginaUnlocked()) {
            var nv = vag(vn);
            if (pc.createVagina()) {
                pc.shiftVagina(vn, nv.type);
                var NV = pc.vaginas[vn];
                NV.wetnessRaw = nv.wet;
                NV.minLooseness = nv.loose;
                NV.loosenessRaw = nv.loose;
                NV.clits = nv.clits;
                NV.vaginaColor = nv.color;
                if (pc.clitLength <= 0) pc.clitLength = 0.5;
                out.push("<b>You have a brand new " + typeName(nv.type).toLowerCase() + " pussy" + (vn ? "" : " between your [pc.thighs]") + ": " + vagSummary(vn) + "!</b>");
            }
        }
        if (p.clitLen !== null && p.clitLen !== pc.clitLength) {
            if (pc.clitLengthUnlocked(p.clitLen)) {
                var bigger = p.clitLen > pc.clitLength;
                pc.clitLength = p.clitLen;
                out.push("<b>Your clit" + (P(function () { return pc.totalClits(); }, 1) > 1 ? "s are" : " is") + " " + (bigger ? "bigger" : "smaller") + " now, about " + inches(p.clitLen) + " long.</b>");
            } else out.push(pc.clitLengthLockedMessage());
        }
        return out;
    }
    function aOrAn(word) { return /^[aeiou]/i.test(word) ? "an" : "a"; }
    function vagSummary(j) {
        var V = pcx().vaginas[j];
        return V.vaginaColor + ", " + WETNESS[Math.min(V.wetnessRaw, 5)].toLowerCase() + " and " + (LOOSENESS[V.minLooseness] || "loose").toLowerCase() + ", with " + V.clits + " " + plural(V.clits, "clit", "clits");
    }

    // ---------------------------------------------------------------------------
    // Mod menu
    // ---------------------------------------------------------------------------
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: NAME,
            author: "TN",
            description: "A TamaniCorp machine that reshapes breasts and pussies in one session. Find one on Tarkus (Oil Sea Beach, south of the Polluted Beach) or buy one in the TamaniCorp shop on Tavros (50,500 credits), install it from your inventory on your ship, then use it from Masturbate > Installed.",
            supportsToggle: true,
            onEnabledChange: function () { return true; }
        });
        return true;
    }
    (function waitForModMenu(tries) {
        if (register()) return;
        if (window.tnModMenuActive === false && tries >= 6) return;
        if (tries < 240) setTimeout(function () { waitForModMenu(tries + 1); }, 500);
    })(0);

    window.tnFemmeFormer = {
        boothButton: boothButton,
        tarkusBox: tarkusBox,
        installed: installed,
        installedBlurb: installedBlurb,
        statsLine: statsLine,
        menu: menu,
        // for testing from the console
        _plan: function () { return getPlan(); },
        _install: install,
        _uninstall: uninstall,
        _buy: buy,
        _take: take,
        _apply: apply,
        _start: start,
        _chest: chestChanges,
        _pussy: pussyChanges
    };
})();
