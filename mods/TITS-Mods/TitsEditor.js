/* In-game editor for Trials in Tainted Space.
   Opens from the main menu after a game is loaded or started.
   Categories match tits.js-save-editor-main. Writes the live game. */

(function titsEditorBoot() {
    if (!window.ui || typeof ui.generateMainMenuButtons !== "function" || typeof output !== "function") {
        setTimeout(titsEditorBoot, 400);
        return;
    }
    if (ui.generateMainMenuButtons.__tnEditor) return;
    var original = ui.generateMainMenuButtons;
    var wrapped = function () {
        var result = original.apply(this, arguments);
        try {
            if (typeof getGameState === "function" && getGameState()) {
                this.addButton(6, "Editor", window.TitsEditor, "Editor", "Edit the loaded game.");
            }
        } catch (err) {
            console.error("[TN] editor button", err);
        }
        return result;
    };
    wrapped.__tnEditor = true;
    ui.generateMainMenuButtons = wrapped;
})();

function tnEditorEsc(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function tnEditorStyle() {
    if (document.getElementById("tnEditorStyle")) return;
    var style = document.createElement("style");
    style.id = "tnEditorStyle";
    style.textContent = "#mainText .tn-edit{margin-top:6px;}"
        + "#mainText .tn-edit .tn-group{margin:14px 0 4px;font-weight:bold;border-bottom:1px solid currentColor;}"
        + "#mainText .tn-edit label{display:flex;align-items:baseline;gap:12px;margin:5px 0;max-width:680px;}"
        + "#mainText .tn-edit label span{flex:0 0 230px;}"
        + "#mainText .tn-edit input,#mainText .tn-edit select{flex:1;min-width:0;font:inherit;color:inherit;background:transparent;border:0;border-bottom:1px solid currentColor;border-radius:0;padding:1px 0;}"
        + "#mainText .tn-edit input[type=checkbox]{flex:0 0 auto;}";
    document.head.appendChild(style);
}

function tnEditorLiveKey(key) {
    return key.indexOf("Internal_") === 0 ? key.slice(9) : key;
}

function tnEditorHas(obj, key) {
    if (!obj) return false;
    var live = tnEditorLiveKey(key);
    return live in obj || key in obj;
}

function tnEditorRead(obj, key) {
    if (!obj) return undefined;
    var live = tnEditorLiveKey(key);
    if (live in obj) return obj[live];
    if (key in obj) return obj[key];
    return undefined;
}

function tnEditorWrite(obj, key, value) {
    if (!obj) return;
    var live = tnEditorLiveKey(key);
    try {
        if (live in obj) obj[live] = value;
        else obj[key] = value;
    } catch (err) {}
}

function tnEditorPath(root, path) {
    var parts = path.split(".");
    var obj = root;
    for (var i = 0; i < parts.length - 1; i++) {
        if (!obj) return null;
        obj = obj[parts[i]];
    }
    return obj ? { obj: obj, key: parts[parts.length - 1] } : null;
}

window.tnEditorChars = function () {
    var list = [{ id: "Player", label: "Player" }];
    if (typeof chars !== "undefined") {
        Object.keys(chars).sort().forEach(function (key) {
            var person = chars[key];
            var label = key;
            try {
                if (person && typeof person.nameDisplay === "function") label = person.nameDisplay() + " (" + key + ")";
                else if (person && person.short) label = person.short + " (" + key + ")";
            } catch (err) {}
            list.push({ id: key, label: label });
        });
    }
    return list;
};

window.tnEditorPerson = function () {
    var people = window.tnEditorChars();
    var index = window.tnEditorWhoIndex || 0;
    if (index < 0 || index >= people.length) index = 0;
    window.tnEditorWhoIndex = index;
    var id = people[index].id;
    if (id === "Player") return pc;
    return typeof chars === "undefined" ? null : chars[id];
};

function tnEditorWhoLine() {
    var people = window.tnEditorChars();
    var index = window.tnEditorWhoIndex || 0;
    return "Editing " + tnEditorEsc(people[index].label) + " (" + (index + 1) + " of " + people.length + ").";
}

function tnEditorPaint(html, fill) {
    tnEditorStyle();
    if (typeof clearOutput === "function") clearOutput();
    if (typeof clearBust === "function") clearBust();
    if (typeof clearName === "function") clearName();
    if (typeof clearMenu === "function") clearMenu();
    var title = typeof blockHeader === "function" ? blockHeader("Editor") : "<b>Editor</b>\n\n";
    var note = window.tnEditorNote ? "\n" + tnEditorEsc(window.tnEditorNote) : "";
    output(title + '<div class="tn-edit">' + html + "</div>" + note + "\n\nApply writes the live game. Save afterward.");
    if (fill) fill();
    addButton(14, "Back", window.tnEditorBack || window.TitsEditor, "Back", window.tnEditorBackTip || "Return to the editor categories.");
}

function tnEditorInput(id, type, value) {
    if (type === "bool") {
        return "<input id=\"" + id + "\" type=\"checkbox\"" + (value ? " checked" : "") + ">";
    }
    var kind = type === "number" ? "number" : "text";
    return "<input id=\"" + id + "\" type=\"" + kind + "\" value=\"" + tnEditorEsc(value) + "\">";
}

window.tnEditorRows = [];

function tnEditorRow(target, key, label, type) {
    var where = tnEditorPath(target, key);
    if (!where || !tnEditorHas(where.obj, where.key)) return "";
    var value = tnEditorRead(where.obj, where.key);
    if (type === "flags") {
        value = Array.isArray(value) ? value.join(", ") : "";
    }
    var id = "tnE" + window.tnEditorRows.length;
    window.tnEditorRows.push({ obj: where.obj, key: where.key, type: type, id: id });
    return "<label><span>" + tnEditorEsc(label) + "</span>" + tnEditorInput(id, type, value) + "</label>";
}

function tnEditorGroup(title, target, fields) {
    var body = "";
    fields.forEach(function (field) {
        body += tnEditorRow(target, field[1], field[0], field[2] || "number");
    });
    if (!body) return "";
    return "<div class=\"tn-group\">" + tnEditorEsc(title) + "</div>" + body;
}

function tnEditorN(label, key) { return [label, key, "number"]; }
function tnEditorS(label, key) { return [label, key, "string"]; }
function tnEditorB(label, key) { return [label, key, "bool"]; }
function tnEditorF(label, key) { return [label, key, "flags"]; }

function tnEditorApply() {
    window.tnEditorRows.forEach(function (row) {
        var el = document.getElementById(row.id);
        if (!el) return;
        if (row.type === "bool") tnEditorWrite(row.obj, row.key, !!el.checked);
        else if (row.type === "number") {
            var number = Number(el.value);
            if (!isNaN(number)) tnEditorWrite(row.obj, row.key, number);
        } else if (row.type === "flags") {
            var list = el.value.trim() ? el.value.split(",").map(function (part) {
                return Number(String(part).trim());
            }).filter(function (part) { return !isNaN(part); }) : [];
            tnEditorWrite(row.obj, row.key, list);
        } else tnEditorWrite(row.obj, row.key, el.value);
    });
    window.tnEditorNote = "Applied.";
    if (window.tnEditorRedraw) window.tnEditorRedraw();
}

function tnEditorPersonButtons() {
    var people = window.tnEditorChars();
    addButton(6, "Prev", function () {
        window.tnEditorNote = "";
        window.tnEditorWhoIndex = ((window.tnEditorWhoIndex || 0) - 1 + people.length) % people.length;
        window.tnEditorRedraw();
    }, "Previous", "Previous character.");
    addButton(7, "Next", function () {
        window.tnEditorNote = "";
        window.tnEditorWhoIndex = ((window.tnEditorWhoIndex || 0) + 1) % people.length;
        window.tnEditorRedraw();
    }, "Next", "Next character.");
}

function tnEditorListButtons(list, indexKey, label) {
    if (!list || list.length < 2) return;
    addButton(8, "Prev " + label, function () {
        window.tnEditorNote = "";
        var index = window[indexKey] || 0;
        window[indexKey] = (index - 1 + list.length) % list.length;
        window.tnEditorRedraw();
    }, "Previous", "Previous " + label + ".");
    addButton(9, "Next " + label, function () {
        window.tnEditorNote = "";
        var index = window[indexKey] || 0;
        window[indexKey] = (index + 1) % list.length;
        window.tnEditorRedraw();
    }, "Next", "Next " + label + ".");
}

function tnEditorScreen(html, fill) {
    window.tnEditorBack = window.TitsEditor;
    window.tnEditorBackTip = "Return to the editor categories.";
    tnEditorPaint(html, function () {
        addButton(5, "Apply", tnEditorApply, "Apply", "Write these fields into the live game.");
        if (fill) fill();
    });
}

window.TitsEditor = function () {
    try {
        if (window.ui && typeof ui.showMainText === "function") ui.showMainText();
        else if (window.ui && typeof ui.returnFromElement === "function") ui.returnFromElement(true);
    } catch (err) {}
    window.tnEditorNote = "";
    window.tnEditorBack = function () {
        if (typeof showMainMenu === "function") showMainMenu(true, true);
        else mainGameMenu();
    };
    window.tnEditorBackTip = "Return to the main menu.";
    var html = "Same categories as the save editor. Pick one. This edits the loaded game, not a save file on disk.";
    tnEditorPaint(html, function () {
        var cats = [
            ["Game", window.tnEditorGame],
            ["General", window.tnEditorGeneral],
            ["Stats", window.tnEditorStats],
            ["Head", window.tnEditorHead],
            ["Body", window.tnEditorBody],
            ["Chest", window.tnEditorChest],
            ["Tails", window.tnEditorTails],
            ["Crotch", window.tnEditorCrotch],
            ["Ships", window.tnEditorShips],
            ["Key Items", window.tnEditorKeys],
            ["Perks", window.tnEditorPerks],
            ["Status Effects", window.tnEditorStatus],
            ["Flags", window.tnEditorFlags]
        ];
        cats.forEach(function (cat, index) {
            addButton(index, cat[0], cat[1], cat[0], cat[0]);
        });
    });
};

window.tnEditorGame = function () {
    window.tnEditorRows = [];
    window.tnEditorRedraw = window.tnEditorGame;
    var html = "<div class=\"tn-group\">Time</div>";
    html += "<label><span>Days</span><input id=\"tnDays\" type=\"number\" value=\"" + days + "\"></label>";
    html += "<label><span>Hours</span><input id=\"tnHours\" type=\"number\" value=\"" + hours + "\"></label>";
    html += "<label><span>Minutes</span><input id=\"tnMinutes\" type=\"number\" value=\"" + minutes + "\"></label>";
    var state = typeof getGameState === "function" ? getGameState() : null;
    if (state && state.gameInstanceInfo) html += tnEditorGroup("Save Slot", state.gameInstanceInfo, [tnEditorS("Note", "note")]);
    if (state) html += tnEditorGroup("Miscellaneous", state, [tnEditorB("Debug Mode", "debugMode"), tnEditorS("Game Build", "gameBuild")]);
    tnEditorScreen(html, function () {
        addButton(5, "Apply", function () {
            var dayEl = document.getElementById("tnDays");
            var hourEl = document.getElementById("tnHours");
            var minuteEl = document.getElementById("tnMinutes");
            var nextDays = dayEl ? Number(dayEl.value) : days;
            var nextHours = hourEl ? Number(hourEl.value) : hours;
            var nextMinutes = minuteEl ? Number(minuteEl.value) : minutes;
            tnEditorApply();
            days = nextDays;
            hours = nextHours;
            minutes = nextMinutes;
            window.tnEditorNote = "Applied.";
            window.tnEditorGame();
        }, "Apply", "Set the clock and save-slot fields.");
    });
};

window.tnEditorGeneral = function () {
    var who = window.tnEditorPerson();
    window.tnEditorRows = [];
    window.tnEditorRedraw = window.tnEditorGeneral;
    var html = tnEditorWhoLine();
    html += tnEditorGroup("General", who, [
        tnEditorS("Name", "short"), tnEditorN("Class", "characterClass"), tnEditorS("Original Race", "originalRace"),
        tnEditorN("Credits", "credits"), tnEditorN("Personality", "personality"), tnEditorN("Exhibitionism", "exhibitionismRaw")
    ]);
    if (who === pc && typeof flags !== "undefined") html += tnEditorGroup("General", flags, [tnEditorS("Upbringing", "PC_UPBRINGING")]);
    html += tnEditorGroup("Advancement", who, [
        tnEditorN("Level", "level"), tnEditorN("XP", "XPRaw"), tnEditorN("Pending Stat Points", "pendingStatPoints"),
        tnEditorN("Unspent Stat Points", "unspentStatPoints"), tnEditorN("Unclaimed Class Perks", "unclaimedClassPerks"),
        tnEditorN("Unclaimed Generic Perks", "unclaimedGenericPerks")
    ]);
    html += tnEditorGroup("Appearance", who, [
        tnEditorN("Height", "tallness"), tnEditorN("Thickness", "thickness"), tnEditorN("Muscle Tone", "tone"), tnEditorN("Femininity", "femininity")
    ]);
    tnEditorScreen(html, tnEditorPersonButtons);
};

window.tnEditorStats = function () {
    var who = window.tnEditorPerson();
    window.tnEditorRows = [];
    window.tnEditorRedraw = window.tnEditorStats;
    var html = tnEditorWhoLine();
    html += tnEditorGroup("Core", who, [
        tnEditorN("Aim", "Internal_aimRaw"), tnEditorN("Aim Modifier", "aimMod"),
        tnEditorN("Intelligence", "Internal_intelligenceRaw"), tnEditorN("Intelligence Modifier", "intelligenceMod"),
        tnEditorN("Physique", "Internal_physiqueRaw"), tnEditorN("Physique Modifier", "physiqueMod"),
        tnEditorN("Reflexes", "Internal_reflexesRaw"), tnEditorN("Reflexes Modifier", "reflexesMod"),
        tnEditorN("Willpower", "Internal_willpowerRaw"), tnEditorN("Willpower Modifier", "willpowerMod"),
        tnEditorN("Libido", "Internal_libidoRaw"), tnEditorN("Libido Modifier", "libidoMod"),
        tnEditorN("Taint", "Internal_taintRaw"), tnEditorN("Taint Modifier", "taintMod")
    ]);
    html += tnEditorGroup("Combat", who, [
        tnEditorN("Hit Points", "HPRaw"), tnEditorN("Hit Points Modifier", "HPMod"),
        tnEditorN("Energy", "energyRaw"), tnEditorN("Energy Modifier", "energyMod"),
        tnEditorN("Lust", "lustRaw"), tnEditorN("Lust Modifier", "lustMod"), tnEditorN("Shields", "shieldsRaw")
    ]);
    html += tnEditorGroup("Pregnancy", who, [
        tnEditorN("Quantity Multiplier", "pregnancyMultiplierRaw"), tnEditorN("Quantity Multiplier Modifier", "pregnancyMultiplierMod"),
        tnEditorN("Incubation (Mother)", "pregnancyIncubationBonusMotherRaw"), tnEditorN("Incubation (Mother) Modifier", "pregnancyIncubationBonusMotherMod"),
        tnEditorN("Incubation (Father)", "pregnancyIncubationBonusFatherRaw"), tnEditorN("Incubation (Father) Modifier", "pregnancyIncubationBonusFatherMod")
    ]);
    tnEditorScreen(html, tnEditorPersonButtons);
};

window.tnEditorHead = function () {
    var who = window.tnEditorPerson();
    window.tnEditorRows = [];
    window.tnEditorRedraw = window.tnEditorHead;
    var html = tnEditorWhoLine();
    html += tnEditorGroup("Face", who, [tnEditorN("Face Type", "faceType"), tnEditorF("Face Flags", "faceFlags")]);
    html += tnEditorGroup("Eyes", who, [tnEditorN("Eye Type", "eyeType"), tnEditorS("Eye Color", "eyeColor")]);
    html += tnEditorGroup("Ears", who, [tnEditorN("Ear Type", "earType"), tnEditorN("Ear Length", "earLength"), tnEditorF("Ear Flags", "earFlags")]);
    html += tnEditorGroup("Lips", who, [tnEditorS("Lip Color", "lipColor"), tnEditorN("Lip Size", "lipMod")]);
    html += tnEditorGroup("Tongue", who, [tnEditorN("Tongue Type", "tongueType"), tnEditorF("Tongue Flags", "tongueFlags")]);
    html += tnEditorGroup("Hair", who, [tnEditorN("Hair Type", "hairType"), tnEditorN("Hair Length", "hairLength"), tnEditorS("Hair Color", "hairColor"), tnEditorS("Hair Style", "hairStyle")]);
    html += tnEditorGroup("Beard", who, [tnEditorN("Beard Length", "beardLength"), tnEditorN("Beard Type", "beardType"), tnEditorN("Beard Style", "beardStyle"), tnEditorS("Beard Color", "beardColor")]);
    html += tnEditorGroup("Horns", who, [tnEditorN("Horn Type", "hornType"), tnEditorN("Horn Count", "horns"), tnEditorN("Horn Length", "hornLength")]);
    html += tnEditorGroup("Antennae", who, [tnEditorN("Antennae Type", "antennaeType"), tnEditorN("Antennae Count", "antennae")]);
    tnEditorScreen(html, tnEditorPersonButtons);
};

window.tnEditorBody = function () {
    var who = window.tnEditorPerson();
    window.tnEditorRows = [];
    window.tnEditorRedraw = window.tnEditorBody;
    var html = tnEditorWhoLine();
    html += tnEditorGroup("Torso", who, [
        tnEditorN("Hip Size", "hipRatingRaw"), tnEditorN("Hip Size Modifier", "hipRatingMod"),
        tnEditorN("Belly Size", "bellyRatingRaw"), tnEditorN("Belly Size Modifier", "bellyRatingMod")
    ]);
    html += tnEditorGroup("Skin", who, [
        tnEditorN("Skin Type", "skinType"), tnEditorS("Skin Tone", "skinTone"), tnEditorS("Skin Accent", "skinAccent"),
        tnEditorS("Fur Color", "furColor"), tnEditorS("Scale Color", "scaleColor"), tnEditorF("Skin Flags", "skinFlags")
    ]);
    if (who && who.ass) {
        html += tnEditorGroup("Ass", who, [tnEditorB("Is Virgin", "analVirgin")]);
        html += tnEditorGroup("Ass", who.ass, [
            tnEditorN("Size", "buttRatingRaw"), tnEditorN("Bonus Capacity", "bonusCapacity"), tnEditorN("Minimum Looseness", "minLooseness"),
            tnEditorN("Looseness", "loosenessRaw"), tnEditorN("Looseness Modifier", "loosenessMod"),
            tnEditorN("Wetness", "wetnessRaw"), tnEditorN("Wetness Modifier", "wetnessMod"),
            tnEditorN("Shrink Counter", "shrinkCounter"), tnEditorF("Flags", "flags")
        ]);
        html += tnEditorGroup("Ass", who, [tnEditorN("Butt Size", "buttRatingRaw"), tnEditorN("Butt Size Modifier", "buttRatingMod")]);
    }
    html += tnEditorGroup("Arms", who, [tnEditorN("Arm Type", "armType"), tnEditorF("Arm Flags", "armFlags")]);
    html += tnEditorGroup("Wings", who, [tnEditorN("Wing Type", "wingType"), tnEditorN("Wing Count", "wingCount")]);
    html += tnEditorGroup("Legs", who, [tnEditorN("Leg Type", "legType"), tnEditorN("Leg Count", "legCount"), tnEditorF("Leg Flags", "legFlags")]);
    html += tnEditorGroup("Miscellaneous", who, [
        tnEditorB("Has Gills", "gills"), tnEditorN("Elasticity", "elasticity"), tnEditorN("Genital Spot", "genitalSpot"), tnEditorF("Crotch Flags", "crotchFlags")
    ]);
    tnEditorScreen(html, tnEditorPersonButtons);
};

function tnEditorCockFields(cock, title) {
    return tnEditorGroup(title, cock, [
        tnEditorB("Is Virgin", "virgin"), tnEditorN("Type", "cType"), tnEditorS("Color", "cockColor"),
        tnEditorN("Length", "cLengthRaw"), tnEditorN("Length Modifier", "cLengthMod"),
        tnEditorN("Thickness Ratio", "cThicknessRatioRaw"), tnEditorN("Thickness Ratio Modifier", "cThicknessRatioMod"),
        tnEditorN("Knot Multiplier", "knotMultiplier"), tnEditorN("Flaccid Multiplier", "flaccidMultiplier"), tnEditorF("Flags", "flags")
    ]);
}

function tnEditorVaginaFields(vagina, title) {
    return tnEditorGroup(title, vagina, [
        tnEditorB("Is Virgin", "hymen"), tnEditorN("Type", "type"), tnEditorS("Color", "vaginaColor"),
        tnEditorN("Bonus Capacity", "bonusCapacity"), tnEditorN("Minimum Looseness", "minLooseness"),
        tnEditorN("Looseness", "loosenessRaw"), tnEditorN("Looseness Modifier", "loosenessMod"),
        tnEditorN("Wetness", "wetnessRaw"), tnEditorN("Wetness Modifier", "wetnessMod"),
        tnEditorN("Clit Count", "clits"), tnEditorN("Shrink Counter", "shrinkCounter"), tnEditorF("Flags", "flags")
    ]);
}

window.tnEditorChest = function () {
    var who = window.tnEditorPerson();
    window.tnEditorRows = [];
    window.tnEditorRedraw = window.tnEditorChest;
    var html = tnEditorWhoLine();
    var rows = who && who.breastRows ? who.breastRows : [];
    rows.forEach(function (row, index) {
        html += tnEditorGroup("Breast Row " + (index + 1), row, [
            tnEditorN("Breast Count", "breasts"), tnEditorN("Cup Size", "breastRatingRaw"), tnEditorN("Cup Size Modifier", "breastRatingMod"),
            tnEditorN("Lactation Modifier", "breastRatingLactationMod"), tnEditorN("Honeypot Modifier", "breastRatingHoneypotMod"),
            tnEditorN("Nipple Type", "nippleType"), tnEditorF("Areola Flags", "areolaFlags")
        ]);
    });
    html += tnEditorGroup("Nipples", who, [
        tnEditorS("Nipple Color", "nippleColor"), tnEditorN("Nipples per Breast", "nipplesPerBreast"),
        tnEditorN("Nipple Length Ratio", "nippleLengthRatio"), tnEditorN("Nipple Width Ratio", "nippleWidthRatio"),
        tnEditorN("DickNipple Type", "dickNippleType"), tnEditorN("DickNipple Multiplier", "dickNippleMultiplier")
    ]);
    html += tnEditorGroup("Milk", who, [
        tnEditorN("Milk Type", "milkType"), tnEditorN("Milk Fullness", "milkFullness"), tnEditorN("Milk Rate", "milkRate"),
        tnEditorN("Milk Multiplier", "milkMultiplier"), tnEditorN("Milk Storage Multiplier", "milkStorageMultiplier")
    ]);
    html += "\nBreast rows: " + rows.length + " of 10.";
    tnEditorScreen(html, function () {
        tnEditorPersonButtons();
        addButton(8, "Add Row", function () {
            var person = window.tnEditorPerson();
            tnEditorTry("Breast row added.", function () { return person.createBreastRow(); });
        }, "Add Breast Row", "Add another row of breasts. The game allows up to 10.");
        addButton(9, "Del Row", function () {
            var person = window.tnEditorPerson();
            if (!person.breastRows || person.breastRows.length <= 1) {
                window.tnEditorNote = "The game keeps at least one breast row.";
                window.tnEditorRedraw();
                return;
            }
            tnEditorTry("Last breast row removed.", function () {
                person.removeBreastRow(person.breastRows.length - 1, 1);
            });
        }, "Remove Breast Row", "Remove the last breast row.");
    });
};

function tnEditorTry(note, fn) {
    var ok = true;
    try { if (fn() === false) ok = false; }
    catch (err) { ok = false; }
    window.tnEditorNote = ok ? note : "The game would not add another. That list is at its limit.";
    if (window.tnEditorRedraw) window.tnEditorRedraw();
}

window.tnEditorTails = function () {
    var who = window.tnEditorPerson();
    window.tnEditorRows = [];
    window.tnEditorRedraw = window.tnEditorTails;
    var html = tnEditorWhoLine();
    html += tnEditorGroup("Tail", who, [tnEditorN("Tail Type", "tailType"), tnEditorN("Tail Count", "tailCount"), tnEditorF("Tail Flags", "tailFlags")]);
    if (who && who.tailCock) html += tnEditorCockFields(who.tailCock, "Tailcock");
    if (who && who.tailCunt) html += tnEditorVaginaFields(who.tailCunt, "Tailcunt");
    tnEditorScreen(html, tnEditorPersonButtons);
};

window.tnEditorCrotch = function () {
    var who = window.tnEditorPerson();
    window.tnEditorRows = [];
    window.tnEditorRedraw = window.tnEditorCrotch;
    var html = tnEditorWhoLine();
    html += tnEditorGroup("Male Organs", who, [
        tnEditorB("Is Cock Virgin", "cockVirgin"), tnEditorN("Ball Count", "balls"),
        tnEditorN("Ball Size", "ballSizeRaw"), tnEditorN("Ball Size Modifier", "ballSizeMod"),
        tnEditorN("Ball Fullness", "Internal_ballFullness"), tnEditorN("Ball Efficiency", "Internal_ballEfficiency"),
        tnEditorN("Cum Type", "cumType"), tnEditorN("Cum Multiplier", "cumMultiplierRaw"), tnEditorN("Cum Multiplier Modifier", "cumMultiplierMod"),
        tnEditorN("Cum Quality", "cumQualityRaw"), tnEditorN("Cum Quality Modifier", "cumQualityMod"), tnEditorN("Refractory Rate", "refractoryRate")
    ]);
    var cocks = who && who.cocks ? who.cocks : [];
    html += "\nCocks: " + cocks.length + " of 10.";
    cocks.forEach(function (cock, index) { html += tnEditorCockFields(cock, "Cock " + (index + 1)); });
    html += tnEditorGroup("Female Organs", who, [
        tnEditorB("Is Vaginal Virgin", "vaginalVirgin"), tnEditorN("Fertility", "fertilityRaw"), tnEditorN("Fertility Modifier", "fertilityMod"),
        tnEditorN("Girl Cum Type", "girlCumType"), tnEditorN("Girl Cum Multiplier", "girlCumMultiplierRaw"),
        tnEditorN("Girl Cum Multiplier Modifier", "girlCumMultiplierMod"), tnEditorN("Clit Length", "clitLength")
    ]);
    var vaginas = who && who.vaginas ? who.vaginas : [];
    html += "\nVaginas: " + vaginas.length + ".";
    vaginas.forEach(function (vagina, index) { html += tnEditorVaginaFields(vagina, "Vagina " + (index + 1)); });
    tnEditorScreen(html, function () {
        tnEditorPersonButtons();
        addButton(8, "Add Cock", function () {
            var person = window.tnEditorPerson();
            tnEditorTry("Cock added.", function () { return person.createCock(); });
        }, "Add Cock", "Add another cock. The game allows up to 10.");
        addButton(9, "Del Cock", function () {
            var person = window.tnEditorPerson();
            if (!person.cocks || !person.cocks.length) return;
            tnEditorTry("Last cock removed.", function () {
                person.removeCock(person.cocks.length - 1, 1);
            });
        }, "Remove Cock", "Remove the last cock.");
        addButton(10, "Add Vagina", function () {
            var person = window.tnEditorPerson();
            tnEditorTry("Vagina added.", function () { return person.createVagina(); });
        }, "Add Vagina", "Add another vagina.");
        addButton(11, "Del Vagina", function () {
            var person = window.tnEditorPerson();
            if (!person.vaginas || !person.vaginas.length) return;
            tnEditorTry("Last vagina removed.", function () {
                person.removeVagina(person.vaginas.length - 1, 1);
            });
        }, "Remove Vagina", "Remove the last vagina.");
    });
};

function tnEditorShips() {
    var list = [];
    if (typeof pc_ship !== "undefined" && pc_ship) list.push(pc_ship);
    var state = typeof getGameState === "function" ? getGameState() : null;
    var extra = state && state.inactivePlayerOwnedShips;
    if (extra && extra.length) {
        for (var i = 0; i < extra.length; i++) if (list.indexOf(extra[i]) < 0) list.push(extra[i]);
    }
    return list;
}

window.tnEditorShips = function () {
    window.tnEditorRows = [];
    window.tnEditorRedraw = window.tnEditorShips;
    var list = tnEditorShips();
    var index = window.tnEditorShipIndex || 0;
    if (!list.length) index = 0;
    else if (index < 0 || index >= list.length) index = 0;
    window.tnEditorShipIndex = index;
    var ship = list[index];
    var html = list.length ? "Ship " + (index + 1) + " of " + list.length + "." : "No ship is loaded.";
    if (ship) {
        html += tnEditorGroup("General", ship, [tnEditorS("Name", "short"), tnEditorS("Manufacturer / Model", "modelDisplay"), tnEditorS("Description", "long")]);
        html += tnEditorGroup("Stats", ship, [
            tnEditorN("Level", "level"), tnEditorN("Shields", "shieldsRaw"), tnEditorN("Armor", "HPRaw"), tnEditorN("Armor Modifier", "HPMod"),
            tnEditorN("Energy", "energyRaw"), tnEditorN("Energy Modifier", "energyMod"), tnEditorN("Power", "powerRaw"), tnEditorN("Agility", "agilityRaw"),
            tnEditorN("Sensors", "sensorsRaw"), tnEditorN("Systems", "systemsRaw"), tnEditorN("Thrust", "speedRaw")
        ]);
        html += tnEditorGroup("Storage Capacity", ship, [
            tnEditorN("Modules / Crew", "capacityRaw"), tnEditorN("Wardrobe", "wardrobeSizeRaw"), tnEditorN("Equipment", "equipmentSizeRaw"),
            tnEditorN("Consumables", "consumableSizeRaw"), tnEditorN("Valuables", "valuablesSizeRaw"), tnEditorN("Toys", "toysSizeRaw"), tnEditorN("Weapons", "gunCapacityRaw")
        ]);
        html += tnEditorGroup("Miscellaneous", ship, [tnEditorB("Has Holodeck", "holodeck")]);
    }
    tnEditorScreen(html, function () { tnEditorListButtons(list, "tnEditorShipIndex", "Ship"); });
};

function tnEditorStoragePage(title, listName, indexKey, addFn) {
    var who = window.tnEditorPerson();
    window.tnEditorRows = [];
    window.tnEditorRedraw = function () { tnEditorStoragePage(title, listName, indexKey, addFn); };
    var list = who && who[listName] ? who[listName] : [];
    var index = window[indexKey] || 0;
    if (!list.length) index = 0;
    else if (index >= list.length) index = list.length - 1;
    if (index < 0) index = 0;
    window[indexKey] = index;
    var item = list[index];
    var html = tnEditorWhoLine() + "\n" + title + (list.length ? " " + (index + 1) + " of " + list.length + "." : ": none.");
    if (item) {
        html += "<div class=\"tn-group\">" + tnEditorEsc(item.storageName || item.keyName || title) + "</div>";
        html += tnEditorGroup(title, item, [
            tnEditorS("Name", "storageName"), tnEditorN("Value 1", "value1"), tnEditorN("Value 2", "value2"),
            tnEditorN("Value 3", "value3"), tnEditorN("Value 4", "value4"), tnEditorS("Tooltip", "tooltip")
        ]);
    }
    html += "\n<label><span>Add name</span><input id=\"tnStorageAdd\" type=\"text\" value=\"\"></label>";
    tnEditorScreen(html, function () {
        tnEditorPersonButtons();
        tnEditorListButtons(list, indexKey, "Item");
        if (list.length) {
            addButton(10, "Remove", function () {
                list.splice(window[indexKey] || 0, 1);
                window.tnEditorNote = "Removed.";
                window.tnEditorRedraw();
            }, "Remove", "Remove this entry.");
        }
        addButton(11, "Add", function () {
            var el = document.getElementById("tnStorageAdd");
            var name = el ? el.value.trim() : "";
            if (!name) return;
            addFn(who, name);
            window[indexKey] = Math.max(0, (who[listName] ? who[listName].length : 1) - 1);
            window.tnEditorNote = "Added.";
            window.tnEditorRedraw();
        }, "Add", "Add an entry with this name.");
    });
}

window.tnEditorKeys = function () {
    tnEditorStoragePage("Key item", "keyItems", "tnEditorKeyIndex", function (who, name) {
        if (who === pc && typeof pc.createKeyItem === "function") pc.createKeyItem(name);
        else if (who.keyItems) who.keyItems.push({ storageName: name, value1: 0, value2: 0, value3: 0, value4: 0, tooltip: "" });
    });
};

window.tnEditorPerks = function () {
    tnEditorStoragePage("Perk", "perks", "tnEditorPerkIndex", function (who, name) {
        if (typeof who.createPerk === "function") who.createPerk(name, 0, 0, 0, 0);
        else if (who.perks) who.perks.push({ storageName: name, value1: 0, value2: 0, value3: 0, value4: 0, tooltip: "" });
    });
};

window.tnEditorStatus = function () {
    tnEditorStoragePage("Status effect", "statusEffects", "tnEditorStatusIndex", function (who, name) {
        if (typeof who.createStatusEffect === "function") who.createStatusEffect(name, 0, 0, 0, 0);
        else if (who.statusEffects) who.statusEffects.push({ storageName: name, value1: 0, value2: 0, value3: 0, value4: 0, tooltip: "" });
    });
};

window.tnEditorFlags = function () {
    if (typeof flags === "undefined") return;
    window.tnEditorRows = [];
    window.tnEditorRedraw = window.tnEditorFlags;
    var filter = window.tnEditorFlagFilter || "";
    var names = Object.keys(flags).filter(function (name) {
        return flags[name] !== undefined && String(name).toLowerCase().indexOf(filter.toLowerCase()) >= 0;
    }).sort();
    var shown = names.slice(0, 80);
    var html = "Showing " + shown.length + " of " + names.length + ".";
    html += "\n<label><span>Filter</span><input id=\"tnFlagFilter\" type=\"text\" value=\"" + tnEditorEsc(filter) + "\"></label>";
    shown.forEach(function (name) {
        var value = flags[name];
        if (value !== null && typeof value === "object") {
            html += "<label><span>" + tnEditorEsc(name) + "</span><input type=\"text\" value=\"object\" disabled></label>";
            return;
        }
        var id = "tnE" + window.tnEditorRows.length;
        var type = typeof value === "number" ? "number" : "string";
        window.tnEditorRows.push({ obj: flags, key: name, type: type, id: id });
        html += "<label><span>" + tnEditorEsc(name) + "</span>" + tnEditorInput(id, type, value) + "</label>";
    });
    html += "\n<label><span>New flag</span><input id=\"tnNewFlag\" type=\"text\" value=\"\"></label>";
    html += "<label><span>New value</span><input id=\"tnNewFlagValue\" type=\"text\" value=\"\"></label>";
    tnEditorScreen(html, function () {
        addButton(6, "Filter", function () {
            var el = document.getElementById("tnFlagFilter");
            window.tnEditorNote = "";
            window.tnEditorFlagFilter = el ? el.value : "";
            window.tnEditorFlags();
        }, "Filter", "Show flags whose names contain this text.");
        addButton(7, "Add", function () {
            var nameEl = document.getElementById("tnNewFlag");
            var valueEl = document.getElementById("tnNewFlagValue");
            var name = nameEl ? nameEl.value.trim() : "";
            if (!name) return;
            var raw = valueEl ? valueEl.value : "";
            flags[name] = raw !== "" && !isNaN(Number(raw)) ? Number(raw) : raw;
            window.tnEditorFlagFilter = name;
            window.tnEditorNote = "Flag added.";
            window.tnEditorFlags();
        }, "Add", "Create the new flag.");
    });
};
