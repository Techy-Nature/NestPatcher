/* TN Implant Slots for Trials in Tainted Space (v1.0, checked against 0.9.169).
   Sabrae on Dhaal can install up to three combat implants and three utility (sex)
   implants at once, instead of one of each.

   The game keeps each implant in a named slot: combatImplant and utilityImplant.
   TN_ImplantSlots_v1.0.mod adds combatImplant2/3 and utilityImplant2/3, and points
   every "is this implant installed?" check at all six. This file holds the slot
   logic those blocks call:

   - tnISlot:      the first free slot of an implant's type (a new install goes there).
   - tnIFind:      the slot that holds a given implant (removal takes it from there).
   - tnICompact:   after a removal, implants move down so slot 1 is used first.
   - tnImplantRoom:  true when the switch is on and a slot of that type is free, so
                   Sabrae installs without swapping out your first implant.
   - tnImplantBlock: the reason an implant is greyed out in Sabrae's list: one of the
                   same is already installed, a second tail implant, or full slots.
   - tnImplantOn:  the switch, for Sabrae's line about how many fit.

   Settings: Options > Android Mods / TN Mod Settings > "Implant Slots". The switch
   is saved on this device. With it off, Sabrae goes back to one of each and swaps
   like the base game. Implants already in slots 2 and 3 keep working until she
   removes them.
   Console: tnImplantSlots.settings(), tnImplantSlots.set(true|false), tnImplantSlots.list(). */
(function () {
    "use strict";
    if (window.tnImplantSlots) return;

    var MOD_ID = "TN_ImplantSlots";
    var STORE = "tn.implantSlots.v1";
    var SLOTS = {
        combatImplant: ["combatImplant", "combatImplant2", "combatImplant3"],
        utilityImplant: ["utilityImplant", "utilityImplant2", "utilityImplant3"]
    };
    var ALL = SLOTS.combatImplant.concat(SLOTS.utilityImplant);
    // Two implants that each give you a tail. Only one of them can go in.
    var TAILS = ["CombatTail", "ArmoredTail"];

    function load() {
        try {
            var saved = JSON.parse(window.localStorage.getItem(STORE) || "{}");
            return saved.extraSlots !== false;
        } catch (err) { return true; }
    }
    var extraSlots = load();
    function save() { try { window.localStorage.setItem(STORE, JSON.stringify({ extraSlots: extraSlots })); } catch (err) {} }

    function modOn() {
        return (window.tnModMenuActive !== true || typeof window.isTnModEnabled !== "function") ||
            window.isTnModEnabled(MOD_ID) !== false;
    }
    function on() { return extraSlots && modOn(); }

    function className(item) { try { return item.getClassName(); } catch (err) { return ""; } }
    function holder(inv) { return inv && inv.equippedImplants ? inv.equippedImplants : null; }
    // The slot list for an implant: by its base slot name, or by its type.
    function slotsFor(item) {
        var G = window.GLOBAL || {};
        if (!item) return null;
        if (item.type === G.COMBAT_IMPLANT) return SLOTS.combatImplant;
        if (item.type === G.UTILITY_IMPLANT) return SLOTS.utilityImplant;
        return null;
    }
    function installed(ei) {
        var out = [];
        if (!ei) return out;
        ALL.forEach(function (k) { if (ei[k]) out.push(ei[k]); });
        return out;
    }

    // equipImplant: the first free slot of this type. The switch doesn't matter here:
    // Sabrae only installs into a used slot after swapping one out.
    function slot(ei, key) {
        var list = SLOTS[key];
        if (!ei || !list) return key;
        for (var i = 0; i < list.length; i++) if (!ei[list[i]]) return list[i];
        return key;
    }

    // unequipImplant: the slot that holds this exact implant.
    function find(ei, item, dflt) {
        if (ei && item) for (var i = 0; i < ALL.length; i++) if (ei[ALL[i]] === item) return ALL[i];
        return dflt;
    }

    // After a removal, move implants down so the base slot is filled first. The base
    // game only looks at slot 1 to decide whether you have an implant of that type.
    function compact(ei) {
        if (!ei) return;
        Object.keys(SLOTS).forEach(function (key) {
            var list = SLOTS[key], kept = [];
            list.forEach(function (k) { if (ei[k]) kept.push(ei[k]); });
            list.forEach(function (k, i) { ei[k] = i < kept.length ? kept[i] : null; });
        });
    }

    function room(inv, item) {
        var ei = holder(inv), list = slotsFor(item);
        if (!on() || !ei || !list) return false;
        for (var i = 0; i < list.length; i++) if (!ei[list[i]]) return true;
        return false;
    }

    function block(inv, item) {
        var ei = holder(inv), list = slotsFor(item);
        if (!on() || !ei || !list) return "";
        var name = className(item);
        var have = installed(ei).map(className);
        if (have.indexOf(name) >= 0) return "You already have this implant installed.";
        if (TAILS.indexOf(name) >= 0 && have.some(function (n) { return TAILS.indexOf(n) >= 0; }))
            return "You already have a tail implant installed.";
        if (!room(inv, item)) {
            var kind = list === SLOTS.combatImplant ? "combat" : "utility";
            return "All three " + kind + " implant slots are full. Have Sabrae remove one first.";
        }
        return "";
    }

    window.tnISlot = slot;
    window.tnIFind = find;
    window.tnICompact = compact;
    window.tnImplantRoom = room;
    window.tnImplantBlock = block;
    window.tnImplantOn = on;

    // ---------------------------------------------------------------------------
    // Mod menu
    // ---------------------------------------------------------------------------
    function listHtml() {
        var ei = holder(window.pc && window.pc.inventory);
        if (!ei) return "";
        var rows = [];
        [["Combat", SLOTS.combatImplant], ["Utility", SLOTS.utilityImplant]].forEach(function (pair) {
            pair[1].forEach(function (k, i) {
                var it = ei[k];
                rows.push(pair[0] + " " + (i + 1) + ": " + (it ? (it.longName || className(it)) : "empty"));
            });
        });
        return "\n\n<b>Installed now</b>\n" + rows.join("\n");
    }
    function pageHtml() {
        var html = "Sabrae on Dhaal can install up to three combat implants and three utility (sex) implants at once." +
            " Each implant works from any slot. You can't install two of the same one, or both tail implants." +
            "\n\n<b>Extra slots: " + (extraSlots ? "On" : "Off") + "</b>\n" +
            "With this off, Sabrae goes back to one of each and swaps like the base game. Implants you already have in slots 2 and 3 keep working until she removes them.";
        html += listHtml();
        html += '<button type="button" data-mod-act="slots">Extra slots: ' + (extraSlots ? "On" : "Off") + "</button>";
        return html;
    }
    function register() {
        if (window.tnModMenuActive !== true || typeof window.registerModMenu !== "function") return false;
        window.registerModMenu({
            id: MOD_ID,
            name: "Implant Slots",
            author: "TN",
            description: "Three combat and three utility implants at once from Sabrae on Dhaal.",
            supportsToggle: true,
            getHtml: pageHtml,
            onAct: function (act) {
                if (act !== "slots") return false;
                extraSlots = !extraSlots;
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

    window.tnImplantSlots = {
        settings: function () { return { extraSlots: extraSlots, active: on() }; },
        set: function (value) { extraSlots = !!value; save(); return extraSlots; },
        list: function () {
            var ei = holder(window.pc && window.pc.inventory), out = {};
            ALL.forEach(function (k) { out[k] = ei && ei[k] ? className(ei[k]) : null; });
            return out;
        }
    };
})();
